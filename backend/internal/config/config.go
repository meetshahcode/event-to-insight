package config

import (
	"os"
)

// Config holds the application configuration
type Config struct {
	Port      string
	DBPath    string
	GeminiKey string
	UseMockAI bool
}

// LoadConfig loads configuration from environment variables
func LoadConfig() *Config {
	return &Config{
		Port:      getEnv("PORT", "8080"),
		DBPath:    getEnv("DB_PATH", "./data.db"),
		GeminiKey: getEnv("GEMINI_API_KEY", ""),
		UseMockAI: getEnv("USE_MOCK_AI", "true") == "true",
	}
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
