package handler

import (
	"context"
	"net/http"
	"strings"
	"sync"

	"github.com/bolaabanjo/statuskeet/internal/api"
	"github.com/bolaabanjo/statuskeet/internal/config"
	"github.com/bolaabanjo/statuskeet/internal/database"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	pool *pgxpool.Pool
	once sync.Once
)

func Handler(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	cfg, err := config.Load()
	if err != nil {
		http.Error(w, "Config error", http.StatusInternalServerError)
		return
	}

	once.Do(func() {
		p, err := database.NewPool(ctx, cfg.DatabaseURL)
		if err != nil {
			return
		}
		pool = p
	})

	if pool == nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}

	router := api.NewRouter(cfg, pool)
	router.ServeHTTP(w, normalizeRequestPath(r))
}

func normalizeRequestPath(r *http.Request) *http.Request {
	path := strings.TrimSpace(r.URL.Query().Get("path"))
	if path == "" {
		return r
	}

	clone := r.Clone(r.Context())
	query := clone.URL.Query()
	query.Del("path")
	clone.URL.RawQuery = query.Encode()
	clone.URL.Path = "/" + strings.TrimPrefix(path, "/")
	clone.RequestURI = clone.URL.RequestURI()
	return clone
}
