package api

import (
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/bolaabanjo/statuskeet/internal/middleware"
	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/bolaabanjo/statuskeet/internal/repository"
	"github.com/bolaabanjo/statuskeet/internal/service"
)

type HeartbeatHandler struct {
	checkResultRepo *repository.CheckResultRepo
	serviceRepo     *repository.ServiceRepo
	statusEvaluator *service.StatusEvaluator
	incidentManager *service.IncidentManager
}

func NewHeartbeatHandler(checkResultRepo *repository.CheckResultRepo, serviceRepo *repository.ServiceRepo, statusEvaluator *service.StatusEvaluator, incidentManager *service.IncidentManager) *HeartbeatHandler {
	return &HeartbeatHandler{
		checkResultRepo: checkResultRepo,
		serviceRepo:     serviceRepo,
		statusEvaluator: statusEvaluator,
		incidentManager: incidentManager,
	}
}

func (h *HeartbeatHandler) Ingest(w http.ResponseWriter, r *http.Request) {
	orgID, err := middleware.GetOrgID(r.Context())
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var req models.HeartbeatRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if len(req.Services) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "at least one service is required"})
		return
	}

	checkedAt := time.Now()
	if req.Timestamp != "" {
		if parsed, err := time.Parse(time.RFC3339, req.Timestamp); err == nil {
			checkedAt = parsed
		}
	}

	var results []models.CheckResult
	for _, svc := range req.Services {
		if err := validateHeartbeatService(svc); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}

		// Look up service by name within the org
		service, err := h.serviceRepo.GetByName(r.Context(), orgID, svc.ServiceName)
		if err != nil {
			slog.Warn("heartbeat for unknown service", "service", svc.ServiceName, "org_id", orgID)
			continue // Skip unknown services rather than failing the whole batch
		}

		cr := models.CheckResult{
			ServiceID:    service.ID,
			Source:       "heartbeat",
			Status:       svc.Status,
			ResponseTime: svc.ResponseTimeMs,
			Metadata:     svc.Metadata,
			CheckedAt:    checkedAt,
		}

		if req.Region != "" {
			cr.Region = &req.Region
		}

		results = append(results, cr)
	}

	if len(results) > 0 {
		if err := h.checkResultRepo.CreateBatch(r.Context(), results); err != nil {
			slog.Error("failed to store heartbeat results", "error", err)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
			return
		}
	}

	// Evaluate status for all affected services
	serviceIDs := uniqueServiceIDs(results)
	transitions, _ := h.statusEvaluator.EvaluateMultiple(r.Context(), serviceIDs)

	// Process transitions: create or resolve incidents
	if len(transitions) > 0 {
		h.incidentManager.ProcessTransitions(r.Context(), transitions)
	}

	writeJSON(w, http.StatusOK, models.HeartbeatResponse{Received: len(results)})
}

func uniqueServiceIDs(results []models.CheckResult) []uuid.UUID {
	seen := make(map[uuid.UUID]bool)
	var ids []uuid.UUID
	for _, r := range results {
		if !seen[r.ServiceID] {
			seen[r.ServiceID] = true
			ids = append(ids, r.ServiceID)
		}
	}
	return ids
}

func validateHeartbeatService(svc models.HeartbeatService) error {
	if svc.ServiceName == "" {
		return fmt.Errorf("service_name is required")
	}
	switch svc.Status {
	case "up", "down", "degraded", "timeout":
		// valid
	case "":
		return fmt.Errorf("status is required for service %s", svc.ServiceName)
	default:
		return fmt.Errorf("invalid status for service %s: %s (must be up, down, degraded, or timeout)", svc.ServiceName, svc.Status)
	}
	return nil
}
