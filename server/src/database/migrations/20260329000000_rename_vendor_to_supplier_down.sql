-- Reverse: rename supplier columns back to vendor

ALTER TABLE ingestion_job RENAME COLUMN supplier_id TO vendor_id;
ALTER TABLE import_template RENAME COLUMN supplier_id TO vendor_id;

ALTER TABLE supplier_sku_mapping RENAME COLUMN supplier_sku TO vendor_sku;
ALTER TABLE supplier_sku_mapping RENAME COLUMN supplier_id TO vendor_id;

ALTER TABLE supplier_inventory RENAME COLUMN supplier_sku TO vendor_sku;
ALTER TABLE supplier_inventory RENAME COLUMN supplier_id TO vendor_id;

ALTER TABLE supplier_sku_mapping RENAME TO vendor_sku_mapping;
ALTER TABLE supplier_inventory RENAME TO vendor_inventory;
ALTER TABLE supplier RENAME TO vendor;
