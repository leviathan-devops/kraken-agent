/**
 * src/execution-brain/rge/l5-pattern-db.ts
 *
 * L5: Cross-Project Pattern Database
 *
 * Checks source files against a database of known anti-patterns from
 * the Runtime Grade Bible and project history.
 * Each pattern uses AST-based detection (not regex).
 */

import * as ts from 'typescript';
import type { RGELayerResult, RGEViolation } from './types.js';
import { RGELayer } from './types.js';

interface KnownPattern {
  id: string;
  name: string;
  principle: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  detect: (sourceFile: ts.SourceFile) => RGEViolation[];
}

const PATTERN_DB: KnownPattern[] = [
  {
    id: 'P12.6',
    name: 'Wildcard Permission',
    principle: 'P8',
    severity: 'CRITICAL',
    description: 'Wildcard permission {"*": {"*": "allow"}} overrides all per-agent tool whitelisting',
    detect(sourceFile: ts.SourceFile): RGEViolation[] {
      const violations: RGEViolation[] = [];
      const text = sourceFile.getText();
      // Look for wildcard permission patterns in JSON-like structures
      if (text.includes('"*"') && text.includes('"allow"')) {
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('"*"') && (lines[i].includes('"allow"') || lines[i + 1]?.includes('"allow"'))) {
            violations.push({
              principle: 'P8',
              layer: RGELayer.L5_PATTERN_DB,
              message: 'Wildcard permission detected — grants every tool to every agent, overriding all whitelisting',
              file: sourceFile.fileName,
              line: i + 1,
              severity: 'CRITICAL',
              fix: 'Replace wildcard with explicit per-agent tool whitelisting',
              nodeText: lines[i].trim().slice(0, 100),
            });
          }
        }
      }
      return violations;
    },
  },
  {
    id: 'P12.8',
    name: 'Empty Set Consensus',
    principle: 'P11',
    severity: 'HIGH',
    description: 'Aggregation that returns true/consensus when input set is empty',
    detect(sourceFile: ts.SourceFile): RGEViolation[] {
      const violations: RGEViolation[] = [];

      function visit(node: ts.Node) {
        // Detect: size <= 1, length <= 1, etc. without checking for zero first
        if (ts.isBinaryExpression(node)) {
          const left = node.left;
          const op = node.operatorToken.kind;

          if (op === ts.SyntaxKind.LessThanEqualsToken || op === ts.SyntaxKind.LessThanToken) {
            const leftText = left.getText(sourceFile);
            if (/\.size\b|\.length\b/.test(leftText)) {
              // Check if there's a preceding check for zero
              const parent = findContainingFunction(node);
              if (parent) {
                const hasZeroCheck = containsZeroLengthCheck(parent, sourceFile);
                if (!hasZeroCheck) {
                  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                  violations.push({
                    principle: 'P11',
                    layer: RGELayer.L5_PATTERN_DB,
                    message: `Empty set consensus: '${leftText}' comparison without zero-length check — empty collection produces false success (P11)`,
                    file: sourceFile.fileName,
                    line: line + 1,
                    severity: 'HIGH',
                    fix: 'Add explicit check: if (items.length === 0) return { consensus: false, reason: "No items to verify" }',
                    nodeText: node.getText(sourceFile).slice(0, 100),
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
    },
  },
  {
    id: 'P12.7',
    name: 'Theatrical Orchestration',
    principle: 'P11',
    severity: 'CRITICAL',
    description: 'Function returns informational JSON about work instead of doing the work',
    detect(sourceFile: ts.SourceFile): RGEViolation[] {
      const violations: RGEViolation[] = [];

      function visit(node: ts.Node) {
        if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) && node.body) {
          const funcName = getFunctionName(node, sourceFile);
          // Check for orchestration functions that return instructions instead of acting
          const bodyText = node.body.getText(sourceFile);

          // Pattern: returns { dispersed: true, message: "...", spawnInstructions: [...] }
          if (/dispersed|spawned|completed/.test(bodyText) && /instructions|nextSteps|suggestions/.test(bodyText)) {
            // Check if it actually calls a spawn/exec function
            if (!containsSpawnCall(node.body, sourceFile)) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              violations.push({
                principle: 'P11',
                layer: RGELayer.L5_PATTERN_DB,
                message: `Theatrical orchestration in '${funcName}': returns instructions ABOUT work instead of DOING work (P11)`,
                file: sourceFile.fileName,
                line: line + 1,
                severity: 'CRITICAL',
                fix: 'Either perform the actual work (spawn, execute) or return action_required format that forces the model to act',
              });
            }
          }
        }
        ts.forEachChild(node, visit);
      }

      ts.forEachChild(sourceFile, visit);
      return violations;
    },
  },
  {
    id: 'P12.9',
    name: 'Theatrical File Path',
    principle: 'P11',
    severity: 'HIGH',
    description: 'Function reports a file path that was never created',
    detect(sourceFile: ts.SourceFile): RGEViolation[] {
      const violations: RGEViolation[] = [];

      function visit(node: ts.Node) {
        if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) && node.body) {
          const bodyText = node.body.getText(sourceFile);
          // If function returns an evidencePath or outputPath but doesn't write files
          if (/evidencePath|outputDir|resultPath/.test(bodyText)) {
            const hasWrite = /writeFile|writeFileSync|mkdir|mkdirSync|createWriteStream/.test(bodyText);
            if (!hasWrite) {
              const funcName = getFunctionName(node, sourceFile);
              const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              violations.push({
                principle: 'P11',
                layer: RGELayer.L5_PATTERN_DB,
                message: `Theatrical file path in '${funcName}': returns a path but never creates the file (P11)`,
                file: sourceFile.fileName,
                line: line + 1,
                severity: 'HIGH',
                fix: 'Actually create the file/directory before returning the path',
              });
            }
          }
        }
        ts.forEachChild(node, visit);
      }

      ts.forEachChild(sourceFile, visit);
      return violations;
    },
  },
  {
    id: 'P12.5',
    name: 'Verification Theater',
    principle: 'P11',
    severity: 'HIGH',
    description: 'Counting/grep-based verification that proves nothing about correctness',
    detect(sourceFile: ts.SourceFile): RGEViolation[] {
      const violations: RGEViolation[] = [];
      const text = sourceFile.getText();

      // Pattern: grep -c "function" or wc -l as "verification"
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/grep\s+-c|wc\s+-l|wc\s+-w/.test(line) && /verify|check|test|confirm/.test(lines[Math.max(0, i - 3)] + line)) {
          violations.push({
            principle: 'P11',
            layer: RGELayer.L5_PATTERN_DB,
            message: 'Verification theater: using grep/wc counts as proof of correctness (P11)',
            file: sourceFile.fileName,
            line: i + 1,
            severity: 'HIGH',
            fix: 'Run the code. Test the output. Verify in a real runtime environment.',
            nodeText: line.slice(0, 100),
          });
        }
      }

      return violations;
    },
  },
];

