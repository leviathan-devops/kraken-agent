/**
 * src/execution-brain/rge/l4-side-effect.ts
 *
 * L4: Side-Effect Truth (P11 — Output is the Work)
 *
 * THE CRITICAL ANTI-THEATRICAL LAYER.
 * If a function claims work was done, the work MUST have actually been done.
 * Detects theatrical returns, evidence fabrication, and false success claims.
 *
 * Detection strategy:
 * - Find functions returning success/complete/done status objects
 * - Verify the function actually calls the side-effect API
 * - If function returns { success: true } → verify spawn/write/exec call exists
 * - If function returns { evidencePath } → verify fs.mkdir/writeFile was called
 */

import * as ts from 'typescript';
import type { RGELayerResult, RGEViolation } from './types.js';
import { RGELayer } from './types.js';

const SIDE_EFFECT_APIS = new Set([
  'writeFile', 'writeFileSync', 'mkdir', 'mkdirSync', 'appendFile', 'appendFileSync',
  'spawn', 'exec', 'execSync', 'execFile', 'fork',
  'fetch', 'send', 'post', 'put', 'delete', 'patch',
  'createWriteStream', 'copyFile', 'rename', 'unlink',
  'dispatch', 'emit', 'publish',
]);

const THEATRICAL_RETURN_PATTERNS = [
  /\bdispersed\s*:\s*true/,
  /\bcompleted\s*:\s*true/,
  /\bspawned\s*:\s*true/,
  /\bcreated\s*:\s*true/,
  /\bsuccess\s*:\s*true/,
  /\bdone\s*:\s*true/,
  /\bfinished\s*:\s*true/,
];

