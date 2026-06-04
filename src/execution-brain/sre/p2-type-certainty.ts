import * as ts from 'typescript';
import * as fs from 'fs';
import { SREPrinciple, SREViolation, SRECheckResult } from './types';

interface ValidationMarker {
  line: number;
  type: 'typeof' | 'instanceof' | 'in' | 'isArray' | 'typeGuard';
}

/**
 * Collects runtime validation markers (typeof, instanceof, in, Array.isArray) within a function body
 * that appear before a given line number.
 */
function collectValidationMarkers(sourceFile: ts.SourceFile, funcBody: ts.Block): ValidationMarker[] {
  const markers: ValidationMarker[] = [];

  function visit(node: ts.Node): void {
    // typeof x === 'string' / typeof x !== 'undefined'
    if (ts.isBinaryExpression(node)) {
      const left = node.left;
      const right = node.right;

      // typeof expr === 'string'
      if (ts.isTypeOfExpression(left) && ts.isStringLiteral(right)) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        markers.push({ line, type: 'typeof' });
      }
      // expr === 'string' (when left is typeof)
      if (ts.isTypeOfExpression(right) && ts.isStringLiteral(left)) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        markers.push({ line, type: 'typeof' });
      }

      // expr instanceof SomeClass
      if (node.operatorToken.kind === ts.SyntaxKind.InstanceOfKeyword) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        markers.push({ line, type: 'instanceof' });
      }

      // 'prop' in expr
      if (node.operatorToken.kind === ts.SyntaxKind.InKeyword && ts.isStringLiteral(left)) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        markers.push({ line, type: 'in' });
      }
    }

    // Array.isArray(expr)
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (ts.isPropertyAccessExpression(expr)) {
        if (
          ts.isIdentifier(expr.expression) &&
          expr.expression.text === 'Array' &&
          expr.name.text === 'isArray'
        ) {
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
          markers.push({ line, type: 'isArray' });
        }
      }

      // Custom type guard: function returns x is Type
      // We can't fully check this without the type checker, but we can flag common patterns
      if (ts.isIdentifier(expr)) {
        const fnName = expr.text;
        if (fnName.startsWith('is') || fnName.startsWith('has') || fnName.startsWith('check') || fnName.startsWith('validate')) {
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
          markers.push({ line, type: 'typeGuard' });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(funcBody, visit);
  return markers;
}

function isCastToComplexType(castType: ts.TypeNode): boolean {
  // Complex types: object literals, arrays, generics, union/intersection
  if (ts.isTypeReferenceNode(castType)) return true;
  if (ts.isTypeLiteralNode(castType)) return true;
  if (ts.isArrayTypeNode(castType)) return true;
  if (ts.isUnionTypeNode(castType)) return true;
  if (ts.isIntersectionTypeNode(castType)) return true;
  if (ts.isTupleTypeNode(castType)) return true;
  return false;
}

function getSourceSnippet(sourceFile: ts.SourceFile, line: number): string {
  const lineStart = sourceFile.getPositionOfLineAndCharacter(line - 1, 0);
  const lineEnd = sourceFile.getLineEndOfPosition(lineStart);
  return sourceFile.text.substring(lineStart, lineEnd).trim();
}

function findEnclosingFunctionBody(node: ts.Node, sourceFile: ts.SourceFile): ts.Block | null {
  let current: ts.Node | undefined = node;
  while (current) {
    if (
      ts.isFunctionDeclaration(current) ||
      ts.isFunctionExpression(current) ||
      ts.isArrowFunction(current) ||
      ts.isMethodDeclaration(current)
    ) {
      const body = current.body;
      if (body && ts.isBlock(body)) return body;
    }
    current = current.parent;
  }
  return null;
}

export async function checkP2(sourceFiles: string[], projectRoot: string): Promise<SRECheckResult> {
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
      console.error(`[SRE:P2] Cannot read file ${filePath}: ${errMsg}. Skipping.`);
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
      // Check for `as SomeType` casts
      if (ts.isAsExpression(node)) {
        const castLine = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        const castColumn = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).character + 1;
        const castType = node.type;

        // Find enclosing function and collect validation markers before this cast
        const funcBody = findEnclosingFunctionBody(node, sourceFile);
        const markers = funcBody ? collectValidationMarkers(sourceFile, funcBody) : [];

        const hasPrecedingValidation = markers.some(m => m.line < castLine);

        if (!hasPrecedingValidation) {
          const isComplex = isCastToComplexType(castType);
          violations.push({
            principle: SREPrinciple.P2_TYPE_CERTAINTY,
            file: filePath,
            line: castLine,
            column: castColumn,
            severity: isComplex ? 'CRITICAL' : 'HIGH',
            description: `Unchecked 'as' cast to type "${castType.getText(sourceFile)}" without preceding runtime validation`,
            codeSnippet: getSourceSnippet(sourceFile, castLine),
            fix: `Add a runtime type check (typeof, instanceof, Array.isArray, or type guard) before the cast`,
          });
        }
      }

      // Check for angle-bracket casts: <SomeType>expr (only in .ts, not .tsx)
      if (ts.isAssertionExpression(node) && node.kind === ts.SyntaxKind.TypeAssertionExpression) {
        const castLine = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        const castColumn = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).character + 1;
        const castType = node.type;

        const funcBody = findEnclosingFunctionBody(node, sourceFile);
        const markers = funcBody ? collectValidationMarkers(sourceFile, funcBody) : [];
        const hasPrecedingValidation = markers.some(m => m.line < castLine);

        if (!hasPrecedingValidation) {
          const isComplex = isCastToComplexType(castType);
          violations.push({
            principle: SREPrinciple.P2_TYPE_CERTAINTY,
            file: filePath,
            line: castLine,
            column: castColumn,
            severity: isComplex ? 'CRITICAL' : 'HIGH',
            description: `Unchecked type assertion <${castType.getText(sourceFile)}> without preceding runtime validation`,
            codeSnippet: getSourceSnippet(sourceFile, castLine),
            fix: `Add a runtime type check before the assertion`,
          });
        }
      }

      // Check for `any` type annotations
      if (ts.isVariableDeclaration(node)) {
        if (node.type && node.type.kind === ts.SyntaxKind.AnyKeyword) {
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
          const column = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).character + 1;
          violations.push({
            principle: SREPrinciple.P2_TYPE_CERTAINTY,
            file: filePath,
            line,
            column,
            severity: 'HIGH',
            description: `Variable typed as 'any' — use a specific type or unknown`,
            codeSnippet: getSourceSnippet(sourceFile, line),
            fix: `Replace 'any' with a specific type or 'unknown' and add type guards`,
          });
        }
      }

      // Check for function parameters typed as `any`
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isArrowFunction(node) ||
        ts.isMethodDeclaration(node)
      ) {
        for (const param of node.parameters) {
          if (param.type && param.type.kind === ts.SyntaxKind.AnyKeyword) {
            const line = sourceFile.getLineAndCharacterOfPosition(param.getStart(sourceFile)).line + 1;
            const column = sourceFile.getLineAndCharacterOfPosition(param.getStart(sourceFile)).character + 1;
            violations.push({
              principle: SREPrinciple.P2_TYPE_CERTAINTY,
              file: filePath,
              line,
              column,
              severity: 'HIGH',
              description: `Function parameter typed as 'any' — use a specific type or unknown`,
              codeSnippet: getSourceSnippet(sourceFile, line),
              fix: `Replace 'any' with a specific type or 'unknown'`,
            });
          }
        }
      }

      // Check for `any` in call signatures (callback parameters)
      if (ts.isParameter(node) && node.type && node.type.kind === ts.SyntaxKind.AnyKeyword) {
        // Already handled above for function parameters
        // This catches callback parameters in other positions
      }

      // Check for `as any` casts
      if (ts.isAsExpression(node) && node.type.kind === ts.SyntaxKind.AnyKeyword) {
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        const column = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).character + 1;
        violations.push({
          principle: SREPrinciple.P2_TYPE_CERTAINTY,
          file: filePath,
          line,
          column,
          severity: 'CRITICAL',
          description: `Cast to 'any' — this defeats type safety entirely`,
          codeSnippet: getSourceSnippet(sourceFile, line),
          fix: `Replace 'as any' with a proper type assertion or use 'unknown' with type guards`,
        });
      }

      ts.forEachChild(node, visit);
    }

    ts.forEachChild(sourceFile, visit);
  }

  return {
    principle: SREPrinciple.P2_TYPE_CERTAINTY,
    passed: violations.length === 0,
    violations,
    filesChecked,
    durationMs: Date.now() - startTime,
  };
}