function findContainingFunction(node: ts.Node): ts.Node | null {
  let current = node.parent;
  while (current) {
    if (ts.isFunctionLike(current)) return current;
    current = current.parent;
  }
  return null;
}

function containsZeroLengthCheck(root: ts.Node, sourceFile: ts.SourceFile): boolean {
  let found = false;
  function walk(n: ts.Node) {
    if (found) return;
    if (ts.isBinaryExpression(n)) {
      const text = n.getText(sourceFile);
      if (/\.length\s*===?\s*0|\.size\s*===?\s*0|\.length\s*!==?\s*0|\.size\s*!==?\s*0/.test(text)) {
        found = true;
        return;
      }
    }
    ts.forEachChild(n, walk);
  }
  ts.forEachChild(root, walk);
  return found;
}

function containsSpawnCall(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  let found = false;
  function walk(n: ts.Node) {
    if (found) return;
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      if (ts.isIdentifier(callee)) {
        if (/spawn|exec|fork|dispatch|createTask|launch/.test(callee.text)) {
          found = true;
          return;
        }
      }
      if (ts.isPropertyAccessExpression(callee)) {
        if (/spawn|exec|fork|dispatch|createTask|launch/.test(callee.name.text)) {
          found = true;
          return;
        }
      }
    }
    ts.forEachChild(n, walk);
  }
  ts.forEachChild(node, walk);
  return found;
}

function getFunctionName(node: ts.Node, sourceFile: ts.SourceFile): string {
  if (ts.isFunctionDeclaration(node) && node.name) return node.name.text;
  if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) return node.name.text;
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
  }
  return '<anonymous>';
}

export async function checkL5PatternDB(
  sourceFiles: string[],
  _projectRoot: string,
  program: ts.Program,
): Promise<RGELayerResult> {
  const startTime = Date.now();
  const allViolations: RGEViolation[] = [];
  let checksRun = 0;

  for (const filePath of sourceFiles) {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
      console.error(`[L5] Source file not in program: ${filePath}`);
      continue;
    }

    for (const pattern of PATTERN_DB) {
      checksRun++;
      const violations = pattern.detect(sourceFile);
      allViolations.push(...violations);
    }
  }

  const durationMs = Date.now() - startTime;

  return {
    layer: RGELayer.L5_PATTERN_DB,
    passed: allViolations.filter((v) => v.severity === 'CRITICAL').length === 0,
    violations: allViolations,
    checksRun,
    checksPassed: Math.max(0, checksRun - allViolations.length),
    durationMs,
  };
}
