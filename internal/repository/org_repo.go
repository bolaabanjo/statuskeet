package repository

import (
	"context"

	"github.com/bolaabanjo/statuskeet/internal/database"
	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/google/uuid"
)

type OrgRepo struct {
	db database.Querier
}

func NewOrgRepo(db database.Querier) *OrgRepo {
	return &OrgRepo{db: db}
}

func (r *OrgRepo) Create(ctx context.Context, name, slug string) (*models.Organization, error) {
	org := &models.Organization{}
	err := r.db.QueryRow(ctx,
		`INSERT INTO public.organizations (name, slug) VALUES ($1, $2)
		 RETURNING id, name, slug, created_at, updated_at`,
		name, slug,
	).Scan(&org.ID, &org.Name, &org.Slug, &org.CreatedAt, &org.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return org, nil
}

func (r *OrgRepo) AddMember(ctx context.Context, userID, orgID uuid.UUID, role string) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO public.members (user_id, organization_id, role) VALUES ($1, $2, $3)`,
		userID, orgID, role,
	)
	return err
}

func (r *OrgRepo) GetBySlug(ctx context.Context, slug string) (*models.Organization, error) {
	org := &models.Organization{}
	err := r.db.QueryRow(ctx,
		`SELECT id, name, slug, created_at, updated_at FROM public.organizations WHERE slug = $1`,
		slug,
	).Scan(&org.ID, &org.Name, &org.Slug, &org.CreatedAt, &org.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return org, nil
}

func (r *OrgRepo) GetUserOrgs(ctx context.Context, userID uuid.UUID) ([]models.Organization, error) {
	rows, err := r.db.Query(ctx,
		`SELECT o.id, o.name, o.slug, o.created_at, o.updated_at
		 FROM public.organizations o
		 JOIN public.members m ON m.organization_id = o.id
		 WHERE m.user_id = $1`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orgs []models.Organization
	for rows.Next() {
		var org models.Organization
		if err := rows.Scan(&org.ID, &org.Name, &org.Slug, &org.CreatedAt, &org.UpdatedAt); err != nil {
			return nil, err
		}
		orgs = append(orgs, org)
	}
	return orgs, rows.Err()
}
