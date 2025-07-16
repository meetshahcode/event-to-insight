package handlers

import (
	"bytes"
	"encoding/json"
	"event-to-insight/internal/ai"
	"event-to-insight/internal/database"
	"event-to-insight/internal/models"
	"event-to-insight/internal/service"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestHandler(t *testing.T) (*SearchHandler, func()) {
	// Create temporary database
	dbPath := "test_handler.db"
	db, err := database.NewSQLiteDB(dbPath)
	require.NoError(t, err)

	err = db.Initialize()
	require.NoError(t, err)

	// Use mock AI service
	aiService := ai.NewMockAIService()

	// Create services and handler
	searchService := service.NewSearchService(db, aiService)
	handler := NewSearchHandler(searchService)

	cleanup := func() {
		db.Close()
		os.Remove(dbPath)
	}

	return handler, cleanup
}

func TestSearchHandler_SearchQuery(t *testing.T) {
	handler, cleanup := setupTestHandler(t)
	defer cleanup()

	t.Run("ValidSearchRequest", func(t *testing.T) {
		requestBody := models.SearchRequest{
			Query: "How do I reset my password?",
		}

		body, err := json.Marshal(requestBody)
		require.NoError(t, err)

		req := httptest.NewRequest("POST", "/search-query", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.SearchQuery(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response models.SearchResponse
		err = json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, requestBody.Query, response.Query)
		assert.NotEmpty(t, response.AISummaryAnswer)
	})

	t.Run("EmptyQuery", func(t *testing.T) {
		requestBody := models.SearchRequest{
			Query: "",
		}

		body, err := json.Marshal(requestBody)
		require.NoError(t, err)

		req := httptest.NewRequest("POST", "/search-query", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.SearchQuery(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("InvalidJSON", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/search-query", bytes.NewReader([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.SearchQuery(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestSearchHandler_GetAllArticles(t *testing.T) {
	handler, cleanup := setupTestHandler(t)
	defer cleanup()

	req := httptest.NewRequest("GET", "/articles", nil)
	w := httptest.NewRecorder()

	handler.GetAllArticles(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var articles []models.Article
	err := json.Unmarshal(w.Body.Bytes(), &articles)
	assert.NoError(t, err)
	assert.Greater(t, len(articles), 0)
}

func TestSearchHandler_HealthCheck(t *testing.T) {
	handler, cleanup := setupTestHandler(t)
	defer cleanup()

	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	handler.HealthCheck(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "healthy", response["status"])
}
