/**
 * L6: Kraken Zone Protection (brains/system re-export)
 * Re-exports from system-brain/firewall/l6-kraken-protection.ts — SINGLE SOURCE OF TRUTH
 */

export {
  L6_KRAKEN_PROTECTION,
  KRAKEN_ZONES,
  checkKrakenProtection,
  checkProtectionPatterns,
} from '../../../system-brain/firewall/l6-kraken-protection.js';
