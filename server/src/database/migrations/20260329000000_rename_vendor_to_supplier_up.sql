-- Rename vendor table to supplier
ALTER TABLE vendor RENAME TO supplier;

-- Rename vendor_inventory table to supplier_inventory
ALTER TABLE vendor_inventory RENAME TO supplier_inventory;

-- Rename vendor_sku_mapping table to supplier_sku_mapping
ALTER TABLE vendor_sku_mapping RENAME TO supplier_sku_mapping;

-- Rename foreign key columns in supplier_inventory
ALTER TABLE supplier_inventory RENAME COLUMN vendor_id TO supplier_id;
ALTER TABLE supplier_inventory RENAME COLUMN vendor_sku TO supplier_sku;

-- Rename foreign key columns in supplier_sku_mapping
ALTER TABLE supplier_sku_mapping RENAME COLUMN vendor_id TO supplier_id;
ALTER TABLE supplier_sku_mapping RENAME COLUMN vendor_sku TO supplier_sku;

-- Rename foreign key column in import_template
ALTER TABLE import_template RENAME COLUMN vendor_id TO supplier_id;

-- Rename foreign key column in ingestion_job
ALTER TABLE ingestion_job RENAME COLUMN vendor_id TO supplier_id;
