import db from '../../database/db';
import type { ResolvedRow } from './sku-resolver';

const BATCH_SIZE = 500;

export interface UpsertResult {
  inserted: number;
  updated: number;
}

/**
 * Batch upserts resolved rows into vendor_inventory.
 * Uses INSERT ... ON CONFLICT to update existing records.
 * Reactivates soft-deleted inventory rows on re-import.
 */
export async function batchUpsert(
  tenantId: string,
  vendorId: string,
  rows: ResolvedRow[],
): Promise<UpsertResult> {
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    // Return batch counts from the transaction to avoid referencing outer
    // variables inside a loop callback (no-loop-func).
    const batchResult = await db.transaction(async (trx) => {
      let batchInserted = 0;
      let batchUpdated = 0;

      for (const row of batch) {
        const result = await trx.raw(
          `INSERT INTO vendor_inventory (tenant_id, vendor_id, catalogue_item_id, vendor_sku, stock_level, cost_price, last_synced_at, is_active)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), TRUE)
           ON CONFLICT (tenant_id, vendor_id, catalogue_item_id)
           DO UPDATE SET
             vendor_sku = EXCLUDED.vendor_sku,
             stock_level = EXCLUDED.stock_level,
             cost_price = EXCLUDED.cost_price,
             last_synced_at = NOW(),
             is_active = TRUE
           RETURNING (xmax = 0) AS is_insert`,
          [tenantId, vendorId, row.catalogueItemId, row.vendorSku, row.stockLevel, row.costPrice],
        );

        if (result.rows[0]?.is_insert) {
          batchInserted++;
        } else {
          batchUpdated++;
        }
      }

      return { batchInserted, batchUpdated };
    });

    inserted += batchResult.batchInserted;
    updated += batchResult.batchUpdated;
  }

  return { inserted, updated };
}
