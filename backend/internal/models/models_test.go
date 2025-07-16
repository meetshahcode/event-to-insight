package models

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// TestArticleModel tests the Article model structure and behavior
func TestArticleModel(t *testing.T) {
	t.Run("ArticleCreation", func(t *testing.T) {
		article := Article{
			ID:      1,
			Title:   "Test Article",
			Content: "This is test content for the article",
		}

		assert.Equal(t, 1, article.ID)
		assert.Equal(t, "Test Article", article.Title)
		assert.Equal(t, "This is test content for the article", article.Content)
	})

	t.Run("ArticleJSONSerialization", func(t *testing.T) {
		article := Article{
			ID:      42,
			Title:   "JSON Test Article",
			Content: "Content with special characters: !@#$%^&*()",
		}

		// Test JSON marshaling
		jsonData, err := json.Marshal(article)
		assert.NoError(t, err)
		assert.Contains(t, string(jsonData), `"id":42`)
		assert.Contains(t, string(jsonData), `"title":"JSON Test Article"`)

		// Test JSON unmarshaling
		var unmarshaledArticle Article
		err = json.Unmarshal(jsonData, &unmarshaledArticle)
		assert.NoError(t, err)
		assert.Equal(t, article.ID, unmarshaledArticle.ID)
		assert.Equal(t, article.Title, unmarshaledArticle.Title)
		assert.Equal(t, article.Content, unmarshaledArticle.Content)
	})

	t.Run("ArticleWithEmptyFields", func(t *testing.T) {
		article := Article{
			ID:      0,
			Title:   "",
			Content: "",
		}

		assert.Equal(t, 0, article.ID)
		assert.Equal(t, "", article.Title)
		assert.Equal(t, "", article.Content)
	})

	t.Run("ArticleWithLongContent", func(t *testing.T) {
		longContent := make([]byte, 10000)
		for i := range longContent {
			longContent[i] = 'A'
		}

		article := Article{
			ID:      1,
			Title:   "Long Content Article",
			Content: string(longContent),
		}

		assert.Equal(t, 10000, len(article.Content))
		assert.Contains(t, article.Content, "AAAA")
	})
}

// TestQueryModel tests the Query model structure and behavior
func TestQueryModel(t *testing.T) {
	t.Run("QueryCreation", func(t *testing.T) {
		now := time.Now()
		query := Query{
			ID:        1,
			Query:     "Test search query",
			CreatedAt: now,
		}

		assert.Equal(t, 1, query.ID)
		assert.Equal(t, "Test search query", query.Query)
		assert.Equal(t, now, query.CreatedAt)
	})

	t.Run("QueryJSONSerialization", func(t *testing.T) {
		now := time.Now()
		query := Query{
			ID:        123,
			Query:     "JSON serialization test",
			CreatedAt: now,
		}

		// Test JSON marshaling
		jsonData, err := json.Marshal(query)
		assert.NoError(t, err)
		assert.Contains(t, string(jsonData), `"id":123`)
		assert.Contains(t, string(jsonData), `"query":"JSON serialization test"`)

		// Test JSON unmarshaling
		var unmarshaledQuery Query
		err = json.Unmarshal(jsonData, &unmarshaledQuery)
		assert.NoError(t, err)
		assert.Equal(t, query.ID, unmarshaledQuery.ID)
		assert.Equal(t, query.Query, unmarshaledQuery.Query)
		// Note: Time precision might be lost in JSON, so we check if it's close
		assert.WithinDuration(t, query.CreatedAt, unmarshaledQuery.CreatedAt, time.Second)
	})

	t.Run("QueryWithSpecialCharacters", func(t *testing.T) {
		specialQuery := "How do I reset my password? It's not working! @#$%^&*()"
		query := Query{
			ID:        1,
			Query:     specialQuery,
			CreatedAt: time.Now(),
		}

		assert.Equal(t, specialQuery, query.Query)

		// Test JSON handling of special characters
		jsonData, err := json.Marshal(query)
		assert.NoError(t, err)

		var unmarshaledQuery Query
		err = json.Unmarshal(jsonData, &unmarshaledQuery)
		assert.NoError(t, err)
		assert.Equal(t, specialQuery, unmarshaledQuery.Query)
	})
}

