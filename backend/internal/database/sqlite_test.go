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

// TestSQLiteDBErrors tests error scenarios and edge cases
func TestSQLiteDBErrors(t *testing.T) {
	t.Run("InvalidDBPath", func(t *testing.T) {
		// Test with invalid path (read-only directory)
		_, err := NewSQLiteDB("/root/nonexistent/test.db")
		assert.Error(t, err)
	})

	t.Run("GetNonExistentArticle", func(t *testing.T) {
		dbPath := "test_errors.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		err = db.Initialize()
		require.NoError(t, err)

		// Try to get non-existent article
		article, err := db.GetArticleByID(999)
		assert.Error(t, err)
		assert.Nil(t, article)
	})

	t.Run("GetNonExistentQuery", func(t *testing.T) {
		dbPath := "test_errors2.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		err = db.Initialize()
		require.NoError(t, err)

		// Try to get non-existent query
		query, err := db.GetQueryByID(999)
		assert.Error(t, err)
		assert.Nil(t, query)
	})

	t.Run("GetSearchResultForNonExistentQuery", func(t *testing.T) {
		dbPath := "test_errors3.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		err = db.Initialize()
		require.NoError(t, err)

		// Try to get search result for non-existent query
		result, err := db.GetSearchResultByQueryID(999)
		assert.Error(t, err)
		assert.Nil(t, result)
	})

	t.Run("EmptyIDsArray", func(t *testing.T) {
		dbPath := "test_empty_ids.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		err = db.Initialize()
		require.NoError(t, err)

		// Test with empty IDs array
		articles, err := db.GetArticlesByIDs([]int{})
		assert.NoError(t, err)
		assert.Empty(t, articles)
	})

	t.Run("GetArticlesByNonExistentIDs", func(t *testing.T) {
		dbPath := "test_nonexistent_ids.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		err = db.Initialize()
		require.NoError(t, err)

		// Test with non-existent IDs
		articles, err := db.GetArticlesByIDs([]int{999, 1000})
		assert.NoError(t, err)
		assert.Empty(t, articles)
	})
}

// TestSQLiteDBInitialization tests database initialization scenarios
func TestSQLiteDBInitialization(t *testing.T) {
	t.Run("InitializeAlreadySeeded", func(t *testing.T) {
		dbPath := "test_seeded.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		// Initialize twice - second should not re-seed
		err = db.Initialize()
		require.NoError(t, err)

		articles1, err := db.GetAllArticles()
		require.NoError(t, err)
		count1 := len(articles1)

		// Initialize again
		err = db.Initialize()
		require.NoError(t, err)

		articles2, err := db.GetAllArticles()
		require.NoError(t, err)
		count2 := len(articles2)

		// Should have same number of articles (no duplicates)
		assert.Equal(t, count1, count2)
	})

	t.Run("CreateQueryAndRetrieve", func(t *testing.T) {
		dbPath := "test_query_retrieve.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		err = db.Initialize()
		require.NoError(t, err)

		// Create a query
		query, err := db.CreateQuery("test query for retrieval")
		require.NoError(t, err)

		// Retrieve it by ID
		retrievedQuery, err := db.GetQueryByID(query.ID)
		assert.NoError(t, err)
		assert.NotNil(t, retrievedQuery)
		assert.Equal(t, query.Query, retrievedQuery.Query)
		assert.Equal(t, query.ID, retrievedQuery.ID)
	})

	t.Run("CreateAndRetrieveSearchResult", func(t *testing.T) {
		dbPath := "test_search_result.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		err = db.Initialize()
		require.NoError(t, err)

		// Create a query first
		query, err := db.CreateQuery("test search query")
		require.NoError(t, err)

		// Create search result
		relevantArticles := []int{1, 2, 3}
		result, err := db.CreateSearchResult(query.ID, "AI analysis summary", relevantArticles)
		require.NoError(t, err)

		// Test GetSearchResultByID
		retrievedResult, err := db.GetSearchResultByID(result.ID)
		assert.NoError(t, err)
		assert.NotNil(t, retrievedResult)
		assert.Equal(t, result.AISummaryAnswer, retrievedResult.AISummaryAnswer)
		assert.Equal(t, result.AIRelevantArticles, retrievedResult.AIRelevantArticles)

		// Test GetSearchResultByQueryID
		retrievedResult2, err := db.GetSearchResultByQueryID(query.ID)
		assert.NoError(t, err)
		assert.NotNil(t, retrievedResult2)
		assert.Equal(t, result.ID, retrievedResult2.ID)
	})
}

