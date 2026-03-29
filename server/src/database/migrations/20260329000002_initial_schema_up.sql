--
-- FUNCS
--

CREATE OR REPLACE FUNCTION update_modified_on_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_on_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


--
-- ENUMS
--

CREATE TYPE tenant_status AS ENUM (
    'PENDING',
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);

CREATE TYPE proposal_status AS ENUM (
    'DRAFT',
    'IN_REVIEW',
    'REQUIRES_REVISION',
    'SENT',
    'VIEWED',
    'APPROVED',
    'DECLINED',
    'EXPIRED',
    'CANCELED'
);

CREATE TYPE section_type AS ENUM (
    'COVER_LETTER',
    'PRODUCTS',
    'INFO',
    'TOTALS',
    'MILESTONES',
    'TERMS_AND_CONDITIONS'
);

CREATE TYPE section_recurrence AS ENUM (
    'ONE_TIME',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'ANNUAL'
);

CREATE TYPE item_type AS ENUM (
    'PRODUCT',
    'BUNDLE',
    'COMMENT'
);

CREATE TYPE ingestion_job_status AS ENUM (
    'PENDING',
    'PROCESSING',
    'COMPLETED',
    'FAILED'
);


--
-- TENANT TABLES
--

CREATE TABLE tenant (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(255) UNIQUE,
        status tenant_status NOT NULL DEFAULT 'PENDING',
        status_reason TEXT NOT NULL DEFAULT '',
        admin_user_id UUID,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_modified_on_date_trigger
    BEFORE UPDATE ON tenant
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE tenant_theme (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "primary" VARCHAR NOT NULL DEFAULT '#ff822d',
        "secondary" VARCHAR NOT NULL DEFAULT '#2D7FFF',
        "accent" VARCHAR NOT NULL DEFAULT '#CC681F',
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_theme_modified_on_date_trigger
    BEFORE UPDATE ON tenant_theme
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE tenant_role (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description VARCHAR(255) NOT NULL DEFAULT '',
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_role_modified_on_date_trigger
    BEFORE UPDATE ON tenant_role
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE tenant_permission (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description VARCHAR(255) NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_permission_modified_on_date_trigger
    BEFORE UPDATE ON tenant_permission
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE tenant_address_information (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_address_information_modified_on_date_trigger
    BEFORE UPDATE ON tenant_address_information
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE tenant_contact_information (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL,
        phone VARCHAR NOT NULL,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        address UUID REFERENCES tenant_address_information(id),
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_contact_information_modified_on_date_trigger
    BEFORE UPDATE ON tenant_contact_information
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE tenant_proposal_setting (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        expiry INTEGER NOT NULL DEFAULT 14,
        tax BOOLEAN NOT NULL DEFAULT TRUE,
        tax_rate INTEGER NOT NULL DEFAULT 10,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_proposal_setting_modified_on_date_trigger
    BEFORE UPDATE ON tenant_proposal_setting
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

-- stale_inventory_days baked in (was added via ALTER TABLE in a later migration)
CREATE TABLE tenant_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prefix VARCHAR(50) NOT NULL DEFAULT 'S-CPQ',
        suffix VARCHAR(50) NOT NULL DEFAULT '',
        logo VARCHAR(255) NOT NULL DEFAULT 'default.svg',
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
        date_format VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD',
        selected_template VARCHAR(255) NOT NULL DEFAULT 'default',
        stale_inventory_days INTEGER NOT NULL DEFAULT 28,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        contact_information UUID REFERENCES tenant_contact_information(id),
        proposal_settings UUID REFERENCES tenant_proposal_setting(id),
        proposal_settings_default UUID REFERENCES tenant_theme(id),
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_settings_modified_on_date_trigger
    BEFORE UPDATE ON tenant_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE tenant_role_user (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES tenant_role(id) ON DELETE CASCADE,
        user_id UUID,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_role_user_permission_modified_on_date_trigger
    BEFORE UPDATE ON tenant_role_user
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE tenant_role_permission (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role_id UUID NOT NULL REFERENCES tenant_role(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES tenant_permission(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tenant_role_permission_modified_on_date_trigger
    BEFORE UPDATE ON tenant_role_permission
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();


--
-- USER TABLES
-- auth_provider, external_id, and password_hash DEFAULT '' baked in
-- (were added via ALTER TABLE in a later migration)
--

CREATE TABLE "user" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL DEFAULT '',
        auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
        external_id TEXT,
        description TEXT NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_modified_on_date_trigger
    BEFORE UPDATE ON "user"
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

-- Refresh token storage for logout/revocation
CREATE TABLE user_refresh_token (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE user_contact (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_contact_modified_on_date_trigger
    BEFORE UPDATE ON user_contact
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE user_location (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        user_id UUID,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER user_location_modified_on_date_trigger
    BEFORE UPDATE ON user_location
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();


--
-- CUSTOMER TABLES
--

CREATE TABLE customer (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        primary_customer_contact_id UUID,
        primary_customer_location_id UUID,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER customer_modified_on_date_trigger
    BEFORE UPDATE ON customer
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE customer_contact (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        role VARCHAR(255) NOT NULL,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        customer_id UUID,
        location_id UUID,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER customer_contact_modified_on_date_trigger
    BEFORE UPDATE ON customer_contact
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE customer_location (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        zip_code VARCHAR(20) NOT NULL,
        country VARCHAR(100) NOT NULL,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        customer_id UUID,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER customer_location_modified_on_date_trigger
    BEFORE UPDATE ON customer_location
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();


--
-- PROPOSAL TABLES
--

CREATE TABLE proposal (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        version INTEGER NOT NULL,
        identifier VARCHAR(5) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status proposal_status NOT NULL DEFAULT 'DRAFT',
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        user_id UUID,
        customer_id UUID,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER proposal_modified_on_date_trigger
    BEFORE UPDATE ON proposal
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE proposal_section (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        type section_type NOT NULL DEFAULT 'PRODUCTS',
        "order" INTEGER NOT NULL,
        recurrence section_recurrence,
        description TEXT NOT NULL DEFAULT '',
        is_optional BOOLEAN NOT NULL DEFAULT FALSE,
        is_locked BOOLEAN NOT NULL DEFAULT FALSE,
        is_reference BOOLEAN NOT NULL DEFAULT FALSE,
        block_removal BOOLEAN NOT NULL DEFAULT FALSE,
        tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
        proposal_id UUID,
        created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
        modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER proposal_section_modified_on_date_trigger
    BEFORE UPDATE ON proposal_section
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE proposal_section_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "order" INTEGER NOT NULL,
    sku VARCHAR(256),
    title VARCHAR(255) NOT NULL DEFAULT '',
    description TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 0,
    cost INTEGER NOT NULL,
    price INTEGER NOT NULL,
    margin INTEGER NOT NULL,
    subtotal INTEGER NOT NULL,
    type item_type NOT NULL DEFAULT 'PRODUCT',
    is_optional BOOLEAN DEFAULT FALSE,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    section_id UUID REFERENCES proposal_section(id) ON DELETE CASCADE,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER proposal_section_item_modified_on_date_trigger
    BEFORE UPDATE ON proposal_section_item
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE proposal_section_milestone (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    description TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL,
    due_date DATE,
    amount INTEGER NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    section_id UUID REFERENCES proposal_section(id) ON DELETE CASCADE,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER proposal_section_milestone_modified_on_date_trigger
    BEFORE UPDATE ON proposal_section_milestone
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE TABLE proposal_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES proposal(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX proposal_version_proposal_id_idx ON proposal_version (proposal_id);


--
-- CATALOGUE TABLE
-- Unique SKU index baked in (was added via separate statement in a later migration)
--

CREATE TABLE catalogue_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL DEFAULT '',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    cost BIGINT NOT NULL DEFAULT 0,
    price BIGINT NOT NULL DEFAULT 0,
    type item_type NOT NULL DEFAULT 'PRODUCT',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER catalogue_item_modified_on_date_trigger
    BEFORE UPDATE ON catalogue_item
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE UNIQUE INDEX catalogue_item_tenant_sku_unique
    ON catalogue_item (tenant_id, sku) WHERE sku <> '';


--
-- SUPPLIER TABLES
--

CREATE TABLE supplier (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER supplier_modified_on_date_trigger
    BEFORE UPDATE ON supplier
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE UNIQUE INDEX supplier_tenant_code_unique
    ON supplier (tenant_id, code) WHERE code <> '';

CREATE TABLE supplier_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    catalogue_item_id UUID NOT NULL REFERENCES catalogue_item(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES supplier(id) ON DELETE CASCADE,
    supplier_sku VARCHAR(100) NOT NULL DEFAULT '',
    stock_level INTEGER NOT NULL DEFAULT 0,
    cost_price BIGINT NOT NULL DEFAULT 0,
    last_synced_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER supplier_inventory_modified_on_date_trigger
    BEFORE UPDATE ON supplier_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE UNIQUE INDEX supplier_inventory_unique
    ON supplier_inventory (tenant_id, supplier_id, catalogue_item_id);

CREATE TABLE import_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES supplier(id) ON DELETE CASCADE,
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

CREATE UNIQUE INDEX import_template_supplier_unique
    ON import_template (tenant_id, COALESCE(supplier_id, '00000000-0000-0000-0000-000000000000'));

CREATE TABLE supplier_sku_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES supplier(id) ON DELETE CASCADE,
    supplier_sku VARCHAR(100) NOT NULL,
    catalogue_item_id UUID NOT NULL REFERENCES catalogue_item(id) ON DELETE CASCADE,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW(),
    modified_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER supplier_sku_mapping_modified_on_date_trigger
    BEFORE UPDATE ON supplier_sku_mapping
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_on_date();

CREATE UNIQUE INDEX supplier_sku_mapping_unique
    ON supplier_sku_mapping (tenant_id, supplier_id, supplier_sku);

CREATE TABLE ingestion_job (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES supplier(id) ON DELETE CASCADE,
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


--
-- DEFERRED CONSTRAINTS
-- Circular FK references that could not be defined inline above
--

ALTER TABLE "user" ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);

ALTER TABLE user_contact ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);
ALTER TABLE user_contact ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id);

ALTER TABLE user_location ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);
ALTER TABLE user_location ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id);

ALTER TABLE customer ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);
ALTER TABLE customer ADD CONSTRAINT fk_contact FOREIGN KEY (primary_customer_contact_id) REFERENCES customer_contact(id);
ALTER TABLE customer ADD CONSTRAINT fk_location FOREIGN KEY (primary_customer_location_id) REFERENCES customer_location(id);

ALTER TABLE customer_contact ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);
ALTER TABLE customer_contact ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customer(id);
ALTER TABLE customer_contact ADD CONSTRAINT fk_location FOREIGN KEY (location_id) REFERENCES customer_location(id);

ALTER TABLE customer_location ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);
ALTER TABLE customer_location ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customer(id);

ALTER TABLE proposal ADD CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);
ALTER TABLE proposal ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id);
ALTER TABLE proposal ADD CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customer(id);

ALTER TABLE proposal_section ADD CONSTRAINT fk_section_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);
-- ON DELETE CASCADE baked in (was originally missing, added via a later migration)
ALTER TABLE proposal_section ADD CONSTRAINT fk_section_proposal FOREIGN KEY (proposal_id) REFERENCES proposal(id) ON DELETE CASCADE;
ALTER TABLE proposal_section ADD CONSTRAINT proposal_section_order_unique UNIQUE (proposal_id, "order");
