package models

import "time"

// Article represents a knowledge base article
type Article struct {
	ID      int    `json:"id" db:"id"`
	Title   string `json:"title" db:"title"`
	Content string `json:"content" db:"content"`
}

// Query represents a user search query
type Query struct {
	ID        int       `json:"id" db:"id"`
	Query     string    `json:"query" db:"query"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// SearchResult represents the result of a search query
type SearchResult struct {
	ID                int       `json:"id" db:"id"`
	QueryID           int       `json:"query_id" db:"query_id"`
	AISummaryAnswer   string    `json:"ai_summary_answer" db:"ai_summary_answer"`
	AIRelevantArticles []int    `json:"ai_relevant_articles"` // JSON array in DB
	CreatedAt         time.Time `json:"created_at" db:"created_at"`
}

// SearchRequest represents the incoming search request
type SearchRequest struct {
	Query string `json:"query" validate:"required,min=1"`
}

// SearchResponse represents the search response
type SearchResponse struct {
	Query              string    `json:"query"`
	AISummaryAnswer    string    `json:"ai_summary_answer"`
	AIRelevantArticles []Article `json:"ai_relevant_articles"`
	QueryID            int       `json:"query_id"`
	Timestamp          time.Time `json:"timestamp"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}
