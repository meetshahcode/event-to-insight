/**
 * Search Functionality Tests
 * Tests the core search features including successful searches, error handling,
 * and various search scenarios to ensure robust search behavior
 */

import { test, expect } from '@playwright/test';
import { EventToInsightPage } from './pages/EventToInsightPage';

test.describe('Search Functionality', () => {
  let page: EventToInsightPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new EventToInsightPage(playwrightPage);
    await page.goto();
  });

  test('should perform successful password-related search', async ({ page: playwrightPage }) => {
    // Mock the API response for password search
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "How do I reset my password?",
          ai_summary_answer: "To reset your password, go to the login page, click 'Forgot Password', enter your email address, and follow the instructions sent to your email. The reset link expires in 24 hours.",
          ai_relevant_articles: [{
            id: 1,
            title: "Password Reset Instructions",
            content: "Step-by-step password reset guide"
          }],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });

    await page.performSearch('How do I reset my password?');
    await page.waitForSearchResults();

    // Verify search results are displayed
    expect(await page.areSearchResultsVisible()).toBe(true);
    
    // Verify hero section is hidden
    expect(await page.isHeroSectionVisible()).toBe(false);
    
    // Verify reset button is now visible
    expect(await page.isResetButtonVisible()).toBe(true);

    // Check that at least one article is displayed
    const articleCount = await page.getArticleCardCount();
    expect(articleCount).toBeGreaterThan(0);
  });

  test('should perform successful VPN-related search', async ({ page: playwrightPage }) => {
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "VPN connection problems",
          ai_summary_answer: "To set up VPN connection, download the VPN client from the IT portal, install it with admin credentials, and connect to the 'Corporate-Main' server using your domain username and password.",
          ai_relevant_articles: [{
            id: 2,
            title: "VPN Connection Setup",
            content: "VPN configuration and troubleshooting"
          }],
          query_id: 2,
          timestamp: "2025-07-16T22:01:00Z"
        })
      });
    });

    await page.performSearch('VPN connection problems');
    await page.waitForSearchResults();

    expect(await page.areSearchResultsVisible()).toBe(true);
    expect(await page.getArticleCardCount()).toBeGreaterThan(0);
  });

  test('should handle search with multiple relevant articles', async ({ page: playwrightPage }) => {
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "email and password issues",
          ai_summary_answer: "For email and password issues, you can reset your password through the login page and configure your email client with the proper settings.",
          ai_relevant_articles: [
            {
              id: 1,
              title: "Password Reset Instructions",
              content: "Step-by-step password reset guide"
            },
            {
              id: 3,
              title: "Email Client Configuration",
              content: "Email setup for various clients"
            }
          ],
          query_id: 3,
          timestamp: "2025-07-16T22:02:00Z"
        })
      });
    });

    await page.performSearch('email and password issues');
    await page.waitForSearchResults();

    expect(await page.areSearchResultsVisible()).toBe(true);
    
    // Should display multiple articles
    const articleCount = await page.getArticleCardCount();
    expect(articleCount).toBe(2);
  });

  test('should handle no results scenario', async ({ page: playwrightPage }) => {
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "random unrelated query",
          ai_summary_answer: "I couldn't find specific information for your query in our knowledge base. Please contact IT support for further assistance, or try rephrasing your question.",
          ai_relevant_articles: [],
          query_id: 4,
          timestamp: "2025-07-16T22:03:00Z"
        })
      });
    });

    await page.performSearch('random unrelated query');
    await page.waitForNoResultsMessage();

    expect(await page.isNoResultsMessageVisible()).toBe(true);
    expect(await page.getNoResultsMessageText()).toContain("couldn't find specific information");
  });

  test('should handle API server errors', async ({ page: playwrightPage }) => {
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: "Internal server error",
          message: "Failed to process search query"
        })
      });
    });

    await page.performSearch('test query');
    await page.waitForErrorMessage();

    expect(await page.isErrorMessageVisible()).toBe(true);
    expect(await page.getErrorMessageText()).toContain('Failed to process search query');
  });

  test('should handle network timeout errors', async ({ page: playwrightPage }) => {
    await playwrightPage.route('**/api/search-query', async route => {
      // Delay response to simulate timeout
      await new Promise(resolve => setTimeout(resolve, 35000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Success' })
      });
    });

    await page.performSearch('timeout test');
    await page.waitForErrorMessage();

    expect(await page.isErrorMessageVisible()).toBe(true);
  });

  test('should handle malformed API responses', async ({ page: playwrightPage }) => {
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json response'
      });
    });

    await page.performSearch('malformed response test');
    await page.waitForErrorMessage();

    expect(await page.isErrorMessageVisible()).toBe(true);
  });

  test('should reset application state correctly', async ({ page: playwrightPage }) => {
    // Mock successful search first
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "test query",
          ai_summary_answer: "Test response",
          ai_relevant_articles: [{
            id: 1,
            title: "Test Article",
            content: "Test content"
          }],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });

    // Perform search
    await page.performSearch('test query');
    await page.waitForSearchResults();
    
    // Verify search results are shown
    expect(await page.areSearchResultsVisible()).toBe(true);
    expect(await page.isResetButtonVisible()).toBe(true);

    // Reset application
    await page.resetApplication();

    // Verify back to initial state
    expect(await page.isHeroSectionVisible()).toBe(true);
    expect(await page.isResetButtonVisible()).toBe(false);
    expect(await page.getSearchInputValue()).toBe('');
  });

  test('should handle special characters in search queries', async ({ page: playwrightPage }) => {
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "password reset with special characters @#$%",
          ai_summary_answer: "Special characters are handled properly in search queries.",
          ai_relevant_articles: [{
            id: 1,
            title: "Password Reset Instructions",
            content: "Special character handling guide"
          }],
          query_id: 6,
          timestamp: "2025-07-16T22:05:00Z"
        })
      });
    });

    await page.performSearch('password reset with special characters @#$%');
    await page.waitForSearchResults();

    expect(await page.areSearchResultsVisible()).toBe(true);
  });

  test('should handle emoji and unicode in search queries', async ({ page: playwrightPage }) => {
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "🚀 password reset help 🔧",
          ai_summary_answer: "Unicode and emoji characters are supported in search.",
          ai_relevant_articles: [{
            id: 1,
            title: "Password Reset Instructions",
            content: "Unicode support guide"
          }],
          query_id: 7,
          timestamp: "2025-07-16T22:06:00Z"
        })
      });
    });

    await page.performSearch('🚀 password reset help 🔧');
    await page.waitForSearchResults();

    expect(await page.areSearchResultsVisible()).toBe(true);
  });

  test('should handle very long search queries', async ({ page: playwrightPage }) => {
    const longQuery = 'I need help with my password reset because I forgot my password and I cannot access my email account and I tried multiple times but nothing works and I am getting frustrated and I need immediate assistance with this issue please help me solve this problem as soon as possible because I have urgent work to complete and cannot access my systems without the proper authentication credentials that I have unfortunately misplaced or forgotten due to the complexity of the requirements'.repeat(2);

    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: longQuery,
          ai_summary_answer: "Long queries are processed correctly by the system.",
          ai_relevant_articles: [{
            id: 1,
            title: "Password Reset Instructions",
            content: "Long query handling guide"
          }],
          query_id: 8,
          timestamp: "2025-07-16T22:07:00Z"
        })
      });
    });

    await page.performSearch(longQuery);
    await page.waitForSearchResults();

    expect(await page.areSearchResultsVisible()).toBe(true);
  });
});

