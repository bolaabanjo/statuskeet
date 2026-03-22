CREATE TABLE incidents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'detected' CHECK (status IN ('detected', 'investigating', 'identified', 'monitoring', 'resolved')),
    severity        TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('critical', 'major', 'minor')),
    auto_generated  BOOLEAN NOT NULL DEFAULT TRUE,
    started_at      TIMESTAMPTZ NOT NULL,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE incident_services (
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    service_id  UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (incident_id, service_id)
);

CREATE TABLE incident_updates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    status      TEXT NOT NULL,
    message     TEXT NOT NULL,
    is_public   BOOLEAN NOT NULL DEFAULT TRUE,
    author_id   UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_org_status ON incidents (org_id, status);
CREATE INDEX idx_incidents_started_at ON incidents (started_at DESC);
CREATE INDEX idx_incident_updates_incident ON incident_updates (incident_id, created_at DESC);
