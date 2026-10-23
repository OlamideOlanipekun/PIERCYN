/**
 * persist.ts
 * Simple file-based persistence for in-memory inventory.
 * Saves inventory state to a JSON file after every adjustment,
 * and restores it on startup so stock never resets to seed values.
 */

import fs from 'fs';
import path from 'path';
import { DbInventory } from './store';

// Store the file next to this module so it's always findable
const PERSIST_DIR = path.resolve(__dirname);
const INVENTORY_FILE = path.join(PERSIST_DIR, 'inventory-state.json');

export interface PersistedInventoryState {
  savedAt: string;
  inventory: Record<string, DbInventory>; // variantId -> DbInventory
}

/**
 * Save the current inventory Map to disk.
 * Called after every stock adjustment.
 */
export function saveInventoryState(inventory: Map<string, DbInventory>): void {
  try {
    const state: PersistedInventoryState = {
      savedAt: new Date().toISOString(),
      inventory: Object.fromEntries(inventory.entries()),
    };
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    // Non-fatal — adjustments still work in-session, just won't survive restart
    console.warn('[persist] Failed to save inventory state:', (err as Error).message);
  }
}

/**
 * Load saved inventory state from disk and merge it back into the live Map.
 * Call this AFTER seedFromCatalog() so saved values overwrite seed defaults.
 * Only restores records that still have a matching variantId in the live store.
 */
export function loadInventoryState(inventory: Map<string, DbInventory>): void {
  try {
    if (!fs.existsSync(INVENTORY_FILE)) return;

    const raw = fs.readFileSync(INVENTORY_FILE, 'utf-8');
    const state: PersistedInventoryState = JSON.parse(raw);

    let restored = 0;
    for (const [variantId, savedInv] of Object.entries(state.inventory)) {
      // Only restore if this variant still exists in the seeded store
      if (inventory.has(variantId)) {
        inventory.set(variantId, { ...savedInv, updatedAt: savedInv.updatedAt });
        restored++;
      }
    }

    if (restored > 0) {
      console.log(`[persist] Restored inventory for ${restored} variant(s) from saved state (${state.savedAt})`);
    }
  } catch (err) {
    console.warn('[persist] Failed to load inventory state:', (err as Error).message);
  }
}