// TestSearchResultModel tests the SearchResult model structure and behavior
func TestSearchResultModel(t *testing.T) {
	t.Run("SearchResultCreation", func(t *testing.T) {
		now := time.Now()
		relevantArticles := []int{1, 2, 3}

		result := SearchResult{
			ID:                 1,
			QueryID:            42,
			AISummaryAnswer:    "AI generated summary",
			AIRelevantArticles: relevantArticles,
			CreatedAt:          now,
		}

		assert.Equal(t, 1, result.ID)
		assert.Equal(t, 42, result.QueryID)
		assert.Equal(t, "AI generated summary", result.AISummaryAnswer)
		assert.Equal(t, relevantArticles, result.AIRelevantArticles)
		assert.Equal(t, now, result.CreatedAt)
	})

	t.Run("SearchResultJSONSerialization", func(t *testing.T) {
		now := time.Now()
		relevantArticles := []int{1, 2, 3}

		result := SearchResult{
			ID:                 1,
			QueryID:            42,
			AISummaryAnswer:    "AI summary with special chars: !@#$%",
			AIRelevantArticles: relevantArticles,
			CreatedAt:          now,
		}

		// Test JSON marshaling
		jsonData, err := json.Marshal(result)
		assert.NoError(t, err)
		assert.Contains(t, string(jsonData), `"id":1`)
		assert.Contains(t, string(jsonData), `"query_id":42`)
		assert.Contains(t, string(jsonData), `"ai_relevant_articles":[1,2,3]`)

		// Test JSON unmarshaling
		var unmarshaledResult SearchResult
		err = json.Unmarshal(jsonData, &unmarshaledResult)
		assert.NoError(t, err)
		assert.Equal(t, result.ID, unmarshaledResult.ID)
		assert.Equal(t, result.QueryID, unmarshaledResult.QueryID)
		assert.Equal(t, result.AISummaryAnswer, unmarshaledResult.AISummaryAnswer)
		assert.Equal(t, result.AIRelevantArticles, unmarshaledResult.AIRelevantArticles)
	})

	t.Run("SearchResultWithEmptyRelevantArticles", func(t *testing.T) {
		result := SearchResult{
			ID:                 1,
			QueryID:            1,
			AISummaryAnswer:    "No relevant articles found",
			AIRelevantArticles: []int{},
			CreatedAt:          time.Now(),
		}

		assert.Empty(t, result.AIRelevantArticles)
		assert.Equal(t, "No relevant articles found", result.AISummaryAnswer)
	})

	t.Run("SearchResultWithNilRelevantArticles", func(t *testing.T) {
		result := SearchResult{
			ID:                 1,
			QueryID:            1,
			AISummaryAnswer:    "No relevant articles found",
			AIRelevantArticles: nil,
			CreatedAt:          time.Now(),
		}

		assert.Nil(t, result.AIRelevantArticles)

		// Test JSON handling of nil slice
		jsonData, err := json.Marshal(result)
		assert.NoError(t, err)
		assert.Contains(t, string(jsonData), `"ai_relevant_articles":null`)
	})

	t.Run("SearchResultWithLargeRelevantArticles", func(t *testing.T) {
		// Create a large slice of relevant articles
		largeSlice := make([]int, 1000)
		for i := 0; i < 1000; i++ {
			largeSlice[i] = i + 1
		}

		result := SearchResult{
			ID:                 1,
			QueryID:            1,
			AISummaryAnswer:    "Large result set",
			AIRelevantArticles: largeSlice,
			CreatedAt:          time.Now(),
		}

		assert.Len(t, result.AIRelevantArticles, 1000)
		assert.Equal(t, 1, result.AIRelevantArticles[0])
		assert.Equal(t, 1000, result.AIRelevantArticles[999])
	})
}

