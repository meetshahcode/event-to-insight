.PHONY: build run test clean deps dev

# Variables
BINARY_NAME=event-to-insight
BINARY_PATH=./bin/$(BINARY_NAME)
CMD_PATH=./cmd

# Build the application
build:
	@echo "Building application..."
	@mkdir -p bin
	@go build -o $(BINARY_PATH) $(CMD_PATH)

# Run the application
run: build
	@echo "Running application..."
	@$(BINARY_PATH)

# Run with development settings
dev:
	@echo "Running in development mode..."
	@go run $(CMD_PATH)/main.go

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	@go mod download
	@go mod tidy

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	@go test -v -coverprofile=coverage.out ./...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf bin/
	@rm -f coverage.out coverage.html
	@rm -f *.db

# Format code
fmt:
	@echo "Formatting code..."
	@go fmt ./...

# Lint code
lint:
	@echo "Linting code..."
	@golangci-lint run

# Initialize project (install dependencies)
init: deps
	@echo "Project initialized successfully!"

# Run in production mode
prod: build
	@echo "Running in production mode..."
	@USE_MOCK_AI=false $(BINARY_PATH)

# Docker build
docker-build:
	@echo "Building Docker image..."
	@docker build -t event-to-insight-backend .

# Help
help:
	@echo "Available commands:"
	@echo "  build         - Build the application"
	@echo "  run           - Build and run the application"
	@echo "  dev           - Run in development mode"
	@echo "  deps          - Download dependencies"
	@echo "  test          - Run tests"
	@echo "  test-coverage - Run tests with coverage report"
	@echo "  clean         - Clean build artifacts"
	@echo "  fmt           - Format code"
	@echo "  lint          - Lint code"
	@echo "  init          - Initialize project"
	@echo "  prod          - Run in production mode"
	@echo "  docker-build  - Build Docker image"
	@echo "  help          - Show this help message"
