DROP INDEX IF EXISTS catalogue_item_tenant_sku_unique;
ALTER TABLE tenant_settings DROP COLUMN IF EXISTS stale_inventory_days;
DROP TABLE IF EXISTS ingestion_job CASCADE;
DROP TYPE IF EXISTS ingestion_job_status;
DROP TABLE IF EXISTS vendor_sku_mapping CASCADE;
DROP TABLE IF EXISTS import_template CASCADE;
DROP TABLE IF EXISTS vendor_inventory CASCADE;
DROP TABLE IF EXISTS vendor CASCADE;
