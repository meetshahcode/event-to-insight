package handlers

import (
	"encoding/json"
	"event-to-insight/internal/models"
	"event-to-insight/internal/service"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
)

// SearchHandler handles search-related HTTP requests
type SearchHandler struct {
	searchService *service.SearchService
}

// NewSearchHandler creates a new search handler
func NewSearchHandler(searchService *service.SearchService) *SearchHandler {
	return &SearchHandler{
		searchService: searchService,
	}
}

// SearchQuery handles POST /search-query
func (h *SearchHandler) SearchQuery(w http.ResponseWriter, r *http.Request) {
	var req models.SearchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid JSON", err.Error())
		return
	}

	// Validate request
	if strings.TrimSpace(req.Query) == "" {
		h.sendErrorResponse(w, http.StatusBadRequest, "Query is required", "")
		return
	}

	// Process search query
	response, err := h.searchService.ProcessSearchQuery(req.Query)
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to process search query", err.Error())
		return
	}

	h.sendJSONResponse(w, http.StatusOK, response)
}

// GetArticle handles GET /articles/{id}
func (h *SearchHandler) GetArticle(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		h.sendErrorResponse(w, http.StatusBadRequest, "Invalid article ID", "")
		return
	}

	article, err := h.searchService.GetArticleByID(id)
	if err != nil {
		h.sendErrorResponse(w, http.StatusNotFound, "Article not found", "")
		return
	}

	h.sendJSONResponse(w, http.StatusOK, article)
}

// GetAllArticles handles GET /articles
func (h *SearchHandler) GetAllArticles(w http.ResponseWriter, r *http.Request) {
	articles, err := h.searchService.GetAllArticles()
	if err != nil {
		h.sendErrorResponse(w, http.StatusInternalServerError, "Failed to get articles", err.Error())
		return
	}

	h.sendJSONResponse(w, http.StatusOK, articles)
}

// HealthCheck handles GET /health
func (h *SearchHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	response := map[string]string{
		"status":  "healthy",
		"service": "event-to-insight-backend",
	}
	h.sendJSONResponse(w, http.StatusOK, response)
}

// sendJSONResponse sends a JSON response
func (h *SearchHandler) sendJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(data)
}

// sendErrorResponse sends an error response
func (h *SearchHandler) sendErrorResponse(w http.ResponseWriter, statusCode int, error string, message string) {
	response := models.ErrorResponse{
		Error:   error,
		Message: message,
	}
	h.sendJSONResponse(w, statusCode, response)
}