// TestSearchRequestModel tests the SearchRequest model structure and behavior
func TestSearchRequestModel(t *testing.T) {
	t.Run("SearchRequestCreation", func(t *testing.T) {
		request := SearchRequest{
			Query: "Test search query",
		}

		assert.Equal(t, "Test search query", request.Query)
	})

	t.Run("SearchRequestJSONSerialization", func(t *testing.T) {
		request := SearchRequest{
			Query: "JSON test query with special chars: !@#$%^&*()",
		}

		// Test JSON marshaling
		jsonData, err := json.Marshal(request)
		assert.NoError(t, err)
		// Note: JSON marshaling may escape special characters like & as \u0026
		assert.Contains(t, string(jsonData), `"query":"JSON test query with special chars:`)
		assert.Contains(t, string(jsonData), "!@#$%^")

		// Test JSON unmarshaling
		var unmarshaledRequest SearchRequest
		err = json.Unmarshal(jsonData, &unmarshaledRequest)
		assert.NoError(t, err)
		assert.Equal(t, request.Query, unmarshaledRequest.Query)
	})

	t.Run("SearchRequestEmptyQuery", func(t *testing.T) {
		request := SearchRequest{
			Query: "",
		}

		assert.Equal(t, "", request.Query)

		// Test JSON serialization of empty query
		jsonData, err := json.Marshal(request)
		assert.NoError(t, err)
		assert.Contains(t, string(jsonData), `"query":""`)
	})
}

// TestSearchResponseModel tests the SearchResponse model structure and behavior
func TestSearchResponseModel(t *testing.T) {
	t.Run("SearchResponseCreation", func(t *testing.T) {
		now := time.Now()
		articles := []Article{
			{ID: 1, Title: "Article 1", Content: "Content 1"},
			{ID: 2, Title: "Article 2", Content: "Content 2"},
		}

		response := SearchResponse{
			Query:              "Test query",
			AISummaryAnswer:    "AI generated summary",
			AIRelevantArticles: articles,
			QueryID:            42,
			Timestamp:          now,
		}

		assert.Equal(t, "Test query", response.Query)
		assert.Equal(t, "AI generated summary", response.AISummaryAnswer)
		assert.Len(t, response.AIRelevantArticles, 2)
		assert.Equal(t, 42, response.QueryID)
		assert.Equal(t, now, response.Timestamp)
	})

	t.Run("SearchResponseJSONSerialization", func(t *testing.T) {
		now := time.Now()
		articles := []Article{
			{ID: 1, Title: "Article 1", Content: "Content 1"},
		}

		response := SearchResponse{
			Query:              "JSON test query",
			AISummaryAnswer:    "JSON test summary",
			AIRelevantArticles: articles,
			QueryID:            123,
			Timestamp:          now,
		}

		// Test JSON marshaling
		jsonData, err := json.Marshal(response)
		assert.NoError(t, err)
		assert.Contains(t, string(jsonData), `"query":"JSON test query"`)
		assert.Contains(t, string(jsonData), `"query_id":123`)
		assert.Contains(t, string(jsonData), `"ai_relevant_articles":[`)

		// Test JSON unmarshaling
		var unmarshaledResponse SearchResponse
		err = json.Unmarshal(jsonData, &unmarshaledResponse)
		assert.NoError(t, err)
		assert.Equal(t, response.Query, unmarshaledResponse.Query)
		assert.Equal(t, response.AISummaryAnswer, unmarshaledResponse.AISummaryAnswer)
		assert.Equal(t, response.QueryID, unmarshaledResponse.QueryID)
		assert.Len(t, unmarshaledResponse.AIRelevantArticles, 1)
	})

	t.Run("SearchResponseWithEmptyArticles", func(t *testing.T) {
		response := SearchResponse{
			Query:              "No results query",
			AISummaryAnswer:    "No relevant articles found",
			AIRelevantArticles: []Article{},
			QueryID:            1,
			Timestamp:          time.Now(),
		}

		assert.Empty(t, response.AIRelevantArticles)
		assert.Equal(t, "No relevant articles found", response.AISummaryAnswer)
	})
}

