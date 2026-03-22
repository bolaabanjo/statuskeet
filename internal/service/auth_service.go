package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"
	"unicode"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/bolaabanjo/statuskeet/internal/repository"
)

type AuthService struct {
	pool     *pgxpool.Pool
	userRepo *repository.UserRepo
	orgRepo  *repository.OrgRepo
	secret   []byte
}

func NewAuthService(pool *pgxpool.Pool, userRepo *repository.UserRepo, orgRepo *repository.OrgRepo, jwtSecret string) *AuthService {
	return &AuthService{
		pool:     pool,
		userRepo: userRepo,
		orgRepo:  orgRepo,
		secret:   []byte(jwtSecret),
	}
}

func (s *AuthService) Signup(ctx context.Context, req models.SignupRequest) (*models.AuthResponse, error) {
	if err := validateSignup(req); err != nil {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	slug := slugify(req.OrgName)

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	userRepo := repository.NewUserRepo(tx)
	orgRepo := repository.NewOrgRepo(tx)

	user, err := userRepo.Create(ctx, req.Email, string(hash), req.Name)
	if err != nil {
		if isDuplicateKey(err) {
			return nil, ErrEmailTaken
		}
		return nil, fmt.Errorf("create user: %w", err)
	}

	org, err := orgRepo.Create(ctx, req.OrgName, slug)
	if err != nil {
		if isDuplicateKey(err) {
			return nil, ErrSlugTaken
		}
		return nil, fmt.Errorf("create org: %w", err)
	}

	if err := orgRepo.AddMember(ctx, user.ID, org.ID, "owner"); err != nil {
		return nil, fmt.Errorf("add member: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit tx: %w", err)
	}

	token, err := s.GenerateJWT(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	return &models.AuthResponse{
		Token:        token,
		User:         user,
		Organization: org,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("get user: %w", err)
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	orgs, err := s.orgRepo.GetUserOrgs(ctx, user.ID)
	if err != nil {
		return nil, fmt.Errorf("get user orgs: %w", err)
	}

	token, err := s.GenerateJWT(user.ID, user.Email)
	if err != nil {
		return nil, err
	}

	var org *models.Organization
	if len(orgs) > 0 {
		org = &orgs[0]
	}

	return &models.AuthResponse{
		Token:        token,
		User:         user,
		Organization: org,
	}, nil
}

func (s *AuthService) GenerateJWT(userID uuid.UUID, email string) (string, error) {
	claims := jwt.MapClaims{
		"sub":   userID.String(),
		"email": email,
		"iat":   time.Now().Unix(),
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.secret)
}

func (s *AuthService) ValidateJWT(tokenString string) (uuid.UUID, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return s.secret, nil
	})
	if err != nil {
		return uuid.Nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return uuid.Nil, ErrInvalidToken
	}

	sub, ok := claims["sub"].(string)
	if !ok {
		return uuid.Nil, ErrInvalidToken
	}

	return uuid.Parse(sub)
}

func validateSignup(req models.SignupRequest) error {
	if req.Email == "" || !isValidEmail(req.Email) {
		return fmt.Errorf("invalid email address")
	}
	if len(req.Password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	if req.Name == "" {
		return fmt.Errorf("name is required")
	}
	if req.OrgName == "" {
		return fmt.Errorf("organization name is required")
	}
	return nil
}

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func isValidEmail(email string) bool {
	return emailRegex.MatchString(email)
}

func slugify(s string) string {
	s = strings.ToLower(s)
	var b strings.Builder
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
		} else if r == ' ' || r == '-' || r == '_' {
			b.WriteRune('-')
		}
	}
	// Collapse consecutive hyphens
	result := b.String()
	for strings.Contains(result, "--") {
		result = strings.ReplaceAll(result, "--", "-")
	}
	return strings.Trim(result, "-")
}

func isDuplicateKey(err error) bool {
	return strings.Contains(err.Error(), "duplicate key") ||
		strings.Contains(err.Error(), "23505")
}
