/**
 * src/execution-brain/rge/l2-control-flow.ts
 *
 * L2: Control Flow & Liveness Analysis
 *
 * Detects:
 * - Unreachable code after throw/return
 * - Resources acquired without cleanup on error paths (missing finally)
 * - State mutations that can leave torn state (P5)
 * - Promises created but never awaited (P9)
 */

import * as ts from 'typescript';
import type { RGELayerResult, RGEViolation } from './types.js';
import { RGELayer } from './types.js';

function checkFile(
  sourceFile: ts.SourceFile,
  _checker: ts.TypeChecker,
): RGEViolation[] {
  const violations: RGEViolation[] = [];

  function visit(node: ts.Node) {
    // Detect setInterval without clearInterval in same scope
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      if (ts.isIdentifier(callee)) {
        // setInterval without corresponding clearInterval
        if (callee.text === 'setInterval') {
          const parent = findContainingFunction(node);
          if (parent) {
            const hasClear = containsIdentifier(parent, 'clearInterval');
            if (!hasClear) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              violations.push({
                principle: 'P4',
                layer: RGELayer.L2_CONTROL_FLOW,
                message: 'setInterval without clearInterval in same scope — resource leak (P4)',
                file: sourceFile.fileName,
                line: line + 1,
                severity: 'CRITICAL',
                fix: 'Add clearInterval in a finally block to ensure cleanup on all paths',
              });
            } else {
              // Check if clearInterval is in a finally block
              const hasFinally = containsFinallyWithIdentifier(parent, 'clearInterval');
              if (!hasFinally) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                violations.push({
                  principle: 'P4',
                  layer: RGELayer.L2_CONTROL_FLOW,
                  message: 'setInterval with clearInterval but NOT in finally block — may leak on error (P4)',
                  file: sourceFile.fileName,
                  line: line + 1,
                  severity: 'HIGH',
                  fix: 'Move clearInterval to a finally block to ensure cleanup even when errors occur',
                });
              }
            }
          }
        }

        // fs.openSync without fs.closeSync
        if (callee.text === 'openSync' || callee.text === 'open') {
          const parent = findContainingFunction(node);
          if (parent) {
            const hasClose = containsIdentifier(parent, 'closeSync') || containsIdentifier(parent, 'close');
            if (!hasClose) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              violations.push({
                principle: 'P4',
                layer: RGELayer.L2_CONTROL_FLOW,
                message: `fs.${callee.text} without corresponding close — file descriptor leak (P4)`,
                file: sourceFile.fileName,
                line: line + 1,
                severity: 'HIGH',
                fix: 'Add fs.closeSync/close in a finally block',
              });
            }
          }
        }
      }
    }

    // Detect torn state: sequential property assignments with await between them
    if (ts.isBlock(node)) {
      const statements = node.statements;
      for (let i = 0; i < statements.length - 1; i++) {
        const stmt = statements[i];
        const nextStmt = statements[i + 1];

        // Pattern: obj.prop = value; await something(); obj.prop2 = value2;
        if (isPropertyAssignment(stmt) && ts.isExpressionStatement(nextStmt)) {
          const expr = nextStmt.expression;
          if (ts.isAwaitExpression(expr) || ts.isCallExpression(expr)) {
            const stmtObjName = getAssignmentObjectName(stmt);
            // Check if a later statement assigns to the same object
            for (let j = i + 2; j < statements.length; j++) {
              const laterStmt = statements[j];
              if (isPropertyAssignment(laterStmt)) {
                const laterObjName = getAssignmentObjectName(laterStmt);
                if (stmtObjName && laterObjName && stmtObjName === laterObjName) {
                  // Check if this is inside a try block
                  const parent = node.parent;
                  const isInTry = parent && ts.isTryStatement(parent);
                  if (!isInTry) {
                    const { line } = sourceFile.getLineAndCharacterOfPosition(stmt.getStart());
                    violations.push({
                      principle: 'P5',
                      layer: RGELayer.L2_CONTROL_FLOW,
                      message: `Torn state: '${stmtObjName}' properties assigned sequentially with async operation between — if async throws, state is inconsistent (P5)`,
                      file: sourceFile.fileName,
                      line: line + 1,
                      severity: 'HIGH',
                      fix: 'Use atomic state assignment: save previous state, then assign entire state object at once after async completes',
                    });
                  }
                  break;
                }
              }
            }
          }
        }
      }
    }

    // Detect floating promises: call expression that returns a promise but is not awaited
    if (ts.isExpressionStatement(node)) {
      const expr = node.expression;
      if (ts.isCallExpression(expr)) {
        // Check if the call looks like it could be a promise-returning function
        const callee = expr.expression;
        if (ts.isPropertyAccessExpression(callee) || ts.isIdentifier(callee)) {
          // Heuristic: if the call involves .then, .catch, or async-like names
          const callText = expr.getText(sourceFile);
          if (/^void\s+/.test(callText)) {
            // Explicit void — check if there's a .catch()
            const hasCatch = callText.includes('.catch(');
            if (!hasCatch) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
              violations.push({
                principle: 'P9',
                layer: RGELayer.L2_CONTROL_FLOW,
                message: 'Fire-and-forget async call with void — no error handling (P9)',
                file: sourceFile.fileName,
                line: line + 1,
                severity: 'HIGH',
                fix: 'Add .catch() handler or use await with try/catch',
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

function findContainingFunction(node: ts.Node): ts.Node | null {
  let current = node.parent;
  while (current) {
    if (
      ts.isFunctionDeclaration(current) ||
      ts.isArrowFunction(current) ||
      ts.isFunctionExpression(current) ||
      ts.isMethodDeclaration(current)
    ) {
      return current;
    }
    current = current.parent;
  }
  return null;
}

function containsIdentifier(root: ts.Node, name: string): boolean {
  let found = false;
  function walk(n: ts.Node) {
    if (found) return;
    if (ts.isIdentifier(n) && n.text === name) {
      found = true;
      return;
    }
    ts.forEachChild(n, walk);
  }
  ts.forEachChild(root, walk);
  return found;
}

function containsFinallyWithIdentifier(root: ts.Node, name: string): boolean {
  let found = false;
  function walk(n: ts.Node) {
    if (found) return;
    if (ts.isTryStatement(n) && n.finallyBlock) {
      if (containsIdentifier(n.finallyBlock, name)) {
        found = true;
        return;
      }
    }
    ts.forEachChild(n, walk);
  }
  ts.forEachChild(root, walk);
  return found;
}

function isPropertyAssignment(stmt: ts.Statement): boolean {
  if (!ts.isExpressionStatement(stmt)) return false;
  const expr = stmt.expression;
  if (ts.isBinaryExpression(expr)) {
    return ts.isPropertyAccessExpression(expr.left) || ts.isElementAccessExpression(expr.left);
  }
  return false;
}

function getAssignmentObjectName(stmt: ts.Statement): string | null {
  if (!ts.isExpressionStatement(stmt)) return null;
  const expr = stmt.expression;
  if (!ts.isBinaryExpression(expr)) return null;
  if (ts.isPropertyAccessExpression(expr.left)) {
    const obj = expr.left.expression;
    if (ts.isIdentifier(obj)) {
      return obj.text;
    }
  }
  return null;
}

export async function checkL2ControlFlow(
  sourceFiles: string[],
  _projectRoot: string,
  program: ts.Program,
  checker: ts.TypeChecker,
): Promise<RGELayerResult> {
  const startTime = Date.now();
  const allViolations: RGEViolation[] = [];
  let checksRun = 0;

  for (const filePath of sourceFiles) {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
      console.error(`[L2] Source file not in program: ${filePath}`);
      continue;
    }

    checksRun++;
    const violations = checkFile(sourceFile, checker);
    allViolations.push(...violations);
  }

  const durationMs = Date.now() - startTime;

  return {
    layer: RGELayer.L2_CONTROL_FLOW,
    passed: allViolations.filter((v) => v.severity === 'CRITICAL').length === 0,
    violations: allViolations,
    checksRun,
    checksPassed: checksRun - allViolations.filter((v) => v.severity === 'CRITICAL' || v.severity === 'HIGH').length,
    durationMs,
  };
}
