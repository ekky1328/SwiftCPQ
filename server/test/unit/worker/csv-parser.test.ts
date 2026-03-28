import { parseCsv } from '../../../src/worker/ingestion/csv-parser';
import type { ColumnMapping } from '../../../src/types/Supplier';

const DEFAULT_MAPPING: ColumnMapping = {
  sku: 'sku',
  supplier_sku: 'supplier_sku',
  stock_level: 'stock',
  cost_price: 'cost',
};

function toBuffer(csv: string): Buffer {
  return Buffer.from(csv, 'utf8');
}

describe('parseCsv', () => {
  it('parses a standard CSV with header row', () => {
    const csv = `sku,supplier_sku,stock,cost\nSKU-001,SSKU-1,10,19.99\n`;
    const { rows, errors } = parseCsv(toBuffer(csv), DEFAULT_MAPPING, ',', true);

    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
    expect(rows[0].sku).toBe('SKU-001');
    expect(rows[0].supplierSku).toBe('SSKU-1');
    expect(rows[0].stockLevel).toBe(10);
    expect(rows[0].costPrice).toBe(1999); // toCents(19.99)
  });

  it('skips rows with missing SKU and records an error', () => {
    const csv = `sku,stock,cost\nSKU-001,5,10.00\n,3,5.00\nSKU-003,2,2.00\n`;
    const { rows, errors } = parseCsv(toBuffer(csv), DEFAULT_MAPPING, ',', true);

    expect(rows).toHaveLength(2);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Row 3');
    expect(errors[0]).toContain('missing SKU');
  });

  it('handles optional fields: title, description, price', () => {
    const mapping: ColumnMapping = {
      ...DEFAULT_MAPPING,
      title: 'name',
      description: 'desc',
      price: 'sell_price',
    };
    const csv = `sku,stock,cost,name,desc,sell_price\nSKU-001,1,10.00,Widget,A widget,29.99\n`;
    const { rows } = parseCsv(toBuffer(csv), mapping, ',', true);

    expect(rows[0].title).toBe('Widget');
    expect(rows[0].description).toBe('A widget');
    expect(rows[0].price).toBe(2999); // toCents(29.99)
  });

  it('does not set title/description/price when optional mapping is absent', () => {
    const csv = `sku,stock,cost\nSKU-001,1,5.00\n`;
    const { rows } = parseCsv(toBuffer(csv), DEFAULT_MAPPING, ',', true);

    expect(rows[0].title).toBeUndefined();
    expect(rows[0].description).toBeUndefined();
    expect(rows[0].price).toBeUndefined();
  });

  it('handles pipe-delimited CSV', () => {
    const csv = `sku|stock|cost\nSKU-PIPE|7|15.50\n`;
    const { rows, errors } = parseCsv(toBuffer(csv), DEFAULT_MAPPING, '|', true);

    expect(errors).toHaveLength(0);
    expect(rows[0].sku).toBe('SKU-PIPE');
    expect(rows[0].costPrice).toBe(1550);
  });

  it('treats non-numeric cost_price as 0', () => {
    const csv = `sku,stock,cost\nSKU-001,1,NOT_A_NUMBER\n`;
    const { rows } = parseCsv(toBuffer(csv), DEFAULT_MAPPING, ',', true);

    expect(rows[0].costPrice).toBe(0);
  });

  it('treats non-numeric stock_level as 0', () => {
    const csv = `sku,stock,cost\nSKU-001,MANY,10.00\n`;
    const { rows } = parseCsv(toBuffer(csv), DEFAULT_MAPPING, ',', true);

    expect(rows[0].stockLevel).toBe(0);
  });

  it('returns empty rows and no errors for an empty CSV (header only)', () => {
    const csv = `sku,stock,cost\n`;
    const { rows, errors } = parseCsv(toBuffer(csv), DEFAULT_MAPPING, ',', true);

    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  it('trims whitespace from cell values', () => {
    const csv = `sku,stock,cost\n  SKU-001  , 5 , 10.00 \n`;
    const { rows } = parseCsv(toBuffer(csv), DEFAULT_MAPPING, ',', true);

    expect(rows[0].sku).toBe('SKU-001');
  });

  it('uses empty string for supplierSku when supplier_sku mapping is absent', () => {
    const mappingNoSupplierSku: ColumnMapping = {
      sku: 'sku',
      stock_level: 'stock',
      cost_price: 'cost',
    };
    const csv = `sku,stock,cost\nSKU-001,1,5.00\n`;
    const { rows } = parseCsv(toBuffer(csv), mappingNoSupplierSku, ',', true);

    expect(rows[0].supplierSku).toBe('');
  });

  it('handles multiple rows correctly', () => {
    const csv = `sku,stock,cost\nSKU-001,1,10.00\nSKU-002,5,20.00\nSKU-003,0,5.50\n`;
    const { rows, errors } = parseCsv(toBuffer(csv), DEFAULT_MAPPING, ',', true);

    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(3);
    expect(rows[1].sku).toBe('SKU-002');
    expect(rows[2].costPrice).toBe(550);
  });
});
