package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"

	"github.com/google/uuid"

	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/bolaabanjo/statuskeet/internal/repository"
)

type APIKeyService struct {
	repo *repository.APIKeyRepo
}

func NewAPIKeyService(repo *repository.APIKeyRepo) *APIKeyService {
	return &APIKeyService{repo: repo}
}

func (s *APIKeyService) Create(ctx context.Context, orgID uuid.UUID, name string) (string, *models.APIKey, error) {
	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		return "", nil, fmt.Errorf("generate key: %w", err)
	}

	fullKey := "sk_live_" + base64.RawURLEncoding.EncodeToString(rawBytes)
	prefix := fullKey[:16]

	hash := sha256.Sum256([]byte(fullKey))
	keyHash := hex.EncodeToString(hash[:])

	apiKey, err := s.repo.Create(ctx, orgID, keyHash, prefix, name)
	if err != nil {
		return "", nil, fmt.Errorf("store api key: %w", err)
	}

	return fullKey, apiKey, nil
}

func (s *APIKeyService) Validate(ctx context.Context, rawKey string) (*models.APIKey, error) {
	hash := sha256.Sum256([]byte(rawKey))
	keyHash := hex.EncodeToString(hash[:])

	apiKey, err := s.repo.GetByHash(ctx, keyHash)
	if err != nil {
		return nil, ErrAPIKeyNotFound
	}

	// Update last used timestamp in background (fire and forget)
	go func() {
		_ = s.repo.UpdateLastUsed(context.Background(), apiKey.ID)
	}()

	return apiKey, nil
}

func (s *APIKeyService) ListByOrg(ctx context.Context, orgID uuid.UUID) ([]models.APIKey, error) {
	return s.repo.ListByOrg(ctx, orgID)
}
