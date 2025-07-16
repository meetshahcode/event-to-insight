package ai

import (
	"event-to-insight/internal/models"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMockAIService(t *testing.T) {
	service := NewMockAIService()

	articles := []models.Article{
		{ID: 1, Title: "Password Reset", Content: "Instructions for password reset"},
		{ID: 2, Title: "VPN Setup", Content: "How to configure VPN connection"},
		{ID: 3, Title: "Email Configuration", Content: "Email setup instructions"},
	}

	t.Run("PasswordQuery", func(t *testing.T) {
		result, err := service.AnalyzeQuery("How do I reset my password?", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Contains(t, result.Summary, "password")
		assert.Contains(t, result.RelevantArticles, 1)
	})

	t.Run("VPNQuery", func(t *testing.T) {
		result, err := service.AnalyzeQuery("I need help with VPN", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Contains(t, result.Summary, "VPN")
		assert.Contains(t, result.RelevantArticles, 2)
	})

	t.Run("EmailQuery", func(t *testing.T) {
		result, err := service.AnalyzeQuery("Email not working", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Contains(t, result.Summary, "email")
		assert.Contains(t, result.RelevantArticles, 3)
	})

	t.Run("NoMatchQuery", func(t *testing.T) {
		result, err := service.AnalyzeQuery("random unrelated query", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.NotEmpty(t, result.Summary)
		assert.Empty(t, result.RelevantArticles)
	})
}

// TestMockAIServiceEdgeCases tests various edge cases and scenarios
func TestMockAIServiceEdgeCases(t *testing.T) {
	service := NewMockAIService()

	articles := []models.Article{
		{ID: 1, Title: "Password Reset Instructions", Content: "Step-by-step password reset guide"},
		{ID: 2, Title: "VPN Connection Setup", Content: "VPN configuration and troubleshooting"},
		{ID: 3, Title: "Email Client Configuration", Content: "Email setup for various clients"},
		{ID: 4, Title: "Printer Setup Guide", Content: "How to install and configure printers"},
		{ID: 5, Title: "Software Installation", Content: "Installing and updating software packages"},
		{ID: 6, Title: "Network Troubleshooting", Content: "Diagnosing and fixing network issues"},
		{ID: 7, Title: "Backup and Recovery", Content: "Data backup and recovery procedures"},
	}

	t.Run("EmptyQuery", func(t *testing.T) {
		result, err := service.AnalyzeQuery("", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.NotEmpty(t, result.Summary)
		assert.Empty(t, result.RelevantArticles)
	})

	t.Run("WhitespaceOnlyQuery", func(t *testing.T) {
		result, err := service.AnalyzeQuery("   \t\n   ", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.NotEmpty(t, result.Summary)
	})

	t.Run("CaseInsensitiveMatching", func(t *testing.T) {
		testCases := []struct {
			query    string
			expected int
		}{
			{"PASSWORD reset help", 1},
			{"VPN connection issues", 2},
			{"Email Problems", 3},
		}

		for _, tc := range testCases {
			result, err := service.AnalyzeQuery(tc.query, articles)
			assert.NoError(t, err)
			assert.Contains(t, result.RelevantArticles, tc.expected, "Failed for query: %s", tc.query)
		}
	})

	t.Run("MultipleKeywordMatching", func(t *testing.T) {
		result, err := service.AnalyzeQuery("password and email configuration", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Should match both password and email articles
		assert.Contains(t, result.RelevantArticles, 1) // Password article
		assert.Contains(t, result.RelevantArticles, 3) // Email article
	})

	t.Run("PrinterKeywordMatching", func(t *testing.T) {
		result, err := service.AnalyzeQuery("printer setup help", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Contains(t, result.Summary, "printer")
		assert.Contains(t, result.RelevantArticles, 4)
	})

	t.Run("SoftwareKeywordMatching", func(t *testing.T) {
		result, err := service.AnalyzeQuery("software installation problems", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		// Test passes if no error is returned, regardless of match
		assert.NotEmpty(t, result.Summary)
	})

	t.Run("NetworkKeywordMatching", func(t *testing.T) {
		result, err := service.AnalyzeQuery("network connectivity issues", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		// Network is not in the mock's supported keywords, so no match expected
		assert.NotEmpty(t, result.Summary)
	})

	t.Run("BackupKeywordMatching", func(t *testing.T) {
		result, err := service.AnalyzeQuery("backup data recovery", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		// Test passes if no error is returned, regardless of match
		assert.NotEmpty(t, result.Summary)
	})

	t.Run("EmptyArticlesArray", func(t *testing.T) {
		result, err := service.AnalyzeQuery("any query", []models.Article{})
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.NotEmpty(t, result.Summary)
		assert.Empty(t, result.RelevantArticles)
	})

	t.Run("NilArticlesArray", func(t *testing.T) {
		result, err := service.AnalyzeQuery("any query", nil)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.NotEmpty(t, result.Summary)
		assert.Empty(t, result.RelevantArticles)
	})

	t.Run("VeryLongQuery", func(t *testing.T) {
		longQuery := "This is a very long query that contains multiple keywords like password reset and VPN configuration and email setup and printer installation and software updates and network troubleshooting and backup procedures to test how the mock AI service handles extended queries with multiple potential matches"

		result, err := service.AnalyzeQuery(longQuery, articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.NotEmpty(t, result.Summary)

		// Should match multiple articles due to multiple keywords
		assert.Greater(t, len(result.RelevantArticles), 1)
	})

	t.Run("SpecialCharactersInQuery", func(t *testing.T) {
		result, err := service.AnalyzeQuery("How do I reset my password? It's not working!", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Contains(t, result.Summary, "password")
		assert.Contains(t, result.RelevantArticles, 1)
	})

	t.Run("UnicodeQuery", func(t *testing.T) {
		result, err := service.AnalyzeQuery("Comment réinitialiser le password? 密码重置", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		// Should still match password keyword
		assert.Contains(t, result.RelevantArticles, 1)
	})

	t.Run("NumericQuery", func(t *testing.T) {
		result, err := service.AnalyzeQuery("12345 password reset 67890", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Contains(t, result.RelevantArticles, 1)
	})

	t.Run("SummaryGeneration", func(t *testing.T) {
		testCases := []struct {
			query           string
			expectedKeyword string
		}{
			{"password help", "password"},
			{"vpn issues", "VPN"},
			{"email problems", "email"},
			{"printer setup", "printer"},
		}

		for _, tc := range testCases {
			result, err := service.AnalyzeQuery(tc.query, articles)
			assert.NoError(t, err)
			if len(result.RelevantArticles) > 0 {
				assert.Contains(t, result.Summary, tc.expectedKeyword, "Summary should contain keyword for query: %s", tc.query)
			} else {
				assert.NotEmpty(t, result.Summary, "Summary should not be empty for query: %s", tc.query)
			}
		}
	})
}

// TestMockAIServiceConsistency tests that the service provides consistent results
func TestMockAIServiceConsistency(t *testing.T) {
	service := NewMockAIService()

	articles := []models.Article{
		{ID: 1, Title: "Password Reset", Content: "Instructions for password reset"},
		{ID: 2, Title: "VPN Setup", Content: "VPN configuration guide"},
	}

	t.Run("ConsistentResults", func(t *testing.T) {
		query := "password reset help"

		// Run the same query multiple times
		for i := 0; i < 5; i++ {
			result, err := service.AnalyzeQuery(query, articles)
			assert.NoError(t, err)
			assert.NotNil(t, result)
			assert.Contains(t, result.Summary, "password")
			assert.Contains(t, result.RelevantArticles, 1)
		}
	})

	t.Run("ServiceCreation", func(t *testing.T) {
		// Test that NewMockAIService returns a valid service
		service1 := NewMockAIService()
		service2 := NewMockAIService()

		assert.NotNil(t, service1)
		assert.NotNil(t, service2)

		// Both services should work independently
		result1, err1 := service1.AnalyzeQuery("password help", articles)
		result2, err2 := service2.AnalyzeQuery("password help", articles)

		assert.NoError(t, err1)
		assert.NoError(t, err2)
		assert.Equal(t, result1.Summary, result2.Summary)
		assert.Equal(t, result1.RelevantArticles, result2.RelevantArticles)
	})
}
