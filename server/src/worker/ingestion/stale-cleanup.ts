import db from '../../database/db';

/**
 * Runs the stale inventory cleanup job for all active tenants.
 * For each tenant:
 * 1. Reads stale_inventory_days from tenant_settings (default 28)
 * 2. Soft-deletes supplier_inventory rows not synced within the threshold
 * 3. Soft-deletes catalogue items that have zero active supplier_inventory rows
 */
export async function runStaleCleanup(): Promise<void> {
  const tenants = await db('tenant').where('status', 'ACTIVE');

  for (const tenant of tenants) {
    const settings = await db('tenant_settings')
      .where('tenant_id', tenant.id)
      .first();

    const staleDays = settings?.stale_inventory_days ?? 28;

    // Soft-delete stale supplier_inventory rows
    const staleCount = await db('supplier_inventory')
      .where('tenant_id', tenant.id)
      .where('is_active', true)
      .whereRaw('last_synced_at < NOW() - INTERVAL ? DAY', [staleDays])
      .update({ is_active: false });

    if (staleCount > 0) {
      console.log(`[stale-cleanup] tenant=${tenant.id}: deactivated ${staleCount} stale supplier_inventory rows`);
    }

    // Soft-delete catalogue items with zero active supplier_inventory rows
    // Only targets items that have at least one supplier_inventory row (i.e., were part of ingestion)
    const orphanedItems = await db('catalogue_item')
      .where('catalogue_item.tenant_id', tenant.id)
      .where('catalogue_item.is_active', true)
      .whereExists(
        db('supplier_inventory')
          .whereRaw('supplier_inventory.catalogue_item_id = catalogue_item.id')
      )
      .whereNotExists(
        db('supplier_inventory')
          .whereRaw('supplier_inventory.catalogue_item_id = catalogue_item.id')
          .where('supplier_inventory.is_active', true)
      )
      .update({ is_active: false });

    if (orphanedItems > 0) {
      console.log(`[stale-cleanup] tenant=${tenant.id}: deactivated ${orphanedItems} orphaned catalogue items`);
    }
  }
}
