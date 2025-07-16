package router

import (
	"event-to-insight/internal/handlers"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

// SetupRouter sets up the HTTP router with all routes
func SetupRouter(searchHandler *handlers.SearchHandler) *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes
	r.Route("/api", func(r chi.Router) {
		// Health check
		r.Get("/health", searchHandler.HealthCheck)

		// Search endpoints
		r.Post("/search-query", searchHandler.SearchQuery)

		// Article endpoints
		r.Get("/articles", searchHandler.GetAllArticles)
		r.Get("/articles/{id}", searchHandler.GetArticle)
	})

	return r
}
