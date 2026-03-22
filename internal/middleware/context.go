package middleware

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type contextKey string

const (
	userIDKey contextKey = "userID"
	orgIDKey  contextKey = "orgID"
)

func SetUserID(ctx context.Context, id uuid.UUID) context.Context {
	return context.WithValue(ctx, userIDKey, id)
}

func GetUserID(ctx context.Context) (uuid.UUID, error) {
	id, ok := ctx.Value(userIDKey).(uuid.UUID)
	if !ok {
		return uuid.Nil, fmt.Errorf("user ID not found in context")
	}
	return id, nil
}

func SetOrgID(ctx context.Context, id uuid.UUID) context.Context {
	return context.WithValue(ctx, orgIDKey, id)
}

func GetOrgID(ctx context.Context) (uuid.UUID, error) {
	id, ok := ctx.Value(orgIDKey).(uuid.UUID)
	if !ok {
		return uuid.Nil, fmt.Errorf("org ID not found in context")
	}
	return id, nil
}
