package repository

import (
	"context"

	"github.com/bolaabanjo/statuskeet/internal/database"
	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/google/uuid"
)

type APIKeyRepo struct {
	db database.Querier
}

func NewAPIKeyRepo(db database.Querier) *APIKeyRepo {
	return &APIKeyRepo{db: db}
}

func (r *APIKeyRepo) Create(ctx context.Context, orgID uuid.UUID, keyHash, keyPrefix, name string) (*models.APIKey, error) {
	key := &models.APIKey{}
	err := r.db.QueryRow(ctx,
		`INSERT INTO api_keys (organization_id, key_hash, key_prefix, name)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, organization_id, key_hash, key_prefix, name, last_used_at, created_at, revoked_at`,
		orgID, keyHash, keyPrefix, name,
	).Scan(&key.ID, &key.OrganizationID, &key.KeyHash, &key.KeyPrefix, &key.Name,
		&key.LastUsedAt, &key.CreatedAt, &key.RevokedAt)
	if err != nil {
		return nil, err
	}
	return key, nil
}

func (r *APIKeyRepo) GetByHash(ctx context.Context, keyHash string) (*models.APIKey, error) {
	key := &models.APIKey{}
	err := r.db.QueryRow(ctx,
		`SELECT id, organization_id, key_hash, key_prefix, name, last_used_at, created_at, revoked_at
		 FROM api_keys WHERE key_hash = $1 AND revoked_at IS NULL`,
		keyHash,
	).Scan(&key.ID, &key.OrganizationID, &key.KeyHash, &key.KeyPrefix, &key.Name,
		&key.LastUsedAt, &key.CreatedAt, &key.RevokedAt)
	if err != nil {
		return nil, err
	}
	return key, nil
}

func (r *APIKeyRepo) UpdateLastUsed(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx,
		`UPDATE api_keys SET last_used_at = now() WHERE id = $1`, id,
	)
	return err
}

func (r *APIKeyRepo) ListByOrg(ctx context.Context, orgID uuid.UUID) ([]models.APIKey, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, organization_id, key_prefix, name, last_used_at, created_at, revoked_at
		 FROM api_keys WHERE organization_id = $1 ORDER BY created_at DESC`,
		orgID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []models.APIKey
	for rows.Next() {
		var k models.APIKey
		if err := rows.Scan(&k.ID, &k.OrganizationID, &k.KeyPrefix, &k.Name,
			&k.LastUsedAt, &k.CreatedAt, &k.RevokedAt); err != nil {
			return nil, err
		}
		keys = append(keys, k)
	}
	return keys, rows.Err()
}
