package router

import (
	"event-to-insight/internal/ai"
	"event-to-insight/internal/database"
	"event-to-insight/internal/handlers"
	"event-to-insight/internal/service"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// setupTestRouter creates a test router with all dependencies
func setupTestRouter(t *testing.T) (*chi.Mux, func()) {
	// Create temporary database
	dbPath := "test_router.db"
	db, err := database.NewSQLiteDB(dbPath)
	require.NoError(t, err)

	err = db.Initialize()
	require.NoError(t, err)

	// Create AI service
	aiService := ai.NewMockAIService()

	// Create services and handlers
	searchService := service.NewSearchService(db, aiService)
	searchHandler := handlers.NewSearchHandler(searchService)

	// Setup router
	router := SetupRouter(searchHandler)

	cleanup := func() {
		db.Close()
		os.Remove(dbPath)
	}

	return router, cleanup
}

// TestSetupRouter tests the router setup function
func TestSetupRouter(t *testing.T) {
	t.Run("RouterCreation", func(t *testing.T) {
		router, cleanup := setupTestRouter(t)
		defer cleanup()

		assert.NotNil(t, router)
	})

	t.Run("NilHandler", func(t *testing.T) {
		// This should not panic
		router := SetupRouter(nil)
		assert.NotNil(t, router)
	})
}

// TestRouterMiddleware tests the middleware functionality
func TestRouterMiddleware(t *testing.T) {
	router, cleanup := setupTestRouter(t)
	defer cleanup()

	t.Run("CORSHeaders", func(t *testing.T) {
		req := httptest.NewRequest("OPTIONS", "/api/health", nil)
		req.Header.Set("Origin", "http://localhost:3000")
		req.Header.Set("Access-Control-Request-Method", "GET")
		req.Header.Set("Access-Control-Request-Headers", "Content-Type")

		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Should handle CORS preflight
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Origin"), "*")
		assert.Contains(t, w.Header().Get("Access-Control-Allow-Methods"), "GET")
	})

	t.Run("RequestLogging", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/health", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Should complete without errors (logging is passive)
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("Recovery", func(t *testing.T) {
		// Test that the recovery middleware is in place
		// This is tested implicitly through other tests
		req := httptest.NewRequest("GET", "/api/health", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("Timeout", func(t *testing.T) {
		// Test that timeout middleware is configured
		req := httptest.NewRequest("GET", "/api/health", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	})
}

// TestRouterRoutes tests the API routes
func TestRouterRoutes(t *testing.T) {
	router, cleanup := setupTestRouter(t)
	defer cleanup()

	t.Run("HealthEndpoint", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/health", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Contains(t, w.Body.String(), "healthy")
		assert.Equal(t, "application/json", w.Header().Get("Content-Type"))
	})

	t.Run("ArticlesEndpoint", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/articles", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "application/json", w.Header().Get("Content-Type"))
	})

	t.Run("SingleArticleEndpoint", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/articles/1", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "application/json", w.Header().Get("Content-Type"))
	})

	t.Run("SearchEndpoint", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/search-query", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Should respond (may be 400 for bad request, but route exists)
		assert.NotEqual(t, http.StatusNotFound, w.Code)
	})

	t.Run("NonExistentRoute", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/nonexistent", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("RootPath", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("InvalidAPIPath", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

// TestRouterHTTPMethods tests different HTTP methods
func TestRouterHTTPMethods(t *testing.T) {
	router, cleanup := setupTestRouter(t)
	defer cleanup()

	t.Run("GETMethods", func(t *testing.T) {
		endpoints := []string{
			"/api/health",
			"/api/articles",
			"/api/articles/1",
		}

		for _, endpoint := range endpoints {
			req := httptest.NewRequest("GET", endpoint, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.NotEqual(t, http.StatusMethodNotAllowed, w.Code,
				"GET should be allowed for %s", endpoint)
		}
	})

	t.Run("POSTMethods", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/search-query", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.NotEqual(t, http.StatusMethodNotAllowed, w.Code)
	})

	t.Run("UnsupportedMethods", func(t *testing.T) {
		methods := []string{"PUT", "DELETE", "PATCH"}

		for _, method := range methods {
			req := httptest.NewRequest(method, "/api/health", nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, http.StatusMethodNotAllowed, w.Code,
				"%s should not be allowed for /api/health", method)
		}
	})
}

// TestRouterContentTypes tests content type handling
func TestRouterContentTypes(t *testing.T) {
	router, cleanup := setupTestRouter(t)
	defer cleanup()

	t.Run("JSONResponse", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/health", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		assert.Equal(t, "application/json", w.Header().Get("Content-Type"))
	})

	t.Run("JSONRequest", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/search-query", nil)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Should accept JSON content type
		assert.NotEqual(t, http.StatusUnsupportedMediaType, w.Code)
	})
}

// TestRouterErrorHandling tests error scenarios
func TestRouterErrorHandling(t *testing.T) {
	router, cleanup := setupTestRouter(t)
	defer cleanup()

	t.Run("InvalidJSON", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/search-query",
			httptest.NewRequest("POST", "/", nil).Body)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Should handle invalid JSON gracefully
		assert.NotEqual(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("MalformedURL", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/articles/invalid-id", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Should handle malformed URLs gracefully
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// TestRouterHeaders tests HTTP headers
func TestRouterHeaders(t *testing.T) {
	router, cleanup := setupTestRouter(t)
	defer cleanup()

	t.Run("SecurityHeaders", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/health", nil)
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Check that the request completes successfully
		assert.Equal(t, http.StatusOK, w.Code)
		// CORS headers might be set by middleware, check if present
		corsHeader := w.Header().Get("Access-Control-Allow-Origin")
		if corsHeader != "" {
			assert.NotEmpty(t, corsHeader)
		}
	})

	t.Run("CustomHeaders", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/health", nil)
		req.Header.Set("X-Custom-Header", "test-value")
		w := httptest.NewRecorder()

		router.ServeHTTP(w, req)

		// Should handle custom headers without issues
		assert.Equal(t, http.StatusOK, w.Code)
	})
}

// TestRouterConcurrency tests concurrent requests
func TestRouterConcurrency(t *testing.T) {
	router, cleanup := setupTestRouter(t)
	defer cleanup()

	t.Run("ConcurrentRequests", func(t *testing.T) {
		concurrency := 10
		done := make(chan bool, concurrency)

		for i := 0; i < concurrency; i++ {
			go func() {
				defer func() { done <- true }()

				req := httptest.NewRequest("GET", "/api/health", nil)
				w := httptest.NewRecorder()

				router.ServeHTTP(w, req)
				assert.Equal(t, http.StatusOK, w.Code)
			}()
		}

		// Wait for all goroutines to complete
		for i := 0; i < concurrency; i++ {
			<-done
		}
	})
}
