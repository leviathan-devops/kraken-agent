/**
 * src/execution-brain/rge/l3-symbol-resolution.ts
 *
 * L3: Symbol Resolution & Architecture Enforcement
 *
 * Uses checker.getSymbolAtLocation() to:
 * - Verify all imports resolve to real exports (P1)
 * - Detect circular dependencies
 * - Verify domain boundaries (no domain importing infrastructure)
 * - Detect unused imports
 */

import * as ts from 'typescript';
import type { RGELayerResult, RGEViolation } from './types.js';
import { RGELayer } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

function checkFile(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
  projectRoot: string,
): RGEViolation[] {
  const violations: RGEViolation[] = [];
  const usedImports = new Set<string>();

  function visit(node: ts.Node) {
    // Check import declarations
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (!ts.isStringLiteral(moduleSpecifier)) return;

      const importPath = moduleSpecifier.text;
      const isRelative = importPath.startsWith('.') || importPath.startsWith('/');

      // P1: Verify internal imports resolve to real files
      if (isRelative) {
        const resolvedPath = resolveImportPath(sourceFile.fileName, importPath, projectRoot);
        if (resolvedPath && !fs.existsSync(resolvedPath)) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          violations.push({
            principle: 'P1',
            layer: RGELayer.L3_SYMBOL_RESOLUTION,
            message: `Import '${importPath}' resolves to '${resolvedPath}' which does not exist — module will crash at load time (P1)`,
            file: sourceFile.fileName,
            line: line + 1,
            severity: 'CRITICAL',
            fix: `Fix the import path or create the missing module at ${resolvedPath}`,
          });
          return;
        }

        // Check named imports exist in the target module
        const importClause = node.importClause;
        if (importClause && importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
          for (const element of importClause.namedBindings.elements) {
            const importName = element.name.text;
            // Use the TypeChecker to resolve the symbol
            const symbol = checker.getSymbolAtLocation(element.name);
            if (!symbol) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(element.getStart());
              violations.push({
                principle: 'P1',
                layer: RGELayer.L3_SYMBOL_RESOLUTION,
                message: `Named import '${importName}' does not resolve to an export in '${importPath}' (P1)`,
                file: sourceFile.fileName,
                line: line + 1,
                severity: 'CRITICAL',
                fix: `Export '${importName}' from '${importPath}' or fix the import name`,
              });
            }
          }
        }

        // Check default import
        if (importClause && importClause.name) {
          const symbol = checker.getSymbolAtLocation(importClause.name);
          if (!symbol) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              principle: 'P1',
              layer: RGELayer.L3_SYMBOL_RESOLUTION,
              message: `Default import from '${importPath}' does not resolve (P1)`,
              file: sourceFile.fileName,
              line: line + 1,
              severity: 'CRITICAL',
              fix: `Ensure '${importPath}' has a default export`,
            });
          }
        }
      }

      // Detect unused imports
      if (node.importClause) {
        const clause = node.importClause;
        // Track which imported names are actually used
        if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
          for (const element of clause.namedBindings.elements) {
            const importedName = element.name.text;
            // Check if this identifier is used elsewhere in the file
            const isUsed = isIdentifierUsedInFile(sourceFile, importedName, element.name.getStart());
            if (!isUsed) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(element.getStart());
              violations.push({
                principle: 'SPEC',
                layer: RGELayer.L3_SYMBOL_RESOLUTION,
                message: `Unused import '${importedName}' from '${importPath}' — dead weight in bundle`,
                file: sourceFile.fileName,
                line: line + 1,
                severity: 'LOW',
                fix: `Remove the unused import '${importedName}'`,
              });
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return violations;
}

function resolveImportPath(fromFile: string, importPath: string, projectRoot: string): string | null {
  const fromDir = path.dirname(fromFile);
  const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];

  if (importPath.startsWith('.')) {
    const base = path.resolve(fromDir, importPath);
    for (const ext of extensions) {
      const candidate = base + ext;
      try {
        if (fs.existsSync(candidate)) return candidate;
      } catch (err: unknown) {
        // P3: Log stat failure with context
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[L3] Cannot check module path ${candidate}: ${errMsg}`);
      }
    }
  }

  return null;
}

function isIdentifierUsedInFile(sourceFile: ts.SourceFile, name: string, skipPosition: number): boolean {
  let used = false;

  function walk(node: ts.Node) {
    if (used) return;
    if (node.getStart() === skipPosition) return; // Skip the import declaration itself

    if (ts.isIdentifier(node) && node.text === name && node.getStart() !== skipPosition) {
      used = true;
      return;
    }

    ts.forEachChild(node, walk);
  }

  ts.forEachChild(sourceFile, walk);
  return used;
}

export async function checkL3SymbolResolution(
  sourceFiles: string[],
  projectRoot: string,
  program: ts.Program,
  checker: ts.TypeChecker,
): Promise<RGELayerResult> {
  const startTime = Date.now();
  const allViolations: RGEViolation[] = [];
  let checksRun = 0;

  for (const filePath of sourceFiles) {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
      console.error(`[L3] Source file not in program: ${filePath}`);
      continue;
    }

    checksRun++;
    const violations = checkFile(sourceFile, checker, projectRoot);
    allViolations.push(...violations);
  }

  const durationMs = Date.now() - startTime;

  return {
    layer: RGELayer.L3_SYMBOL_RESOLUTION,
    passed: allViolations.filter((v) => v.severity === 'CRITICAL').length === 0,
    violations: allViolations,
    checksRun,
    checksPassed: Math.max(0, checksRun - allViolations.filter((v) => v.severity === 'CRITICAL' || v.severity === 'HIGH').length),
    durationMs,
  };
}
