package ai

import (
	"context"
	"event-to-insight/internal/models"
	"fmt"
	"strconv"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// AIServiceInterface defines the contract for AI operations
type AIServiceInterface interface {
	AnalyzeQuery(query string, articles []models.Article) (*AIAnalysisResult, error)
}

// AIAnalysisResult represents the result of AI analysis
type AIAnalysisResult struct {
	Summary          string
	RelevantArticles []int
}

// GeminiService implements AIServiceInterface using Google's Gemini AI
type GeminiService struct {
	client *genai.Client
	model  *genai.GenerativeModel
}

// NewGeminiService creates a new Gemini AI service
func NewGeminiService(apiKey string) (*GeminiService, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("API key is required")
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create Gemini client: %w", err)
	}

	// model := client.GenerativeModel("gemini-pro")
	model := client.GenerativeModel("gemini-2.0-flash")

	return &GeminiService{
		client: client,
		model:  model,
	}, nil
}

// AnalyzeQuery analyzes the user query against available articles
func (g *GeminiService) AnalyzeQuery(query string, articles []models.Article) (*AIAnalysisResult, error) {
	ctx := context.Background()

	// Build the knowledge base context
	articlesContext := g.buildArticlesContext(articles)

	// Create the prompt
	prompt := g.buildPrompt(query, articlesContext)

	// Generate response
	resp, err := g.model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return nil, fmt.Errorf("failed to generate content: %w", err)
	}

	if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("no response generated")
	}

	// Parse the response
	responseText := fmt.Sprintf("%v", resp.Candidates[0].Content.Parts[0])
	return g.parseResponse(responseText, articles)
}

// buildArticlesContext creates a formatted string of all articles
func (g *GeminiService) buildArticlesContext(articles []models.Article) string {
	var builder strings.Builder
	builder.WriteString("Available Knowledge Base Articles:\n\n")

	for _, article := range articles {
		builder.WriteString(fmt.Sprintf("Article ID: %d\n", article.ID))
		builder.WriteString(fmt.Sprintf("Title: %s\n", article.Title))
		builder.WriteString(fmt.Sprintf("Content: %s\n\n", article.Content))
	}

	return builder.String()
}

// buildPrompt creates the AI prompt
func (g *GeminiService) buildPrompt(query string, articlesContext string) string {
	return fmt.Sprintf(`You are an IT support assistant helping users find answers to their technical questions.

%s

User Query: "%s"

Please analyze the user's query and provide:

1. SUMMARY: A concise, helpful answer based on the relevant articles above. If no articles are relevant, provide general guidance and suggest contacting IT support.

2. RELEVANT_ARTICLES: List the Article IDs (numbers only, comma-separated) of articles that are most relevant to answering this query. If no articles are relevant, return "none".

Format your response exactly as follows:
SUMMARY: [Your concise answer here]
RELEVANT_ARTICLES: [comma-separated Article IDs or "none"]

Example:
SUMMARY: To reset your password, go to the login page, click 'Forgot Password', enter your email, and follow the instructions sent to your email.
RELEVANT_ARTICLES: 1,3

Now analyze the user's query:`, articlesContext, query)
}

// parseResponse parses the AI response to extract summary and relevant articles
func (g *GeminiService) parseResponse(response string, articles []models.Article) (*AIAnalysisResult, error) {
	lines := strings.Split(response, "\n")

	var summary string
	var relevantArticleIDs []int

	for _, line := range lines {
		line = strings.TrimSpace(line)

		if strings.HasPrefix(line, "SUMMARY:") {
			summary = strings.TrimSpace(strings.TrimPrefix(line, "SUMMARY:"))
		} else if strings.HasPrefix(line, "RELEVANT_ARTICLES:") {
			articlesStr := strings.TrimSpace(strings.TrimPrefix(line, "RELEVANT_ARTICLES:"))
			if articlesStr != "none" && articlesStr != "" {
				articleStrs := strings.Split(articlesStr, ",")
				for _, articleStr := range articleStrs {
					articleStr = strings.TrimSpace(articleStr)
					if id, err := strconv.Atoi(articleStr); err == nil {
						// Validate that the article ID exists
						if g.articleExists(id, articles) {
							relevantArticleIDs = append(relevantArticleIDs, id)
						}
					}
				}
			}
		}
	}

	// Fallback if parsing failed
	if summary == "" {
		summary = "I found some information that might help you. Please review the relevant articles below, or contact IT support for further assistance."
	}

	return &AIAnalysisResult{
		Summary:          summary,
		RelevantArticles: relevantArticleIDs,
	}, nil
}

// articleExists checks if an article ID exists in the provided articles
func (g *GeminiService) articleExists(id int, articles []models.Article) bool {
	for _, article := range articles {
		if article.ID == id {
			return true
		}
	}
	return false
}

// Close closes the AI service client
func (g *GeminiService) Close() error {
	return g.client.Close()
}
