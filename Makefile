.PHONY: build run test clean dev-up dev-down migrate-up migrate-down

DATABASE_URL ?= postgres://statuskeet:statuskeet@localhost:5432/statuskeet?sslmode=disable

build:
	go build -o bin/server ./cmd/server

run: build
	./bin/server

test:
	go test ./... -v

clean:
	rm -rf bin/

dev-up:
	docker compose up -d

dev-down:
	docker compose down

migrate-up:
	$(shell go env GOPATH)/bin/migrate -path migrations/ -database "$(DATABASE_URL)" up

migrate-down:
	$(shell go env GOPATH)/bin/migrate -path migrations/ -database "$(DATABASE_URL)" down 1

migrate-create:
	$(shell go env GOPATH)/bin/migrate create -ext sql -dir migrations/ -seq $(name)
