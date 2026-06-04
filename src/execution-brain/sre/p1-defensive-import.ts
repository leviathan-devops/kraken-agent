import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { SREPrinciple, SREViolation, SRECheckResult } from './types';

interface ExportInfo {
  namedExports: Set<string>;
  hasDefaultExport: boolean;
  hasWildcardExport: boolean;
}

function resolveModulePath(importPath: string, fromFile: string, projectRoot: string): string | null {
  if (importPath.startsWith('.') || importPath.startsWith('/')) {
    const dir = path.dirname(fromFile);
    const candidateExtensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];

    for (const ext of candidateExtensions) {
      const fullPath = path.resolve(dir, importPath + ext);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return fullPath;
      }
    }

    // Check for .d.ts
    for (const ext of ['', '.d.ts']) {
      const fullPath = path.resolve(dir, importPath + ext);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return fullPath;
      }
    }

    return null;
  }

  // External package — check node_modules
  const candidateRoots = [path.dirname(fromFile), projectRoot];
  for (const root of candidateRoots) {
    let current = root;
    for (let i = 0; i < 20; i++) {
      const nmDir = path.join(current, 'node_modules', importPath);
      if (fs.existsSync(nmDir) && fs.statSync(nmDir).isDirectory()) {
        // Check package.json for main/exports
        const pkgJsonPath = path.join(nmDir, 'package.json');
        if (fs.existsSync(pkgJsonPath)) {
          return nmDir;
        }
        // Check for index.js / index.ts
        if (fs.existsSync(path.join(nmDir, 'index.js')) || fs.existsSync(path.join(nmDir, 'index.ts'))) {
          return nmDir;
        }
      }

      // Check for file-based module
      const fileCandidates = [nmDir + '.js', nmDir + '.ts', nmDir + '.tsx', nmDir + '.jsx'];
      for (const fc of fileCandidates) {
        if (fs.existsSync(fc) && fs.statSync(fc).isFile()) {
          return fc;
        }
      }

      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  return null;
}

function extractExports(filePath: string): ExportInfo {
  const result: ExportInfo = {
    namedExports: new Set(),
    hasDefaultExport: false,
    hasWildcardExport: false,
  };

  if (!fs.existsSync(filePath)) return result;

  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SRE:P1] Cannot read file ${filePath}: ${errMsg}. Returning empty export info.`);
    return result;
  }

  // If it's a directory, try package.json or index
  let isDir = false;
  try {
    isDir = fs.statSync(filePath).isDirectory();
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SRE:P1] Cannot stat ${filePath}: ${errMsg}. Assuming file.`);
  }
  if (isDir) {
    const pkgJsonPath = path.join(filePath, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
        const mainFile = pkg.main || pkg.module || 'index.js';
        const mainPath = path.join(filePath, mainFile);
        if (fs.existsSync(mainPath)) {
          return extractExports(mainPath);
        }
      } catch (err: unknown) {
        // P3: Log parse failure with context before falling back
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[SRE:P1] Cannot parse package.json at ${pkgJsonPath}: ${errMsg}. Assuming wildcard export.`);
        result.hasWildcardExport = true;
        return result;
      }
    }

    const indexCandidates = ['index.ts', 'index.tsx', 'index.js', 'index.jsx'];
    for (const idx of indexCandidates) {
      const idxPath = path.join(filePath, idx);
      if (fs.existsSync(idxPath)) {
        return extractExports(idxPath);
      }
    }

    result.hasWildcardExport = true;
    return result;
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );

  function visit(node: ts.Node): void {
    // export function foo() / export const foo / export class Foo
    if (ts.isFunctionDeclaration(node) && node.name && node.name.text) {
      if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)) {
          result.hasDefaultExport = true;
        } else {
          result.namedExports.add(node.name.text);
        }
      }
    }

    if (ts.isVariableStatement(node)) {
      if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        for (const decl of node.declarationList.declarations) {
          if (ts.isIdentifier(decl.name)) {
            result.namedExports.add(decl.name.text);
          }
        }
      }
    }

    if (ts.isClassDeclaration(node) && node.name && node.name.text) {
      if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword)) {
          result.hasDefaultExport = true;
        } else {
          result.namedExports.add(node.name.text);
        }
      }
    }

    if (ts.isInterfaceDeclaration(node) && node.name.text) {
      if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        result.namedExports.add(node.name.text);
      }
    }

    if (ts.isTypeAliasDeclaration(node)) {
      if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        result.namedExports.add(node.name.text);
      }
    }

    if (ts.isEnumDeclaration(node) && node.name.text) {
      if (node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
        result.namedExports.add(node.name.text);
      }
    }

    // export default expression
    if (ts.isExportAssignment(node)) {
      result.hasDefaultExport = true;
    }

    // export { foo, bar }
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        const exportedName = element.name.text;
        result.namedExports.add(exportedName);
      }
    }

    // export * from './module'
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      if (!node.exportClause) {
        result.hasWildcardExport = true;
      } else if (ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          result.namedExports.add(element.name.text);
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return result;
}

function getSourceSnippet(sourceFile: ts.SourceFile, line: number): string {
  const lineStart = sourceFile.getPositionOfLineAndCharacter(line - 1, 0);
  const lineEnd = sourceFile.getLineEndOfPosition(lineStart);
  return sourceFile.text.substring(lineStart, lineEnd).trim();
}

export async function checkP1(sourceFiles: string[], projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  let filesChecked = 0;

  for (const filePath of sourceFiles) {
    if (!fs.existsSync(filePath)) continue;

    let content: string;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (err: unknown) {
      // P3: Log read failure with context before skipping
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[SRE:P1] Cannot read file ${filePath}: ${errMsg}. Skipping.`);
      continue;
    }

    filesChecked++;

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    function visit(node: ts.Node): void {
      if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const moduleSpecifier = node.moduleSpecifier.text;
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        const column = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).character + 1;

        const resolvedPath = resolveModulePath(moduleSpecifier, filePath, projectRoot);
        const isInternal = moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/');

        if (!resolvedPath) {
          violations.push({
            principle: SREPrinciple.P1_DEFENSIVE_IMPORT,
            file: filePath,
            line,
            column,
            severity: isInternal ? 'CRITICAL' : 'HIGH',
            description: `Module "${moduleSpecifier}" cannot be resolved`,
            codeSnippet: getSourceSnippet(sourceFile, line),
            fix: isInternal
              ? `Ensure the file at "${moduleSpecifier}" exists with a supported extension (.ts, .tsx, .js, .jsx)`
              : `Install the package "${moduleSpecifier}" or check the import path`,
          });
          return;
        }

        // Check named imports exist in the resolved module
        if (node.importClause) {
          // Default import check
          if (node.importClause.name) {
            const exportInfo = extractExports(resolvedPath);
            if (!exportInfo.hasDefaultExport && !exportInfo.hasWildcardExport) {
              violations.push({
                principle: SREPrinciple.P1_DEFENSIVE_IMPORT,
                file: filePath,
                line,
                column,
                severity: isInternal ? 'CRITICAL' : 'HIGH',
                description: `Module "${moduleSpecifier}" has no default export`,
                codeSnippet: getSourceSnippet(sourceFile, line),
                fix: `Add a default export to "${moduleSpecifier}" or use a named import`,
              });
            }
          }

          // Named imports check
          if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
            const exportInfo = extractExports(resolvedPath);

            for (const importSpecifier of node.importClause.namedBindings.elements) {
              const importName = importSpecifier.name.text;
              // Skip if module has wildcard re-exports — can't reliably check
              if (exportInfo.hasWildcardExport) continue;

              if (!exportInfo.namedExports.has(importName) && !exportInfo.hasDefaultExport) {
                violations.push({
                  principle: SREPrinciple.P1_DEFENSIVE_IMPORT,
                  file: filePath,
                  line,
                  column,
                  severity: isInternal ? 'CRITICAL' : 'HIGH',
                  description: `Named export "${importName}" does not exist in module "${moduleSpecifier}"`,
                  codeSnippet: getSourceSnippet(sourceFile, line),
                  fix: `Export "${importName}" from "${moduleSpecifier}" or fix the import name`,
                });
              }
            }
          }

          // Namespace import check — e.g. import * as X
          if (node.importClause.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings)) {
            const exportInfo = extractExports(resolvedPath);
            if (exportInfo.namedExports.size === 0 && !exportInfo.hasDefaultExport && !exportInfo.hasWildcardExport) {
              violations.push({
                principle: SREPrinciple.P1_DEFENSIVE_IMPORT,
                file: filePath,
                line,
                column,
                severity: isInternal ? 'CRITICAL' : 'HIGH',
                description: `Module "${moduleSpecifier}" has no exports to namespace-import`,
                codeSnippet: getSourceSnippet(sourceFile, line),
                fix: `Add exports to "${moduleSpecifier}" or remove the import`,
              });
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    }

    ts.forEachChild(sourceFile, visit);
  }

  return {
    principle: SREPrinciple.P1_DEFENSIVE_IMPORT,
    passed: violations.length === 0,
    violations,
    filesChecked,
    durationMs: Date.now() - startTime,
  };
}
