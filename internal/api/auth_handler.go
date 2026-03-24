package api

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/bolaabanjo/statuskeet/internal/middleware"
	"github.com/bolaabanjo/statuskeet/internal/models"
	"github.com/bolaabanjo/statuskeet/internal/repository"
	"github.com/bolaabanjo/statuskeet/internal/service"
)

type AuthHandler struct {
	authService   *service.AuthService
	apiKeyService *service.APIKeyService
	orgRepo       *repository.OrgRepo
}

func NewAuthHandler(authService *service.AuthService, apiKeyService *service.APIKeyService, orgRepo *repository.OrgRepo) *AuthHandler {
	return &AuthHandler{
		authService:   authService,
		apiKeyService: apiKeyService,
		orgRepo:       orgRepo,
	}
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req models.SignupRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	resp, err := h.authService.Signup(r.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEmailTaken):
			writeJSON(w, http.StatusConflict, map[string]string{"error": err.Error()})
		case errors.Is(err, service.ErrSlugTaken):
			writeJSON(w, http.StatusConflict, map[string]string{"error": err.Error()})
		default:
			if isValidationError(err) {
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			} else {
				writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
			}
		}
		return
	}

	writeJSON(w, http.StatusCreated, resp)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	resp, err := h.authService.Login(r.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": err.Error()})
		} else {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
		}
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *AuthHandler) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserID(r.Context())
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	var req models.CreateAPIKeyRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.Name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name is required"})
		return
	}

	// Get the user's first org (multi-org selection comes later)
	orgs, err := h.orgRepo.GetUserOrgs(r.Context(), userID)
	if err != nil || len(orgs) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "no organization found"})
		return
	}
	orgID := orgs[0].ID

	fullKey, apiKey, err := h.apiKeyService.Create(r.Context(), orgID, req.Name)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
		return
	}

	writeJSON(w, http.StatusCreated, models.CreateAPIKeyResponse{
		Key:    fullKey,
		APIKey: apiKey,
	})
}

func (h *AuthHandler) ListAPIKeys(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserID(r.Context())
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	orgs, err := h.orgRepo.GetUserOrgs(r.Context(), userID)
	if err != nil || len(orgs) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "no organization found"})
		return
	}

	keys, err := h.apiKeyService.ListByOrg(r.Context(), orgs[0].ID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"api_keys": keys})
}

func (h *AuthHandler) RevokeAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, err := middleware.GetUserID(r.Context())
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
		return
	}

	keyID, err := uuid.Parse(chi.URLParam(r, "keyID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid key ID"})
		return
	}

	orgs, err := h.orgRepo.GetUserOrgs(r.Context(), userID)
	if err != nil || len(orgs) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "no organization found"})
		return
	}

	if err := h.apiKeyService.Revoke(r.Context(), keyID, orgs[0].ID); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "api key not found"})
		} else {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
		}
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "revoked"})
}

func isValidationError(err error) bool {
	msg := err.Error()
	return msg == "invalid email address" ||
		msg == "password must be at least 8 characters" ||
		msg == "name is required" ||
		msg == "organization name is required"
}