function checkFile(
  sourceFile: ts.SourceFile,
  _checker: ts.TypeChecker,
): RGEViolation[] {
  const violations: RGEViolation[] = [];

  function visit(node: ts.Node) {
    // Find function declarations
    if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) && node.body) {
      const body = node.body;

      // Find all return statements in the function
      const returnStatements: ts.ReturnStatement[] = [];
      function findReturns(n: ts.Node) {
        if (ts.isReturnStatement(n) && n.expression) {
          returnStatements.push(n);
        }
        ts.forEachChild(n, findReturns);
      }
      ts.forEachChild(body, findReturns);

      for (const ret of returnStatements) {
        if (!ret.expression) continue;
        const retText = ret.expression.getText(sourceFile);

        // Check for theatrical return patterns
        let isTheatrical = false;
        for (const pattern of THEATRICAL_RETURN_PATTERNS) {
          if (pattern.test(retText)) {
            isTheatrical = true;
            break;
          }
        }

        if (!isTheatrical) continue;

        // Check if the function body contains actual side-effect calls
        const hasSideEffect = containsSideEffectCall(body, sourceFile);

        if (!hasSideEffect) {
          const funcName = getFunctionName(node, sourceFile);
          const { line } = sourceFile.getLineAndCharacterOfPosition(ret.getStart());
          violations.push({
            principle: 'P11',
            layer: RGELayer.L4_SIDE_EFFECT,
            message: `Theatrical return in '${funcName}': returns success/completion status without performing the claimed side effect (P11)`,
            file: sourceFile.fileName,
            line: line + 1,
            severity: 'CRITICAL',
            fix: 'Either perform the actual side effect before returning, or return action_required instructions instead of claiming work was done',
            nodeText: retText.slice(0, 120),
          });
        } else {
          // Has side effect call — but is it BEFORE the return or after?
          const retPos = ret.getStart();
          const sideEffectPos = findFirstSideEffectPosition(body, sourceFile);
          if (sideEffectPos > retPos) {
            const funcName = getFunctionName(node, sourceFile);
            const { line } = sourceFile.getLineAndCharacterOfPosition(ret.getStart());
            violations.push({
              principle: 'P11',
              layer: RGELayer.L4_SIDE_EFFECT,
              message: `Side effect in '${funcName}' is called AFTER the success return — the return claims work that hasn't happened yet (P11)`,
              file: sourceFile.fileName,
              line: line + 1,
              severity: 'CRITICAL',
              fix: 'Move the side-effect call before the return statement, or await the result before returning',
              nodeText: retText.slice(0, 120),
            });
          }
        }
      }

      // Check for evidence path fabrication
      for (const ret of returnStatements) {
        if (!ret.expression) continue;
        const retText = ret.expression.getText(sourceFile);

        // Pattern: returns { evidencePath: '/some/path' } or { outputPath: ... }
        if (/evidencePath|outputPath|resultPath|filePath/.test(retText)) {
          // Check if fs.writeFileSync or fs.mkdirSync was called in this function
          const hasFileWrite = containsCallWithName(body, ['writeFile', 'writeFileSync', 'mkdir', 'mkdirSync', 'createWriteStream']);
          if (!hasFileWrite) {
            const funcName = getFunctionName(node, sourceFile);
            const { line } = sourceFile.getLineAndCharacterOfPosition(ret.getStart());
            violations.push({
              principle: 'P11',
              layer: RGELayer.L4_SIDE_EFFECT,
              message: `Evidence path fabrication in '${funcName}': returns a file path but never writes to it (P11)`,
              file: sourceFile.fileName,
              line: line + 1,
              severity: 'CRITICAL',
              fix: 'Actually write the file before returning the path, or remove the path from the return value',
              nodeText: retText.slice(0, 120),
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return violations;
}

function containsSideEffectCall(node: ts.Node, sourceFile: ts.SourceFile): boolean {
  let found = false;

  function walk(n: ts.Node) {
    if (found) return;

    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      if (ts.isIdentifier(callee) && SIDE_EFFECT_APIS.has(callee.text)) {
        found = true;
        return;
      }
      if (ts.isPropertyAccessExpression(callee)) {
        const methodName = callee.name.text;
        if (SIDE_EFFECT_APIS.has(methodName)) {
          found = true;
          return;
        }
        // Check for fetch(), docker.run(), etc.
        const objText = callee.expression.getText(sourceFile);
        if (/^(fetch|docker|exec|spawn|child_process)/.test(objText)) {
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

function findFirstSideEffectPosition(node: ts.Node, sourceFile: ts.SourceFile): number {
  let minPos = Infinity;

  function walk(n: ts.Node) {
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      let isSideEffect = false;

      if (ts.isIdentifier(callee) && SIDE_EFFECT_APIS.has(callee.text)) {
        isSideEffect = true;
      }
      if (ts.isPropertyAccessExpression(callee) && SIDE_EFFECT_APIS.has(callee.name.text)) {
        isSideEffect = true;
      }

      if (isSideEffect) {
        const pos = n.getStart();
        if (pos < minPos) minPos = pos;
      }
    }

    ts.forEachChild(n, walk);
  }

  ts.forEachChild(node, walk);
  return minPos;
}

function containsCallWithName(node: ts.Node, names: string[]): boolean {
  let found = false;

  function walk(n: ts.Node) {
    if (found) return;
    if (ts.isCallExpression(n)) {
      const callee = n.expression;
      if (ts.isIdentifier(callee) && names.includes(callee.text)) {
        found = true;
        return;
      }
      if (ts.isPropertyAccessExpression(callee) && names.includes(callee.name.text)) {
        found = true;
        return;
      }
    }
    ts.forEachChild(n, walk);
  }

  ts.forEachChild(node, walk);
  return found;
}

function getFunctionName(node: ts.Node, sourceFile: ts.SourceFile): string {
  if (ts.isFunctionDeclaration(node) && node.name) {
    return node.name.text;
  }
  if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) {
    return node.name.text;
  }
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }
    if (ts.isPropertyAssignment(parent) && ts.isIdentifier(parent.name)) {
      return parent.name.text;
    }
  }
  return '<anonymous>';
}

export async function checkL4SideEffect(
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
      console.error(`[L4] Source file not in program: ${filePath}`);
      continue;
    }

    checksRun++;
    const violations = checkFile(sourceFile, checker);
    allViolations.push(...violations);
  }

  const durationMs = Date.now() - startTime;

  return {
    layer: RGELayer.L4_SIDE_EFFECT,
    passed: allViolations.filter((v) => v.severity === 'CRITICAL').length === 0,
    violations: allViolations,
    checksRun,
    checksPassed: Math.max(0, checksRun - allViolations.filter((v) => v.severity === 'CRITICAL' || v.severity === 'HIGH').length),
    durationMs,
  };
}
