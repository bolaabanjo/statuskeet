package repository

import (
	"context"
	"time"

	"github.com/bolaabanjo/statuskeet/internal/database"
	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/google/uuid"
)

type ServiceRepo struct {
	db database.Querier
}

func NewServiceRepo(db database.Querier) *ServiceRepo {
	return &ServiceRepo{db: db}
}

// Upsert creates a service or updates it if one with the same (org_id, name) already exists.
func (r *ServiceRepo) Upsert(ctx context.Context, s *models.Service) (*models.Service, error) {
	result := &models.Service{}
	err := r.db.QueryRow(ctx,
		`INSERT INTO services (org_id, name, description, service_type, url, check_interval, timeout, expected_status, criticality)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 ON CONFLICT (org_id, name) DO UPDATE SET
		   description = EXCLUDED.description,
		   service_type = EXCLUDED.service_type,
		   url = EXCLUDED.url,
		   check_interval = EXCLUDED.check_interval,
		   timeout = EXCLUDED.timeout,
		   expected_status = EXCLUDED.expected_status,
		   criticality = EXCLUDED.criticality,
		   updated_at = now()
		 RETURNING id, org_id, name, description, service_type, url, check_interval, timeout,
		   expected_status, criticality, current_status, display_order, visible, created_at, updated_at`,
		s.OrgID, s.Name, s.Description, s.ServiceType, s.URL,
		s.CheckInterval, s.Timeout, s.ExpectedStatus, s.Criticality,
	).Scan(
		&result.ID, &result.OrgID, &result.Name, &result.Description, &result.ServiceType,
		&result.URL, &result.CheckInterval, &result.Timeout, &result.ExpectedStatus,
		&result.Criticality, &result.CurrentStatus, &result.DisplayOrder, &result.Visible,
		&result.CreatedAt, &result.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return result, nil
}

func (r *ServiceRepo) GetByOrgID(ctx context.Context, orgID uuid.UUID) ([]models.Service, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, org_id, name, description, service_type, url, check_interval, timeout,
		   expected_status, criticality, current_status, display_order, visible, created_at, updated_at
		 FROM services WHERE org_id = $1 ORDER BY display_order, name`,
		orgID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		if err := rows.Scan(
			&s.ID, &s.OrgID, &s.Name, &s.Description, &s.ServiceType,
			&s.URL, &s.CheckInterval, &s.Timeout, &s.ExpectedStatus,
			&s.Criticality, &s.CurrentStatus, &s.DisplayOrder, &s.Visible,
			&s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, err
		}
		services = append(services, s)
	}
	return services, rows.Err()
}

func (r *ServiceRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.Service, error) {
	s := &models.Service{}
	err := r.db.QueryRow(ctx,
		`SELECT id, org_id, name, description, service_type, url, check_interval, timeout,
		   expected_status, criticality, current_status, display_order, visible, created_at, updated_at
		 FROM services WHERE id = $1`,
		id,
	).Scan(
		&s.ID, &s.OrgID, &s.Name, &s.Description, &s.ServiceType,
		&s.URL, &s.CheckInterval, &s.Timeout, &s.ExpectedStatus,
		&s.Criticality, &s.CurrentStatus, &s.DisplayOrder, &s.Visible,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *ServiceRepo) GetByName(ctx context.Context, orgID uuid.UUID, name string) (*models.Service, error) {
	s := &models.Service{}
	err := r.db.QueryRow(ctx,
		`SELECT id, org_id, name, description, service_type, url, check_interval, timeout,
		   expected_status, criticality, current_status, display_order, visible, created_at, updated_at
		 FROM services WHERE org_id = $1 AND name = $2`,
		orgID, name,
	).Scan(
		&s.ID, &s.OrgID, &s.Name, &s.Description, &s.ServiceType,
		&s.URL, &s.CheckInterval, &s.Timeout, &s.ExpectedStatus,
		&s.Criticality, &s.CurrentStatus, &s.DisplayOrder, &s.Visible,
		&s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *ServiceRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	_, err := r.db.Exec(ctx,
		`UPDATE services SET current_status = $1, updated_at = now() WHERE id = $2`,
		status, id,
	)
	return err
}

func (r *ServiceRepo) GetAllForMonitoring(ctx context.Context) ([]models.Service, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, org_id, name, description, service_type, url, check_interval, timeout,
		   expected_status, criticality, current_status, display_order, visible, created_at, updated_at
		 FROM services WHERE url IS NOT NULL AND url != ''`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		if err := rows.Scan(
			&s.ID, &s.OrgID, &s.Name, &s.Description, &s.ServiceType,
			&s.URL, &s.CheckInterval, &s.Timeout, &s.ExpectedStatus,
			&s.Criticality, &s.CurrentStatus, &s.DisplayOrder, &s.Visible,
			&s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, err
		}
		services = append(services, s)
	}
	return services, rows.Err()
}

func (r *ServiceRepo) GetDueForMonitoring(ctx context.Context, now time.Time) ([]models.Service, error) {
	rows, err := r.db.Query(ctx,
		`SELECT s.id, s.org_id, s.name, s.description, s.service_type, s.url, s.check_interval, s.timeout,
		   s.expected_status, s.criticality, s.current_status, s.display_order, s.visible, s.created_at, s.updated_at
		 FROM services s
		 LEFT JOIN LATERAL (
		   SELECT checked_at
		   FROM check_results cr
		   WHERE cr.service_id = s.id AND cr.source = 'external'
		   ORDER BY cr.checked_at DESC
		   LIMIT 1
		 ) latest ON TRUE
		 WHERE s.url IS NOT NULL
		   AND s.url != ''
		   AND (
		     latest.checked_at IS NULL OR
		     latest.checked_at <= $1 - make_interval(secs => s.check_interval)
		   )
		 ORDER BY s.id`,
		now,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		if err := rows.Scan(
			&s.ID, &s.OrgID, &s.Name, &s.Description, &s.ServiceType,
			&s.URL, &s.CheckInterval, &s.Timeout, &s.ExpectedStatus,
			&s.Criticality, &s.CurrentStatus, &s.DisplayOrder, &s.Visible,
			&s.CreatedAt, &s.UpdatedAt,
		); err != nil {
			return nil, err
		}
		services = append(services, s)
	}
	return services, rows.Err()
}
