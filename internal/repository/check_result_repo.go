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

// DailyUptime holds the uptime ratio for a single day.
type DailyUptime struct {
	Date       string  `json:"date"`
	UptimeRate float64 `json:"uptime_rate"`
	Total      int     `json:"total"`
}

// GetDailyUptime returns daily uptime percentages for a service over the last N days.
func (r *CheckResultRepo) GetDailyUptime(ctx context.Context, serviceID uuid.UUID, days int) ([]DailyUptime, error) {
	rows, err := r.db.Query(ctx,
		`SELECT
			checked_at::date AS day,
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE status = 'up') AS up_count
		 FROM check_results
		 WHERE service_id = $1 AND checked_at >= NOW() - make_interval(days => $2)
		 GROUP BY day
		 ORDER BY day ASC`,
		serviceID, days,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []DailyUptime
	for rows.Next() {
		var d DailyUptime
		var total, upCount int
		if err := rows.Scan(&d.Date, &total, &upCount); err != nil {
			return nil, err
		}
		d.Total = total
		if total > 0 {
			d.UptimeRate = float64(upCount) / float64(total)
		}
		results = append(results, d)
	}
	return results, rows.Err()
}

func metadataBytes(m *json.RawMessage) []byte {
	if m == nil {
		return nil
	}
	return []byte(*m)
}
