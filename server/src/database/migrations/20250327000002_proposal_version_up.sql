CREATE TABLE proposal_version (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proposal_id UUID NOT NULL REFERENCES proposal(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    created_on_date TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX proposal_version_proposal_id_idx ON proposal_version(proposal_id);
