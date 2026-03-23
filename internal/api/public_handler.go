package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/bolaabanjo/statuskeet/internal/repository"
)

type PublicHandler struct {
	orgRepo         *repository.OrgRepo
	serviceRepo     *repository.ServiceRepo
	incidentRepo    *repository.IncidentRepo
	checkResultRepo *repository.CheckResultRepo
}

func NewPublicHandler(orgRepo *repository.OrgRepo, serviceRepo *repository.ServiceRepo, incidentRepo *repository.IncidentRepo, checkResultRepo *repository.CheckResultRepo) *PublicHandler {
	return &PublicHandler{
		orgRepo:         orgRepo,
		serviceRepo:     serviceRepo,
		incidentRepo:    incidentRepo,
		checkResultRepo: checkResultRepo,
	}
}

// Status returns the current status of all visible services for an org.
func (h *PublicHandler) Status(w http.ResponseWriter, r *http.Request) {
	orgSlug := chi.URLParam(r, "orgSlug")

	org, err := h.orgRepo.GetBySlug(r.Context(), orgSlug)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "organization not found"})
		return
	}

	services, err := h.serviceRepo.GetByOrgID(r.Context(), org.ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
		return
	}

	// Filter to visible services only
	var visible []models.Service
	for _, s := range services {
		if s.Visible {
			visible = append(visible, s)
		}
	}
	if visible == nil {
		visible = []models.Service{}
	}

	// Determine overall status
	overall := overallStatus(visible)

	// Get active incidents
	activeIncidents, err := h.incidentRepo.GetByOrgID(r.Context(), org.ID, false)
	if err != nil {
		activeIncidents = []models.Incident{}
	}
	if activeIncidents == nil {
		activeIncidents = []models.Incident{}
	}

	// Build incident responses with updates
	var incidentResponses []PublicIncidentResponse
	for _, inc := range activeIncidents {
		updates, _ := h.incidentRepo.GetUpdates(r.Context(), inc.ID)
		if updates == nil {
			updates = []models.IncidentUpdate{}
		}
		// Filter to public updates only
		var publicUpdates []models.IncidentUpdate
		for _, u := range updates {
			if u.IsPublic {
				publicUpdates = append(publicUpdates, u)
			}
		}
		if publicUpdates == nil {
			publicUpdates = []models.IncidentUpdate{}
		}
		incidentResponses = append(incidentResponses, PublicIncidentResponse{
			Incident: inc,
			Updates:  publicUpdates,
		})
	}
	if incidentResponses == nil {
		incidentResponses = []PublicIncidentResponse{}
	}

	// Fetch 90-day uptime for each visible service
	var servicesWithUptime []ServiceWithUptime
	for _, s := range visible {
		uptime, _ := h.checkResultRepo.GetDailyUptime(r.Context(), s.ID, 90)
		if uptime == nil {
			uptime = []repository.DailyUptime{}
		}
		servicesWithUptime = append(servicesWithUptime, ServiceWithUptime{
			Service: s,
			Uptime:  uptime,
		})
	}
	if servicesWithUptime == nil {
		servicesWithUptime = []ServiceWithUptime{}
	}

	writeJSON(w, http.StatusOK, PublicStatusResponse{
		Organization:    *org,
		OverallStatus:   overall,
		StatusMessage:   statusMessage(overall),
		Services:        servicesWithUptime,
		ActiveIncidents: incidentResponses,
	})
}

// Incidents returns recent incidents (active + resolved) for the public page.
func (h *PublicHandler) Incidents(w http.ResponseWriter, r *http.Request) {
	orgSlug := chi.URLParam(r, "orgSlug")

	org, err := h.orgRepo.GetBySlug(r.Context(), orgSlug)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "organization not found"})
		return
	}

	incidents, err := h.incidentRepo.GetByOrgID(r.Context(), org.ID, true)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
		return
	}
	if incidents == nil {
		incidents = []models.Incident{}
	}

	var responses []PublicIncidentResponse
	for _, inc := range incidents {
		updates, _ := h.incidentRepo.GetUpdates(r.Context(), inc.ID)
		if updates == nil {
			updates = []models.IncidentUpdate{}
		}
		var publicUpdates []models.IncidentUpdate
		for _, u := range updates {
			if u.IsPublic {
				publicUpdates = append(publicUpdates, u)
			}
		}
		if publicUpdates == nil {
			publicUpdates = []models.IncidentUpdate{}
		}
		responses = append(responses, PublicIncidentResponse{
			Incident: inc,
			Updates:  publicUpdates,
		})
	}
	if responses == nil {
		responses = []PublicIncidentResponse{}
	}

	writeJSON(w, http.StatusOK, map[string]any{"incidents": responses})
}

// Response types

type ServiceWithUptime struct {
	models.Service
	Uptime []repository.DailyUptime `json:"uptime"`
}

type PublicStatusResponse struct {
	Organization    models.Organization     `json:"organization"`
	OverallStatus   string                  `json:"overall_status"`
	StatusMessage   string                  `json:"status_message"`
	Services        []ServiceWithUptime     `json:"services"`
	ActiveIncidents []PublicIncidentResponse `json:"active_incidents"`
}

type PublicIncidentResponse struct {
	Incident models.Incident          `json:"incident"`
	Updates  []models.IncidentUpdate  `json:"updates"`
}

func overallStatus(services []models.Service) string {
	if len(services) == 0 {
		return "operational"
	}

	hasDegraded := false
	hasPartial := false
	hasMajor := false

	for _, s := range services {
		switch s.CurrentStatus {
		case "major_outage":
			hasMajor = true
		case "partial_outage":
			hasPartial = true
		case "degraded":
			hasDegraded = true
		}
	}

	if hasMajor {
		return "major_outage"
	}
	if hasPartial {
		return "partial_outage"
	}
	if hasDegraded {
		return "degraded"
	}
	return "operational"
}

func statusMessage(status string) string {
	switch status {
	case "operational":
		return "All Systems Operational"
	case "degraded":
		return "Degraded Performance"
	case "partial_outage":
		return "Partial System Outage"
	case "major_outage":
		return "Major System Outage"
	default:
		return "Unknown"
	}
}
