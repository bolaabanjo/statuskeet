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
		`INSERT INTO public.users (email, password_hash, name, auth_provider) VALUES ($1, $2, $3, 'legacy')
		 RETURNING id, email, COALESCE(password_hash, ''), name, auth_provider, COALESCE(auth_user_id, ''), created_at, updated_at`,
		email, passwordHash, name,
	).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AuthProvider,
		&user.AuthUserID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) CreateFromAuth(ctx context.Context, email, name, provider, authUserID string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx,
		`INSERT INTO public.users (email, password_hash, name, auth_provider, auth_user_id)
		 VALUES ($1, NULL, $2, $3, $4)
		 RETURNING id, email, COALESCE(password_hash, ''), name, auth_provider, COALESCE(auth_user_id, ''), created_at, updated_at`,
		email, name, provider, authUserID,
	).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AuthProvider,
		&user.AuthUserID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx,
		`SELECT id, email, COALESCE(password_hash, ''), name, auth_provider, COALESCE(auth_user_id, ''), created_at, updated_at
		 FROM public.users WHERE email = $1`,
		email,
	).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AuthProvider,
		&user.AuthUserID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx,
		`SELECT id, email, COALESCE(password_hash, ''), name, auth_provider, COALESCE(auth_user_id, ''), created_at, updated_at
		 FROM public.users WHERE id = $1`,
		id,
	).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AuthProvider,
		&user.AuthUserID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) GetByAuthIdentity(ctx context.Context, provider, authUserID string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx,
		`SELECT id, email, COALESCE(password_hash, ''), name, auth_provider, COALESCE(auth_user_id, ''), created_at, updated_at
		 FROM public.users
		 WHERE auth_provider = $1 AND auth_user_id = $2`,
		provider, authUserID,
	).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AuthProvider,
		&user.AuthUserID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *UserRepo) LinkAuthIdentity(ctx context.Context, id uuid.UUID, email, name, provider, authUserID string) (*models.User, error) {
	user := &models.User{}
	err := r.db.QueryRow(ctx,
		`UPDATE public.users
		 SET email = $2,
		     name = $3,
		     auth_provider = $4,
		     auth_user_id = $5,
		     password_hash = NULL,
		     updated_at = now()
		 WHERE id = $1
		 RETURNING id, email, COALESCE(password_hash, ''), name, auth_provider, COALESCE(auth_user_id, ''), created_at, updated_at`,
		id, email, name, provider, authUserID,
	).Scan(
		&user.ID,
		&user.Email,
		&user.PasswordHash,
		&user.Name,
		&user.AuthProvider,
		&user.AuthUserID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return user, nil
}
