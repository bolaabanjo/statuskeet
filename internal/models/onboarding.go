package models

import (
	"time"

	"github.com/google/uuid"
)

type OnboardingProfile struct {
	ID             uuid.UUID `json:"id"`
	UserID         uuid.UUID `json:"user_id"`
	OrganizationID uuid.UUID `json:"organization_id"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
	CompanySize    string    `json:"company_size"`
	Role           string    `json:"role"`
	UseCases       []string  `json:"use_cases"`
	CompletedAt    time.Time `json:"completed_at"`
}

type OnboardingRequest struct {
	FirstName   string   `json:"first_name"`
	LastName    string   `json:"last_name"`
	CompanySize string   `json:"company_size"`
	Role        string   `json:"role"`
	UseCases    []string `json:"use_cases"`
}
