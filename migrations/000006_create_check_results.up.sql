CREATE TABLE check_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    source          TEXT NOT NULL CHECK (source IN ('external', 'heartbeat')),
    status          TEXT NOT NULL CHECK (status IN ('up', 'down', 'degraded', 'timeout')),
    response_time   INTEGER,
    status_code     INTEGER,
    error_message   TEXT,
    metadata        JSONB,
    region          TEXT,
    checked_at      TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_check_results_service_time ON check_results (service_id, checked_at DESC);
CREATE INDEX idx_check_results_checked_at ON check_results (checked_at DESC);