test.describe('Search Input Validation', () => {
  let page: EventToInsightPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new EventToInsightPage(playwrightPage);
    await page.goto();
  });

  test('should validate empty search queries', async () => {
    await page.performSearch('');
    await page.waitForErrorMessage();

    expect(await page.isErrorMessageVisible()).toBe(true);
    expect(await page.getErrorMessageText()).toContain('Please enter a search query');
  });

  test('should validate whitespace-only queries', async () => {
    await page.performSearch('   \t\n   ');
    await page.waitForErrorMessage();

    expect(await page.isErrorMessageVisible()).toBe(true);
    expect(await page.getErrorMessageText()).toContain('Please enter a search query');
  });

  test('should trim whitespace from valid queries', async ({ page: playwrightPage }) => {
    await playwrightPage.route('**/api/search-query', async route => {
      const request = route.request();
      const body = await request.postDataJSON();
      
      // Verify the query is trimmed
      expect(body.query).toBe('password reset');
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: body.query,
          ai_summary_answer: "Query trimmed successfully",
          ai_relevant_articles: [],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });

    await page.performSearch('  password reset  ');
    await page.waitForLoadingToFinish();
  });

  test('should handle form submission via Enter key', async ({ page: playwrightPage }) => {
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "enter key test",
          ai_summary_answer: "Enter key submission works",
          ai_relevant_articles: [],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });

    await page.searchInput.fill('enter key test');
    await page.searchInput.press('Enter');
    
    await page.waitForLoadingToFinish();
  });

  test('should maintain search input focus during typing', async () => {
    await page.searchInput.focus();
    await page.searchInput.type('test query');
    
    expect(await page.searchInput).toBeFocused();
    expect(await page.getSearchInputValue()).toBe('test query');
  });

  test('should handle rapid sequential searches', async ({ page: playwrightPage }) => {
    let requestCount = 0;
    
    await playwrightPage.route('**/api/search-query', async route => {
      requestCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: `rapid search ${requestCount}`,
          ai_summary_answer: `Response ${requestCount}`,
          ai_relevant_articles: [],
          query_id: requestCount,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });

    // Perform multiple rapid searches
    await page.performSearch('rapid search 1');
    await page.performSearch('rapid search 2');
    await page.performSearch('rapid search 3');
    
    await page.waitForLoadingToFinish();
    
    // Should handle all requests gracefully
    expect(requestCount).toBeGreaterThan(0);
  });
});
