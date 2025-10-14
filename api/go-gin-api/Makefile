.PHONY: help test test-coverage test-verbose run build clean docker-build docker-run

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

test: ## Run all tests
	@echo "Running tests..."
	@go test ./... -v

test-coverage: ## Run tests with coverage report
	@echo "Running tests with coverage..."
	@go test ./... -coverprofile=coverage.out
	@go tool cover -html=coverage.out -o coverage.html
	@go tool cover -func=coverage.out
	@echo "Coverage report generated: coverage.html"

test-verbose: ## Run tests with verbose output
	@echo "Running tests (verbose)..."
	@go test ./... -v -cover

test-short: ## Run tests in short mode
	@echo "Running tests (short)..."
	@go test ./... -short

test-models: ## Run only model tests
	@echo "Running model tests..."
	@go test ./models/ -v

test-service: ## Run only service tests
	@echo "Running service tests..."
	@go test ./service/ -v

test-handlers: ## Run only handler tests
	@echo "Running handler tests..."
	@go test ./handlers/ -v

test-integration: ## Run integration tests
	@echo "Running integration tests..."
	@go test -v -run Integration

test-edge: ## Run edge case tests
	@echo "Running edge case tests..."
	@go test ./... -v -run Edge

test-race: ## Run tests with race detection
	@echo "Running tests with race detector..."
	@go test ./... -race

bench: ## Run benchmark tests
	@echo "Running benchmarks..."
	@go test -bench=. -benchmem -run=^$

bench-verbose: ## Run benchmarks with verbose output
	@echo "Running benchmarks (verbose)..."
	@go test -bench=. -benchmem -benchtime=5s

test-count: ## Count total tests
	@echo "Counting tests..."
	@go test ./... -v | grep -c "^=== RUN" || echo "Install grep for count"

run: ## Run the application
	@echo "Starting application..."
	@go run main.go

build: ## Build the application
	@echo "Building application..."
	@go build -o bin/spicy-todo-api

build-linux: ## Build for Linux
	@echo "Building for Linux..."
	@GOOS=linux GOARCH=amd64 go build -o bin/spicy-todo-api-linux

clean: ## Clean build artifacts and test cache
	@echo "Cleaning..."
	@rm -rf bin/
	@rm -f coverage.out coverage.html
	@go clean -testcache

docker-build: ## Build Docker image
	@echo "Building Docker image..."
	@docker-compose build

docker-run: ## Run with Docker Compose
	@echo "Starting with Docker Compose..."
	@docker-compose up -d

docker-stop: ## Stop Docker containers
	@echo "Stopping Docker containers..."
	@docker-compose down

docker-logs: ## View Docker logs
	@docker-compose logs -f

lint: ## Run linter
	@echo "Running linter..."
	@golangci-lint run ./...

fmt: ## Format code
	@echo "Formatting code..."
	@go fmt ./...

vet: ## Run go vet
	@echo "Running go vet..."
	@go vet ./...

deps: ## Download dependencies
	@echo "Downloading dependencies..."
	@go mod download

tidy: ## Tidy dependencies
	@echo "Tidying dependencies..."
	@go mod tidy

all: clean deps test build ## Clean, download deps, test, and build

