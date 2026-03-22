# Makefile — common commands for development
#
# Why a Makefile?
# It's a universal task runner. Instead of remembering long commands,
# you type `make run` or `make build`. Every developer on the team
# uses the same commands regardless of their editor or workflow.
# Makefiles have been around since 1976 — they work everywhere.

.PHONY: build run test clean dev-up dev-down migrate-up migrate-down

# Build the server binary into bin/
build:
	go build -o bin/server ./cmd/server

# Run the server (builds first)
run: build
	./bin/server

# Run tests
test:
	go test ./... -v

# Remove build artifacts
clean:
	rm -rf bin/

# Start local dev infrastructure (Postgres + Redis)
dev-up:
	docker compose up -d

# Stop local dev infrastructure
dev-down:
	docker compose down

# Run database migrations (we'll set this up next)
migrate-up:
	@echo "Migration tool not yet installed — coming in Step 2"

migrate-down:
	@echo "Migration tool not yet installed — coming in Step 2"
