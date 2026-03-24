package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/bolaabanjo/statuskeet/internal/config"
	"github.com/bolaabanjo/statuskeet/internal/middleware"
	"github.com/bolaabanjo/statuskeet/internal/repository"
	"github.com/bolaabanjo/statuskeet/internal/service"
)

func NewRouter(cfg *config.Config, pool *pgxpool.Pool) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.CORS)
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Repositories
	userRepo := repository.NewUserRepo(pool)
	orgRepo := repository.NewOrgRepo(pool)
	apiKeyRepo := repository.NewAPIKeyRepo(pool)
	serviceRepo := repository.NewServiceRepo(pool)
	checkResultRepo := repository.NewCheckResultRepo(pool)
	incidentRepo := repository.NewIncidentRepo(pool)
	onboardingRepo := repository.NewOnboardingRepo(pool)

	// Services
	authService := service.NewAuthService(pool, userRepo, orgRepo, cfg.JWTSecret)
	apiKeyService := service.NewAPIKeyService(apiKeyRepo)
	statusEvaluator := service.NewStatusEvaluator(checkResultRepo, serviceRepo)
	incidentManager := service.NewIncidentManager(incidentRepo)

	// Handlers
	authHandler := NewAuthHandler(authService, apiKeyService, orgRepo)
	serviceHandler := NewServiceHandler(serviceRepo, checkResultRepo, orgRepo)
	heartbeatHandler := NewHeartbeatHandler(checkResultRepo, serviceRepo, statusEvaluator, incidentManager)
	publicHandler := NewPublicHandler(orgRepo, serviceRepo, incidentRepo, checkResultRepo)
	onboardingHandler := NewOnboardingHandler(onboardingRepo, orgRepo)

	r.Route("/v1", func(r chi.Router) {
		// Public auth routes
		r.Post("/auth/signup", authHandler.Signup)
		r.Post("/auth/login", authHandler.Login)

		// SDK routes (API key auth)
		r.Group(func(r chi.Router) {
			r.Use(middleware.APIKeyAuth(apiKeyService))
			r.Post("/services/register", serviceHandler.Register)
			r.Post("/heartbeat", heartbeatHandler.Ingest)
		})

		// Dashboard routes (JWT auth)
		r.Group(func(r chi.Router) {
			r.Use(middleware.JWTAuth(authService))
			r.Post("/org/api-keys", authHandler.CreateAPIKey)
			r.Get("/org/api-keys", authHandler.ListAPIKeys)
			r.Delete("/org/api-keys/{keyID}", authHandler.RevokeAPIKey)
			r.Get("/services", serviceHandler.List)
			r.Get("/services/{serviceID}", serviceHandler.Detail)
			r.Post("/onboarding", onboardingHandler.Complete)
			r.Get("/onboarding", onboardingHandler.Status)
		})

		// Public status page routes (no auth)
		r.Get("/public/{orgSlug}/status", publicHandler.Status)
		r.Get("/public/{orgSlug}/incidents", publicHandler.Incidents)
	})

	return r
}
