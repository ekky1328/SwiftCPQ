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
