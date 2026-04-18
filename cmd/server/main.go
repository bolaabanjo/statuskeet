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
	"github.com/bolaabanjo/statuskeet/internal/database"
	"github.com/bolaabanjo/statuskeet/internal/monitor"
	"github.com/bolaabanjo/statuskeet/internal/repository"
	"github.com/bolaabanjo/statuskeet/internal/service"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("connected to database")

	// Initialize dependencies for monitoring worker
	serviceRepo := repository.NewServiceRepo(pool)
	checkResultRepo := repository.NewCheckResultRepo(pool)
	incidentRepo := repository.NewIncidentRepo(pool)
	statusEvaluator := service.NewStatusEvaluator(checkResultRepo, serviceRepo)
	incidentManager := service.NewIncidentManager(incidentRepo)

	monitorWorker := monitor.NewMonitorWorker(serviceRepo, checkResultRepo, statusEvaluator, incidentManager)
	go monitorWorker.Start(ctx)

	router := api.NewRouter(cfg, pool)

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("server starting", "port", cfg.Port, "env", cfg.Env)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down server...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("server forced to shutdown", "error", err)
		os.Exit(1)
	}

	slog.Info("server stopped cleanly")
}
