/**
 * src/execution-brain/sre/checks.ts
 *
 * SRE P1-P11 Principle Checkers
 *
 * Each checker uses AST-based analysis via the TypeScript Compiler API.
 * Regex is used ONLY for fast string-level scanning where AST is overkill.
 *
 * P3 COMPLIANCE: Every catch block has meaningful error handling.
 * P2 COMPLIANCE: No unchecked `as` casts.
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { SREPrinciple } from './types.js';
import type { SRECheckResult, SREViolation } from './types.js';

// ============================================================
// Shared Utilities
// ============================================================

async function readSourceFiles(sourceFiles: string[]): Promise<Array<{ path: string; content: string; sourceFile: ts.SourceFile }>> {
  const results: Array<{ path: string; content: string; sourceFile: ts.SourceFile }> = [];

  for (const filePath of sourceFiles) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.ESNext,
        true,
        ts.ScriptKind.TS,
      );
      results.push({ path: filePath, content, sourceFile });
    } catch (err: unknown) {
      // P3: Meaningful error handling — log with context and file path
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[SRE] Cannot read file ${filePath}: ${errMsg}. Skipping file — may indicate missing source or permission issue.`);
    }
  }

  return results;
}

function createResult(
  principle: SREPrinciple,
  violations: SREViolation[],
  filesChecked: number,
  startTime: number,
): SRECheckResult {
  return {
    principle,
    passed: violations.filter((v) => v.severity === 'CRITICAL').length === 0 && violations.filter((v) => v.severity === 'HIGH').length <= 3,
    violations,
    filesChecked,
    durationMs: Date.now() - startTime,
  };
}

// ============================================================
// P1: Defensive Import
// ============================================================

export async function checkP1(sourceFiles: string[], projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  const files = await readSourceFiles(sourceFiles);

  for (const { path: filePath, sourceFile } of files) {
    function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node)) {
        const specifier = node.moduleSpecifier;
        if (!ts.isStringLiteral(specifier)) return;

        const importPath = specifier.text;
        const isRelative = importPath.startsWith('.') || importPath.startsWith('/');

        if (isRelative) {
          // Verify the module file exists
          const resolvedPath = resolveModulePath(filePath, importPath, projectRoot);
          if (resolvedPath && !fs.existsSync(resolvedPath)) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              principle: SREPrinciple.P1_DEFENSIVE_IMPORT,
              file: filePath,
              line: line + 1,
              severity: 'CRITICAL',
              description: `Import '${importPath}' resolves to non-existent file '${resolvedPath}'`,
              fix: `Fix the import path or create the missing module`,
            });
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    ts.forEachChild(sourceFile, visit);
  }

  return createResult(SREPrinciple.P1_DEFENSIVE_IMPORT, violations, files.length, startTime);
}

// ============================================================
// P2: Type Certainty
// ============================================================

export async function checkP2(sourceFiles: string[], _projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  const files = await readSourceFiles(sourceFiles);

  for (const { path: filePath, content, sourceFile } of files) {
    // Check for `any` type usage
    function visit(node: ts.Node) {
      // `any` keyword in type positions
      if (node.kind === ts.SyntaxKind.AnyKeyword) {
        const parent = node.parent;
        // Skip if it's in a generic type argument that's intentional
        if (parent && (ts.isTypeReferenceNode(parent) || ts.isTypeNode(parent))) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          violations.push({
            principle: SREPrinciple.P2_TYPE_CERTAINTY,
            file: filePath,
            line: line + 1,
            severity: 'HIGH',
            description: 'Use of `any` type — bypasses type system (P2)',
            fix: 'Replace `any` with a specific type or `unknown` with runtime validation',
            codeSnippet: content.split('\n')[line]?.trim().slice(0, 100),
          });
        }
      }

      // Unchecked `as` casts
      if (ts.isAsExpression(node)) {
        const typeName = node.type.getText(sourceFile);
        const isSafeCast = typeName === 'unknown' || typeName === 'const';
        if (!isSafeCast) {
          // Check if there's a runtime validation before this cast
          const lineNum = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line;
          const lines = content.split('\n');
          const prevLine = lineNum > 0 ? lines[lineNum - 1] : '';
          const currentLine = lines[lineNum] || '';
          const beforeCast = currentLine.slice(0, currentLine.indexOf(' as '));

          const hasCheck =
            /typeof\s+\w+\s*(===?|!==?)\s*['"]/.test(prevLine) ||
            /instanceof\s+/.test(prevLine) ||
            /Array\.isArray\s*\(/.test(prevLine) ||
            /typeof\s+\w+\s*(===?|!==?)\s*['"]/.test(beforeCast);

          if (!hasCheck) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              principle: SREPrinciple.P2_TYPE_CERTAINTY,
              file: filePath,
              line: line + 1,
              severity: 'HIGH',
              description: `Unchecked 'as ${typeName}' cast without runtime validation (P2)`,
              fix: `Add typeof/instanceof/Array.isArray check before casting to '${typeName}'`,
              codeSnippet: currentLine.trim().slice(0, 100),
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    }
    ts.forEachChild(sourceFile, visit);
  }

  return createResult(SREPrinciple.P2_TYPE_CERTAINTY, violations, files.length, startTime);
}

// ============================================================
// P3: Error Completeness
// ============================================================

export async function checkP3(sourceFiles: string[], _projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  const files = await readSourceFiles(sourceFiles);

  for (const { path: filePath, sourceFile } of files) {
    function visit(node: ts.Node) {
      if (ts.isCatchClause(node)) {
        const block = node.block;
        const statements = block.statements;

        // Empty catch block
        if (statements.length === 0) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          violations.push({
            principle: SREPrinciple.P3_ERROR_COMPLETENESS,
            file: filePath,
            line: line + 1,
            severity: 'CRITICAL',
            description: 'Empty catch block — errors silently swallowed (P3)',
            fix: 'Add logging (console.error), recovery, or propagation (throw)',
          });
          return;
        }

        // Check if catch block has any meaningful statements
        const hasLogging = statements.some((stmt) => {
          const text = stmt.getText(sourceFile);
          return /console\.(error|warn)|logger\.(error|warn)|throw\s/.test(text);
        });

        if (!hasLogging) {
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          violations.push({
            principle: SREPrinciple.P3_ERROR_COMPLETENESS,
            file: filePath,
            line: line + 1,
            severity: 'HIGH',
            description: 'Catch block has no error handling — errors are acknowledged but not handled (P3)',
            fix: 'Add at minimum: console.error with context, or throw with additional info',
          });
        }
      }

      ts.forEachChild(node, visit);
    }
    ts.forEachChild(sourceFile, visit);
  }

  return createResult(SREPrinciple.P3_ERROR_COMPLETENESS, violations, files.length, startTime);
}

// ============================================================
// P4: Resource Lifecycle
// ============================================================

export async function checkP4(sourceFiles: string[], _projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  const files = await readSourceFiles(sourceFiles);

  for (const { path: filePath, sourceFile } of files) {
    const intervals = new Set<string>();
    const clears = new Set<string>();

    function visit(node: ts.Node) {
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        if (ts.isIdentifier(callee)) {
          if (callee.text === 'setInterval') intervals.add(`${filePath}:${node.getStart()}`);
          if (callee.text === 'clearInterval' || callee.text === 'clearTimeout') clears.add(callee.text);
        }
      }
      ts.forEachChild(node, visit);
    }
    ts.forEachChild(sourceFile, visit);

    if (intervals.size > 0 && !clears.has('clearInterval')) {
      violations.push({
        principle: SREPrinciple.P4_RESOURCE_LIFECYCLE,
        file: filePath,
        line: 0,
        severity: 'CRITICAL',
        description: `setInterval called ${intervals.size} time(s) without clearInterval — resource leak (P4)`,
        fix: 'Add clearInterval in a finally block to ensure cleanup',
      });
    }
  }

  return createResult(SREPrinciple.P4_RESOURCE_LIFECYCLE, violations, files.length, startTime);
}

// ============================================================
// P5: Atomic State
// ============================================================

export async function checkP5(sourceFiles: string[], _projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  const files = await readSourceFiles(sourceFiles);

  for (const { path: filePath, content } of files) {
    const lines = content.split('\n');

    // Detect pattern: state.xxx = ... followed by await on next lines
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      if (/^\w+\.\w+\s*=/.test(line)) {
        // Look for await in subsequent lines within 3 lines
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          if (/\bawait\b/.test(lines[j])) {
            // Check if same object is mutated after await
            for (let k = j + 1; k < Math.min(j + 3, lines.length); k++) {
              const objMatch = line.match(/^(\w+)\.\w+\s*=/);
              if (objMatch && lines[k].includes(`${objMatch[1]}.`)) {
                violations.push({
                  principle: SREPrinciple.P5_ATOMIC_STATE,
                  file: filePath,
                  line: i + 1,
                  severity: 'HIGH',
                  description: `Torn state: '${objMatch[1]}' mutated before await and after — if await throws, state is inconsistent (P5)`,
                  fix: 'Save previous state, then assign entire state atomically after async completes',
                  codeSnippet: line.slice(0, 100),
                });
              }
            }
          }
        }
      }
    }
  }

  return createResult(SREPrinciple.P5_ATOMIC_STATE, violations, files.length, startTime);
}

// ============================================================
// P6: Dependency Check
// ============================================================

export async function checkP6(sourceFiles: string[], _projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  const files = await readSourceFiles(sourceFiles);

  for (const { path: filePath, content } of files) {
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // process.env.XXX used without null check
      const envMatch = line.match(/process\.env\.(\w+)/g);
      if (envMatch) {
        // Check surrounding lines for null/undefined check
        const surrounding = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
        for (const match of envMatch) {
          const varName = match.replace('process.env.', '');
          if (!surrounding.includes(`if (!process.env.${varName}`) &&
              !surrounding.includes(`if (process.env.${varName}`) &&
              !surrounding.includes(`??`) &&
              !surrounding.includes(`||`)) {
            violations.push({
              principle: SREPrinciple.P6_DEPENDENCY_CHECK,
              file: filePath,
              line: i + 1,
              severity: 'CRITICAL',
              description: `process.env.${varName} used without null check — undefined at runtime (P6)`,
              fix: `Add: if (!process.env.${varName}) throw new Error('${varName} required')`,
              codeSnippet: line.slice(0, 100),
            });
          }
        }
      }
    }
  }

  return createResult(SREPrinciple.P6_DEPENDENCY_CHECK, violations, files.length, startTime);
}

// ============================================================
// P7: Path Resolution
// ============================================================

export async function checkP7(sourceFiles: string[], _projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  const files = await readSourceFiles(sourceFiles);

  const HARDCODED_PATH_PATTERNS = [
    { pattern: /['"]\/home\/[a-zA-Z_]\w*\//, desc: 'Hardcoded /home/username path' },
    { pattern: /['"]C:\\Users\\[a-zA-Z_]/, desc: 'Hardcoded Windows user path' },
    { pattern: /['"]\/root\/(?!\.config)/, desc: 'Hardcoded /root/ path' },
  ];

  for (const { path: filePath, content } of files) {
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Skip comments
      if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;

      for (const { pattern, desc } of HARDCODED_PATH_PATTERNS) {
        if (pattern.test(line)) {
          violations.push({
            principle: SREPrinciple.P7_PATH_RESOLUTION,
            file: filePath,
            line: i + 1,
            severity: 'CRITICAL',
            description: `${desc} — only works on one machine (P7)`,
            fix: 'Use os.homedir() + path.join() instead',
            codeSnippet: line.slice(0, 100),
          });
        }
      }
    }
  }

  return createResult(SREPrinciple.P7_PATH_RESOLUTION, violations, files.length, startTime);
}

// ============================================================
// P8: Config Validation
// ============================================================

export async function checkP8(sourceFiles: string[], _projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  const files = await readSourceFiles(sourceFiles);

  for (const { path: filePath, content } of files) {
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Only flag config access in dangerous contexts (app.listen, server.listen, setTimeout with config)
      if (/app\.listen|server\.listen|setTimeout\([^,]+,\s*config/.test(line)) {
        const configAccess = line.match(/config\.(\w+)/g);
        if (configAccess) {
          const surrounding = lines.slice(Math.max(0, i - 5), i + 1).join('\n');
          for (const access of configAccess) {
            const fieldName = access.replace('config.', '');
            if (!surrounding.includes(`typeof config.${fieldName}`) &&
                !surrounding.includes(`if (!config.${fieldName}`) &&
                !surrounding.includes(`if (config.${fieldName}`) &&
                !surrounding.includes('??') &&
                !surrounding.includes('parseInt')) {
              violations.push({
                principle: SREPrinciple.P8_CONFIG_VALIDATION,
                file: filePath,
                line: i + 1,
                severity: 'CRITICAL',
                description: `Config value '${access}' used in dangerous context without validation (P8)`,
                fix: `Validate config.${fieldName} before use: check type, range, and presence`,
                codeSnippet: line.slice(0, 100),
              });
            }
          }
        }
      }
    }
  }

  return createResult(SREPrinciple.P8_CONFIG_VALIDATION, violations, files.length, startTime);
}

// ============================================================
// P9: Async Discipline
// ============================================================

export async function checkP9(sourceFiles: string[], _projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  const files = await readSourceFiles(sourceFiles);

  for (const { path: filePath, content, sourceFile } of files) {
    function visit(node: ts.Node) {
      // .then() without .catch()
      if (ts.isCallExpression(node)) {
        const callee = node.expression;
        if (ts.isPropertyAccessExpression(callee) && callee.name.text === 'then') {
          // Check if the next call in chain is .catch()
          const parent = node.parent;
          if (ts.isPropertyAccessExpression(parent) && parent.name.text === 'catch') {
            return; // Has .catch() — OK
          }
          const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
          violations.push({
            principle: SREPrinciple.P9_ASYNC_DISCIPLINE,
            file: filePath,
            line: line + 1,
            severity: 'CRITICAL',
            description: 'Promise .then() without .catch() — unhandled rejection (P9)',
            fix: 'Add .catch() handler or use await with try/catch',
          });
        }
      }

      // void someAsync() without .catch()
      if (ts.isVoidExpression(node)) {
        const innerExpr = node.expression;
        if (ts.isCallExpression(innerExpr)) {
          const innerText = innerExpr.getText(sourceFile);
          if (!innerText.includes('.catch(')) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              principle: SREPrinciple.P9_ASYNC_DISCIPLINE,
              file: filePath,
              line: line + 1,
              severity: 'HIGH',
              description: 'Fire-and-forget async call with void — errors lost (P9)',
              fix: 'Add .catch() or use await with try/catch',
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    }
    ts.forEachChild(sourceFile, visit);
  }

  return createResult(SREPrinciple.P9_ASYNC_DISCIPLINE, violations, files.length, startTime);
}

// ============================================================
// P10: Output Contract
// ============================================================

export async function checkP10(sourceFiles: string[], _projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  const files = await readSourceFiles(sourceFiles);

  for (const { path: filePath, content, sourceFile } of files) {
    function visit(node: ts.Node) {
      if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) && node.body) {
        // Find return statements with inconsistent types
        const returnValues: Array<{ line: number; text: string; type: string }> = [];

        function findReturns(n: ts.Node) {
          if (ts.isReturnStatement(n) && n.expression) {
            const expr = n.expression;
            let type = 'unknown';
            if (expr.kind === ts.SyntaxKind.NullKeyword) type = 'null';
            else if (ts.isNumericLiteral(expr)) type = 'number';
            else if (ts.isStringLiteral(expr)) type = 'string';
            else if (expr.kind === ts.SyntaxKind.TrueKeyword || expr.kind === ts.SyntaxKind.FalseKeyword) type = 'boolean';
            else if (ts.isObjectLiteralExpression(expr)) type = 'object';
            else if (ts.isArrayLiteralExpression(expr)) type = 'array';

            const { line } = sourceFile.getLineAndCharacterOfPosition(n.getStart());
            returnValues.push({ line, text: expr.getText(sourceFile).slice(0, 50), type });
          }
          ts.forEachChild(n, findReturns);
        }
        ts.forEachChild(node.body, findReturns);

        // Check for null returns from non-nullable functions
        const hasNullReturn = returnValues.some((r) => r.type === 'null');
        const hasNonNullReturn = returnValues.some((r) => r.type !== 'null' && r.type !== 'unknown');

        if (hasNullReturn && hasNonNullReturn && returnValues.length > 1) {
          const nullReturn = returnValues.find((r) => r.type === 'null');
          if (nullReturn) {
            violations.push({
              principle: SREPrinciple.P10_OUTPUT_CONTRACT,
              file: filePath,
              line: nullReturn.line + 1,
              severity: 'CRITICAL',
              description: `Function returns null in error path but non-null in success — contract violation (P10)`,
              fix: 'Return proper error type, throw, or update return type to include null',
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    }
    ts.forEachChild(sourceFile, visit);
  }

  return createResult(SREPrinciple.P10_OUTPUT_CONTRACT, violations, files.length, startTime);
}

// ============================================================
// P11: Output is the Work
// ============================================================

export async function checkP11(sourceFiles: string[], _projectRoot: string): Promise<SRECheckResult> {
  const startTime = Date.now();
  const violations: SREViolation[] = [];
  const files = await readSourceFiles(sourceFiles);

  for (const { path: filePath, content, sourceFile } of files) {
    function visit(node: ts.Node) {
      if ((ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node)) && node.body) {
        const funcName = getFunctionName(node, sourceFile);
        const bodyText = node.body.getText(sourceFile);

        // Check for { success: true } returns without side effects
        if (/\breturn\s*\{\s*success\s*:\s*true\s*\}/.test(bodyText)) {
          const hasSideEffect = /writeFile|mkdir|spawn|exec|fetch|send|dispatch|emit/.test(bodyText);
          if (!hasSideEffect) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              principle: SREPrinciple.P11_OUTPUT_IS_WORK,
              file: filePath,
              line: line + 1,
              severity: 'CRITICAL',
              description: `Function '${funcName}' returns {success:true} without performing side effect (P11)`,
              fix: 'Perform the actual side effect before returning, or return action_required instructions',
            });
          }
        }

        // Check for path returns without file creation
        if (/evidencePath|outputPath|resultPath/.test(bodyText)) {
          const hasWrite = /writeFile|writeFileSync|mkdir|mkdirSync/.test(bodyText);
          if (!hasWrite) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              principle: SREPrinciple.P11_OUTPUT_IS_WORK,
              file: filePath,
              line: line + 1,
              severity: 'CRITICAL',
              description: `Function '${funcName}' returns file path but never creates the file (P11)`,
              fix: 'Actually write the file before returning the path',
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    }
    ts.forEachChild(sourceFile, visit);
  }

  return createResult(SREPrinciple.P11_OUTPUT_IS_WORK, violations, files.length, startTime);
}

// ============================================================
// Helpers
// ============================================================

function resolveModulePath(fromFile: string, importPath: string, _projectRoot: string): string | null {
  if (!importPath.startsWith('.')) return null;
  const fromDir = path.dirname(fromFile);
  const base = path.resolve(fromDir, importPath);
  const extensions = ['.ts', '.tsx', '.js', '/index.ts', '/index.js'];
  for (const ext of extensions) {
    const candidate = base + ext;
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch (err: unknown) {
      // P3: Meaningful error handling — log with context
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`[SRE] Cannot check if module exists at ${candidate}: ${errMsg}`);
    }
  }
  return base + '.ts'; // Return best guess
}

function getFunctionName(node: ts.Node, sourceFile: ts.SourceFile): string {
  if (ts.isFunctionDeclaration(node) && node.name) return node.name.text;
  if (ts.isMethodDeclaration(node) && ts.isIdentifier(node.name)) return node.name.text;
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parent = node.parent;
    if (ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
  }
  return '<anonymous>';
}
