package service

import (
	"errors"
	"event-to-insight/internal/ai"
	"event-to-insight/internal/models"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// SimpleMockDatabase is a simple mock implementation for testing
type SimpleMockDatabase struct {
	articles           []models.Article
	queries            map[int]*models.Query
	searchResults      map[int]*models.SearchResult
	shouldReturnError  bool
	errorMessage       string
	nextQueryID        int
	nextSearchResultID int
}

func NewSimpleMockDatabase() *SimpleMockDatabase {
	return &SimpleMockDatabase{
		articles: []models.Article{
			{ID: 1, Title: "Password Reset", Content: "Instructions for password reset"},
			{ID: 2, Title: "VPN Setup", Content: "VPN configuration guide"},
			{ID: 3, Title: "Email Configuration", Content: "Email setup instructions"},
		},
		queries:            make(map[int]*models.Query),
		searchResults:      make(map[int]*models.SearchResult),
		nextQueryID:        1,
		nextSearchResultID: 1,
	}
}

func (m *SimpleMockDatabase) SetError(shouldError bool, message string) {
	m.shouldReturnError = shouldError
	m.errorMessage = message
}

func (m *SimpleMockDatabase) GetAllArticles() ([]models.Article, error) {
	if m.shouldReturnError {
		return nil, errors.New(m.errorMessage)
	}
	return m.articles, nil
}

func (m *SimpleMockDatabase) GetArticleByID(id int) (*models.Article, error) {
	if m.shouldReturnError {
		return nil, errors.New(m.errorMessage)
	}
	for _, article := range m.articles {
		if article.ID == id {
			return &article, nil
		}
	}
	return nil, errors.New("article not found")
}

func (m *SimpleMockDatabase) GetArticlesByIDs(ids []int) ([]models.Article, error) {
	if m.shouldReturnError {
		return nil, errors.New(m.errorMessage)
	}
	var result []models.Article
	for _, id := range ids {
		for _, article := range m.articles {
			if article.ID == id {
				result = append(result, article)
				break
			}
		}
	}
	return result, nil
}

func (m *SimpleMockDatabase) CreateQuery(query string) (*models.Query, error) {
	if m.shouldReturnError {
		return nil, errors.New(m.errorMessage)
	}

	q := &models.Query{
		ID:        m.nextQueryID,
		Query:     query,
		CreatedAt: time.Now(),
	}

	m.queries[m.nextQueryID] = q
	m.nextQueryID++

	return q, nil
}

func (m *SimpleMockDatabase) GetQueryByID(id int) (*models.Query, error) {
	if m.shouldReturnError {
		return nil, errors.New(m.errorMessage)
	}

	if query, exists := m.queries[id]; exists {
		return query, nil
	}
	return nil, errors.New("query not found")
}

func (m *SimpleMockDatabase) CreateSearchResult(queryID int, summary string, relevantArticleIDs []int) (*models.SearchResult, error) {
	if m.shouldReturnError {
		return nil, errors.New(m.errorMessage)
	}

	result := &models.SearchResult{
		ID:                 m.nextSearchResultID,
		QueryID:            queryID,
		AISummaryAnswer:    summary,
		AIRelevantArticles: relevantArticleIDs,
		CreatedAt:          time.Now(),
	}

	m.searchResults[m.nextSearchResultID] = result
	m.nextSearchResultID++

	return result, nil
}

func (m *SimpleMockDatabase) GetSearchResultByQueryID(queryID int) (*models.SearchResult, error) {
	if m.shouldReturnError {
		return nil, errors.New(m.errorMessage)
	}

	for _, result := range m.searchResults {
		if result.QueryID == queryID {
			return result, nil
		}
	}
	return nil, errors.New("search result not found")
}

func (m *SimpleMockDatabase) Initialize() error {
	if m.shouldReturnError {
		return errors.New(m.errorMessage)
	}
	return nil
}

func (m *SimpleMockDatabase) Close() error {
	if m.shouldReturnError {
		return errors.New(m.errorMessage)
	}
	return nil
}

// TestSearchService tests the SearchService functionality
func TestSearchService(t *testing.T) {
	t.Run("NewSearchService", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()

		service := NewSearchService(mockDB, mockAI)

		assert.NotNil(t, service)
		assert.Equal(t, mockDB, service.db)
		assert.Equal(t, mockAI, service.aiService)
	})
}

