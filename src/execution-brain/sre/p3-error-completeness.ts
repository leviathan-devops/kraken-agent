import * as ts from 'typescript';
import * as fs from 'fs';
import { SREPrinciple, SREViolation, SRECheckResult } from './types';

function getSourceSnippet(sourceFile: ts.SourceFile, line: number): string {
  const lineStart = sourceFile.getPositionOfLineAndCharacter(line - 1, 0);
  const lineEnd = sourceFile.getLineEndOfPosition(lineStart);
  return sourceFile.text.substring(lineStart, lineEnd).trim();
}

/**
 * Checks if a statement is "just a comment" — i.e., it has no runtime effect.
 * In TypeScript AST, comments are not child nodes, so a block with only
 * comment-like statements would actually have zero child statements.
 */
function isEmptyOrCommentOnly(block: ts.Block): boolean {
  return block.statements.length === 0;
}

/**
 * Determines if a catch block has meaningful error handling.
 * Meaningful handling includes:
 * - console.error / console.warn / console.info
 * - throw
 * - return with error information
 * - Logging calls (logger.error, logger.warn, etc.)
 * - Re-assignment of error state
 * - Calling an error-handling function
 */
function hasMeaningfulHandling(block: ts.Block, sourceFile: ts.SourceFile): boolean {
  for (const stmt of block.statements) {
    // throw — definitely meaningful
    if (ts.isThrowStatement(stmt)) return true;

    // return — meaningful if it returns error info
    if (ts.isReturnStatement(stmt)) return true;

    // Expression statement — check for console.error/warn/log, logger calls, etc.
    if (ts.isExpressionStatement(stmt)) {
      const expr = stmt.expression;

      // console.error / console.warn / console.info / console.log
      if (ts.isCallExpression(expr) && ts.isPropertyAccessExpression(expr.expression)) {
        const obj = expr.expression.expression;
        const prop = expr.expression.name.text;

        if (ts.isIdentifier(obj) && obj.text === 'console') {
          if (['error', 'warn', 'info', 'log'].includes(prop)) {
            return true;
          }
        }

        // logger.error / logger.warn / logger.info etc.
        if (ts.isIdentifier(obj) && prop !== undefined) {
          const objName = obj.text.toLowerCase();
          const propName = prop.toLowerCase();
          if (
            (objName.includes('log') || objName.includes('logger') || objName.includes('log4')) &&
            (propName.includes('error') || propName.includes('warn') || propName.includes('info'))
          ) {
            return true;
          }
        }
      }

      // Process.exit in catch is meaningful (though drastic)
      if (ts.isCallExpression(expr) && ts.isPropertyAccessExpression(expr.expression)) {
        if (
          ts.isIdentifier(expr.expression.expression) &&
          expr.expression.expression.text === 'process' &&
          expr.expression.name.text === 'exit'
        ) {
          return true;
        }
      }
    }

    // Variable declaration that uses the error — e.g., const msg = error.message
    if (ts.isVariableStatement(stmt)) {
      for (const decl of stmt.declarationList.declarations) {
        if (decl.initializer) {
          // Check if the initializer references the catch variable
          const initText = decl.initializer.getText(sourceFile);
          if (initText.includes('.message') || initText.includes('.stack') || initText.includes('.code')) {
            return true;
          }
        }
      }
    }

    // If statement in catch — likely branching on error type
    if (ts.isIfStatement(stmt)) return true;

    // Assignment to an error state variable
    if (ts.isExpressionStatement(stmt) && ts.isBinaryExpression(stmt.expression)) {
      if (stmt.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        const leftText = stmt.expression.left.getText(sourceFile);
        if (leftText.includes('error') || leftText.includes('Error') || leftText.includes('err')) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Checks if the catch block has ONLY comment-like content.
 * Since TS AST doesn't include comments as statements, an empty statements array
 * means there could be comments. We need to check the source text.
 */
function hasOnlyComments(block: ts.Block, sourceFile: ts.SourceFile): boolean {
  if (block.statements.length > 0) return false;

  // Get the text between { and }
  const openBrace = block.getStart(sourceFile);
  const closeBrace = block.getEnd();
  const blockText = sourceFile.text.substring(openBrace, closeBrace);
  const innerText = blockText.replace(/^\s*\{/, '').replace(/\}\s*$/, '').trim();

  if (innerText.length === 0) return false; // Truly empty

  // Check if it's only comments
  const lines = innerText.split('\n');
  const nonCommentLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*') && !trimmed.endsWith('*/');
  });

  return nonCommentLines.length === 0;
}

export async function checkP3(sourceFiles: string[], projectRoot: string): Promise<SRECheckResult> {
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
      console.error(`[SRE:P3] Cannot read file ${filePath}: ${errMsg}. Skipping.`);
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
      // Find CatchClause nodes
      if (ts.isCatchClause(node)) {
        const catchBlock = node.block;
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
        const column = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).character + 1;

        const isEmpty = isEmptyOrCommentOnly(catchBlock);
        const isCommentOnly = hasOnlyComments(catchBlock, sourceFile);
        const hasMeaningful = hasMeaningfulHandling(catchBlock, sourceFile);

        if (isEmpty && !isCommentOnly) {
          // Completely empty catch block: catch {} or catch(e) {}
          violations.push({
            principle: SREPrinciple.P3_ERROR_COMPLETENESS,
            file: filePath,
            line,
            column,
            severity: 'CRITICAL',
            description: `Empty catch block silently swallows errors`,
            codeSnippet: getSourceSnippet(sourceFile, line),
            fix: `Add error handling: log the error, throw it, or return an error result`,
          });
        } else if (isCommentOnly) {
          // catch(e) { /* comment only */ }
          violations.push({
            principle: SREPrinciple.P3_ERROR_COMPLETENESS,
            file: filePath,
            line,
            column,
            severity: 'HIGH',
            description: `Catch block contains only comments — no actual error handling`,
            codeSnippet: getSourceSnippet(sourceFile, line),
            fix: `Add substantive error handling: log the error, throw it, or return an error result`,
          });
        } else if (!hasMeaningful) {
          // catch block has statements but none are meaningful error handling
          violations.push({
            principle: SREPrinciple.P3_ERROR_COMPLETENESS,
            file: filePath,
            line,
            column,
            severity: 'HIGH',
            description: `Catch block does not meaningfully handle the error — errors may be silently swallowed`,
            codeSnippet: getSourceSnippet(sourceFile, line),
            fix: `Add error logging (console.error), re-throw, or return error information`,
          });
        }
      }

      ts.forEachChild(node, visit);
    }

    ts.forEachChild(sourceFile, visit);
  }

  return {
    principle: SREPrinciple.P3_ERROR_COMPLETENESS,
    passed: violations.length === 0,
    violations,
    filesChecked,
    durationMs: Date.now() - startTime,
  };
}
