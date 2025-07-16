# Event-to-Insight System

An AI-powered IT support system that transforms user queries into actionable insights using Golang backend, React frontend, and Gemini AI integration.

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended for easiest setup)
- **OR** for manual setup:
  - Go 1.21+
  - Node.js 18+
  - npm or yarn

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd event-to-insight

# Start the entire stack
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080/api/health
```

### Option 2: Manual Development Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
go mod download

# Set up environment (optional - defaults work for development)
cp .env.example .env

# Run the application
make dev
# OR
go run cmd/main.go

# API will be available at http://localhost:8080
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Start development server
npm run dev

# Frontend will be available at http://localhost:3000
```

## 🏗️ Architecture Overview

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │────│   Golang API     │────│   SQLite DB     │
│   (Frontend)    │    │   (Backend)      │    │   (Persistence) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                       ┌──────────────────┐
                       │   Gemini AI      │
                       │   (Analysis)     │
                       └──────────────────┘
```

### Core Functionality

1. **User Query Processing**: Users submit IT questions through a clean web interface
2. **AI Analysis**: Gemini AI (or Mock AI) analyzes queries against knowledge base articles
3. **Smart Responses**: System returns concise answers with relevant documentation
4. **Knowledge Base**: Pre-populated with common IT support articles
5. **Persistent Storage**: All queries and responses are stored for analysis

## 🔧 Technology Stack & Design Decisions

### Backend (Golang)

#### Technology Choices

- **Framework**: Chi Router
  - **Why**: Lightweight, fast, and provides excellent middleware support
  - **Benefits**: Built-in CORS, logging, and timeout handling
  
- **Database**: SQLite with Interface Pattern
  - **Why**: Simple deployment, zero configuration, perfect for demo/development
  - **Design**: Database interface allows easy switching to PostgreSQL/MySQL
  
- **AI Integration**: Google Gemini AI
  - **Why**: Advanced reasoning capabilities, good documentation
  - **Fallback**: Mock AI service for development/demo without API keys

#### Architecture Patterns

```go
// Clean Architecture Layers
cmd/              // Application entry point
internal/
  ├── models/     // Domain entities
  ├── database/   // Data persistence (interface + SQLite impl)
  ├── ai/         // AI service (interface + Gemini + Mock impl)
  ├── service/    // Business logic
  ├── handlers/   // HTTP request handling
  ├── router/     // Route configuration
  └── config/     // Configuration management
```

#### Key Design Decisions

1. **Interface-Based Design**: All external dependencies (DB, AI) use interfaces
2. **Dependency Injection**: Services are injected, making testing easier
3. **Error Handling**: Consistent error responses with proper HTTP status codes
4. **Middleware Stack**: Logging, CORS, timeouts, and recovery
5. **Configuration**: Environment-based config with sensible defaults

### Frontend (React + TypeScript)

#### Technology Choices

- **Framework**: React 18 with TypeScript
  - **Why**: Type safety, excellent ecosystem, component reusability
  
- **Build Tool**: Vite
  - **Why**: Fast development server, optimized builds, great DX
  
- **Styling**: Tailwind CSS
  - **Why**: Utility-first approach, consistent design system, mobile-first
  
- **Icons**: Lucide React
  - **Why**: Lightweight, consistent icon set, tree-shakeable
  
- **HTTP Client**: Axios
  - **Why**: Interceptors for logging/error handling, request/response transformation

#### Component Architecture

```
src/
├── components/
│   ├── SearchBar.tsx       // Query input with validation
│   ├── SearchResults.tsx   // AI answer + article list
│   └── ArticleModal.tsx    // Full article viewer
├── services/
│   └── api.ts             // API client with error handling
└── App.tsx                // Main application shell
```

#### State Management

- **Local State**: React useState for component-level state
- **Props**: Clean data flow between components
- **No Global State**: Kept simple as per requirements

### API Design

#### Endpoints

```http
GET  /api/health               # Health check
POST /api/search-query         # Main search functionality
GET  /api/articles             # List all articles
GET  /api/articles/{id}        # Get specific article
```

#### Request/Response Format

```typescript
// Search Request
interface SearchRequest {
  query: string;
}

// Search Response
interface SearchResponse {
  query: string;
  ai_summary_answer: string;
  ai_relevant_articles: Article[];
  query_id: number;
  timestamp: string;
}
```

## 🧪 Testing Strategy

### Backend Testing

#### Unit Tests
- **Database Layer**: Tests for all CRUD operations
- **AI Service**: Mock AI service testing with various query types
- **Handlers**: HTTP request/response testing with mocked dependencies

#### Integration Tests
- **API Endpoints**: Full request/response cycle testing
- **Database Integration**: Real SQLite database operations
- **Error Handling**: Various failure scenarios

```bash
# Run backend tests
cd backend
make test

