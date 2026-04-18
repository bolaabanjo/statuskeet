package service

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const supabaseAuthProvider = "supabase"

type SupabaseAuthClient struct {
	baseURL        string
	clientKey      string
	serviceRoleKey string
	httpClient     *http.Client
}

type SupabaseUser struct {
	ID    string
	Email string
	Name  string
}

type supabaseUserPayload struct {
	ID           string         `json:"id"`
	Email        string         `json:"email"`
	UserMetadata map[string]any `json:"user_metadata"`
}

type supabaseSessionResponse struct {
	User supabaseUserPayload `json:"user"`
}

type supabaseAPIError struct {
	Code             string `json:"code"`
	ErrorCode        string `json:"error_code"`
	Message          string `json:"message"`
	Msg              string `json:"msg"`
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description"`
}

type supabaseRequestError struct {
	StatusCode int
	Message    string
}

func (e *supabaseRequestError) Error() string {
	if e.Message == "" {
		return fmt.Sprintf("supabase request failed with status %d", e.StatusCode)
	}
	return fmt.Sprintf("supabase request failed with status %d: %s", e.StatusCode, e.Message)
}

func NewSupabaseAuthClient(baseURL, clientKey, serviceRoleKey string) *SupabaseAuthClient {
	return &SupabaseAuthClient{
		baseURL:        strings.TrimRight(baseURL, "/"),
		clientKey:      clientKey,
		serviceRoleKey: serviceRoleKey,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

func (c *SupabaseAuthClient) CreateUser(ctx context.Context, email, password, name string) (*SupabaseUser, error) {
	body := map[string]any{
		"email":         email,
		"password":      password,
		"email_confirm": true,
		"user_metadata": map[string]string{
			"name": name,
		},
	}

	var payload supabaseUserPayload
	if err := c.doJSON(ctx, http.MethodPost, "/auth/v1/admin/users", c.serviceRoleKey, c.serviceRoleKey, body, &payload); err != nil {
		return nil, mapSupabaseError(err)
	}

	return payload.toUser(), nil
}

func (c *SupabaseAuthClient) SignInWithPassword(ctx context.Context, email, password string) (*SupabaseUser, error) {
	body := map[string]string{
		"email":    email,
		"password": password,
	}

	var payload supabaseSessionResponse
	if err := c.doJSON(ctx, http.MethodPost, "/auth/v1/token?grant_type=password", c.clientKey, "", body, &payload); err != nil {
		return nil, mapSupabaseError(err)
	}

	return payload.User.toUser(), nil
}

func (c *SupabaseAuthClient) EnsureUser(ctx context.Context, email, password, name string) (*SupabaseUser, error) {
	user, err := c.CreateUser(ctx, email, password, name)
	if err == nil {
		return user, nil
	}
	if !errors.Is(err, ErrEmailTaken) {
		return nil, err
	}

	return c.SignInWithPassword(ctx, email, password)
}

func (c *SupabaseAuthClient) DeleteUser(ctx context.Context, userID string) error {
	err := c.doJSON(ctx, http.MethodDelete, "/auth/v1/admin/users/"+userID, c.serviceRoleKey, c.serviceRoleKey, nil, nil)
	if err == nil {
		return nil
	}

	var requestErr *supabaseRequestError
	if errors.As(err, &requestErr) && requestErr.StatusCode == http.StatusNotFound {
		return nil
	}

	return err
}

func (c *SupabaseAuthClient) doJSON(ctx context.Context, method, path, apiKey, bearerToken string, body any, dst any) error {
	var bodyReader *bytes.Reader
	if body == nil {
		bodyReader = bytes.NewReader(nil)
	} else {
		rawBody, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("marshal supabase request: %w", err)
		}
		bodyReader = bytes.NewReader(rawBody)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, bodyReader)
	if err != nil {
		return fmt.Errorf("build supabase request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if apiKey != "" {
		req.Header.Set("apikey", apiKey)
	}
	if bearerToken != "" {
		req.Header.Set("Authorization", "Bearer "+bearerToken)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("send supabase request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var apiErr supabaseAPIError
		if err := json.NewDecoder(resp.Body).Decode(&apiErr); err == nil {
			return &supabaseRequestError{
				StatusCode: resp.StatusCode,
				Message:    apiErr.message(),
			}
		}
		return &supabaseRequestError{StatusCode: resp.StatusCode}
	}

	if dst == nil {
		return nil
	}

	if err := json.NewDecoder(resp.Body).Decode(dst); err != nil {
		return fmt.Errorf("decode supabase response: %w", err)
	}

	return nil
}

func (p supabaseUserPayload) toUser() *SupabaseUser {
	return &SupabaseUser{
		ID:    p.ID,
		Email: p.Email,
		Name:  metadataString(p.UserMetadata, "name", "full_name", "display_name"),
	}
}

func (e supabaseAPIError) message() string {
	for _, value := range []string{e.Message, e.Msg, e.ErrorDescription, e.Error, e.Code, e.ErrorCode} {
		if trimmed := strings.TrimSpace(value); trimmed != "" {
			return trimmed
		}
	}
	return ""
}

func mapSupabaseError(err error) error {
	var requestErr *supabaseRequestError
	if !errors.As(err, &requestErr) {
		return err
	}

	message := strings.ToLower(requestErr.Message)
	switch {
	case strings.Contains(message, "already been registered"),
		strings.Contains(message, "already registered"),
		strings.Contains(message, "email exists"),
		strings.Contains(message, "user already exists"),
		requestErr.StatusCode == http.StatusConflict,
		requestErr.StatusCode == http.StatusUnprocessableEntity:
		return ErrEmailTaken
	case strings.Contains(message, "invalid login credentials"),
		strings.Contains(message, "invalid grant"),
		strings.Contains(message, "email not confirmed"),
		strings.Contains(message, "invalid email or password"),
		requestErr.StatusCode == http.StatusUnauthorized:
		return ErrInvalidCredentials
	default:
		if requestErr.Message == "" {
			return fmt.Errorf("supabase auth request failed with status %d", requestErr.StatusCode)
		}
		return fmt.Errorf("supabase auth: %s", requestErr.Message)
	}
}

func metadataString(metadata map[string]any, keys ...string) string {
	for _, key := range keys {
		value, ok := metadata[key]
		if !ok {
			continue
		}

		text, ok := value.(string)
		if !ok {
			continue
		}

		text = strings.TrimSpace(text)
		if text != "" {
			return text
		}
	}

	return ""
}
