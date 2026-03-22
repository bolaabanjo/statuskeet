package repository

import (
	"context"

	"github.com/bolaabanjo/statuskeet/internal/database"
	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/google/uuid"
)

type UserRepo struct {
	db database.Querier
}

func NewUserRepo(db database.Querier) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(ctx context.Context, email, passwordHash, name string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)
		 RETURNING id, email, password_hash, name, created_at, updated_at`,
		email, passwordHash, name,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx,
		`SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE email = $1`,
		email,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx,
		`SELECT id, email, password_hash, name, created_at, updated_at FROM users WHERE id = $1`,
		id,
	).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return user, nil
}
