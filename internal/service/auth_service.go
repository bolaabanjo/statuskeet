package service

import (
	"context"
	"errors"
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

type AuthMode string

const (
	AuthModeLegacy   AuthMode = "legacy"
	AuthModeSupabase AuthMode = "supabase"
)

type AuthOptions struct {
	JWTSecret              string
	Mode                   string
	SupabaseURL            string
	SupabaseClientKey      string
	SupabaseServiceRoleKey string
}

type AuthService struct {
	pool     *pgxpool.Pool
	userRepo *repository.UserRepo
	orgRepo  *repository.OrgRepo
	secret   []byte
	mode     AuthMode
	supabase *SupabaseAuthClient
}

func NewAuthService(pool *pgxpool.Pool, userRepo *repository.UserRepo, orgRepo *repository.OrgRepo, opts AuthOptions) *AuthService {
	mode := AuthModeLegacy
	if strings.EqualFold(opts.Mode, string(AuthModeSupabase)) {
		mode = AuthModeSupabase
	}

	service := &AuthService{
		pool:     pool,
		userRepo: userRepo,
		orgRepo:  orgRepo,
		secret:   []byte(opts.JWTSecret),
		mode:     mode,
	}

	if mode == AuthModeSupabase {
		service.supabase = NewSupabaseAuthClient(
			opts.SupabaseURL,
			opts.SupabaseClientKey,
			opts.SupabaseServiceRoleKey,
		)
	}

	return service
}

func (s *AuthService) Signup(ctx context.Context, req models.SignupRequest) (*models.AuthResponse, error) {
	if err := validateSignup(req); err != nil {
		return nil, err
	}

	if s.mode == AuthModeSupabase {
		return s.signupWithSupabase(ctx, req)
	}

	return s.signupLegacy(ctx, req)
}

func (s *AuthService) Login(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	if s.mode == AuthModeSupabase {
		return s.loginWithSupabase(ctx, req)
	}

	return s.loginLegacy(ctx, req)
}

func (s *AuthService) signupLegacy(ctx context.Context, req models.SignupRequest) (*models.AuthResponse, error) {
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

func (s *AuthService) signupWithSupabase(ctx context.Context, req models.SignupRequest) (*models.AuthResponse, error) {
	if s.supabase == nil {
		return nil, fmt.Errorf("supabase auth is not configured")
	}

	if _, err := s.userRepo.GetByEmail(ctx, req.Email); err == nil {
		return nil, ErrEmailTaken
	} else if err != pgx.ErrNoRows {
		return nil, fmt.Errorf("check user email: %w", err)
	}

	slug := slugify(req.OrgName)
	if err := s.ensureSlugAvailable(ctx, slug); err != nil {
		return nil, err
	}

	supabaseUser, err := s.supabase.CreateUser(ctx, req.Email, req.Password, req.Name)
	if err != nil {
		return nil, err
	}
	supabaseUser.Name = displayName(supabaseUser.Name, req.Name, req.Email)

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		s.cleanupSupabaseUser(ctx, supabaseUser.ID)
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	userRepo := repository.NewUserRepo(tx)
	orgRepo := repository.NewOrgRepo(tx)

	user, err := s.syncSupabaseUser(ctx, userRepo, supabaseUser)
	if err != nil {
		s.cleanupSupabaseUser(ctx, supabaseUser.ID)
		return nil, err
	}

	org, err := orgRepo.Create(ctx, req.OrgName, slug)
	if err != nil {
		s.cleanupSupabaseUser(ctx, supabaseUser.ID)
		if isDuplicateKey(err) {
			return nil, ErrSlugTaken
		}
		return nil, fmt.Errorf("create org: %w", err)
	}

	if err := orgRepo.AddMember(ctx, user.ID, org.ID, "owner"); err != nil {
		s.cleanupSupabaseUser(ctx, supabaseUser.ID)
		return nil, fmt.Errorf("add member: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		s.cleanupSupabaseUser(ctx, supabaseUser.ID)
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

func (s *AuthService) loginLegacy(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("get user: %w", err)
	}

	if user.PasswordHash == "" {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return s.buildAuthResponse(ctx, user)
}

func (s *AuthService) loginWithSupabase(ctx context.Context, req models.LoginRequest) (*models.AuthResponse, error) {
	if s.supabase == nil {
		return nil, fmt.Errorf("supabase auth is not configured")
	}

	supabaseUser, err := s.supabase.SignInWithPassword(ctx, req.Email, req.Password)
	if err == nil {
		supabaseUser.Name = displayName(supabaseUser.Name, "", req.Email)

		user, syncErr := s.syncSupabaseUser(ctx, s.userRepo, supabaseUser)
		if syncErr != nil {
			return nil, syncErr
		}

		return s.buildAuthResponse(ctx, user)
	}

	if errors.Is(err, ErrInvalidCredentials) && req.Email != "" && req.Password != "" {
		migrated, migrateErr := s.migrateLegacyUserToSupabase(ctx, req)
		if migrateErr == nil {
			return s.buildAuthResponse(ctx, migrated)
		}
		if migrateErr != nil && !errors.Is(migrateErr, ErrInvalidCredentials) {
			return nil, migrateErr
		}
	}

	if errors.Is(err, ErrInvalidCredentials) {
		return nil, ErrInvalidCredentials
	}

	return nil, err
}

func (s *AuthService) migrateLegacyUserToSupabase(ctx context.Context, req models.LoginRequest) (*models.User, error) {
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("get local user: %w", err)
	}

	if user.PasswordHash == "" {
		return nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	supabaseUser, err := s.supabase.EnsureUser(ctx, req.Email, req.Password, displayName(user.Name, "", req.Email))
	if err != nil {
		return nil, err
	}

	linkedUser, err := s.userRepo.LinkAuthIdentity(
		ctx,
		user.ID,
		supabaseUser.Email,
		displayName(supabaseUser.Name, user.Name, req.Email),
		supabaseAuthProvider,
		supabaseUser.ID,
	)
	if err != nil {
		return nil, fmt.Errorf("link supabase user: %w", err)
	}

	return linkedUser, nil
}

func (s *AuthService) syncSupabaseUser(ctx context.Context, userRepo *repository.UserRepo, supabaseUser *SupabaseUser) (*models.User, error) {
	user, err := userRepo.GetByAuthIdentity(ctx, supabaseAuthProvider, supabaseUser.ID)
	if err == nil {
		updatedUser, updateErr := userRepo.LinkAuthIdentity(
			ctx,
			user.ID,
			supabaseUser.Email,
			displayName(supabaseUser.Name, user.Name, supabaseUser.Email),
			supabaseAuthProvider,
			supabaseUser.ID,
		)
		if updateErr != nil {
			return nil, fmt.Errorf("update linked user: %w", updateErr)
		}
		return updatedUser, nil
	}
	if err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("get linked user: %w", err)
	}

	user, err = userRepo.GetByEmail(ctx, supabaseUser.Email)
	if err == nil {
		linkedUser, linkErr := userRepo.LinkAuthIdentity(
			ctx,
			user.ID,
			supabaseUser.Email,
			displayName(supabaseUser.Name, user.Name, supabaseUser.Email),
			supabaseAuthProvider,
			supabaseUser.ID,
		)
		if linkErr != nil {
			return nil, fmt.Errorf("link existing user: %w", linkErr)
		}
		return linkedUser, nil
	}
	if err != nil && err != pgx.ErrNoRows {
		return nil, fmt.Errorf("get existing user by email: %w", err)
	}

	createdUser, err := userRepo.CreateFromAuth(
		ctx,
		supabaseUser.Email,
		displayName(supabaseUser.Name, "", supabaseUser.Email),
		supabaseAuthProvider,
		supabaseUser.ID,
	)
	if err == nil {
		return createdUser, nil
	}

	if !isDuplicateKey(err) {
		return nil, fmt.Errorf("create local user: %w", err)
	}

	user, retryErr := userRepo.GetByAuthIdentity(ctx, supabaseAuthProvider, supabaseUser.ID)
	if retryErr == nil {
		return user, nil
	}
	if retryErr != nil && retryErr != pgx.ErrNoRows {
		return nil, fmt.Errorf("retry linked user lookup: %w", retryErr)
	}

	user, retryErr = userRepo.GetByEmail(ctx, supabaseUser.Email)
	if retryErr != nil {
		return nil, fmt.Errorf("retry user lookup by email: %w", retryErr)
	}

	linkedUser, linkErr := userRepo.LinkAuthIdentity(
		ctx,
		user.ID,
		supabaseUser.Email,
		displayName(supabaseUser.Name, user.Name, supabaseUser.Email),
		supabaseAuthProvider,
		supabaseUser.ID,
	)
	if linkErr != nil {
		return nil, fmt.Errorf("link raced user: %w", linkErr)
	}

	return linkedUser, nil
}

func (s *AuthService) buildAuthResponse(ctx context.Context, user *models.User) (*models.AuthResponse, error) {
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

func (s *AuthService) ensureSlugAvailable(ctx context.Context, slug string) error {
	_, err := s.orgRepo.GetBySlug(ctx, slug)
	if err == nil {
		return ErrSlugTaken
	}
	if err != pgx.ErrNoRows {
		return fmt.Errorf("check organization slug: %w", err)
	}
	return nil
}

func (s *AuthService) cleanupSupabaseUser(ctx context.Context, userID string) {
	if s.supabase == nil || userID == "" {
		return
	}

	_ = s.supabase.DeleteUser(ctx, userID)
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

func displayName(primary, secondary, email string) string {
	for _, candidate := range []string{strings.TrimSpace(primary), strings.TrimSpace(secondary)} {
		if candidate != "" {
			return candidate
		}
	}

	localPart, _, ok := strings.Cut(email, "@")
	if ok {
		return localPart
	}

	return email
}

func isDuplicateKey(err error) bool {
	return strings.Contains(err.Error(), "duplicate key") ||
		strings.Contains(err.Error(), "23505")
}
