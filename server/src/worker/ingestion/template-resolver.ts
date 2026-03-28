import db from '../../database/db';
import type { ColumnMapping, ResolvedTemplate } from '../../types/Vendor';

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
 * Resolves the import template for a given vendor.
 * 1. Vendor-specific template
 * 2. Tenant generic template (vendor_id IS NULL)
 * 3. Hardcoded default
 */
export async function resolveTemplate(tenantId: string, vendorId: string): Promise<ResolvedTemplate> {
  // Try vendor-specific template
  const vendorTemplate = await db('import_template')
    .where('tenant_id', tenantId)
    .where('vendor_id', vendorId)
    .where('is_active', true)
    .first();

  if (vendorTemplate) {
    return {
      columnMapping: vendorTemplate.column_mapping as ColumnMapping,
      delimiter: vendorTemplate.delimiter,
      hasHeaderRow: vendorTemplate.has_header_row,
    };
  }

  // Try generic tenant template
  const genericTemplate = await db('import_template')
    .where('tenant_id', tenantId)
    .whereNull('vendor_id')
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
