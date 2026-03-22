CREATE TABLE services (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    service_type    TEXT NOT NULL CHECK (service_type IN ('http', 'tcp', 'dns', 'internal')),
    url             TEXT,
    check_interval  INTEGER NOT NULL DEFAULT 30,
    timeout         INTEGER NOT NULL DEFAULT 10,
    expected_status INTEGER NOT NULL DEFAULT 200,
    criticality     TEXT NOT NULL DEFAULT 'standard' CHECK (criticality IN ('critical', 'standard', 'low')),
    current_status  TEXT NOT NULL DEFAULT 'unknown' CHECK (current_status IN ('operational', 'degraded', 'partial_outage', 'major_outage', 'unknown')),
    display_order   INTEGER NOT NULL DEFAULT 0,
    visible         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (org_id, name)
);

CREATE INDEX idx_services_org_id ON services (org_id);