// TestErrorResponseModel tests the ErrorResponse model structure and behavior
func TestErrorResponseModel(t *testing.T) {
	t.Run("ErrorResponseCreation", func(t *testing.T) {
		errorResponse := ErrorResponse{
			Error:   "Validation Error",
			Message: "Query is required",
		}

		assert.Equal(t, "Validation Error", errorResponse.Error)
		assert.Equal(t, "Query is required", errorResponse.Message)
	})

	t.Run("ErrorResponseJSONSerialization", func(t *testing.T) {
		errorResponse := ErrorResponse{
			Error:   "Bad Request",
			Message: "Invalid JSON format",
		}

		// Test JSON marshaling
		jsonData, err := json.Marshal(errorResponse)
		assert.NoError(t, err)
		assert.Contains(t, string(jsonData), `"error":"Bad Request"`)
		assert.Contains(t, string(jsonData), `"message":"Invalid JSON format"`)

		// Test JSON unmarshaling
		var unmarshaledError ErrorResponse
		err = json.Unmarshal(jsonData, &unmarshaledError)
		assert.NoError(t, err)
		assert.Equal(t, errorResponse.Error, unmarshaledError.Error)
		assert.Equal(t, errorResponse.Message, unmarshaledError.Message)
	})

	t.Run("ErrorResponseWithEmptyMessage", func(t *testing.T) {
		errorResponse := ErrorResponse{
			Error:   "Internal Server Error",
			Message: "",
		}

		assert.Equal(t, "Internal Server Error", errorResponse.Error)
		assert.Equal(t, "", errorResponse.Message)

		// Test JSON serialization omits empty message due to omitempty tag
		jsonData, err := json.Marshal(errorResponse)
		assert.NoError(t, err)
		assert.NotContains(t, string(jsonData), `"message"`)
	})

	t.Run("ErrorResponseWithOnlyError", func(t *testing.T) {
		errorResponse := ErrorResponse{
			Error: "Not Found",
		}

		assert.Equal(t, "Not Found", errorResponse.Error)
		assert.Equal(t, "", errorResponse.Message)
	})
}

// TestModelInteractions tests how different models work together
func TestModelInteractions(t *testing.T) {
	t.Run("ArticleToSearchResponseConversion", func(t *testing.T) {
		// Simulate converting articles to search response
		articles := []Article{
			{ID: 1, Title: "Password Reset", Content: "How to reset password"},
			{ID: 2, Title: "VPN Setup", Content: "VPN configuration guide"},
		}

		response := SearchResponse{
			Query:              "password help",
			AISummaryAnswer:    "Here's how to reset your password...",
			AIRelevantArticles: articles,
			QueryID:            1,
			Timestamp:          time.Now(),
		}

		assert.Equal(t, len(articles), len(response.AIRelevantArticles))
		assert.Equal(t, articles[0].ID, response.AIRelevantArticles[0].ID)
		assert.Equal(t, articles[1].Title, response.AIRelevantArticles[1].Title)
	})

	t.Run("QueryToSearchResultFlow", func(t *testing.T) {
		// Simulate the flow from Query to SearchResult
		query := Query{
			ID:        1,
			Query:     "test query",
			CreatedAt: time.Now(),
		}

		searchResult := SearchResult{
			ID:                 1,
			QueryID:            query.ID,
			AISummaryAnswer:    "AI analysis result",
			AIRelevantArticles: []int{1, 2},
			CreatedAt:          time.Now(),
		}

		assert.Equal(t, query.ID, searchResult.QueryID)
		assert.Greater(t, searchResult.ID, 0)
		assert.NotEmpty(t, searchResult.AISummaryAnswer)
	})
}