// TestProcessSearchQuery tests the ProcessSearchQuery method
func TestProcessSearchQuery(t *testing.T) {
	t.Run("SuccessfulPasswordSearch", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		queryText := "How do I reset my password?"

		response, err := service.ProcessSearchQuery(queryText)

		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.Equal(t, queryText, response.Query)
		assert.Contains(t, response.AISummaryAnswer, "password")
		assert.NotEmpty(t, response.AIRelevantArticles)
		assert.Greater(t, response.QueryID, 0)
	})

	t.Run("SuccessfulVPNSearch", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		queryText := "VPN connection issues"

		response, err := service.ProcessSearchQuery(queryText)

		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.Equal(t, queryText, response.Query)
		assert.Contains(t, response.AISummaryAnswer, "VPN")
		assert.NotEmpty(t, response.AIRelevantArticles)
	})

	t.Run("UnrelatedQuery", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		queryText := "random unrelated question"

		response, err := service.ProcessSearchQuery(queryText)

		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.Equal(t, queryText, response.Query)
		assert.NotEmpty(t, response.AISummaryAnswer)
		// Relevant articles might be empty for unrelated queries
	})

	t.Run("DatabaseErrorOnCreateQuery", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockDB.SetError(true, "database connection failed")
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		queryText := "Test query"

		response, err := service.ProcessSearchQuery(queryText)

		assert.Error(t, err)
		assert.Nil(t, response)
		assert.Contains(t, err.Error(), "failed to create query")
	})

	t.Run("EmptyQuery", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		response, err := service.ProcessSearchQuery("")

		assert.NoError(t, err) // Service doesn't validate empty queries, that's handler's job
		assert.NotNil(t, response)
		assert.Equal(t, "", response.Query)
	})

	t.Run("LongQuery", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		longQuery := "This is a very long query with many words about password reset and VPN configuration and email setup and various other technical topics that might be found in our knowledge base"

		response, err := service.ProcessSearchQuery(longQuery)

		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.Equal(t, longQuery, response.Query)
		assert.NotEmpty(t, response.AISummaryAnswer)
	})
}

// TestGetArticleByID tests the GetArticleByID method
func TestGetArticleByID(t *testing.T) {
	t.Run("SuccessfulRetrieval", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		article, err := service.GetArticleByID(1)

		assert.NoError(t, err)
		assert.NotNil(t, article)
		assert.Equal(t, 1, article.ID)
		assert.Equal(t, "Password Reset", article.Title)
	})

	t.Run("ArticleNotFound", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		article, err := service.GetArticleByID(999)

		assert.Error(t, err)
		assert.Nil(t, article)
		assert.Contains(t, err.Error(), "article not found")
	})

	t.Run("DatabaseError", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockDB.SetError(true, "database connection failed")
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		article, err := service.GetArticleByID(1)

		assert.Error(t, err)
		assert.Nil(t, article)
		assert.Contains(t, err.Error(), "database connection failed")
	})

	t.Run("NegativeID", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		article, err := service.GetArticleByID(-1)

		assert.Error(t, err)
		assert.Nil(t, article)
	})

	t.Run("ZeroID", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		article, err := service.GetArticleByID(0)

		assert.Error(t, err)
		assert.Nil(t, article)
	})
}

// TestGetAllArticles tests the GetAllArticles method
func TestGetAllArticles(t *testing.T) {
	t.Run("SuccessfulRetrieval", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		articles, err := service.GetAllArticles()

		assert.NoError(t, err)
		assert.NotNil(t, articles)
		assert.Len(t, articles, 3)
		assert.Equal(t, "Password Reset", articles[0].Title)
		assert.Equal(t, "VPN Setup", articles[1].Title)
		assert.Equal(t, "Email Configuration", articles[2].Title)
	})

	t.Run("DatabaseError", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockDB.SetError(true, "database connection failed")
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		articles, err := service.GetAllArticles()

		assert.Error(t, err)
		assert.Nil(t, articles)
		assert.Contains(t, err.Error(), "database connection failed")
	})

	t.Run("EmptyDatabase", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockDB.articles = []models.Article{} // Empty articles
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		articles, err := service.GetAllArticles()

		assert.NoError(t, err)
		assert.Empty(t, articles)
	})
}

// TestServiceErrorHandling tests error handling in various scenarios
func TestServiceErrorHandling(t *testing.T) {
	t.Run("DatabaseConnectionLoss", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		// Start normal operation
		response, err := service.ProcessSearchQuery("test query")
		assert.NoError(t, err)
		assert.NotNil(t, response)

		// Simulate database connection loss
		mockDB.SetError(true, "connection lost")

		// Operations should now fail gracefully
		response, err = service.ProcessSearchQuery("another query")
		assert.Error(t, err)
		assert.Nil(t, response)

		articles, err := service.GetAllArticles()
		assert.Error(t, err)
		assert.Nil(t, articles)

		article, err := service.GetArticleByID(1)
		assert.Error(t, err)
		assert.Nil(t, article)
	})
}

// TestServiceWithNilInputs tests service behavior with nil inputs
func TestServiceWithNilInputs(t *testing.T) {
	t.Run("NilDatabase", func(t *testing.T) {
		mockAI := ai.NewMockAIService()

		// This should not panic
		service := NewSearchService(nil, mockAI)
		assert.NotNil(t, service)
		assert.Nil(t, service.db)
	})

	t.Run("NilAIService", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()

		// This should not panic
		service := NewSearchService(mockDB, nil)
		assert.NotNil(t, service)
		assert.Nil(t, service.aiService)
	})

	t.Run("BothNil", func(t *testing.T) {
		// This should not panic
		service := NewSearchService(nil, nil)
		assert.NotNil(t, service)
		assert.Nil(t, service.db)
		assert.Nil(t, service.aiService)
	})
}

