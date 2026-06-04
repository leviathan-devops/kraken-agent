/**
 * src/execution-brain/rge/l1-type-contract.ts
 *
 * L1: Type Contract Enforcement
 *
 * Uses TypeScript TypeChecker to verify that function return types match
 * in ALL code paths, detect unchecked `as` casts, and validate boundary types.
 *
 * Uses: checker.getTypeAtLocation(), checker.isTypeAssignableTo(),
 *        checker.getSignatureFromDeclaration()
 */

import * as ts from 'typescript';
import type { RGELayerResult, RGEViolation } from './types.js';
import { RGELayer } from './types.js';

function isRuntimeCheck(node: ts.Node): boolean {
  if (!ts.isExpressionStatement(node) && !ts.isIfStatement(node)) return false;

  const expr = ts.isIfStatement(node)
    ? node.expression
    : ts.isExpressionStatement(node)
      ? node.expression
      : null;

  if (!expr) return false;

  // typeof x === 'string'
  if (ts.isBinaryExpression(expr)) {
    const left = expr.left;
    const op = expr.operatorToken.kind;
    if (op === ts.SyntaxKind.EqualsEqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsEqualsToken) {
      if (ts.isTypeOfExpression(left)) return true;
    }
  }

  // Array.isArray(x)
  if (ts.isCallExpression(expr)) {
    const callee = expr.expression;
    if (ts.isPropertyAccessExpression(callee)) {
      if (callee.name.text === 'isArray') return true;
    }
  }

  // x !== null, x !== undefined
  if (ts.isBinaryExpression(expr)) {
    const right = expr.right;
    if (ts.isIdentifier(right) || right.kind === ts.SyntaxKind.NullKeyword || right.kind === ts.SyntaxKind.VoidExpression) {
      return true;
    }
  }

  return false;
}

function hasPrecedingRuntimeCheck(sourceFile: ts.SourceFile, asExpr: ts.AsExpression, lineStart: number): boolean {
  const asLine = sourceFile.getLineAndCharacterOfPosition(asExpr.getStart()).line;
  let found = false;

  function walk(node: ts.Node) {
    if (found) return;
    if (node.getStart() >= asExpr.getStart()) return; // Past the as expression

    const nodeLine = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;
    if (asLine - nodeLine <= 3 && isRuntimeCheck(node)) {
      found = true;
      return;
    }

    ts.forEachChild(node, walk);
  }

  ts.forEachChild(sourceFile, walk);
  return found;
}

function checkFile(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): RGEViolation[] {
  const violations: RGEViolation[] = [];
  const text = sourceFile.getText();

  function visit(node: ts.Node) {
    // Check for `as` casts without runtime validation
    if (ts.isAsExpression(node)) {
      const asType = node.type;
      // Skip casting to primitive types that are commonly safe
      const typeName = asType.getText(sourceFile);
      const isPrimitiveCast =
        typeName === 'unknown' ||
        typeName === 'string' ||
        typeName === 'number' ||
        typeName === 'boolean' ||
        typeName === 'any';

      if (!isPrimitiveCast && !hasPrecedingRuntimeCheck(sourceFile, node, 0)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        violations.push({
          principle: 'P2',
          layer: RGELayer.L1_TYPE_CONTRACT,
          message: `Unchecked 'as ${typeName}' cast without runtime validation — type assertion bypasses type system (P2)`,
          file: sourceFile.fileName,
          line: line + 1,
          severity: 'HIGH',
          fix: `Add a runtime type check before the cast: typeof check, instanceof, or schema validation for '${typeName}'`,
          nodeText: node.getText(sourceFile).slice(0, 100),
        });
      }
    }

    // Check function return type contracts
    if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node))) {
      const signature = checker.getSignatureFromDeclaration(node);
      if (signature) {
        const returnType = signature.getReturnType();
        const returnTypeName = checker.typeToString(returnType);

        // Check for explicit `any` in return type
        if (returnTypeName === 'any') {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          violations.push({
            principle: 'P2',
            layer: RGELayer.L1_TYPE_CONTRACT,
            message: `Function has 'any' return type — no type contract (P2)`,
            file: sourceFile.fileName,
            line: line + 1,
            severity: 'HIGH',
            fix: 'Add explicit return type annotation instead of any',
          });
        }

        // Walk function body for return statements with inconsistent types
        const returnTypes: string[] = [];
        if (node.body) {
          function findReturns(n: ts.Node) {
            if (ts.isReturnStatement(n) && n.expression) {
              const retType = checker.getTypeAtLocation(n.expression);
              returnTypes.push(checker.typeToString(retType));
            }
            ts.forEachChild(n, findReturns);
          }
          ts.forEachChild(node.body, findReturns);
        }

        // Check for inconsistent return types (e.g., string | null when declared as string)
        const uniqueReturnTypes = [...new Set(returnTypes)];
        if (uniqueReturnTypes.length > 1 && returnTypeName !== 'any') {
          // Check if the declared return type includes all actual return types
          const hasNullReturn = uniqueReturnTypes.includes('null');
          const hasUndefinedReturn = uniqueReturnTypes.includes('undefined');
          if ((hasNullReturn || hasUndefinedReturn) && !returnTypeName.includes('null') && !returnTypeName.includes('undefined') && !returnTypeName.includes('|')) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              principle: 'P10',
              layer: RGELayer.L1_TYPE_CONTRACT,
              message: `Function declares return type '${returnTypeName}' but returns ${uniqueReturnTypes.join(' | ')} in different paths (P10)`,
              file: sourceFile.fileName,
              line: line + 1,
              severity: 'CRITICAL',
              fix: `Update return type to include all possible return values: ${uniqueReturnTypes.join(' | ')}`,
            });
          }
        }
      }
    }

    // Check for `any` type annotations on parameters
    if (ts.isParameter(node)) {
      const paramType = node.type;
      if (paramType && paramType.kind === ts.SyntaxKind.AnyKeyword) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        violations.push({
          principle: 'P2',
          layer: RGELayer.L1_TYPE_CONTRACT,
          message: `Parameter '${node.name.getText(sourceFile)}' has 'any' type — no type contract (P2)`,
          file: sourceFile.fileName,
          line: line + 1,
          severity: 'HIGH',
          fix: 'Replace any with a specific type or unknown + runtime validation',
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);
  return violations;
}

export async function checkL1TypeContract(
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
      console.error(`[L1] Source file not in program: ${filePath}`);
      continue;
    }

    checksRun++;
    const violations = checkFile(sourceFile, checker);
    allViolations.push(...violations);
  }

  const durationMs = Date.now() - startTime;

  return {
    layer: RGELayer.L1_TYPE_CONTRACT,
    passed: allViolations.filter((v) => v.severity === 'CRITICAL').length === 0,
    violations: allViolations,
    checksRun,
    checksPassed: checksRun - allViolations.filter((v) => v.severity === 'CRITICAL' || v.severity === 'HIGH').length,
    durationMs,
  };
}
