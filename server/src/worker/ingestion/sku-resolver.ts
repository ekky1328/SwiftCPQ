import db from '../../database/db';
import type { ParsedRow } from '../../types/Supplier';

export interface ResolvedRow {
  catalogueItemId: string;
  supplierSku: string;
  stockLevel: number;
  costPrice: number;
  wasCreated: boolean;
}

/**
 * Resolves a parsed CSV row to a catalogue_item_id.
 *
 * Resolution order:
 * 1. Check supplier_sku_mapping for an explicit alias
 * 2. Match against catalogue_item.sku within the tenant
 * 3. Auto-create a new catalogue_item if no match found
 *
 * Returns null only on error.
 */
export async function resolveRow(
  tenantId: string,
  supplierId: string,
  row: ParsedRow,
): Promise<{ resolved: ResolvedRow } | { error: string }> {

  const mapping = await db('supplier_sku_mapping')
    .where('tenant_id', tenantId)
    .where('supplier_id', supplierId)
    .where('supplier_sku', row.sku)
    .first();

  if (mapping) {
    return {
      resolved: {
        catalogueItemId: mapping.catalogue_item_id,
        supplierSku: row.supplierSku || row.sku,
        stockLevel: row.stockLevel,
        costPrice: row.costPrice,
        wasCreated: false,
      },
    };
  }

  const catalogueItem = await db('catalogue_item')
    .where('tenant_id', tenantId)
    .where('sku', row.sku)
    .first();

  if (catalogueItem) {
    if (!catalogueItem.is_active) {
      await db('catalogue_item')
        .where('id', catalogueItem.id)
        .update({ is_active: true });
    }

    return {
      resolved: {
        catalogueItemId: catalogueItem.id,
        supplierSku: row.supplierSku || row.sku,
        stockLevel: row.stockLevel,
        costPrice: row.costPrice,
        wasCreated: false,
      },
    };
  }

  try {
    const [newItem] = await db('catalogue_item').insert({
      tenant_id: tenantId,
      sku: row.sku,
      title: row.title || row.sku,
      description: row.description || '',
      cost: row.costPrice,
      price: row.price ?? 0,
      type: 'PRODUCT',
    }).returning('*');

    return {
      resolved: {
        catalogueItemId: newItem.id,
        supplierSku: row.supplierSku || row.sku,
        stockLevel: row.stockLevel,
        costPrice: row.costPrice,
        wasCreated: true,
      },
    };
  } catch (err: any) {
    return { error: `SKU "${row.sku}": failed to auto-create catalogue item — ${err.message}` };
  }
}
