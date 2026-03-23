package api

import (
	"net/http"

	"github.com/bolaabanjo/statuskeet/internal/middleware"
	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/bolaabanjo/statuskeet/internal/repository"
)

type OnboardingHandler struct {
	onboardingRepo *repository.OnboardingRepo
	orgRepo        *repository.OrgRepo
}

func NewOnboardingHandler(onboardingRepo *repository.OnboardingRepo, orgRepo *repository.OrgRepo) *OnboardingHandler {
	return &OnboardingHandler{
		onboardingRepo: onboardingRepo,
		orgRepo:        orgRepo,
	}
}

func (h *OnboardingHandler) Complete(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserID(r.Context())
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var req models.OnboardingRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.FirstName == "" || req.LastName == "" || req.CompanySize == "" || req.Role == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "all fields are required"})
		return
	}

	if len(req.UseCases) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "at least one use case is required"})
		return
	}

	orgs, err := h.orgRepo.GetUserOrgs(r.Context(), userID)
	if err != nil || len(orgs) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "no organization found"})
		return
	}
	orgID := orgs[0].ID

	profile, err := h.onboardingRepo.Create(r.Context(), userID, orgID, req)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
		return
	}

	writeJSON(w, http.StatusCreated, profile)
}

func (h *OnboardingHandler) Status(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserID(r.Context())
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	profile, err := h.onboardingRepo.GetByUserID(r.Context(), userID)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]bool{"completed": false})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"completed": true,
		"profile":   profile,
	})
}
