// Package api defines HTTP routes and handlers.
//
// We use chi (github.com/go-chi/chi) as our HTTP router.
// Why chi instead of the stdlib net/http?
// Go's stdlib ServeMux is solid but lacks: path parameters (/services/:id),
// middleware chaining, and route grouping. chi adds exactly these features
// while staying compatible with net/http interfaces — every chi handler is
// a standard http.Handler. No magic, no code generation, no framework lock-in.
package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"github.com/bolaabanjo/statuskeet/internal/config"
)

func NewRouter(cfg *config.Config) http.Handler {
	r := chi.NewRouter()

	// --- Middleware stack ---
	// Middleware runs on EVERY request, in order. Think of it as a pipeline:
	// Request → Logger → Recoverer → RealIP → Your Handler → Response
	//
	// Each middleware can inspect/modify the request, call the next handler,
	// then inspect/modify the response.

	// RequestID: Assigns a unique ID to each request. Essential for tracing
	// a single request across log lines when debugging production issues.
	r.Use(middleware.RequestID)

	// RealIP: Extracts the client's real IP from X-Forwarded-For or
	// X-Real-IP headers. Behind a load balancer, RemoteAddr is the LB's IP,
	// not the client's. This fixes that.
	r.Use(middleware.RealIP)

	// Logger: Logs every request with method, path, status code, and duration.
	// In production, you'd replace this with a custom structured logger.
	r.Use(middleware.Logger)

	// Recoverer: Catches panics in handlers and returns 500 instead of
	// crashing the entire server. A single bad request should never bring
	// down the process.
	r.Use(middleware.Recoverer)

	// --- Health check ---
	// Every production service needs a health endpoint. Load balancers,
	// Kubernetes, and monitoring tools hit this to know if the server is alive.
	// It should be fast, simple, and always respond.
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// API v1 routes will go here as we build them
	r.Route("/v1", func(r chi.Router) {
		// Public routes (no auth)
		// r.Post("/auth/signup", ...)
		// r.Post("/auth/login", ...)

		// SDK routes (API key auth)
		// r.Group(func(r chi.Router) {
		//     r.Use(APIKeyAuth)
		//     r.Post("/heartbeat", ...)
		//     r.Post("/services/register", ...)
		// })

		// Dashboard routes (JWT auth)
		// r.Group(func(r chi.Router) {
		//     r.Use(JWTAuth)
		//     r.Get("/services", ...)
		//     r.Get("/incidents", ...)
		// })

		// Public status page routes (no auth)
		// r.Get("/public/{orgSlug}/status", ...)
	})

	return r
}
