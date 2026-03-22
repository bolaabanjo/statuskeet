CREATE TABLE api_keys (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    key_hash        TEXT NOT NULL UNIQUE,
    key_prefix      TEXT NOT NULL,
    name            TEXT NOT NULL,
    last_used_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at      TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_key_hash ON api_keys (key_hash);
CREATE INDEX idx_api_keys_org_id ON api_keys (organization_id);
