// Package config loads application configuration from environment variables.
//
// Why environment variables and not a config file?
// This follows the "12-Factor App" methodology (https://12factor.net/config).
// Environment variables work the same way whether you're running locally,
// in Docker, or on a cloud platform. Config files need to be managed,
// deployed, and kept out of git. Env vars are injected by the runtime.
package config

import (
	"fmt"
	"os"
	"strings"
)

type Config struct {
	Port                   string
	Env                    string
	DatabaseURL            string
	RedisURL               string
	JWTSecret              string
	AuthMode               string
	SupabaseURL            string
	SupabaseClientKey      string
	SupabaseServiceRoleKey string
}

// Load reads configuration from environment variables.
// It returns an error if any required variable is missing.
//
// Why not use a library like "viper"?
// For our needs, os.Getenv is sufficient. Viper adds file watching,
// remote config, and dozens of formats we don't need. Adding dependencies
// you don't need is a common Go anti-pattern. The stdlib is powerful — use it.
func Load() (*Config, error) {
	cfg := &Config{
		Port: getEnv("PORT", "8080"),
		Env:  getEnv("ENV", "development"),
		DatabaseURL: firstNonEmpty(
			os.Getenv("DATABASE_URL"),
			os.Getenv("POSTGRES_URL"),
			os.Getenv("POSTGRES_PRISMA_URL"),
			os.Getenv("POSTGRES_URL_NON_POOLING"),
		),
		RedisURL:  getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret: os.Getenv("JWT_SECRET"),
		SupabaseURL: strings.TrimRight(
			os.Getenv("SUPABASE_URL"),
			"/",
		),
		SupabaseClientKey: firstNonEmpty(
			os.Getenv("SUPABASE_PUBLISHABLE_KEY"),
			os.Getenv("SUPABASE_ANON_KEY"),
		),
		SupabaseServiceRoleKey: firstNonEmpty(
			os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
			os.Getenv("SUPABASE_SECRET_KEY"),
		),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL or POSTGRES_URL is required")
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	authMode := strings.ToLower(strings.TrimSpace(os.Getenv("AUTH_MODE")))
	hasSupabaseConfig := cfg.SupabaseURL != "" || cfg.SupabaseClientKey != "" || cfg.SupabaseServiceRoleKey != ""

	switch authMode {
	case "", "auto":
		if hasSupabaseConfig {
			cfg.AuthMode = "supabase"
		} else {
			cfg.AuthMode = "legacy"
		}
	case "legacy", "supabase":
		cfg.AuthMode = authMode
	default:
		return nil, fmt.Errorf("AUTH_MODE must be one of: legacy, supabase, auto")
	}

	if cfg.AuthMode == "supabase" {
		if cfg.SupabaseURL == "" {
			return nil, fmt.Errorf("SUPABASE_URL is required when AUTH_MODE=supabase")
		}
		if cfg.SupabaseClientKey == "" {
			return nil, fmt.Errorf("SUPABASE_PUBLISHABLE_KEY or SUPABASE_ANON_KEY is required when AUTH_MODE=supabase")
		}
		if cfg.SupabaseServiceRoleKey == "" {
			return nil, fmt.Errorf("SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required when AUTH_MODE=supabase")
		}
	}

	return cfg, nil
}

// getEnv returns the value of an environment variable, or a default if unset.
func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
