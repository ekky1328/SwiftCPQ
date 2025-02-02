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

-- Create tenant_status enum
CREATE TYPE tenant_status AS ENUM (
    'PENDING',
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);

-- Create proposal_status enum
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

-- Create section_type enum
CREATE TYPE section_type AS ENUM (
    'COVER_LETTER',
    'PRODUCTS',
    'INFO',
    'TOTALS',
    'MILESTONES',
    'TERMS_AND_CONDITIONS'
);

-- Create section_recurrence enum
CREATE TYPE section_recurrence AS ENUM (
    'ONE_TIME',
    'DAILY',
    'WEEKLY',
    'MONTHLY',
    'ANNUAL'
);

-- Create item_type enum
CREATE TYPE item_type AS ENUM (
    'PRODUCT',
    'BUNDLE',
    'COMMENT'
);


--
-- TENANTS MIGRATIONS
--

-- Create tenant table
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

-- Create tenant_theme table
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

-- Create tenant_role table
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

-- Create tenant_permission table
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

-- Create tenant_address_information table
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

-- Create tenant_contact_information table
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

-- Create tenant_proposal_setting table
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

-- Create tenant_settings table
CREATE TABLE tenant_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        prefix VARCHAR(50) NOT NULL DEFAULT 'S-CPQ',
        suffix VARCHAR(50) NOT NULL DEFAULT '',
        logo VARCHAR(255) NOT NULL DEFAULT 'default.svg',
        currency VARCHAR(10) NOT NULL DEFAULT 'USD',
        timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
        date_format VARCHAR(20) NOT NULL DEFAULT 'YYYY-MM-DD',
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

-- Create tenant_role_user table
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

-- Create tenant_role_permission table
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
-- USER MIGRATIONS
-- 

-- Create 'user' table
CREATE TABLE "user" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        description TEXT NOT NULL,
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

-- Create 'user_contact' table
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

-- Create 'user_location' table
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
-- CUSTOMER MIGRATIONS
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
-- PROPOSAL MIGRATIONS
-- 

-- Create 'proposal' table with UUID primary key and constraints
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

-- Create 'proposal_section' table with UUID primary key and constraints
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

-- Create 'proposal_section_item' table with UUID primary key and constraints
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

-- Trigger to update modified_on_date before each update
CREATE TRIGGER proposal_section_item_modified_on_date_trigger 
    BEFORE UPDATE ON proposal_section_item 
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_on_date();

-- Create 'proposal_section_milestone' table with UUID primary key and constraints
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

-- Trigger to update modified_on_date before each update
CREATE TRIGGER proposal_section_milestone_modified_on_date_trigger 
    BEFORE UPDATE ON proposal_section_milestone 
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_on_date();

--
-- CONSTRAINTS
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
ALTER TABLE proposal_section ADD CONSTRAINT fk_section_proposal FOREIGN KEY (proposal_id) REFERENCES proposal(id);
ALTER TABLE proposal_section ADD CONSTRAINT proposal_section_order_unique UNIQUE (proposal_id, "order");