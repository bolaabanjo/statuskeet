package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type CheckResult struct {
	ID           uuid.UUID        `json:"id"`
	ServiceID    uuid.UUID        `json:"service_id"`
	Source       string           `json:"source"`
	Status       string           `json:"status"`
	ResponseTime *int             `json:"response_time,omitempty"`
	StatusCode   *int             `json:"status_code,omitempty"`
	ErrorMessage *string          `json:"error_message,omitempty"`
	Metadata     *json.RawMessage `json:"metadata,omitempty"`
	Region       *string          `json:"region,omitempty"`
	CheckedAt    time.Time        `json:"checked_at"`
}

// HeartbeatRequest matches the SDK heartbeat payload from the PRD.
type HeartbeatRequest struct {
	Timestamp  string             `json:"timestamp"`
	Region     string             `json:"region,omitempty"`
	SDKVersion string             `json:"sdk_version,omitempty"`
	Services   []HeartbeatService `json:"services"`
}

type HeartbeatService struct {
	ServiceName    string           `json:"service_name"`
	Status         string           `json:"status"`
	ResponseTimeMs *int             `json:"response_time_ms,omitempty"`
	Metadata       *json.RawMessage `json:"metadata,omitempty"`
}

type HeartbeatResponse struct {
	Received int `json:"received"`
}
