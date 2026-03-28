import { parse } from 'csv-parse/sync';
import { toCents } from '../../server/helpers/money';
import type { ColumnMapping, ParsedRow } from '../../types/Vendor';

/**
 * Parses a CSV buffer using a column mapping to translate vendor headers into canonical fields.
 * Returns an array of parsed rows. Rows missing a SKU value are skipped.
 */
export function parseCsv(
  buffer: Buffer,
  mapping: ColumnMapping,
  delimiter: string,
  hasHeaderRow: boolean,
): { rows: ParsedRow[]; errors: string[] } {
  const errors: string[] = [];

  const options = {
    columns: hasHeaderRow as true,
    delimiter,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  };
  const records: Record<string, string>[] = parse(buffer, options);

  const rows: ParsedRow[] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const lineNum = hasHeaderRow ? i + 2 : i + 1; // +2 accounts for header row

    const skuValue = record[mapping.sku];
    if (!skuValue?.trim()) {
      errors.push(`Row ${lineNum}: missing SKU value (column "${mapping.sku}")`);
      continue;
    }

    const costPriceRaw = record[mapping.cost_price];
    const costPrice = costPriceRaw ? toCents(parseFloat(costPriceRaw) || 0) : 0;

    const stockLevelRaw = record[mapping.stock_level];
    const stockLevel = stockLevelRaw ? parseInt(stockLevelRaw, 10) || 0 : 0;

    const vendorSku = mapping.vendor_sku ? (record[mapping.vendor_sku]?.trim() ?? '') : '';

    const parsed: ParsedRow = {
      sku: skuValue.trim(),
      vendorSku,
      stockLevel,
      costPrice,
    };

    if (mapping.title) {
      const titleValue = record[mapping.title]?.trim();
      if (titleValue) parsed.title = titleValue;
    }

    if (mapping.description) {
      const descValue = record[mapping.description]?.trim();
      if (descValue) parsed.description = descValue;
    }

    if (mapping.price) {
      const priceRaw = record[mapping.price];
      if (priceRaw) parsed.price = toCents(parseFloat(priceRaw) || 0);
    }

    rows.push(parsed);
  }

  return { rows, errors };
}
