package service

import "errors"

var (
	ErrEmailTaken         = errors.New("email already registered")
	ErrSlugTaken          = errors.New("organization slug already taken")
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInvalidToken       = errors.New("invalid or expired token")
	ErrAPIKeyNotFound     = errors.New("api key not found or revoked")
)
