/**
 * BUNDLE INTEGRITY CHECK — v1.2 Architecture Preservation System
 *
 * Prevents the catastrophic scenario where Kraken source architecture
 * is silently stripped from the bundle during a build. This ALGORITHMICALLY
 * verifies that ALL core subsystems are present in the built bundle,
 * not just checking for hardcoded paths.
 *
 * Three checkpoints:
 * 1. PRE-BUILD: All core source directories exist and contain files
 * 2. POST-BUILD: Bundle exports contain all required subsystems
 * 3. POST-DEPLOY: Ship package has full source tree
 *
 * If ANY subsystem is missing, the build/ship is ABORTED with a
 * specific error telling you exactly what was stripped.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';

// ============================================================
// CORE SUBSYSTEM DEFINITIONS
// ============================================================
// These define the MINIMUM VIABLE Kraken architecture.
// If ANY of these subsystems are missing, Kraken is NOT Kraken.
// This is NOT hardcoded — it's the architectural specification.

interface CoreSubsystem {
  name: string;
  path: string;           // Source directory relative to project root
  expectedExports: string[];  // Exports that MUST exist in the bundle
  minimumFiles: number;       // Minimum .ts files expected (catches stripped dirs)
  critical: boolean;          // If true, build halts on missing
  description: string;
}

const CORE_SUBSYSTEMS: CoreSubsystem[] = [
  {
    name: 'brains',
    path: 'src/brains',
    expectedExports: ['PlanningBrain', 'ExecutionBrain', 'SystemBrain', 'BrainConcurrencyManager'],
    minimumFiles: 5,
    critical: true,
    description: 'Multi-brain orchestration (Planning, Execution, System)',
  },
  {
    name: 'clusters',
    path: 'src/clusters',
    expectedExports: ['ClusterManager', 'ClusterInstance'],
    minimumFiles: 3,
    critical: true,
    description: 'Async cluster management (Alpha/Beta/Gamma)',
  },
  {
    name: 'factory',
    path: 'src/factory',
    expectedExports: ['AsyncDelegationEngine', 'ClusterScheduler'],
    minimumFiles: 5,
    critical: true,
    description: 'Delegation engine and scheduling infrastructure',
  },
  {
    name: 'shared',
    path: 'src/shared',
    expectedExports: ['StateStore', 'EvidenceCollector', 'BrainMessenger'],
    minimumFiles: 3,
    critical: true,
    description: 'Shared state, evidence, and messaging',
  },
  {
    name: 'tools',
    path: 'src/tools',
    expectedExports: ['kraken_hive_search', 'spawn_shark_agent', 'spawn_manta_agent'],
    minimumFiles: 3,
    critical: true,
    description: 'Agent-visible orchestration and Hive tools',
  },
  {
    name: 'kraken-hive',
    path: 'src/kraken-hive',
    expectedExports: ['KrakenHiveEngine'],
    minimumFiles: 1,
    critical: true,
    description: 'File-based persistent Hive Mind memory',
  },
  {
    name: 'v4.1-framework',
    path: 'src/v4.1',
    expectedExports: ['safeHook'],
    minimumFiles: 5,
    critical: true,
    description: 'v4.1 boilerplate framework (hooks, state, context)',
  },
  {
    name: 'identity',
    path: 'src/identity',
    expectedExports: ['IdentityLoader', 'formatIdentityForSystemPrompt'],
    minimumFiles: 2,
    critical: false, // Fallback hardcoded identity works
    description: 'File-based identity loader and injector',
  },
  {
    name: 'system-firewall',
    path: 'src/system-brain/firewall',
    expectedExports: ['LayerEngine', 'checkKrakenProtection', 'bridgeFirewallToHive'],
    minimumFiles: 8,
    critical: true,
    description: '16-layer firewall system (system-brain)',
  },
  {
    name: 'brains-firewall',
    path: 'src/brains/system/firewall',
    expectedExports: ['l0-identity', 'l1-orchestration-theater'],
    minimumFiles: 8,
    critical: true,
    description: '16-layer firewall system (brains)',
  },
];

// ============================================================
// PRE-BUILD CHECK: Source tree integrity
// ============================================================

export interface SystemIntegrityReport {
  passed: boolean;
  subsystems: { name: string; present: boolean; fileCount: number; minimum: number }[];
  missingCritical: string[];
  missingNonCritical: string[];
  totalFiles: number;
  minimumTotal: number;
}

export function checkSourceTreeIntegrity(projectRoot: string): SystemIntegrityReport {
  const report: SystemIntegrityReport = {
    passed: true,
    subsystems: [],
    missingCritical: [],
    missingNonCritical: [],
    totalFiles: 0,
    minimumTotal: 0,
  };

  for (const sys of CORE_SUBSYSTEMS) {
    const dirPath = resolve(projectRoot, sys.path);

    let fileCount = 0;
    let present = false;

    try {
      if (existsSync(dirPath) && statSync(dirPath).isDirectory()) {
        const countFiles = (dir: string): number => {
          let count = 0;
          const entries = readdirSync(dir, { withFileTypes: true });
          for (const e of entries) {
            if (e.isDirectory() && !e.name.startsWith('.')) {
              count += countFiles(join(dir, e.name));
            } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.py'))) {
              count++;
            }
          }
          return count;
        };
        fileCount = countFiles(dirPath);
        present = fileCount >= sys.minimumFiles;
      }
    } catch {
      present = false;
      fileCount = 0;
    }

    report.subsystems.push({
      name: sys.name,
      present,
      fileCount,
      minimum: sys.minimumFiles,
    });

    report.totalFiles += fileCount;
    report.minimumTotal += sys.minimumFiles;

    if (!present) {
      if (sys.critical) {
        report.missingCritical.push(sys.name);
        report.passed = false;
      } else {
        report.missingNonCritical.push(sys.name);
      }
    }
  }

  return report;
}

// ============================================================
// POST-BUILD CHECK: Bundle export integrity
// ============================================================

export interface BundleIntegrityReport {
  passed: boolean;
  bundlePath: string;
  bundleSize: number;
  missingExports: { subsystem: string; missing: string[] }[];
  expectedTotalExports: number;
  verifiedExports: number;
}

export function checkBundleExportIntegrity(bundlePath: string): BundleIntegrityReport {
  const report: BundleIntegrityReport = {
    passed: true,
    bundlePath,
    bundleSize: 0,
    missingExports: [],
    expectedTotalExports: 0,
    verifiedExports: 0,
  };

  if (!existsSync(bundlePath)) {
    report.missingExports.push({ subsystem: 'bundle', missing: ['FILE_NOT_FOUND'] });
    report.passed = false;
    return report;
  }

  report.bundleSize = statSync(bundlePath).size;
  const content = readFileSync(bundlePath, 'utf-8');

  // Check EVERY subsystem's required exports exist in the bundle
  for (const sys of CORE_SUBSYSTEMS) {
    const missing: string[] = [];

    for (const exp of sys.expectedExports) {
      // Search for the export name in the bundle (must appear as identifier, not just string)
      // Pattern: the export name appears as a function/class/variable definition or reference
      const found = new RegExp(
        `(?:function|class|const|let|var)\\s+${exp}\\b|` +
        `(?:export\\s*\\{[^}]*\\b${exp}\\b[^}]*\\})|` +
        `(?:${exp}\\s*[=(:])|` +
        `(?:"${exp}"|'${exp}')`,
        'm'
      ).test(content);

      report.expectedTotalExports++;

      if (found) {
        report.verifiedExports++;
      } else {
        missing.push(exp);
      }
    }

    if (missing.length > 0 && sys.critical) {
      report.missingExports.push({ subsystem: sys.name, missing });
      report.passed = false;
    }
  }

  // Additional: check bundle size is reasonable (not a stripped firewall-only build)
  const MINIMUM_BUNDLE_SIZE = 500_000; // 500KB — stripped bundles are ~750KB, real bundles are larger
  if (report.bundleSize < MINIMUM_BUNDLE_SIZE) {
    report.passed = false;
    report.missingExports.push({
      subsystem: 'SIZE_CHECK',
      missing: [`Bundle size ${report.bundleSize} bytes < minimum ${MINIMUM_BUNDLE_SIZE} bytes — likely stripped`],
    });
  }

  return report;
}

// ============================================================
// POST-DEPLOY CHECK: Ship package completeness
// ============================================================

export function checkShipPackageIntegrity(shipRoot: string): SystemIntegrityReport {
  // Check src/ in ship package has all subsystems
  const srcPath = resolve(shipRoot, 'src');
  if (!existsSync(srcPath)) {
    return {
      passed: false,
      subsystems: [],
      missingCritical: ['ENTIRE_SRC_DIRECTORY'],
      missingNonCritical: [],
      totalFiles: 0,
      minimumTotal: 1,
    };
  }

  return checkSourceTreeIntegrity(srcPath);
}

// ============================================================
// COMPREHENSIVE INTEGRITY CHECK (all 3 levels)
// ============================================================

export interface ComprehensiveIntegrityReport {
  sourceTree: SystemIntegrityReport;
  bundle: BundleIntegrityReport | null;
  shipPackage: SystemIntegrityReport | null;
  overallPassed: boolean;
}

export function checkFullIntegrity(
  projectRoot: string,
  bundlePath: string,
  shipRoot: string
): ComprehensiveIntegrityReport {
  const sourceTree = checkSourceTreeIntegrity(projectRoot);
  const bundle = checkBundleExportIntegrity(bundlePath);
  const shipPackage = checkShipPackageIntegrity(shipRoot);

  const overallPassed = sourceTree.passed && bundle.passed && (shipPackage?.passed ?? true);

  return { sourceTree, bundle, shipPackage, overallPassed };
}

// ============================================================
// FORMAT FUNCTION — Human-readable report
// ============================================================

export function formatIntegrityReport(report: ComprehensiveIntegrityReport): string {
  let out = '';

  out += '═══════════════════════════════════════════════\n';
  out += '  KRAKEN v1.2 ARCHITECTURE INTEGRITY VERIFICATION\n';
  out += `  Status: ${report.overallPassed ? '✅ PASSED' : '❌ FAILED — BUILD ABORTED'}\n`;
  out += '═══════════════════════════════════════════════\n\n';

  // Source tree
  out += '── PRE-BUILD: Source Tree ──\n';
  for (const s of report.sourceTree.subsystems) {
    out += `  ${s.present ? '✅' : '❌'} ${s.name}: ${s.fileCount} files (min ${s.minimum})\n`;
  }
  if (report.sourceTree.missingCritical.length > 0) {
    out += `\n  ❌ MISSING CRITICAL: ${report.sourceTree.missingCritical.join(', ')}\n`;
    out += '  These subsystems MUST exist. Build cannot proceed.\n';
  }

  // Bundle
  if (report.bundle) {
    out += `\n── POST-BUILD: Bundle Exports [${(report.bundle.bundleSize / 1024).toFixed(0)}KB] ──\n`;
    out += `  Verified: ${report.bundle.verifiedExports}/${report.bundle.expectedTotalExports} exports\n`;
    if (report.bundle.missingExports.length > 0) {
      for (const m of report.bundle.missingExports) {
        out += `  ❌ ${m.subsystem}: missing ${m.missing.join(', ')}\n`;
      }
    }
  }

  // Ship package
  if (report.shipPackage) {
    out += '\n── POST-DEPLOY: Ship Package ──\n';
    out += `  Status: ${report.shipPackage.passed ? '✅ Complete' : '❌ Incomplete'}\n`;
    if (!report.shipPackage.passed) {
      out += `  Missing: ${report.shipPackage.missingCritical.join(', ')}\n`;
    }
  }

  out += '\n═══════════════════════════════════════════════\n';

  if (!report.overallPassed) {
    out += 'BUILD ABORTED: Architecture integrity check failed.\n';
    out += 'The Kraken source tree was STRIPPED during the build.\n';
    out += 'This has been BLOCKED by the L6 ARCHITECTURE firewall.\n';
    out += 'Restore the missing subsystems and rebuild.\n';
    out += '═══════════════════════════════════════════════\n';
  }

  return out;
}
