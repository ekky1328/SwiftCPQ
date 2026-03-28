import db from '../../database/db';
import type { ColumnMapping, ResolvedTemplate } from '../../types/Supplier';

const DEFAULT_MAPPING: ColumnMapping = {
  sku: 'sku',
  stock_level: 'stock_level',
  cost_price: 'cost_price',
};

const DEFAULT_TEMPLATE: ResolvedTemplate = {
  columnMapping: DEFAULT_MAPPING,
  delimiter: ',',
  hasHeaderRow: true,
};

/**
 * Resolves the import template for a given supplier.
 * 1. Supplier-specific template
 * 2. Tenant generic template (supplier_id IS NULL)
 * 3. Hardcoded default
 */
export async function resolveTemplate(tenantId: string, supplierId: string): Promise<ResolvedTemplate> {
  // Try supplier-specific template
  const supplierTemplate = await db('import_template')
    .where('tenant_id', tenantId)
    .where('supplier_id', supplierId)
    .where('is_active', true)
    .first();

  if (supplierTemplate) {
    return {
      columnMapping: supplierTemplate.column_mapping as ColumnMapping,
      delimiter: supplierTemplate.delimiter,
      hasHeaderRow: supplierTemplate.has_header_row,
    };
  }

  // Try generic tenant template
  const genericTemplate = await db('import_template')
    .where('tenant_id', tenantId)
    .whereNull('supplier_id')
    .where('is_active', true)
    .first();

  if (genericTemplate) {
    return {
      columnMapping: genericTemplate.column_mapping as ColumnMapping,
      delimiter: genericTemplate.delimiter,
      hasHeaderRow: genericTemplate.has_header_row,
    };
  }

  // Hardcoded default
  return DEFAULT_TEMPLATE;
}
