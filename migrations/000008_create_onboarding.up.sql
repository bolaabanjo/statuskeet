CREATE TABLE onboarding_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    company_size    TEXT NOT NULL,
    role            TEXT NOT NULL,
    use_cases       TEXT[] NOT NULL DEFAULT '{}',
    completed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

CREATE INDEX idx_onboarding_profiles_org_id ON onboarding_profiles (organization_id);
