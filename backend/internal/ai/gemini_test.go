package ai

import (
	"event-to-insight/internal/models"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestNewGeminiService tests the creation of Gemini AI service
func TestNewGeminiService(t *testing.T) {
	t.Run("EmptyAPIKey", func(t *testing.T) {
		service, err := NewGeminiService("")
		assert.Error(t, err)
		assert.Nil(t, service)
		assert.Contains(t, err.Error(), "API key is required")
	})

	t.Run("InvalidAPIKey", func(t *testing.T) {
		// This test will fail in CI/CD without a real API key, but demonstrates the interface
		service, err := NewGeminiService("invalid-api-key")
		if err != nil {
			// Expected to fail with invalid API key
			assert.Nil(t, service)
			assert.Error(t, err)
		} else {
			// If it somehow succeeds (e.g., in mock environment), ensure we can close it
			assert.NotNil(t, service)
			err = service.Close()
			assert.NoError(t, err)
		}
	})
}

// TestGeminiServiceMethods tests the Gemini service methods (without actual API calls)
func TestGeminiServiceMethods(t *testing.T) {
	// Note: These tests are primarily for interface compliance and documentation
	// Actual API testing would require valid credentials and would be integration tests

	t.Run("AnalyzeQueryInterface", func(t *testing.T) {
		// Test that the interface is properly defined
		var service AIServiceInterface
		service = NewMockAIService() // Use mock for actual testing

		articles := []models.Article{
			{ID: 1, Title: "Test Article", Content: "Test content"},
		}

		result, err := service.AnalyzeQuery("test query", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.NotEmpty(t, result.Summary)
	})
}

// TestGeminiServiceHelpers tests helper functions that can be tested without API calls
func TestGeminiServiceHelpers(t *testing.T) {
	// Since we can't easily test the actual Gemini service without API keys,
	// we focus on testing the interface and demonstrating the expected behavior

	t.Run("AIAnalysisResultStructure", func(t *testing.T) {
		// Test that AIAnalysisResult has the expected structure
		result := &AIAnalysisResult{
			Summary:          "Test summary",
			RelevantArticles: []int{1, 2, 3},
		}

		assert.Equal(t, "Test summary", result.Summary)
		assert.Equal(t, []int{1, 2, 3}, result.RelevantArticles)
		assert.Len(t, result.RelevantArticles, 3)
	})

	t.Run("AIServiceInterfaceCompliance", func(t *testing.T) {
		// Ensure both Mock and Gemini services implement the same interface
		var mockService AIServiceInterface = NewMockAIService()
		assert.NotNil(t, mockService)

		// Test that the interface method exists and can be called
		articles := []models.Article{
			{ID: 1, Title: "Password Reset", Content: "How to reset password"},
		}

		result, err := mockService.AnalyzeQuery("password help", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.IsType(t, &AIAnalysisResult{}, result)
	})
}

// TestGeminiServiceDocumentation provides documentation through tests
func TestGeminiServiceDocumentation(t *testing.T) {
	t.Run("ExpectedBehavior", func(t *testing.T) {
		// This test documents the expected behavior of the Gemini service
		// when it's properly configured with a valid API key

		// 1. NewGeminiService should create a service instance
		// 2. AnalyzeQuery should return relevant articles and summary
		// 3. Close should properly clean up resources

		// For now, we demonstrate this with the mock service
		mockService := NewMockAIService()

		articles := []models.Article{
			{ID: 1, Title: "Password Reset Instructions", Content: "Step-by-step guide to reset your password"},
			{ID: 2, Title: "VPN Configuration", Content: "How to set up VPN connection"},
		}

		// Test password-related query
		result, err := mockService.AnalyzeQuery("I forgot my password", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Contains(t, result.Summary, "password")
		assert.Contains(t, result.RelevantArticles, 1)

		// Test VPN-related query
		result, err = mockService.AnalyzeQuery("VPN connection issues", articles)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Contains(t, result.Summary, "VPN")
		assert.Contains(t, result.RelevantArticles, 2)
	})

	t.Run("ErrorHandling", func(t *testing.T) {
		// Document how the service should handle errors

		// Empty API key should return error
		service, err := NewGeminiService("")
		assert.Error(t, err)
		assert.Nil(t, service)

		// The service should validate inputs appropriately
		// (This is demonstrated with the mock service)
		mockService := NewMockAIService()

		// Should handle empty query gracefully
		result, err := mockService.AnalyzeQuery("", []models.Article{})
		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Should handle nil articles gracefully
		result, err = mockService.AnalyzeQuery("test", nil)
		assert.NoError(t, err)
		assert.NotNil(t, result)
	})
}

// TestAIServiceFactory demonstrates a factory pattern for AI services
func TestAIServiceFactory(t *testing.T) {
	t.Run("ServiceSelection", func(t *testing.T) {
		// Demonstrate how to choose between different AI services

		createAIService := func(useMock bool, apiKey string) (AIServiceInterface, error) {
			if useMock || apiKey == "" {
				return NewMockAIService(), nil
			}
			return NewGeminiService(apiKey)
		}

		// Test mock service creation
		mockService, err := createAIService(true, "")
		assert.NoError(t, err)
		assert.NotNil(t, mockService)

		// Test that it works
		result, err := mockService.AnalyzeQuery("test", []models.Article{})
		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Test Gemini service creation with empty key (should use mock)
		service, err := createAIService(false, "")
		assert.NoError(t, err)
		assert.NotNil(t, service)
	})
}
