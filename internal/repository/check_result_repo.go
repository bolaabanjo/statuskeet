package repository

import (
	"context"
	"encoding/json"

	"github.com/bolaabanjo/statuskeet/internal/database"
	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/google/uuid"
)

type CheckResultRepo struct {
	db database.Querier
}

func NewCheckResultRepo(db database.Querier) *CheckResultRepo {
	return &CheckResultRepo{db: db}
}

func (r *CheckResultRepo) Create(ctx context.Context, cr *models.CheckResult) error {
	_, err := r.db.Exec(ctx,
		`INSERT INTO check_results (service_id, source, status, response_time, status_code, error_message, metadata, region, checked_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
		cr.ServiceID, cr.Source, cr.Status, cr.ResponseTime, cr.StatusCode,
		cr.ErrorMessage, metadataBytes(cr.Metadata), cr.Region, cr.CheckedAt,
	)
	return err
}

func (r *CheckResultRepo) CreateBatch(ctx context.Context, results []models.CheckResult) error {
	for _, cr := range results {
		if err := r.Create(ctx, &cr); err != nil {
			return err
		}
	}
	return nil
}

// GetRecent returns the last N check results for a service, newest first.
func (r *CheckResultRepo) GetRecent(ctx context.Context, serviceID uuid.UUID, limit int) ([]models.CheckResult, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, service_id, source, status, response_time, status_code, error_message, metadata, region, checked_at
		 FROM check_results WHERE service_id = $1 ORDER BY checked_at DESC LIMIT $2`,
		serviceID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.CheckResult
	for rows.Next() {
		var cr models.CheckResult
		if err := rows.Scan(
			&cr.ID, &cr.ServiceID, &cr.Source, &cr.Status, &cr.ResponseTime,
			&cr.StatusCode, &cr.ErrorMessage, &cr.Metadata, &cr.Region, &cr.CheckedAt,
		); err != nil {
			return nil, err
		}
		results = append(results, cr)
	}
	return results, rows.Err()
}

func metadataBytes(m *json.RawMessage) []byte {
	if m == nil {
		return nil
	}
	return []byte(*m)
}
