package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"event-to-insight/internal/ai"
	"event-to-insight/internal/database"
	"event-to-insight/internal/models"
	"event-to-insight/internal/service"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
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

func TestSearchHandler_GetArticle(t *testing.T) {
	handler, cleanup := setupTestHandler(t)
	defer cleanup()

	t.Run("ValidArticleID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/articles/1", nil)
		// Set URL parameter manually for chi router
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "1")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		w := httptest.NewRecorder()

		handler.GetArticle(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var article models.Article
		err := json.Unmarshal(w.Body.Bytes(), &article)
		assert.NoError(t, err)
		assert.Equal(t, 1, article.ID)
	})

	t.Run("InvalidArticleID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/articles/invalid", nil)
		// Set URL parameter manually for chi router
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "invalid")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		w := httptest.NewRecorder()

		handler.GetArticle(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("NonExistentArticleID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/articles/999", nil)
		// Set URL parameter manually for chi router
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "999")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		w := httptest.NewRecorder()

		handler.GetArticle(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})

	t.Run("NegativeArticleID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/articles/-1", nil)
		// Set URL parameter manually for chi router
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "-1")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		w := httptest.NewRecorder()

		handler.GetArticle(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)
	})
}

func TestSearchHandler_ErrorResponses(t *testing.T) {
	handler, cleanup := setupTestHandler(t)
	defer cleanup()

	t.Run("SendJSONResponse", func(t *testing.T) {
		w := httptest.NewRecorder()

		data := map[string]string{"test": "value"}
		handler.sendJSONResponse(w, http.StatusOK, data)

		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "application/json", w.Header().Get("Content-Type"))

		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "value", response["test"])
	})

	t.Run("SendErrorResponse", func(t *testing.T) {
		w := httptest.NewRecorder()

		handler.sendErrorResponse(w, http.StatusBadRequest, "Test Error", "Test Message")

		assert.Equal(t, http.StatusBadRequest, w.Code)
		assert.Equal(t, "application/json", w.Header().Get("Content-Type"))

		var response models.ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "Test Error", response.Error)
		assert.Equal(t, "Test Message", response.Message)
	})
}

func TestSearchHandler_EdgeCases(t *testing.T) {
	handler, cleanup := setupTestHandler(t)
	defer cleanup()

	t.Run("LargeQuery", func(t *testing.T) {
		largeQuery := strings.Repeat("test ", 1000) // Very long query
		requestBody := models.SearchRequest{
			Query: largeQuery,
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
		assert.Equal(t, largeQuery, response.Query)
	})

	t.Run("QueryWithSpecialCharacters", func(t *testing.T) {
		specialQuery := "How do I reset my password? It's not working! @#$%^&*()"
		requestBody := models.SearchRequest{
			Query: specialQuery,
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
		assert.Equal(t, specialQuery, response.Query)
	})

	t.Run("UnicodeQuery", func(t *testing.T) {
		unicodeQuery := "Comment réinitialiser mon mot de passe? 密码重置问题"
		requestBody := models.SearchRequest{
			Query: unicodeQuery,
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
		assert.Equal(t, unicodeQuery, response.Query)
	})

	t.Run("WhitespaceOnlyQuery", func(t *testing.T) {
		requestBody := models.SearchRequest{
			Query: "   \t\n   ",
		}

		body, err := json.Marshal(requestBody)
		require.NoError(t, err)

		req := httptest.NewRequest("POST", "/search-query", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.SearchQuery(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}
