/**
 * Component Integration Tests
 * Tests the integration between different UI components and their interactions
 * Ensures components work together cohesively and maintain state properly
 */

import { test, expect } from '@playwright/test';
import { EventToInsightPage } from './pages/EventToInsightPage';

test.describe('Component Integration Tests', () => {
  let page: EventToInsightPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new EventToInsightPage(playwrightPage);
    await page.goto();
  });

  test.describe('SearchBar Component Integration', () => {
    test('should integrate properly with App state management', async ({ page: playwrightPage }) => {
      // Mock successful search response
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "integration test",
            ai_summary_answer: "Testing component integration between SearchBar and App",
            ai_relevant_articles: [{
              id: 1,
              title: "Integration Test Article",
              content: "Testing component integration functionality"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Verify initial state
      expect(await page.isHeroSectionVisible()).toBe(true);
      expect(await page.isResetButtonVisible()).toBe(false);

      // Perform search
      await page.performSearch('integration test');
      await page.waitForSearchResults();

      // Verify state changes
      expect(await page.isHeroSectionVisible()).toBe(false);
      expect(await page.areSearchResultsVisible()).toBe(true);
      expect(await page.isResetButtonVisible()).toBe(true);
    });

    test('should handle loading states correctly', async ({ page: playwrightPage }) => {
      // Mock delayed response to test loading state
      await playwrightPage.route('**/api/search-query', async route => {
        // Delay response to test loading state
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "loading test",
            ai_summary_answer: "Testing loading state integration",
            ai_relevant_articles: [],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Start search
      await page.searchInput.fill('loading test');
      await page.searchButton.click();

      // Verify loading state
      await expect(page.loadingSpinner).toBeVisible();
      await expect(page.searchButton).toBeDisabled();

      // Wait for loading to finish
      await page.waitForLoadingToFinish();

      // Verify loading state cleared
      await expect(page.loadingSpinner).toBeHidden();
      await expect(page.searchButton).toBeEnabled();
    });

    test('should validate input and show appropriate error messages', async () => {
      // Test empty query validation
      await page.performSearch('');
      await page.waitForErrorMessage();

      expect(await page.isErrorMessageVisible()).toBe(true);
      expect(await page.getErrorMessageText()).toContain('Please enter a search query');

      // Test whitespace-only query validation
      await page.performSearch('   \t\n   ');
      await page.waitForErrorMessage();

      expect(await page.isErrorMessageVisible()).toBe(true);
      expect(await page.getErrorMessageText()).toContain('Please enter a search query');
    });

    test('should integrate with error handling from API', async ({ page: playwrightPage }) => {
      // Mock API error response
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
            message: 'Database connection failed'
          })
        });
      });

      await page.performSearch('error test');
      await page.waitForErrorMessage();

      expect(await page.isErrorMessageVisible()).toBe(true);
      expect(await page.getErrorMessageText()).toContain('search failed');
    });
  });

  test.describe('SearchResults Component Integration', () => {
    test('should integrate with ArticleModal correctly', async ({ page: playwrightPage }) => {
      // Mock search response with multiple articles
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "modal integration test",
            ai_summary_answer: "Testing modal integration with search results",
            ai_relevant_articles: [
              {
                id: 1,
                title: "First Article",
                content: "Content of the first article for testing modal integration"
              },
              {
                id: 2,
                title: "Second Article",
                content: "Content of the second article for testing modal integration"
              }
            ],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('modal integration test');
      await page.waitForSearchResults();

      // Verify articles are displayed
      const articleCount = await page.getArticleCardCount();
      expect(articleCount).toBe(2);

      // Click first article and verify modal integration
      await page.clickArticleCard(0);
      await expect(page.articleModal).toBeVisible();

      const modalTitle = await page.getModalTitle();
      expect(modalTitle).toContain('First Article');

      // Close modal and click second article
      await page.closeModal();
      await expect(page.articleModal).toBeHidden();

      await page.clickArticleCard(1);
      await expect(page.articleModal).toBeVisible();

      const secondModalTitle = await page.getModalTitle();
      expect(secondModalTitle).toContain('Second Article');
    });

    test('should handle no results state properly', async ({ page: playwrightPage }) => {
      // Mock no results response
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "no results test",
            ai_summary_answer: "I couldn't find specific information about your query. Please try rephrasing your question or contact IT support for further assistance.",
            ai_relevant_articles: [],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('no results test');
      await page.waitForNoResultsMessage();

      expect(await page.isNoResultsMessageVisible()).toBe(true);
      expect(await page.getNoResultsMessageText()).toContain("couldn't find specific information");
    });

    test('should display search metadata correctly', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "metadata test query",
            ai_summary_answer: "Testing metadata display",
            ai_relevant_articles: [{
              id: 1,
              title: "Metadata Test Article",
              content: "Testing metadata functionality"
            }],
            query_id: 42,
            timestamp: "2025-07-16T22:30:45Z"
          })
        });
      });

      await page.performSearch('metadata test query');
      await page.waitForSearchResults();

      // Verify query is displayed correctly
      await expect(page.page.getByText('metadata test query')).toBeVisible();

      // Verify timestamp formatting
      await expect(page.page.getByText(/2025/)).toBeVisible();
    });
  });

  test.describe('ArticleModal Component Integration', () => {
    test('should handle modal focus management', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "focus test",
            ai_summary_answer: "Testing focus management",
            ai_relevant_articles: [{
              id: 1,
              title: "Focus Test Article",
              content: "Testing focus management in modal"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('focus test');
      await page.waitForSearchResults();
      await page.clickArticleCard(0);

      // Modal should be visible and focusable
      await expect(page.articleModal).toBeVisible();
      
      // Close button should be accessible
      await expect(page.modalCloseButton).toBeVisible();
      await expect(page.modalCloseButton).toBeEnabled();

      // Should close with close button
      await page.closeModal();
      await expect(page.articleModal).toBeHidden();
    });

    test('should handle backdrop click to close', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "backdrop test",
            ai_summary_answer: "Testing backdrop click functionality",
            ai_relevant_articles: [{
              id: 1,
              title: "Backdrop Test Article",
              content: "Testing backdrop click to close modal"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('backdrop test');
      await page.waitForSearchResults();
      await page.clickArticleCard(0);

      await expect(page.articleModal).toBeVisible();

      // Click on backdrop (outside modal content)
      await page.page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } });
      await expect(page.articleModal).toBeHidden();
    });

    test('should display article content with proper formatting', async ({ page: playwrightPage }) => {
      const longContent = 'This is a test article with multiple paragraphs.\n\nSecond paragraph with more content.\n\nThird paragraph with special characters: !@#$%^&*()';
      
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "formatting test",
            ai_summary_answer: "Testing content formatting",
            ai_relevant_articles: [{
              id: 123,
              title: "Content Formatting Test Article",
              content: longContent
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('formatting test');
      await page.waitForSearchResults();
      await page.clickArticleCard(0);

      await expect(page.articleModal).toBeVisible();

      // Verify article ID is displayed
      await expect(page.page.getByText('Article ID: 123')).toBeVisible();

      // Verify title is displayed
      await expect(page.page.getByText('Content Formatting Test Article')).toBeVisible();

      // Verify content includes special characters and formatting
      await expect(page.page.getByText('!@#$%^&*()')).toBeVisible();
    });
  });

  test.describe('App State Management Integration', () => {
    test('should handle reset functionality properly', async ({ page: playwrightPage }) => {
      // Mock search response
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "reset test",
            ai_summary_answer: "Testing reset functionality",
            ai_relevant_articles: [{
              id: 1,
              title: "Reset Test Article",
              content: "Testing reset state management"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Perform search and verify state
      await page.performSearch('reset test');
      await page.waitForSearchResults();

      expect(await page.areSearchResultsVisible()).toBe(true);
      expect(await page.isHeroSectionVisible()).toBe(false);
      expect(await page.isResetButtonVisible()).toBe(true);

      // Fill search input again
      await page.searchInput.fill('another query');
      expect(await page.getSearchInputValue()).toBe('another query');

      // Reset application
      await page.resetApplication();

      // Verify reset state
      expect(await page.isHeroSectionVisible()).toBe(true);
      expect(await page.areSearchResultsVisible()).toBe(false);
      expect(await page.isResetButtonVisible()).toBe(false);
      expect(await page.getSearchInputValue()).toBe('');
    });

    test('should maintain component states during modal interactions', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "state maintenance test",
            ai_summary_answer: "Testing state maintenance during modal interactions",
            ai_relevant_articles: [{
              id: 1,
              title: "State Test Article",
              content: "Testing state maintenance"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('state maintenance test');
      await page.waitForSearchResults();

      // Verify search results are visible
      expect(await page.areSearchResultsVisible()).toBe(true);

      // Open modal
      await page.clickArticleCard(0);
      await expect(page.articleModal).toBeVisible();

      // Close modal and verify search results are still visible
      await page.closeModal();
      await expect(page.articleModal).toBeHidden();
      expect(await page.areSearchResultsVisible()).toBe(true);

      // Search input should still contain the query
      expect(await page.getSearchInputValue()).toBe('state maintenance test');
    });

    test('should handle multiple state transitions correctly', async ({ page: playwrightPage }) => {
      // Mock different responses for different queries
      await playwrightPage.route('**/api/search-query', async route => {
        const request = route.request();
        const postData = JSON.parse(request.postData() || '{}');
        
        if (postData.query === 'first query') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              query: "first query",
              ai_summary_answer: "First response",
              ai_relevant_articles: [{
                id: 1,
                title: "First Article",
                content: "First article content"
              }],
              query_id: 1,
              timestamp: "2025-07-16T22:00:00Z"
            })
          });
        } else if (postData.query === 'second query') {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Server error',
              message: 'Test error for second query'
            })
          });
        }
      });

      // First search - successful
      await page.performSearch('first query');
      await page.waitForSearchResults();
      expect(await page.areSearchResultsVisible()).toBe(true);
      expect(await page.isErrorMessageVisible()).toBe(false);

      // Second search - error
      await page.performSearch('second query');
      await page.waitForErrorMessage();
      expect(await page.isErrorMessageVisible()).toBe(true);
      expect(await page.areSearchResultsVisible()).toBe(false);

      // Reset and verify clean state
      await page.resetApplication();
      expect(await page.isHeroSectionVisible()).toBe(true);
      expect(await page.isErrorMessageVisible()).toBe(false);
      expect(await page.areSearchResultsVisible()).toBe(false);
    });
  });

  test.describe('API Service Integration', () => {
    test('should handle timeout scenarios gracefully', async ({ page: playwrightPage }) => {
      // Mock timeout by not responding to the request
      await playwrightPage.route('**/api/search-query', async route => {
        // Don't respond - this will cause a timeout
        await new Promise(resolve => setTimeout(resolve, 35000)); // Longer than API timeout
      });

      await page.performSearch('timeout test');
      
      // Should eventually show an error
      await page.waitForErrorMessage();
      expect(await page.isErrorMessageVisible()).toBe(true);
    });

    test('should handle malformed API responses', async ({ page: playwrightPage }) => {
      // Mock malformed JSON response
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

    test('should handle API unavailable scenarios', async ({ page: playwrightPage }) => {
      // Mock network error
      await playwrightPage.route('**/api/search-query', async route => {
        await route.abort('failed');
      });

      await page.performSearch('network error test');
      await page.waitForErrorMessage();
      expect(await page.isErrorMessageVisible()).toBe(true);
    });
  });
});