// TestProcessSearchQueryErrorScenarios tests various error scenarios during search processing
func TestProcessSearchQueryErrorScenarios(t *testing.T) {
	t.Run("GetAllArticlesError", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		// Create query successfully but fail on get articles
		mockDB.SetError(false, "")
		_, err := service.ProcessSearchQuery("test") // This should create the query
		assert.NoError(t, err)

		// Now make GetAllArticles fail
		mockDB.SetError(true, "failed to get articles")

		response, err := service.ProcessSearchQuery("test query")
		assert.Error(t, err)
		assert.Nil(t, response)
		assert.Contains(t, err.Error(), "failed to get articles")
	})

	t.Run("CreateSearchResultError", func(t *testing.T) {
		// Create a custom mock that fails only on CreateSearchResult
		customMockDB := &FailingCreateSearchResultDB{
			SimpleMockDatabase: NewSimpleMockDatabase(),
		}
		mockAI := ai.NewMockAIService()
		service := NewSearchService(customMockDB, mockAI)

		response, err := service.ProcessSearchQuery("test query")
		assert.Error(t, err)
		assert.Nil(t, response)
		assert.Contains(t, err.Error(), "failed to save search result")
	})

	t.Run("GetArticlesByIDsError", func(t *testing.T) {
		// Create a custom mock that fails only on GetArticlesByIDs
		customMockDB := &FailingGetArticlesByIDsDB{
			SimpleMockDatabase: NewSimpleMockDatabase(),
		}
		mockAI := ai.NewMockAIService()
		service := NewSearchService(customMockDB, mockAI)

		response, err := service.ProcessSearchQuery("password")
		assert.Error(t, err)
		assert.Nil(t, response)
		assert.Contains(t, err.Error(), "failed to get relevant articles")
	})
}

// TestServiceWithSpecialQueries tests the service with various special query types
func TestServiceWithSpecialQueries(t *testing.T) {
	t.Run("UnicodeQuery", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		unicodeQuery := "Comment réinitialiser mon mot de passe? 密码重置问题"
		response, err := service.ProcessSearchQuery(unicodeQuery)

		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.Equal(t, unicodeQuery, response.Query)
	})

	t.Run("QueryWithSpecialCharacters", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		specialQuery := "How do I reset my password? It's not working! @#$%^&*()"
		response, err := service.ProcessSearchQuery(specialQuery)

		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.Equal(t, specialQuery, response.Query)
	})

	t.Run("QueryWithNewlines", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		multilineQuery := "How do I reset my password?\nIt's not working.\nPlease help."
		response, err := service.ProcessSearchQuery(multilineQuery)

		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.Equal(t, multilineQuery, response.Query)
	})

	t.Run("VeryLongQuery", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		// Create a very long query (more than 1000 characters)
		longQuery := "This is a very long query that contains many repeated words about password reset and VPN configuration and email setup and various other technical topics that might be found in our knowledge base. " +
			"The query should be handled properly even when it's extremely long and contains lots of redundant information that might be typical of user queries when they're frustrated and provide too much detail. " +
			"This type of query tests the robustness of our system in handling edge cases where users provide excessive amounts of text in their search queries."

		response, err := service.ProcessSearchQuery(longQuery)

		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.Equal(t, longQuery, response.Query)
		assert.NotEmpty(t, response.AISummaryAnswer)
	})
}

// Helper structs for testing specific error scenarios
type FailingCreateSearchResultDB struct {
	*SimpleMockDatabase
}

func (f *FailingCreateSearchResultDB) CreateSearchResult(queryID int, summary string, relevantArticleIDs []int) (*models.SearchResult, error) {
	return nil, errors.New("failed to create search result")
}

type FailingGetArticlesByIDsDB struct {
	*SimpleMockDatabase
}

func (f *FailingGetArticlesByIDsDB) GetArticlesByIDs(ids []int) ([]models.Article, error) {
	return nil, errors.New("failed to get articles by IDs")
}

// TestServiceMetrics tests that the service maintains proper metrics and logging
func TestServiceMetrics(t *testing.T) {
	t.Run("ResponseTimestamp", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		before := time.Now()
		response, err := service.ProcessSearchQuery("test query")
		after := time.Now()

		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.True(t, response.Timestamp.After(before) || response.Timestamp.Equal(before))
		assert.True(t, response.Timestamp.Before(after) || response.Timestamp.Equal(after))
	})

	t.Run("QueryIDGeneration", func(t *testing.T) {
		mockDB := NewSimpleMockDatabase()
		mockAI := ai.NewMockAIService()
		service := NewSearchService(mockDB, mockAI)

		// Process multiple queries and ensure each gets a unique ID
		queryIDs := make(map[int]bool)

		for i := 0; i < 5; i++ {
			response, err := service.ProcessSearchQuery("test query " + string(rune(i+'0')))
			assert.NoError(t, err)
			assert.NotNil(t, response)
			assert.Greater(t, response.QueryID, 0)

			// Ensure ID is unique
			assert.False(t, queryIDs[response.QueryID], "Query ID %d was used more than once", response.QueryID)
			queryIDs[response.QueryID] = true
		}
	})
}
