export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdOnDate: string;
  modifiedOnDate: string;
}

export interface SupplierInventory {
  id: string;
  tenantId: string;
  catalogueItemId: string;
  supplierId: string;
  supplierSku: string;
  stockLevel: number;
  costPrice: number;
  lastSyncedAt: string;
  isActive: boolean;
  createdOnDate: string;
  modifiedOnDate: string;
}

export interface SupplierInventoryWithSupplier extends SupplierInventory {
  supplierName: string;
  supplierCode: string;
}

export interface SupplierSkuMapping {
  id: string;
  tenantId: string;
  supplierId: string;
  supplierSku: string;
  catalogueItemId: string;
  createdOnDate: string;
  modifiedOnDate: string;
}

export interface ColumnMapping {
  sku: string;
  supplier_sku?: string;
  stock_level: string;
  cost_price: string;
  title?: string;
  description?: string;
  price?: string;
}

export interface ImportTemplate {
  id: string;
  tenantId: string;
  supplierId: string | null;
  name: string;
  columnMapping: ColumnMapping;
  delimiter: string;
  hasHeaderRow: boolean;
  isActive: boolean;
  createdOnDate: string;
  modifiedOnDate: string;
}

export interface ResolvedTemplate {
  columnMapping: ColumnMapping;
  delimiter: string;
  hasHeaderRow: boolean;
}

export interface ParsedRow {
  sku: string;
  supplierSku: string;
  stockLevel: number;
  costPrice: number;
  title?: string;
  description?: string;
  price?: number;
}

export interface IngestionResult {
  inserted: number;
  updated: number;
  created: number;
  errors: string[];
}
