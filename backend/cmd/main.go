package main

import (
	"event-to-insight/internal/ai"
	"event-to-insight/internal/config"
	"event-to-insight/internal/database"
	"event-to-insight/internal/handlers"
	"event-to-insight/internal/router"
	"event-to-insight/internal/service"
	"log"
	"net/http"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Initialize database
	db, err := database.NewSQLiteDB(cfg.DBPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	if err := db.Initialize(); err != nil {
		log.Fatalf("Failed to initialize database schema: %v", err)
	}

	// Initialize AI service
	var aiService ai.AIServiceInterface
	if cfg.UseMockAI || cfg.GeminiKey == "" {
		log.Println("Using Mock AI service")
		aiService = ai.NewMockAIService()
	} else {
		log.Println("Using Gemini AI service")
		aiService, err = ai.NewGeminiService(cfg.GeminiKey)
		if err != nil {
			log.Fatalf("Failed to initialize Gemini AI service: %v", err)
		}
	}

	// Initialize services
	searchService := service.NewSearchService(db, aiService)

	// Initialize handlers
	searchHandler := handlers.NewSearchHandler(searchService)

	// Setup router
	r := router.SetupRouter(searchHandler)

	// Start server
	log.Printf("Server starting on port %s", cfg.Port)
	log.Printf("Using database: %s", cfg.DBPath)
	log.Printf("Health check: http://localhost:%s/api/health", cfg.Port)

	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
