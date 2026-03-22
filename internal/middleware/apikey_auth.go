package middleware

import (
	"net/http"

	"github.com/bolaabanjo/statuskeet/internal/service"
)

func APIKeyAuth(apiKeyService *service.APIKeyService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			key := r.Header.Get("X-API-Key")
			if key == "" {
				http.Error(w, `{"error":"missing X-API-Key header"}`, http.StatusUnauthorized)
				return
			}

			apiKey, err := apiKeyService.Validate(r.Context(), key)
			if err != nil {
				http.Error(w, `{"error":"invalid or revoked api key"}`, http.StatusUnauthorized)
				return
			}

			ctx := SetOrgID(r.Context(), apiKey.OrganizationID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
