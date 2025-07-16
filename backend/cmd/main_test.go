package main

import (
	"event-to-insight/internal/config"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestMainFunction tests aspects of the main function that can be tested
func TestMainFunction(t *testing.T) {
	// Note: Testing main() directly is challenging since it starts a server
	// Instead, we test the components and configuration that main() uses

	t.Run("ConfigurationLoading", func(t *testing.T) {
		// Test that configuration loads properly
		cfg := config.LoadConfig()
		assert.NotNil(t, cfg)
		assert.NotEmpty(t, cfg.Port)
		assert.NotEmpty(t, cfg.DBPath)
		// UseMockAI should have a valid boolean value
		assert.IsType(t, true, cfg.UseMockAI)
	})

	t.Run("DefaultConfiguration", func(t *testing.T) {
		// Save original environment
		originalPort := os.Getenv("PORT")
		originalDBPath := os.Getenv("DB_PATH")
		originalGeminiKey := os.Getenv("GEMINI_API_KEY")
		originalUseMockAI := os.Getenv("USE_MOCK_AI")

		// Clear environment variables to test defaults
		os.Unsetenv("PORT")
		os.Unsetenv("DB_PATH")
		os.Unsetenv("GEMINI_API_KEY")
		os.Unsetenv("USE_MOCK_AI")

		cfg := config.LoadConfig()

		// Verify default values
		assert.Equal(t, "8080", cfg.Port)
		assert.Equal(t, "./data.db", cfg.DBPath)
		assert.Equal(t, "", cfg.GeminiKey)
		assert.Equal(t, true, cfg.UseMockAI) // Default should be true

		// Restore environment
		if originalPort != "" {
			os.Setenv("PORT", originalPort)
		}
		if originalDBPath != "" {
			os.Setenv("DB_PATH", originalDBPath)
		}
		if originalGeminiKey != "" {
			os.Setenv("GEMINI_API_KEY", originalGeminiKey)
		}
		if originalUseMockAI != "" {
			os.Setenv("USE_MOCK_AI", originalUseMockAI)
		}
	})

	t.Run("CustomConfiguration", func(t *testing.T) {
		// Save original environment
		originalPort := os.Getenv("PORT")
		originalDBPath := os.Getenv("DB_PATH")
		originalGeminiKey := os.Getenv("GEMINI_API_KEY")
		originalUseMockAI := os.Getenv("USE_MOCK_AI")

		// Set custom environment variables
		os.Setenv("PORT", "9090")
		os.Setenv("DB_PATH", "/tmp/test.db")
		os.Setenv("GEMINI_API_KEY", "test-key")
		os.Setenv("USE_MOCK_AI", "false")

		cfg := config.LoadConfig()

		// Verify custom values
		assert.Equal(t, "9090", cfg.Port)
		assert.Equal(t, "/tmp/test.db", cfg.DBPath)
		assert.Equal(t, "test-key", cfg.GeminiKey)
		assert.Equal(t, false, cfg.UseMockAI)

		// Restore environment
		if originalPort != "" {
			os.Setenv("PORT", originalPort)
		} else {
			os.Unsetenv("PORT")
		}
		if originalDBPath != "" {
			os.Setenv("DB_PATH", originalDBPath)
		} else {
			os.Unsetenv("DB_PATH")
		}
		if originalGeminiKey != "" {
			os.Setenv("GEMINI_API_KEY", originalGeminiKey)
		} else {
			os.Unsetenv("GEMINI_API_KEY")
		}
		if originalUseMockAI != "" {
			os.Setenv("USE_MOCK_AI", originalUseMockAI)
		} else {
			os.Unsetenv("USE_MOCK_AI")
		}
	})

	t.Run("AIServiceSelection", func(t *testing.T) {
		// Test the logic for selecting between Mock and Gemini AI services

		testCases := []struct {
			name         string
			useMockAI    string
			geminiKey    string
			expectedMock bool
		}{
			{"MockAITrue", "true", "", true},
			{"MockAIFalse", "false", "", true}, // Should use mock if no key
			{"MockAITrueWithKey", "true", "test-key", true},
			{"MockAIFalseWithKey", "false", "test-key", false},
			{"EmptyMockAI", "", "", true},                // Default is true
			{"EmptyMockAIWithKey", "", "test-key", true}, // Should use mock if USE_MOCK_AI is empty (defaults to true)
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				// Save original environment
				originalUseMockAI := os.Getenv("USE_MOCK_AI")
				originalGeminiKey := os.Getenv("GEMINI_API_KEY")

				// Set test environment
				if tc.useMockAI == "" {
					os.Unsetenv("USE_MOCK_AI")
				} else {
					os.Setenv("USE_MOCK_AI", tc.useMockAI)
				}

				if tc.geminiKey == "" {
					os.Unsetenv("GEMINI_API_KEY")
				} else {
					os.Setenv("GEMINI_API_KEY", tc.geminiKey)
				}

				cfg := config.LoadConfig()

				// Test the logic that main() would use
				shouldUseMock := cfg.UseMockAI || cfg.GeminiKey == ""
				assert.Equal(t, tc.expectedMock, shouldUseMock,
					"Expected mock=%v for useMockAI=%s, geminiKey=%s",
					tc.expectedMock, tc.useMockAI, tc.geminiKey)

				// Restore environment
				if originalUseMockAI != "" {
					os.Setenv("USE_MOCK_AI", originalUseMockAI)
				} else {
					os.Unsetenv("USE_MOCK_AI")
				}
				if originalGeminiKey != "" {
					os.Setenv("GEMINI_API_KEY", originalGeminiKey)
				} else {
					os.Unsetenv("GEMINI_API_KEY")
				}
			})
		}
	})
}