# Run with coverage
make test-coverage
```

### Frontend Testing

#### Component Tests
- **SearchBar**: Input validation, API integration, error states
- **SearchResults**: Data display, article interaction
- **API Service**: HTTP client with mocked responses

#### Testing Tools
- **Vitest**: Fast unit test runner
- **Testing Library**: Component testing utilities
- **Mock Service Worker**: API mocking for integration tests

```bash
# Run frontend tests
cd frontend
npm test

# Run with UI
npm run test:ui
```

### Test Coverage Goals

- **Backend**: >80% line coverage
- **Frontend**: >75% component coverage
- **Integration**: All API endpoints tested
- **Error Scenarios**: Network failures, invalid inputs, AI service errors

## 🐳 Docker & Deployment

### Production Deployment

```bash
# Build and start production containers
docker-compose up --build -d

# Check service health
docker-compose ps
```

### Development with Docker

```bash
# Start with hot reload
docker-compose -f docker-compose.dev.yml up --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Environment Configuration

#### Backend Environment Variables

```bash
PORT=8080                    # Server port
DB_PATH=./data.db           # SQLite database path
USE_MOCK_AI=true            # Use mock AI (set false for Gemini)
GEMINI_API_KEY=             # Gemini API key (required if USE_MOCK_AI=false)
```

#### Frontend Environment Variables

```bash
VITE_API_BASE_URL=http://localhost:8080/api  # Backend API URL
```

### Production Considerations

1. **Database**: Consider PostgreSQL for production scale
2. **AI Service**: Implement rate limiting and caching
3. **Monitoring**: Add health checks and metrics
4. **Security**: Implement authentication and input sanitization
5. **Scaling**: Use load balancers and multiple container instances

## 📋 User Journey

### Typical User Flow

1. **Landing**: User visits the clean, intuitive interface
2. **Query**: Types an IT question (e.g., "How do I reset my password?")
3. **Processing**: System analyzes query against knowledge base
4. **Results**: User receives:
   - AI-generated summary answer
   - List of relevant knowledge base articles
   - Timestamp and query tracking
5. **Deep Dive**: User can click articles to view full content
6. **Resolution**: User finds solution or gets guidance to contact IT

### Example Queries

- "How do I reset my password?"
- "VPN is not connecting"
- "Email setup on mobile device"
- "Printer not working"
- "Need to install new software"

## 🚀 Getting Gemini AI Working

### Option 1: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a free API key
3. Update backend environment:

```bash
# In backend/.env
USE_MOCK_AI=false
GEMINI_API_KEY=your_actual_api_key_here
```

### Option 2: Use Mock AI (Default)

The system works out of the box with a sophisticated mock AI service that provides realistic responses based on keyword matching.

## 🔍 Monitoring & Health Checks

### Health Endpoints

- **Backend**: `GET http://localhost:8080/api/health`
- **Frontend**: `GET http://localhost:3000/`

### Docker Health Checks

Both containers include health checks that monitor service availability:

```bash
# Check container health
docker-compose ps
```

## 🛠️ Development Commands

### Backend

```bash
make build        # Build binary
make run          # Build and run
make dev          # Run with hot reload
make test         # Run tests
make clean        # Clean build artifacts
make deps         # Download dependencies
```

### Frontend

```bash
npm run dev       # Development server
npm run build     # Production build
npm run preview   # Preview production build
npm test          # Run tests
npm run lint      # Lint code
```

## 📚 Project Structure

```
event-to-insight/
├── backend/                 # Go backend service
│   ├── cmd/                # Application entry point
│   ├── internal/           # Private application code
│   │   ├── ai/            # AI service implementations
│   │   ├── config/        # Configuration management
│   │   ├── database/      # Database layer
│   │   ├── handlers/      # HTTP handlers
│   │   ├── models/        # Domain models
│   │   ├── router/        # Route setup
│   │   └── service/       # Business logic
│   ├── Dockerfile         # Production container
│   ├── Makefile          # Build commands
│   └── go.mod            # Go dependencies
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API client
│   │   └── App.tsx       # Main application
│   ├── public/           # Static assets
│   ├── Dockerfile        # Production container
│   ├── Dockerfile.dev    # Development container
│   └── package.json      # Node dependencies
├── docker-compose.yml     # Production orchestration
├── docker-compose.dev.yml # Development orchestration
└── README.md             # This file
```

## 🤝 Contributing

1. **Code Style**: Follow Go and TypeScript best practices
2. **Testing**: Add tests for new functionality
3. **Documentation**: Update README for significant changes
4. **Commits**: Use clear, descriptive commit messages

## 📝 License

This project is created for demonstration purposes. Feel free to use and modify as needed.

---

**Built with ❤️ using Go, React, and AI**
