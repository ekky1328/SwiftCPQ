import type { IngestionResult } from '../../types/Supplier';
import { resolveTemplate } from './template-resolver';
import { parseCsv } from './csv-parser';
import { resolveRow } from './sku-resolver';
import { batchUpsert } from './upsert';
import type { ResolvedRow } from './sku-resolver';

/**
 * Runs the full ingestion pipeline:
 * 1. Resolve import template for the supplier
 * 2. Parse CSV using the template's column mapping
 * 3. Resolve each row's SKU to a catalogue item (alias → match → auto-create)
 * 4. Batch upsert into supplier_inventory
 */
export async function runIngestion(
  tenantId: string,
  supplierId: string,
  csvBuffer: Buffer,
): Promise<IngestionResult> {
  // 1. Resolve template
  const template = await resolveTemplate(tenantId, supplierId);

  // 2. Parse CSV
  const { rows: parsedRows, errors } = parseCsv(
    csvBuffer,
    template.columnMapping,
    template.delimiter,
    template.hasHeaderRow,
  );

  if (parsedRows.length === 0) {
    return { inserted: 0, updated: 0, created: 0, errors };
  }

  // 3. Resolve SKUs
  const resolvedRows: ResolvedRow[] = [];
  let created = 0;

  for (const row of parsedRows) {
    const result = await resolveRow(tenantId, supplierId, row);

    if ('error' in result) {
      errors.push(result.error);
      continue;
    }

    if (result.resolved.wasCreated) {
      created++;
    }

    resolvedRows.push(result.resolved);
  }

  if (resolvedRows.length === 0) {
    return { inserted: 0, updated: 0, created, errors };
  }

  // 4. Batch upsert
  const { inserted, updated } = await batchUpsert(tenantId, supplierId, resolvedRows);

  return { inserted, updated, created, errors };
}
