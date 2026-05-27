/**
 * src/factory/StateStore.ts
 * 
 * V4 State Store
 *
 * Shared state store with domain ownership enforcement.
 * Each brain can only WRITE to its owned state domains.
 * All brains can READ from all domains.
 */

import type {
  StateStore,
  StateDomain,
  WriteResult,
  StateSnapshot,
  Unsubscribe,
} from './types.js';

export const DOMAIN_OWNERSHIP: Record<StateDomain, string[]> = {
  'plan-state': ['architect'],
  'execution-state': ['executor'],
  'quality-state': ['guardian', 'executor'],
};

export function createStateStore(): StateStore {
  const data = new Map<string, any>();
  const versions = new Map<string, number>();
  const watchers = new Map<string, Array<(value: any, version: number) => void>>();

  function getKey(key: string, domain?: StateDomain): string {
    return domain ? `${domain}:${key}` : key;
  }

  return {
    get<T>(key: string, domain?: StateDomain): T | undefined {
      const fullKey = getKey(key, domain);
      return data.get(fullKey) as T | undefined;
    },

    set<T>(key: string, value: T, domain: StateDomain, ownerBrain?: string): WriteResult {
      const fullKey = getKey(key, domain);

      // Domain ownership enforcement
      if (ownerBrain) {
        const owners = DOMAIN_OWNERSHIP[domain];
        if (owners && !owners.includes(ownerBrain)) {
          return {
            success: false,
            version: versions.get(fullKey) ?? 0,
            error: `Brain "${ownerBrain}" does not own domain "${domain}". Owners: ${owners.join(', ')}`,
          };
        }
      }

      const currentVersion = versions.get(fullKey) ?? 0;
      const newVersion = currentVersion + 1;

      data.set(fullKey, value);
      versions.set(fullKey, newVersion);

      // Notify watchers
      const watchersForKey = watchers.get(fullKey);
      if (watchersForKey) {
        for (const callback of watchersForKey) {
          try {
            callback(value, newVersion);
          } catch {
            // Watcher errors are silently ignored to not break the store
          }
        }
      }

      return { success: true, version: newVersion };
    },

    watch(key: string, callback: (value: any, version: number) => void): Unsubscribe {
      // Register watcher for both the bare key and all domain-prefixed variants
      const allKeys = [key];
      // Also register for domain-prefixed keys
      for (const domain of Object.keys(DOMAIN_OWNERSHIP)) {
        allKeys.push(`${domain}:${key}`);
      }

      for (const fullKey of allKeys) {
        if (!watchers.has(fullKey)) {
          watchers.set(fullKey, []);
        }
        watchers.get(fullKey)!.push(callback);
      }

      return () => {
        for (const fullKey of allKeys) {
          const list = watchers.get(fullKey);
          if (list) {
            const idx = list.indexOf(callback);
            if (idx !== -1) list.splice(idx, 1);
          }
        }
      };
    },

    snapshot(): StateSnapshot {
      const snapshotData: Record<string, any> = {};
      const snapshotVersions: Record<string, number> = {};

      for (const [key, value] of data.entries()) {
        snapshotData[key] = value;
      }
      for (const [key, version] of versions.entries()) {
        snapshotVersions[key] = version;
      }

      return {
        data: snapshotData,
        versions: snapshotVersions,
        timestamp: Date.now(),
      };
    },

    restore(snapshot: StateSnapshot): void {
      data.clear();
      versions.clear();

      for (const [key, value] of Object.entries(snapshot.data)) {
        data.set(key, value);
      }
      for (const [key, version] of Object.entries(snapshot.versions)) {
        versions.set(key, version);
      }
    },
  };
}
