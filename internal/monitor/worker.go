package monitor

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/bolaabanjo/statuskeet/internal/repository"
	"github.com/bolaabanjo/statuskeet/internal/service"
)

type MonitorWorker struct {
	serviceRepo     *repository.ServiceRepo
	checkResultRepo *repository.CheckResultRepo
	statusEvaluator *service.StatusEvaluator
	incidentManager *service.IncidentManager
	httpClient      *http.Client
}

func NewMonitorWorker(
	serviceRepo *repository.ServiceRepo,
	checkResultRepo *repository.CheckResultRepo,
	statusEvaluator *service.StatusEvaluator,
	incidentManager *service.IncidentManager,
) *MonitorWorker {
	return &MonitorWorker{
		serviceRepo:     serviceRepo,
		checkResultRepo: checkResultRepo,
		statusEvaluator: statusEvaluator,
		incidentManager: incidentManager,
		httpClient:      &http.Client{},
	}
}

func (w *MonitorWorker) Start(ctx context.Context) {
	slog.Info("monitoring worker starting")
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	// Initial run
	w.RunOnce(ctx)

	for {
		select {
		case <-ctx.Done():
			slog.Info("monitoring worker stopping")
			return
		case <-ticker.C:
			w.RunOnce(ctx)
		}
	}
}

func (w *MonitorWorker) RunOnce(ctx context.Context) {
	w.run(ctx)
}

func (w *MonitorWorker) run(ctx context.Context) {
	services, err := w.serviceRepo.GetDueForMonitoring(ctx, time.Now())
	if err != nil {
		slog.Error("failed to get services for monitoring", "error", err)
		return
	}

	if len(services) == 0 {
		return
	}

	slog.Info("performing monitoring checks", "count", len(services))

	var wg sync.WaitGroup
	for _, s := range services {
		wg.Add(1)
		go func(service models.Service) {
			defer wg.Done()
			w.check(ctx, service)
		}(s)
	}
	wg.Wait()
}

func (w *MonitorWorker) check(ctx context.Context, s models.Service) {
	start := time.Now()
	status := "up"
	var responseTime int
	var statusCode *int
	var errorMessage string

	timeout := time.Duration(s.Timeout) * time.Second
	if timeout <= 0 {
		timeout = 10 * time.Second
	}

	checkCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(checkCtx, http.MethodGet, *s.URL, nil)
	if err != nil {
		slog.Error("failed to create monitor request", "service", s.Name, "error", err)
		return
	}

	resp, err := w.httpClient.Do(req)
	responseTime = int(time.Since(start).Milliseconds())

	if err != nil {
		status = "down"
		errorMessage = err.Error()
	} else {
		defer resp.Body.Close()
		code := resp.StatusCode
		statusCode = &code
		if resp.StatusCode != s.ExpectedStatus {
			status = "down"
			errorMessage = fmt.Sprintf("expected status %d, got %d", s.ExpectedStatus, resp.StatusCode)
		}
	}

	result := models.CheckResult{
		ServiceID:    s.ID,
		Source:       "external",
		Status:       status,
		ResponseTime: &responseTime,
		StatusCode:   statusCode,
		CheckedAt:    time.Now(),
	}

	if errorMessage != "" {
		result.ErrorMessage = &errorMessage
	}

	if err := w.checkResultRepo.Create(ctx, &result); err != nil {
		slog.Error("failed to store monitor check result", "service", s.Name, "error", err)
		return
	}

	// Evaluate status change
	transition, err := w.statusEvaluator.Evaluate(ctx, s.ID)
	if err != nil {
		slog.Error("failed to evaluate status after monitor check", "service", s.Name, "error", err)
		return
	}

	if transition != nil {
		w.incidentManager.ProcessTransitions(ctx, []service.StatusTransition{*transition})
	}
}
