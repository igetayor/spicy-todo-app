.PHONY: help test test-coverage run build build-release clean docker-build docker-run

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

test: ## Run all tests
	@echo "Running tests..."
	@cargo test --verbose

test-coverage: ## Run tests with coverage (requires cargo-tarpaulin)
	@echo "Running tests with coverage..."
	@cargo tarpaulin --out Html --output-dir coverage
	@echo "Coverage report generated: coverage/index.html"

test-quiet: ## Run tests quietly
	@cargo test --quiet

run: ## Run the application in development mode
	@echo "Starting application..."
	@cargo run

build: ## Build the application (debug mode)
	@echo "Building application (debug)..."
	@cargo build

build-release: ## Build the application (release mode)
	@echo "Building application (release)..."
	@cargo build --release

check: ## Check code without building
	@echo "Checking code..."
	@cargo check

clippy: ## Run Clippy linter
	@echo "Running Clippy..."
	@cargo clippy -- -D warnings

fmt: ## Format code
	@echo "Formatting code..."
	@cargo fmt

fmt-check: ## Check code formatting
	@echo "Checking code formatting..."
	@cargo fmt -- --check

clean: ## Clean build artifacts
	@echo "Cleaning..."
	@cargo clean
	@rm -rf coverage/

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

watch: ## Run with auto-reload (requires cargo-watch)
	@cargo watch -x run

bench: ## Run benchmarks
	@cargo bench

doc: ## Generate documentation
	@cargo doc --no-deps --open

all: fmt clippy test build-release ## Format, lint, test, and build

