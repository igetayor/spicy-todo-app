.PHONY: help test test-coverage run install clean docker-build docker-run

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	@echo "Installing dependencies..."
	@bundle install

test: ## Run all tests
	@echo "Running tests..."
	@bundle exec rspec

test-coverage: ## Run tests with coverage report
	@echo "Running tests with coverage..."
	@COVERAGE=true bundle exec rspec
	@echo "Coverage report generated: coverage/index.html"

test-verbose: ## Run tests with verbose output
	@echo "Running tests (verbose)..."
	@bundle exec rspec --format documentation

run: ## Run the application
	@echo "Starting application..."
	@bundle exec ruby app.rb

console: ## Start IRB console with app loaded
	@bundle exec irb -r ./app.rb

clean: ## Clean temporary files
	@echo "Cleaning..."
	@rm -rf coverage/
	@rm -f spec/examples.txt

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

lint: ## Run RuboCop linter (if installed)
	@echo "Running RuboCop..."
	@bundle exec rubocop || echo "RuboCop not installed. Run: gem install rubocop"

fmt: ## Auto-format code with RuboCop
	@echo "Formatting code..."
	@bundle exec rubocop -a || echo "RuboCop not installed. Run: gem install rubocop"

all: install test ## Install dependencies and run tests



