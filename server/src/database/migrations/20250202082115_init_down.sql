-- 
-- DROP CONSTRAINTS explicitly before dropping tables
--

ALTER TABLE tenant_settings DROP CONSTRAINT IF EXISTS tenant_settings_proposal_settings_default_fkey CASCADE;
ALTER TABLE tenant_settings DROP CONSTRAINT IF EXISTS tenant_settings_proposal_settings_fkey CASCADE;
ALTER TABLE tenant_contact_information DROP CONSTRAINT IF EXISTS tenant_contact_information_address_fkey CASCADE;
ALTER TABLE tenant_settings DROP CONSTRAINT IF EXISTS tenant_settings_contact_information_fkey CASCADE;

-- 
-- DROP TABLES in reverse order, with CASCADE
--

DROP TABLE IF EXISTS proposal_section_milestone CASCADE;
DROP TABLE IF EXISTS proposal_section_item CASCADE;
DROP TABLE IF EXISTS proposal_section CASCADE;
DROP TABLE IF EXISTS proposal CASCADE;
DROP TABLE IF EXISTS customer_location CASCADE;
DROP TABLE IF EXISTS customer_contact CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS user_location CASCADE;
DROP TABLE IF EXISTS user_contact CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
DROP TABLE IF EXISTS tenant_role_permission CASCADE;
DROP TABLE IF EXISTS tenant_role_user CASCADE;
DROP TABLE IF EXISTS tenant_permission CASCADE;
DROP TABLE IF EXISTS tenant_role CASCADE;
DROP TABLE IF EXISTS tenant_theme CASCADE;
DROP TABLE IF EXISTS tenant_proposal_setting CASCADE;
DROP TABLE IF EXISTS tenant_address_information CASCADE;
DROP TABLE IF EXISTS tenant_contact_information CASCADE;
DROP TABLE IF EXISTS tenant_settings CASCADE;
DROP TABLE IF EXISTS tenant CASCADE;

-- 
-- DROP ENUMS
--

DROP TYPE IF EXISTS item_type CASCADE;
DROP TYPE IF EXISTS section_recurrence CASCADE;
DROP TYPE IF EXISTS section_type CASCADE;
DROP TYPE IF EXISTS proposal_status CASCADE;
DROP TYPE IF EXISTS tenant_status CASCADE;
