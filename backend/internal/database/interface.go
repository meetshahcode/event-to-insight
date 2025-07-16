package database

import (
	"event-to-insight/internal/models"
)

// DatabaseInterface defines the contract for database operations
type DatabaseInterface interface {
	// Article operations
	GetAllArticles() ([]models.Article, error)
	GetArticleByID(id int) (*models.Article, error)
	GetArticlesByIDs(ids []int) ([]models.Article, error)

	// Query operations
	CreateQuery(query string) (*models.Query, error)
	GetQueryByID(id int) (*models.Query, error)

	// Search result operations
	CreateSearchResult(queryID int, summary string, relevantArticleIDs []int) (*models.SearchResult, error)
	GetSearchResultByQueryID(queryID int) (*models.SearchResult, error)

	// Database management
	Initialize() error
	Close() error
}
