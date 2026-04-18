package handler

import (
	"context"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/bolaabanjo/statuskeet/internal/config"
	"github.com/bolaabanjo/statuskeet/internal/database"
	"github.com/bolaabanjo/statuskeet/internal/monitor"
	"github.com/bolaabanjo/statuskeet/internal/repository"
	"github.com/bolaabanjo/statuskeet/internal/service"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	cronPool *pgxpool.Pool
	cronOnce sync.Once
)

func CronHandler(w http.ResponseWriter, r *http.Request) {
	if secret := os.Getenv("CRON_SECRET"); secret != "" {
		if r.Header.Get("Authorization") != "Bearer "+secret {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
	}

	ctx, cancel := context.WithTimeout(r.Context(), 55*time.Second)
	defer cancel()

	cfg, err := config.Load()
	if err != nil {
		http.Error(w, "Config error", http.StatusInternalServerError)
		return
	}

	cronOnce.Do(func() {
		p, err := database.NewPool(ctx, cfg.DatabaseURL)
		if err != nil {
			return
		}
		cronPool = p
	})

	if cronPool == nil {
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}

	// Initialize Monitor Worker Dependencies
	serviceRepo := repository.NewServiceRepo(cronPool)
	checkResultRepo := repository.NewCheckResultRepo(cronPool)
	incidentRepo := repository.NewIncidentRepo(cronPool)
	statusEvaluator := service.NewStatusEvaluator(checkResultRepo, serviceRepo)
	incidentManager := service.NewIncidentManager(incidentRepo)

	// Single trigger of the monitor run
	worker := monitor.NewMonitorWorker(serviceRepo, checkResultRepo, statusEvaluator, incidentManager)

	worker.RunOnce(ctx)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"monitoring_triggered"}`))
}
