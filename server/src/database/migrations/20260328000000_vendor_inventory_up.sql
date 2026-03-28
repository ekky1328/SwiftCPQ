-- Create vendor table
CREATE TABLE vendor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER vendor_modified_on_date_trigger
    BEFORE UPDATE ON vendor
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE UNIQUE INDEX vendor_tenant_code_unique
    ON vendor (tenant_id, code) WHERE code <> '';

-- Create vendor_inventory table
CREATE TABLE vendor_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    catalogue_item_id UUID NOT NULL REFERENCES catalogue_item(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    vendor_sku VARCHAR(100) NOT NULL DEFAULT '',
    stock_level INTEGER NOT NULL DEFAULT 0,
    cost_price BIGINT NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER vendor_inventory_modified_on_date_trigger
    BEFORE UPDATE ON vendor_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();  

CREATE UNIQUE INDEX vendor_inventory_unique
    ON vendor_inventory (tenant_id, vendor_id, catalogue_item_id);

-- Create import_template table
CREATE TABLE import_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendor(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    column_mapping JSONB NOT NULL DEFAULT '{}',
    delimiter VARCHAR(5) NOT NULL DEFAULT ',',
    has_header_row BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER import_template_modified_on_date_trigger
    BEFORE UPDATE ON import_template
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE UNIQUE INDEX import_template_vendor_unique
    ON import_template (tenant_id, COALESCE(vendor_id, '00000000-0000-0000-0000-000000000000'));

-- Create vendor_sku_mapping table
CREATE TABLE vendor_sku_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    vendor_sku VARCHAR(100) NOT NULL,
    catalogue_item_id UUID NOT NULL REFERENCES catalogue_item(id) ON DELETE CASCADE,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER vendor_sku_mapping_modified_on_date_trigger
    BEFORE UPDATE ON vendor_sku_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE UNIQUE INDEX vendor_sku_mapping_unique
    ON vendor_sku_mapping (tenant_id, vendor_id, vendor_sku);

-- Create ingestion_job table (pg-backed job queue for the worker)
CREATE TYPE ingestion_job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE TABLE ingestion_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendor(id) ON DELETE CASCADE,
    status ingestion_job_status NOT NULL DEFAULT 'PENDING',
    csv_data BYTEA NOT NULL,
    result JSONB,
    error TEXT,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX ingestion_job_pending_idx ON ingestion_job (status, created_on_date)
    WHERE status = 'PENDING';

-- Add stale_inventory_days setting to tenant_settings
ALTER TABLE tenant_settings ADD COLUMN stale_inventory_days INTEGER NOT NULL DEFAULT 28;

-- Add unique SKU constraint to catalogue_item (required for ingestion matching)
CREATE UNIQUE INDEX catalogue_item_tenant_sku_unique
    ON catalogue_item (tenant_id, sku) WHERE sku <> '';
