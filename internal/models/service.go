package models

import (
	"time"

	"github.com/google/uuid"
)

type Service struct {
	ID             uuid.UUID `json:"id"`
	OrgID          uuid.UUID `json:"org_id"`
	Name           string    `json:"name"`
	Description    *string   `json:"description,omitempty"`
	ServiceType    string    `json:"service_type"`
	URL            *string   `json:"url,omitempty"`
	CheckInterval  int       `json:"check_interval"`
	Timeout        int       `json:"timeout"`
	ExpectedStatus int       `json:"expected_status"`
	Criticality    string    `json:"criticality"`
	CurrentStatus  string    `json:"current_status"`
	DisplayOrder   int       `json:"display_order"`
	Visible        bool      `json:"visible"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// RegisterServiceRequest is a single service in a registration request from the SDK.
type RegisterServiceRequest struct {
	Name           string `json:"name"`
	Description    string `json:"description,omitempty"`
	Type           string `json:"type"`
	URL            string `json:"url,omitempty"`
	CheckInterval  *int   `json:"check_interval,omitempty"`
	Timeout        *int   `json:"timeout,omitempty"`
	ExpectedStatus *int   `json:"expected_status,omitempty"`
	Criticality    string `json:"criticality,omitempty"`
}

// RegisterServicesRequest is the top-level request from the SDK.
type RegisterServicesRequest struct {
	Services []RegisterServiceRequest `json:"services"`
}

type RegisterServicesResponse struct {
	Services []Service `json:"services"`
}
