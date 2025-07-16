package database

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSQLiteDB(t *testing.T) {
	// Create temporary database
	dbPath := "test.db"
	defer os.Remove(dbPath)

	db, err := NewSQLiteDB(dbPath)
	require.NoError(t, err)
	defer db.Close()

	err = db.Initialize()
	require.NoError(t, err)

	t.Run("GetAllArticles", func(t *testing.T) {
		articles, err := db.GetAllArticles()
		assert.NoError(t, err)
		assert.Greater(t, len(articles), 0)
	})

	t.Run("GetArticleByID", func(t *testing.T) {
		article, err := db.GetArticleByID(1)
		assert.NoError(t, err)
		assert.NotNil(t, article)
		assert.Equal(t, 1, article.ID)
	})

	t.Run("GetArticlesByIDs", func(t *testing.T) {
		articles, err := db.GetArticlesByIDs([]int{1, 2})
		assert.NoError(t, err)
		assert.Len(t, articles, 2)
	})

	t.Run("CreateQuery", func(t *testing.T) {
		query, err := db.CreateQuery("test query")
		assert.NoError(t, err)
		assert.NotNil(t, query)
		assert.Equal(t, "test query", query.Query)
		assert.Greater(t, query.ID, 0)
	})

	t.Run("CreateSearchResult", func(t *testing.T) {
		// First create a query
		query, err := db.CreateQuery("test query for result")
		require.NoError(t, err)

		// Create search result
		result, err := db.CreateSearchResult(query.ID, "test summary", []int{1, 2})
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, query.ID, result.QueryID)
		assert.Equal(t, "test summary", result.AISummaryAnswer)
		assert.Equal(t, []int{1, 2}, result.AIRelevantArticles)
	})

	t.Run("GetSearchResultByQueryID", func(t *testing.T) {
		// Create query and result
		query, err := db.CreateQuery("test query for retrieval")
		require.NoError(t, err)

		_, err = db.CreateSearchResult(query.ID, "test summary", []int{1, 2})
		require.NoError(t, err)

		// Retrieve result
		result, err := db.GetSearchResultByQueryID(query.ID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, query.ID, result.QueryID)
	})
}
