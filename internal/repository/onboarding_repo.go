package repository

import (
	"context"

	"github.com/google/uuid"

	"github.com/bolaabanjo/statuskeet/internal/database"
	"github.com/bolaabanjo/statuskeet/internal/models"
)

type OnboardingRepo struct {
	db database.Querier
}

func NewOnboardingRepo(db database.Querier) *OnboardingRepo {
	return &OnboardingRepo{db: db}
}

func (r *OnboardingRepo) Create(ctx context.Context, userID, orgID uuid.UUID, req models.OnboardingRequest) (*models.OnboardingProfile, error) {
	profile := &models.OnboardingProfile{}
	err := r.db.QueryRow(ctx,
		`INSERT INTO onboarding_profiles (user_id, organization_id, first_name, last_name, company_size, role, use_cases)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 ON CONFLICT (user_id) DO UPDATE SET
		   first_name = EXCLUDED.first_name,
		   last_name = EXCLUDED.last_name,
		   company_size = EXCLUDED.company_size,
		   role = EXCLUDED.role,
		   use_cases = EXCLUDED.use_cases,
		   completed_at = now()
		 RETURNING id, user_id, organization_id, first_name, last_name, company_size, role, use_cases, completed_at`,
		userID, orgID, req.FirstName, req.LastName, req.CompanySize, req.Role, req.UseCases,
	).Scan(
		&profile.ID, &profile.UserID, &profile.OrganizationID,
		&profile.FirstName, &profile.LastName, &profile.CompanySize,
		&profile.Role, &profile.UseCases, &profile.CompletedAt,
	)
	if err != nil {
		return nil, err
	}
	return profile, nil
}

func (r *OnboardingRepo) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.OnboardingProfile, error) {
	profile := &models.OnboardingProfile{}
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, organization_id, first_name, last_name, company_size, role, use_cases, completed_at
		 FROM onboarding_profiles WHERE user_id = $1`,
		userID,
	).Scan(
		&profile.ID, &profile.UserID, &profile.OrganizationID,
		&profile.FirstName, &profile.LastName, &profile.CompanySize,
		&profile.Role, &profile.UseCases, &profile.CompletedAt,
	)
	if err != nil {
		return nil, err
	}
	return profile, nil
}
