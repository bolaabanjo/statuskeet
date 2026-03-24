package api

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/bolaabanjo/statuskeet/internal/middleware"
	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/bolaabanjo/statuskeet/internal/repository"
)

type ServiceHandler struct {
	serviceRepo     *repository.ServiceRepo
	checkResultRepo *repository.CheckResultRepo
	orgRepo         *repository.OrgRepo
}

func NewServiceHandler(serviceRepo *repository.ServiceRepo, checkResultRepo *repository.CheckResultRepo, orgRepo *repository.OrgRepo) *ServiceHandler {
	return &ServiceHandler{serviceRepo: serviceRepo, checkResultRepo: checkResultRepo, orgRepo: orgRepo}
}

func (h *ServiceHandler) Register(w http.ResponseWriter, r *http.Request) {
	orgID, err := middleware.GetOrgID(r.Context())
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var req models.RegisterServicesRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if len(req.Services) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "at least one service is required"})
		return
	}

	var registered []models.Service
	for _, svc := range req.Services {
		if err := validateServiceRequest(svc); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}

		s := &models.Service{
			OrgID:          orgID,
			Name:           svc.Name,
			ServiceType:    svc.Type,
			CheckInterval:  defaultInt(svc.CheckInterval, 30),
			Timeout:        defaultInt(svc.Timeout, 10),
			ExpectedStatus: defaultInt(svc.ExpectedStatus, 200),
			Criticality:    defaultStr(svc.Criticality, "standard"),
		}

		if svc.Description != "" {
			s.Description = &svc.Description
		}
		if svc.URL != "" {
			s.URL = &svc.URL
		}

		result, err := h.serviceRepo.Upsert(r.Context(), s)
		if err != nil {
			slog.Error("failed to upsert service", "error", err, "service", svc.Name)
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
			return
		}
		registered = append(registered, *result)
	}

	writeJSON(w, http.StatusOK, models.RegisterServicesResponse{Services: registered})
}

func (h *ServiceHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserID(r.Context())
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	orgs, err := h.orgRepo.GetUserOrgs(r.Context(), userID)
	if err != nil || len(orgs) == 0 {
		writeJSON(w, http.StatusOK, map[string]any{"services": []models.Service{}})
		return
	}

	services, err := h.serviceRepo.GetByOrgID(r.Context(), orgs[0].ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
		return
	}

	if services == nil {
		services = []models.Service{}
	}

	writeJSON(w, http.StatusOK, map[string]any{"services": services})
}

func (h *ServiceHandler) Detail(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserID(r.Context())
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	serviceID, err := uuid.Parse(chi.URLParam(r, "serviceID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid service ID"})
		return
	}

	// Verify user owns this service
	orgs, err := h.orgRepo.GetUserOrgs(r.Context(), userID)
	if err != nil || len(orgs) == 0 {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "service not found"})
		return
	}

	service, err := h.serviceRepo.GetByID(r.Context(), serviceID)
	if err != nil || service.OrgID != orgs[0].ID {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "service not found"})
		return
	}

	uptime, err := h.checkResultRepo.GetDailyUptime(r.Context(), serviceID, 90)
	if err != nil {
		uptime = nil
	}

	recent, err := h.checkResultRepo.GetRecent(r.Context(), serviceID, 20)
	if err != nil {
		recent = nil
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"service":       service,
		"uptime":        uptime,
		"recent_checks": recent,
	})
}

func validateServiceRequest(svc models.RegisterServiceRequest) error {
	if svc.Name == "" {
		return fmt.Errorf("service name is required")
	}
	switch svc.Type {
	case "http", "tcp", "dns", "internal":
		// valid
	case "":
		return fmt.Errorf("service type is required")
	default:
		return fmt.Errorf("invalid service type: %s (must be http, tcp, dns, or internal)", svc.Type)
	}
	if svc.Type == "http" && svc.URL == "" {
		return fmt.Errorf("url is required for http service type")
	}
	if svc.Criticality != "" {
		switch svc.Criticality {
		case "critical", "standard", "low":
			// valid
		default:
			return fmt.Errorf("invalid criticality: %s (must be critical, standard, or low)", svc.Criticality)
		}
	}
	return nil
}

func defaultInt(v *int, d int) int {
	if v != nil {
		return *v
	}
	return d
}

func defaultStr(v, d string) string {
	if v != "" {
		return v
	}
	return d
}