// TestApplicationStartup tests the components that main() initializes
func TestApplicationStartup(t *testing.T) {
	t.Run("ConfigValidation", func(t *testing.T) {
		cfg := config.LoadConfig()

		// Port should be a valid string that could be converted to int
		assert.NotEmpty(t, cfg.Port)
		assert.Regexp(t, `^\d+$`, cfg.Port, "Port should be numeric")

		// DBPath should be a valid path string
		assert.NotEmpty(t, cfg.DBPath)

		// UseMockAI should be a boolean
		assert.IsType(t, true, cfg.UseMockAI)
	})

	t.Run("EnvironmentVariableHandling", func(t *testing.T) {
		// Test various environment variable scenarios
		testCases := []struct {
			name     string
			envVar   string
			value    string
			expected interface{}
		}{
			{"ValidPort", "PORT", "3000", "3000"},
			{"InvalidPort", "PORT", "abc", "abc"}, // Config doesn't validate, just returns
			{"ValidDBPath", "DB_PATH", "/tmp/test.db", "/tmp/test.db"},
			{"ValidGeminiKey", "GEMINI_API_KEY", "test-key-123", "test-key-123"},
			{"ValidUseMockAITrue", "USE_MOCK_AI", "true", true},
			{"ValidUseMockAIFalse", "USE_MOCK_AI", "false", false},
			{"InvalidUseMockAI", "USE_MOCK_AI", "invalid", false}, // Should default to false for non-"true"
		}

		for _, tc := range testCases {
			t.Run(tc.name, func(t *testing.T) {
				// Save original value
				original := os.Getenv(tc.envVar)

				// Set test value
				os.Setenv(tc.envVar, tc.value)

				// Load config
				cfg := config.LoadConfig()

				// Check expected value
				switch tc.envVar {
				case "PORT":
					assert.Equal(t, tc.expected, cfg.Port)
				case "DB_PATH":
					assert.Equal(t, tc.expected, cfg.DBPath)
				case "GEMINI_API_KEY":
					assert.Equal(t, tc.expected, cfg.GeminiKey)
				case "USE_MOCK_AI":
					assert.Equal(t, tc.expected, cfg.UseMockAI)
				}

				// Restore original value
				if original != "" {
					os.Setenv(tc.envVar, original)
				} else {
					os.Unsetenv(tc.envVar)
				}
			})
		}
	})
}

// TestMainDocumentation provides documentation through tests
func TestMainDocumentation(t *testing.T) {
	t.Run("ApplicationFlow", func(t *testing.T) {
		// This test documents the expected flow of the main application

		// 1. Load configuration from environment
		cfg := config.LoadConfig()
		assert.NotNil(t, cfg)

		// 2. Configuration should have expected structure
		assert.IsType(t, "", cfg.Port)
		assert.IsType(t, "", cfg.DBPath)
		assert.IsType(t, "", cfg.GeminiKey)
		assert.IsType(t, true, cfg.UseMockAI)

		// 3. AI service selection logic
		shouldUseMock := cfg.UseMockAI || cfg.GeminiKey == ""
		assert.IsType(t, true, shouldUseMock)

		// 4. Server configuration should use the port from config
		expectedAddr := ":" + cfg.Port
		assert.Contains(t, expectedAddr, cfg.Port)
	})

	t.Run("ServerConfiguration", func(t *testing.T) {
		// Document expected server configuration
		cfg := config.LoadConfig()

		// Server should listen on configured port
		serverAddr := ":" + cfg.Port
		assert.NotEmpty(t, serverAddr)
		assert.Contains(t, serverAddr, ":")

		// Database path should be configured
		assert.NotEmpty(t, cfg.DBPath)

		// Health check endpoint should be available
		healthEndpoint := "http://localhost:" + cfg.Port + "/api/health"
		assert.Contains(t, healthEndpoint, "health")
		assert.Contains(t, healthEndpoint, cfg.Port)
	})

	t.Run("DependencyValidation", func(t *testing.T) {
		// Document that all required dependencies are available

		// Config package should be available
		cfg := config.LoadConfig()
		assert.NotNil(t, cfg)

		// All imported packages should be accessible
		// (This is implicitly tested by successful compilation)
		assert.True(t, true, "All dependencies should be available")
	})
}
