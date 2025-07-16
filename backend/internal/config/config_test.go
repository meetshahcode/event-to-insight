package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestLoadConfig tests the LoadConfig function with various environment configurations
func TestLoadConfig(t *testing.T) {
	// Save original environment variables
	originalPort := os.Getenv("PORT")
	originalDBPath := os.Getenv("DB_PATH")
	originalGeminiKey := os.Getenv("GEMINI_API_KEY")
	originalUseMockAI := os.Getenv("USE_MOCK_AI")

	// Cleanup function to restore original environment
	defer func() {
		os.Setenv("PORT", originalPort)
		os.Setenv("DB_PATH", originalDBPath)
		os.Setenv("GEMINI_API_KEY", originalGeminiKey)
		os.Setenv("USE_MOCK_AI", originalUseMockAI)
	}()

	t.Run("DefaultValues", func(t *testing.T) {
		// Clear all environment variables
		os.Unsetenv("PORT")
		os.Unsetenv("DB_PATH")
		os.Unsetenv("GEMINI_API_KEY")
		os.Unsetenv("USE_MOCK_AI")

		config := LoadConfig()

		assert.Equal(t, "8080", config.Port)
		assert.Equal(t, "./data.db", config.DBPath)
		assert.Equal(t, "", config.GeminiKey)
		assert.Equal(t, true, config.UseMockAI) // Default is "true"
	})

	t.Run("CustomEnvironmentValues", func(t *testing.T) {
		// Set custom environment variables
		os.Setenv("PORT", "9090")
		os.Setenv("DB_PATH", "/custom/path/data.db")
		os.Setenv("GEMINI_API_KEY", "test-api-key-12345")
		os.Setenv("USE_MOCK_AI", "false")

		config := LoadConfig()

		assert.Equal(t, "9090", config.Port)
		assert.Equal(t, "/custom/path/data.db", config.DBPath)
		assert.Equal(t, "test-api-key-12345", config.GeminiKey)
		assert.Equal(t, false, config.UseMockAI)
	})

	t.Run("PartialEnvironmentValues", func(t *testing.T) {
		// Set only some environment variables
		os.Setenv("PORT", "3000")
		os.Unsetenv("DB_PATH")
		os.Setenv("GEMINI_API_KEY", "partial-key")
		os.Unsetenv("USE_MOCK_AI")

		config := LoadConfig()

		assert.Equal(t, "3000", config.Port)
		assert.Equal(t, "./data.db", config.DBPath) // Default value
		assert.Equal(t, "partial-key", config.GeminiKey)
		assert.Equal(t, true, config.UseMockAI) // Default value
	})

	t.Run("UseMockAIVariations", func(t *testing.T) {
		// Test different USE_MOCK_AI values
		testCases := []struct {
			value    string
			expected bool
		}{
			{"true", true},
			{"false", false},
			{"True", false},  // Case sensitive
			{"FALSE", false}, // Case sensitive
			{"1", false},     // Not "true" exactly
			{"yes", false},   // Not "true" exactly
			{"", true},       // Empty defaults to true
		}

		for _, tc := range testCases {
			t.Run("UseMockAI_"+tc.value, func(t *testing.T) {
				if tc.value == "" {
					os.Unsetenv("USE_MOCK_AI")
				} else {
					os.Setenv("USE_MOCK_AI", tc.value)
				}

				config := LoadConfig()
				assert.Equal(t, tc.expected, config.UseMockAI,
					"Expected USE_MOCK_AI=%s to result in %v", tc.value, tc.expected)
			})
		}
	})
}

// TestGetEnv tests the getEnv helper function
func TestGetEnv(t *testing.T) {
	t.Run("ExistingEnvironmentVariable", func(t *testing.T) {
		os.Setenv("TEST_VAR", "test_value")
		defer os.Unsetenv("TEST_VAR")

		result := getEnv("TEST_VAR", "default_value")
		assert.Equal(t, "test_value", result)
	})

	t.Run("NonExistingEnvironmentVariable", func(t *testing.T) {
		os.Unsetenv("NON_EXISTING_VAR")

		result := getEnv("NON_EXISTING_VAR", "default_value")
		assert.Equal(t, "default_value", result)
	})

	t.Run("EmptyEnvironmentVariable", func(t *testing.T) {
		os.Setenv("EMPTY_VAR", "")
		defer os.Unsetenv("EMPTY_VAR")

		result := getEnv("EMPTY_VAR", "default_value")
		assert.Equal(t, "default_value", result)
	})

	t.Run("WhitespaceEnvironmentVariable", func(t *testing.T) {
		os.Setenv("WHITESPACE_VAR", "   ")
		defer os.Unsetenv("WHITESPACE_VAR")

		result := getEnv("WHITESPACE_VAR", "default_value")
		assert.Equal(t, "   ", result) // Should return the whitespace value, not default
	})
}

// TestConfigStruct tests the Config struct initialization
func TestConfigStruct(t *testing.T) {
	t.Run("ConfigStructFields", func(t *testing.T) {
		config := &Config{
			Port:      "8080",
			DBPath:    "./test.db",
			GeminiKey: "test-key",
			UseMockAI: true,
		}

		assert.Equal(t, "8080", config.Port)
		assert.Equal(t, "./test.db", config.DBPath)
		assert.Equal(t, "test-key", config.GeminiKey)
		assert.Equal(t, true, config.UseMockAI)
	})

	t.Run("ZeroValueConfig", func(t *testing.T) {
		config := &Config{}

		assert.Equal(t, "", config.Port)
		assert.Equal(t, "", config.DBPath)
		assert.Equal(t, "", config.GeminiKey)
		assert.Equal(t, false, config.UseMockAI)
	})
}
