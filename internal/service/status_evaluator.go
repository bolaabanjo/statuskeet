package service

import (
	"context"
	"log/slog"

	"github.com/google/uuid"

	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/bolaabanjo/statuskeet/internal/repository"
)

const defaultWindowSize = 5

// StatusTransition represents a service changing from one status to another.
type StatusTransition struct {
	Service   models.Service
	OldStatus string
	NewStatus string
}

type StatusEvaluator struct {
	checkResultRepo *repository.CheckResultRepo
	serviceRepo     *repository.ServiceRepo
	windowSize      int
}

func NewStatusEvaluator(checkResultRepo *repository.CheckResultRepo, serviceRepo *repository.ServiceRepo) *StatusEvaluator {
	return &StatusEvaluator{
		checkResultRepo: checkResultRepo,
		serviceRepo:     serviceRepo,
		windowSize:      defaultWindowSize,
	}
}

// Evaluate checks the recent results for a service and updates its status.
// Returns a StatusTransition if the status changed, nil otherwise.
func (e *StatusEvaluator) Evaluate(ctx context.Context, serviceID uuid.UUID) (*StatusTransition, error) {
	service, err := e.serviceRepo.GetByID(ctx, serviceID)
	if err != nil {
		return nil, err
	}

	results, err := e.checkResultRepo.GetRecent(ctx, serviceID, e.windowSize)
	if err != nil {
		return nil, err
	}

	if len(results) == 0 {
		return nil, nil
	}

	newStatus := determineStatus(results)

	if newStatus == service.CurrentStatus {
		return nil, nil
	}

	oldStatus := service.CurrentStatus
	if err := e.serviceRepo.UpdateStatus(ctx, serviceID, newStatus); err != nil {
		return nil, err
	}

	slog.Info("service status changed",
		"service", service.Name,
		"from", oldStatus,
		"to", newStatus,
	)

	return &StatusTransition{
		Service:   *service,
		OldStatus: oldStatus,
		NewStatus: newStatus,
	}, nil
}

// EvaluateMultiple evaluates status for multiple services and returns all transitions.
func (e *StatusEvaluator) EvaluateMultiple(ctx context.Context, serviceIDs []uuid.UUID) ([]StatusTransition, error) {
	var transitions []StatusTransition
	for _, id := range serviceIDs {
		t, err := e.Evaluate(ctx, id)
		if err != nil {
			slog.Error("failed to evaluate service status", "service_id", id, "error", err)
			continue
		}
		if t != nil {
			transitions = append(transitions, *t)
		}
	}
	return transitions, nil
}

// determineStatus looks at a window of recent check results and decides the service status.
//
// Logic:
//   - All up          → operational
//   - Any degraded    → degraded
//   - 1-2 failures    → degraded
//   - 3+ failures     → major_outage
//   - Mix of sources with one failing → partial_outage
func determineStatus(results []models.CheckResult) string {
	if len(results) == 0 {
		return "unknown"
	}

	var upCount, downCount, degradedCount, timeoutCount int
	hasHeartbeat := false
	hasExternal := false
	heartbeatDown := false
	externalDown := false

	for _, r := range results {
		switch r.Status {
		case "up":
			upCount++
		case "down":
			downCount++
		case "degraded":
			degradedCount++
		case "timeout":
			timeoutCount++
		}

		switch r.Source {
		case "heartbeat":
			hasHeartbeat = true
			if r.Status == "down" || r.Status == "timeout" {
				heartbeatDown = true
			}
		case "external":
			hasExternal = true
			if r.Status == "down" || r.Status == "timeout" {
				externalDown = true
			}
		}
	}

	failCount := downCount + timeoutCount
	total := len(results)

	// All checks passing
	if failCount == 0 && degradedCount == 0 {
		return "operational"
	}

	// Any degraded reports
	if degradedCount > 0 && failCount == 0 {
		return "degraded"
	}

	// Mixed source failure: one source failing, the other not
	if hasHeartbeat && hasExternal && (heartbeatDown != externalDown) {
		return "partial_outage"
	}

	// Majority failing
	if failCount >= 3 || (total > 0 && failCount > total/2) {
		return "major_outage"
	}

	// Some failures but not majority
	if failCount > 0 {
		return "degraded"
	}

	return "operational"
}
