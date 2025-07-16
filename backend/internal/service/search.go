package service

import (
	"event-to-insight/internal/ai"
	"event-to-insight/internal/database"
	"event-to-insight/internal/models"
	"fmt"
)

// SearchService handles search operations
type SearchService struct {
	db        database.DatabaseInterface
	aiService ai.AIServiceInterface
}

// NewSearchService creates a new search service
func NewSearchService(db database.DatabaseInterface, aiService ai.AIServiceInterface) *SearchService {
	return &SearchService{
		db:        db,
		aiService: aiService,
	}
}

// ProcessSearchQuery processes a search query and returns results
func (s *SearchService) ProcessSearchQuery(queryText string) (*models.SearchResponse, error) {
	// Create query record
	query, err := s.db.CreateQuery(queryText)
	if err != nil {
		return nil, fmt.Errorf("failed to create query: %w", err)
	}

	// Get all articles for AI analysis
	articles, err := s.db.GetAllArticles()
	if err != nil {
		return nil, fmt.Errorf("failed to get articles: %w", err)
	}

	// Analyze query with AI
	aiResult, err := s.aiService.AnalyzeQuery(queryText, articles)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze query: %w", err)
	}

	// Save search result
	_, err = s.db.CreateSearchResult(query.ID, aiResult.Summary, aiResult.RelevantArticles)
	if err != nil {
		return nil, fmt.Errorf("failed to save search result: %w", err)
	}

	// Get relevant articles details
	relevantArticles, err := s.db.GetArticlesByIDs(aiResult.RelevantArticles)
	if err != nil {
		return nil, fmt.Errorf("failed to get relevant articles: %w", err)
	}

	// Build response
	response := &models.SearchResponse{
		Query:              queryText,
		AISummaryAnswer:    aiResult.Summary,
		AIRelevantArticles: relevantArticles,
		QueryID:            query.ID,
		Timestamp:          query.CreatedAt,
	}

	return response, nil
}

// GetArticleByID retrieves a specific article
func (s *SearchService) GetArticleByID(id int) (*models.Article, error) {
	return s.db.GetArticleByID(id)
}

// GetAllArticles retrieves all articles
func (s *SearchService) GetAllArticles() ([]models.Article, error) {
	return s.db.GetAllArticles()
}
