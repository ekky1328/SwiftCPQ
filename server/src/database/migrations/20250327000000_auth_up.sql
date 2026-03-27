-- Refresh token storage for logout/revocation
CREATE TABLE user_refresh_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Support Entra-linked users alongside local auth users
ALTER TABLE "user"
    ADD COLUMN auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    ADD COLUMN external_id TEXT;

-- Allow empty password_hash for Entra-only users
ALTER TABLE "user" ALTER COLUMN password_hash SET DEFAULT '';
