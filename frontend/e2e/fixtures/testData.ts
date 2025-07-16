/**
 * Test fixtures and mock data for Playwright E2E tests
 * Provides reusable test data and response mocks for consistent testing
 */

import { SearchResponse, Article } from '../../src/services/api';

// Mock Articles Data
export const mockArticles: Article[] = [
  {
    id: 1,
    title: "Password Reset Instructions",
    content: "To reset your password: 1) Go to the login page 2) Click 'Forgot Password' 3) Enter your email address 4) Check your email for reset instructions 5) Follow the link and create a new password. The reset link expires in 24 hours."
  },
  {
    id: 2,
    title: "VPN Connection Setup",
    content: "To set up VPN connection: 1) Download VPN client from IT portal 2) Install with admin credentials 3) Connect to 'Corporate-Main' server 4) Use domain username and password 5) Verify connection status. For issues, contact IT support."
  },
  {
    id: 3,
    title: "Email Client Configuration",
    content: "Email setup instructions: IMAP: mail.company.com port 993 SSL. SMTP: mail.company.com port 587 STARTTLS. Username format: firstname.lastname@company.com. For mobile devices, use autodiscovery or manual setup."
  },
  {
    id: 4,
    title: "Printer Setup Guide",
    content: "How to install and configure printers: 1) Connect printer to network 2) Install latest drivers 3) Add printer using IP 192.168.1.100 4) Set as default if needed 5) Test print. For driver issues, download from manufacturer website."
  },
  {
    id: 5,
    title: "Software Installation",
    content: "Installing and updating software: 1) Download from approved software center 2) Run as administrator 3) Follow installation wizard 4) Restart if required 5) Check for updates. Contact IT for license issues."
  }
];

// Mock Search Responses
export const mockSearchResponses = {
  passwordQuery: {
    query: "How do I reset my password?",
    ai_summary_answer: "To reset your password, go to the login page, click 'Forgot Password', enter your email address, and follow the instructions sent to your email. The reset link expires in 24 hours.",
    ai_relevant_articles: [mockArticles[0]],
    query_id: 1,
    timestamp: "2025-07-16T22:00:00Z"
  } as SearchResponse,

  vpnQuery: {
    query: "VPN connection problems",
    ai_summary_answer: "To set up VPN connection, download the VPN client from the IT portal, install it with admin credentials, and connect to the 'Corporate-Main' server using your domain username and password.",
    ai_relevant_articles: [mockArticles[1]],
    query_id: 2,
    timestamp: "2025-07-16T22:01:00Z"
  } as SearchResponse,

  multipleResultsQuery: {
    query: "email and password issues",
    ai_summary_answer: "For email and password issues, you can reset your password through the login page and configure your email client with the proper settings.",
    ai_relevant_articles: [mockArticles[0], mockArticles[2]],
    query_id: 3,
    timestamp: "2025-07-16T22:02:00Z"
  } as SearchResponse,

  noResultsQuery: {
    query: "random unrelated query",
    ai_summary_answer: "I couldn't find specific information for your query in our knowledge base. Please contact IT support for further assistance, or try rephrasing your question.",
    ai_relevant_articles: [],
    query_id: 4,
    timestamp: "2025-07-16T22:03:00Z"
  } as SearchResponse,

  longQuery: {
    query: "I'm having trouble with my computer and it keeps freezing and crashing and I don't know what to do please help me fix this issue",
    ai_summary_answer: "For computer freezing and crashing issues, try restarting your computer, checking for software updates, and running a virus scan. If the problem persists, contact IT support for hardware diagnostics.",
    ai_relevant_articles: [mockArticles[4]],
    query_id: 5,
    timestamp: "2025-07-16T22:04:00Z"
  } as SearchResponse,

  specialCharactersQuery: {
    query: "password reset with special characters @#$%",
    ai_summary_answer: "To reset your password, go to the login page, click 'Forgot Password', enter your email address, and follow the instructions sent to your email. Special characters are allowed in passwords.",
    ai_relevant_articles: [mockArticles[0]],
    query_id: 6,
    timestamp: "2025-07-16T22:05:00Z"
  } as SearchResponse
};

// Mock Error Responses
export const mockErrorResponses = {
  serverError: {
    error: "Internal server error",
    message: "Failed to process search query"
  },
  networkError: {
    error: "Network error",
    message: "Unable to connect to server"
  },
  timeoutError: {
    error: "Request timeout",
    message: "Server took too long to respond"
  },
  validationError: {
    error: "Validation error",
    message: "Query cannot be empty"
  }
};

// Test Data Collections
export const testQueries = {
  valid: [
    "password reset",
    "VPN connection",
    "email setup",
    "printer issues",
    "software installation"
  ],
  invalid: [
    "",
    "   ",
    "\n\t",
  ],
  edge: [
    "a", // single character
    "x".repeat(1000), // very long query
    "🚀 emoji query 🔧", // emoji characters
    "Spëcîål chäractërs", // accented characters
    "How do I reset my password? Can you help me with VPN setup too?" // multiple questions
  ]
};

// UI Selectors (can be moved to Page Object Model later)
export const selectors = {
  searchInput: 'input[placeholder*="Ask any IT question"]',
  searchButton: 'button[type="submit"]',
  loadingSpinner: '[data-testid="loading-spinner"]',
  searchResults: '[data-testid="search-results"]',
  articleCard: '[data-testid="article-card"]',
  articleModal: '[data-testid="article-modal"]',
  errorMessage: '[data-testid="error-message"]',
  noResultsMessage: '[data-testid="no-results-message"]',
  resetButton: 'button:has-text("Reset")',
  apiStatusLink: 'a:has-text("API Status")',
  githubLink: 'a:has-text("GitHub")',
  modalCloseButton: '[data-testid="modal-close"]',
  heroSection: '[data-testid="hero-section"]'
};

// Viewport configurations for responsive testing
export const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  largeDesktop: { width: 2560, height: 1440 }
};

// Animation and timeout configurations
export const timeouts = {
  short: 2000,
  medium: 5000,
  long: 10000,
  apiResponse: 30000
};

export default {
  mockArticles,
  mockSearchResponses,
  mockErrorResponses,
  testQueries,
  selectors,
  viewports,
  timeouts
};
