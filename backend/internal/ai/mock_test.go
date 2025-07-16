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
