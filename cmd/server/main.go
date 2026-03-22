// Package main is the entry point for the StatusKeet server.
//
// Why cmd/server/?
// Go convention: cmd/<binary-name>/main.go. If you later add a CLI tool,
// it goes in cmd/cli/main.go. Each subdirectory under cmd/ produces one
// binary. This keeps your project organized when you have multiple executables.
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/bolaabanjo/statuskeet/internal/api"
	"github.com/bolaabanjo/statuskeet/internal/config"
)

func main() {
	// Structured logging with slog (Go's stdlib structured logger, added in Go 1.21).
	//
	// Why structured logging?
	// Plain log.Println("server started on port 8080") is fine for dev,
	// but in production you need machine-parseable logs. Structured logs
	// output JSON: {"time":"...","level":"INFO","msg":"server starting","port":"8080"}
	// This lets tools like Grafana Loki, Datadog, or ELK parse and query your logs.
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	router := api.NewRouter(cfg)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown.
	//
	// WHY THIS MATTERS:
	// Without this, when you hit Ctrl+C or deploy a new version, the server
	// dies instantly — dropping any in-flight requests. Graceful shutdown:
	// 1. Stops accepting NEW connections
	// 2. Waits for EXISTING requests to finish (up to 10 seconds)
	// 3. Then exits cleanly
	//
	// This is critical for zero-downtime deployments and for not losing
	// heartbeat data mid-request.
	//
	// HOW IT WORKS:
	// - We start the server in a goroutine (background thread)
	// - The main goroutine blocks on signal.NotifyContext, waiting for SIGINT/SIGTERM
	// - When the signal arrives, we call srv.Shutdown() which does the graceful dance
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	// Start server in a goroutine so it doesn't block
	go func() {
		slog.Info("server starting", "port", cfg.Port, "env", cfg.Env)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	// Block until we receive a shutdown signal
	<-ctx.Done()
	slog.Info("shutting down server...")

	// Give in-flight requests 10 seconds to complete
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("server forced to shutdown", "error", err)
		os.Exit(1)
	}

	slog.Info("server stopped cleanly")
}
