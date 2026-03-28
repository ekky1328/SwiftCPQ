export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdOnDate: string;
  modifiedOnDate: string;
}

export interface VendorInventory {
  id: string;
  tenantId: string;
  catalogueItemId: string;
  vendorId: string;
  vendorSku: string;
  stockLevel: number;
  costPrice: number;
  lastSyncedAt: string;
  isActive: boolean;
  createdOnDate: string;
  modifiedOnDate: string;
}

export interface VendorInventoryWithVendor extends VendorInventory {
  vendorName: string;
  vendorCode: string;
}

export interface VendorSkuMapping {
  id: string;
  tenantId: string;
  vendorId: string;
  vendorSku: string;
  catalogueItemId: string;
  createdOnDate: string;
  modifiedOnDate: string;
}

export interface ColumnMapping {
  sku: string;
  vendor_sku?: string;
  stock_level: string;
  cost_price: string;
  title?: string;
  description?: string;
  price?: string;
}

export interface ImportTemplate {
  id: string;
  tenantId: string;
  vendorId: string | null;
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
  vendorSku: string;
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
