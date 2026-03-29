-- Drop everything in reverse FK dependency order

-- Named indexes (tables handle their own implicit FK indexes on drop)
DROP INDEX IF EXISTS ingestion_job_pending_idx;
DROP INDEX IF EXISTS supplier_sku_mapping_unique;
DROP INDEX IF EXISTS import_template_supplier_unique;
DROP INDEX IF EXISTS supplier_inventory_unique;
DROP INDEX IF EXISTS supplier_tenant_code_unique;
DROP INDEX IF EXISTS catalogue_item_tenant_sku_unique;
DROP INDEX IF EXISTS proposal_version_proposal_id_idx;

-- Supplier / ingestion tables
DROP TABLE IF EXISTS ingestion_job CASCADE;
DROP TABLE IF EXISTS supplier_sku_mapping CASCADE;
DROP TABLE IF EXISTS import_template CASCADE;
DROP TABLE IF EXISTS supplier_inventory CASCADE;
DROP TABLE IF EXISTS supplier CASCADE;

-- Catalogue
DROP TABLE IF EXISTS catalogue_item CASCADE;

-- Proposal tables
DROP TABLE IF EXISTS proposal_version CASCADE;
DROP TABLE IF EXISTS proposal_section_milestone CASCADE;
DROP TABLE IF EXISTS proposal_section_item CASCADE;
DROP TABLE IF EXISTS proposal_section CASCADE;
DROP TABLE IF EXISTS proposal CASCADE;

-- Customer tables
DROP TABLE IF EXISTS customer_location CASCADE;
DROP TABLE IF EXISTS customer_contact CASCADE;
DROP TABLE IF EXISTS customer CASCADE;

-- User tables
DROP TABLE IF EXISTS user_refresh_token CASCADE;
DROP TABLE IF EXISTS user_location CASCADE;
DROP TABLE IF EXISTS user_contact CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Tenant tables
DROP TABLE IF EXISTS tenant_role_permission CASCADE;
DROP TABLE IF EXISTS tenant_role_user CASCADE;
DROP TABLE IF EXISTS tenant_settings CASCADE;
DROP TABLE IF EXISTS tenant_proposal_setting CASCADE;
DROP TABLE IF EXISTS tenant_contact_information CASCADE;
DROP TABLE IF EXISTS tenant_address_information CASCADE;
DROP TABLE IF EXISTS tenant_permission CASCADE;
DROP TABLE IF EXISTS tenant_role CASCADE;
DROP TABLE IF EXISTS tenant_theme CASCADE;
DROP TABLE IF EXISTS tenant CASCADE;

-- Enums
DROP TYPE IF EXISTS ingestion_job_status CASCADE;
DROP TYPE IF EXISTS item_type CASCADE;
DROP TYPE IF EXISTS section_recurrence CASCADE;
DROP TYPE IF EXISTS section_type CASCADE;
DROP TYPE IF EXISTS proposal_status CASCADE;
DROP TYPE IF EXISTS tenant_status CASCADE;

-- Trigger function
DROP FUNCTION IF EXISTS update_modified_on_date() CASCADE;
