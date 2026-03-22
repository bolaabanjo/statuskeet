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
)

type Config struct {
	Port        string
	Env         string
	DatabaseURL string
	RedisURL    string
	JWTSecret   string
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
		Port:        getEnv("PORT", "8080"),
		Env:         getEnv("ENV", "development"),
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:   os.Getenv("JWT_SECRET"),
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	if cfg.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
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