// TestSQLiteDBEdgeCases tests various edge cases
func TestSQLiteDBEdgeCases(t *testing.T) {
	t.Run("LongQueryText", func(t *testing.T) {
		dbPath := "test_long_query.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		err = db.Initialize()
		require.NoError(t, err)

		// Create a very long query
		longQuery := "This is a very long query that contains lots of text to test how the database handles long string inputs and whether it properly stores and retrieves them without truncation or corruption of the data stored in the query field of the database table"

		query, err := db.CreateQuery(longQuery)
		assert.NoError(t, err)
		assert.Equal(t, longQuery, query.Query)

		// Retrieve and verify
		retrieved, err := db.GetQueryByID(query.ID)
		assert.NoError(t, err)
		assert.Equal(t, longQuery, retrieved.Query)
	})

	t.Run("SpecialCharactersInQuery", func(t *testing.T) {
		dbPath := "test_special_chars.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		err = db.Initialize()
		require.NoError(t, err)

		// Test with special characters, unicode, SQL injection attempts
		specialQueries := []string{
			"How do I reset my password? It's not working!",
			"'; DROP TABLE articles; --",
			"Comment réinitialiser mon mot de passe? 密码重置问题",
			"Query with \"quotes\" and 'apostrophes'",
			"Query\nwith\nnewlines\tand\ttabs",
		}

		for i, specialQuery := range specialQueries {
			query, err := db.CreateQuery(specialQuery)
			assert.NoError(t, err, "Failed for query %d: %s", i, specialQuery)
			assert.Equal(t, specialQuery, query.Query)

			// Retrieve and verify
			retrieved, err := db.GetQueryByID(query.ID)
			assert.NoError(t, err, "Failed to retrieve query %d", i)
			assert.Equal(t, specialQuery, retrieved.Query)
		}
	})

	t.Run("LargeRelevantArticlesArray", func(t *testing.T) {
		dbPath := "test_large_array.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		err = db.Initialize()
		require.NoError(t, err)

		// Create a query
		query, err := db.CreateQuery("test query")
		require.NoError(t, err)

		// Create search result with large array of relevant articles
		largeArray := make([]int, 100)
		for i := 0; i < 100; i++ {
			largeArray[i] = i + 1
		}

		result, err := db.CreateSearchResult(query.ID, "Summary for large array", largeArray)
		assert.NoError(t, err)
		assert.Equal(t, largeArray, result.AIRelevantArticles)

		// Retrieve and verify
		retrieved, err := db.GetSearchResultByQueryID(query.ID)
		assert.NoError(t, err)
		assert.Equal(t, largeArray, retrieved.AIRelevantArticles)
	})
}

// TestSQLiteDBConcurrency tests concurrent access scenarios
func TestSQLiteDBConcurrency(t *testing.T) {
	t.Run("ConcurrentQueries", func(t *testing.T) {
		dbPath := "test_concurrent.db"
		defer os.Remove(dbPath)

		db, err := NewSQLiteDB(dbPath)
		require.NoError(t, err)
		defer db.Close()

		err = db.Initialize()
		require.NoError(t, err)

		// Test concurrent query creation
		done := make(chan bool, 10)
		for i := 0; i < 10; i++ {
			go func(i int) {
				defer func() { done <- true }()

				query, err := db.CreateQuery("concurrent query " + string(rune(i+'0')))
				assert.NoError(t, err)
				assert.NotNil(t, query)

				// Also test concurrent reads
				articles, err := db.GetAllArticles()
				assert.NoError(t, err)
				assert.NotEmpty(t, articles)
			}(i)
		}

		// Wait for all goroutines to complete
		for i := 0; i < 10; i++ {
			<-done
		}
	})
}
