package ai

import (
	"event-to-insight/internal/models"
	"strings"
)

// MockAIService implements AIServiceInterface for testing
type MockAIService struct{}

// NewMockAIService creates a new mock AI service
func NewMockAIService() *MockAIService {
	return &MockAIService{}
}

// AnalyzeQuery provides mock analysis of queries
func (m *MockAIService) AnalyzeQuery(query string, articles []models.Article) (*AIAnalysisResult, error) {
	query = strings.ToLower(query)
	
	var relevantArticles []int
	var summary string

	// Simple keyword matching logic for mock
	for _, article := range articles {
		articleText := strings.ToLower(article.Title + " " + article.Content)
		
		if strings.Contains(query, "password") && strings.Contains(articleText, "password") {
			relevantArticles = append(relevantArticles, article.ID)
		} else if strings.Contains(query, "vpn") && strings.Contains(articleText, "vpn") {
			relevantArticles = append(relevantArticles, article.ID)
		} else if strings.Contains(query, "email") && strings.Contains(articleText, "email") {
			relevantArticles = append(relevantArticles, article.ID)
		} else if strings.Contains(query, "printer") && strings.Contains(articleText, "printer") {
			relevantArticles = append(relevantArticles, article.ID)
		} else if strings.Contains(query, "software") && strings.Contains(articleText, "software") {
			relevantArticles = append(relevantArticles, article.ID)
		} else if strings.Contains(query, "backup") && strings.Contains(articleText, "backup") {
			relevantArticles = append(relevantArticles, article.ID)
		} else if strings.Contains(query, "antivirus") && strings.Contains(articleText, "antivirus") {
			relevantArticles = append(relevantArticles, article.ID)
		} else if strings.Contains(query, "remote") && strings.Contains(articleText, "remote") {
			relevantArticles = append(relevantArticles, article.ID)
		}
	}

	// Generate summary based on query type
	if strings.Contains(query, "password") {
		summary = "To reset your password, go to the login page, click 'Forgot Password', enter your email address, and follow the instructions sent to your email. The reset link expires in 24 hours."
	} else if strings.Contains(query, "vpn") {
		summary = "To set up VPN connection, download the VPN client from the IT portal, install it with admin credentials, and connect to the 'Corporate-Main' server using your domain username and password."
	} else if strings.Contains(query, "email") {
		summary = "For email configuration, use IMAP: mail.company.com port 993 SSL and SMTP: mail.company.com port 587 STARTTLS. Ensure your username format is firstname.lastname@company.com."
	} else if strings.Contains(query, "printer") {
		summary = "For printer issues, ensure the printer is connected to the corporate network, install latest drivers, and add printer using IP address 192.168.1.100."
	} else if len(relevantArticles) > 0 {
		summary = "I found relevant information in our knowledge base that should help with your query. Please review the articles below for detailed instructions."
	} else {
		summary = "I couldn't find specific information for your query in our knowledge base. Please contact IT support for further assistance, or try rephrasing your question."
	}

	return &AIAnalysisResult{
		Summary:          summary,
		RelevantArticles: relevantArticles,
	}, nil
}
