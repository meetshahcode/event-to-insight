/**
 * API Integration Tests
 * Tests the frontend's integration with the backend API service
 * Ensures proper handling of all API responses and error conditions
 */

import { test, expect } from '@playwright/test';
import { EventToInsightPage } from './pages/EventToInsightPage';

test.describe('API Integration Tests', () => {
  let page: EventToInsightPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new EventToInsightPage(playwrightPage);
    await page.goto();
  });

  test.describe('Search API Integration', () => {
    test('should handle successful search responses correctly', async ({ page: playwrightPage }) => {
      const mockResponse = {
        query: "successful search test",
        ai_summary_answer: "This is a comprehensive answer from the AI assistant that provides helpful information about the user's query.",
        ai_relevant_articles: [
          {
            id: 1,
            title: "Comprehensive Guide to IT Support",
            content: "This article provides detailed information about common IT support scenarios, including troubleshooting steps, best practices, and prevention measures."
          },
          {
            id: 2,
            title: "Advanced Troubleshooting Techniques",
            content: "Learn advanced troubleshooting techniques for complex IT issues that require deeper analysis and systematic approaches."
          }
        ],
        query_id: 12345,
        timestamp: "2025-07-16T22:00:00Z"
      };

      await playwrightPage.route('**/api/search-query', async route => {
        // Verify request structure
        const request = route.request();
        expect(request.method()).toBe('POST');
        expect(request.headers()['content-type']).toContain('application/json');
        
        const postData = JSON.parse(request.postData() || '{}');
        expect(postData).toHaveProperty('query');
        expect(postData.query).toBe('successful search test');

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockResponse)
        });
      });

      await page.performSearch('successful search test');
      await page.waitForSearchResults();

      // Verify response data is displayed correctly
      expect(await page.areSearchResultsVisible()).toBe(true);
      await expect(page.page.getByText('successful search test')).toBeVisible();
      await expect(page.page.getByText('This is a comprehensive answer')).toBeVisible();
      
      // Verify article count and content
      const articleCount = await page.getArticleCardCount();
      expect(articleCount).toBe(2);
      
      const firstArticleTitle = await page.getArticleCardTitle(0);
      expect(firstArticleTitle).toContain('Comprehensive Guide to IT Support');
    });

    test('should handle HTTP 4xx client errors properly', async ({ page: playwrightPage }) => {
      const errorCodes = [400, 401, 403, 404, 422];

      for (const statusCode of errorCodes) {
        await playwrightPage.route('**/api/search-query', async route => {
          await route.fulfill({
            status: statusCode,
            contentType: 'application/json',
            body: JSON.stringify({
              error: `Client error ${statusCode}`,
              message: `Test error message for status ${statusCode}`
            })
          });
        });

        await page.performSearch(`error test ${statusCode}`);
        await page.waitForErrorMessage();

        expect(await page.isErrorMessageVisible()).toBe(true);
        expect(await page.getErrorMessageText()).toContain('search failed');

        // Reset for next iteration
        await page.resetApplication();
      }
    });

    test('should handle HTTP 5xx server errors properly', async ({ page: playwrightPage }) => {
      const errorCodes = [500, 502, 503, 504];

      for (const statusCode of errorCodes) {
        await playwrightPage.route('**/api/search-query', async route => {
          await route.fulfill({
            status: statusCode,
            contentType: 'application/json',
            body: JSON.stringify({
              error: `Server error ${statusCode}`,
              message: `Internal server error: ${statusCode}`
            })
          });
        });

        await page.performSearch(`server error ${statusCode}`);
        await page.waitForErrorMessage();

        expect(await page.isErrorMessageVisible()).toBe(true);
        expect(await page.getErrorMessageText()).toContain('search failed');

        // Reset for next iteration
        await page.resetApplication();
      }
    });

    test('should handle network connectivity issues', async ({ page: playwrightPage }) => {
      // Test different network failure scenarios
      const networkErrors = ['failed', 'connectionrefused', 'timeout', 'connectionreset'];

      for (const errorType of networkErrors) {
        await playwrightPage.route('**/api/search-query', async route => {
          await route.abort(errorType as any);
        });

        await page.performSearch(`network error ${errorType}`);
        await page.waitForErrorMessage();

        expect(await page.isErrorMessageVisible()).toBe(true);
        expect(await page.getErrorMessageText()).toContain('search failed');

        // Reset for next iteration
        await page.resetApplication();
      }
    });

    test('should handle malformed JSON responses', async ({ page: playwrightPage }) => {
      const malformedResponses = [
        'invalid json',
        '{"incomplete": "json"',
        '{"valid": "json", "but": "missing required fields"}',
        '',
        '<html>Not JSON at all</html>'
      ];

      for (let i = 0; i < malformedResponses.length; i++) {
        const response = malformedResponses[i];
        
        await playwrightPage.route('**/api/search-query', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: response
          });
        });

        await page.performSearch(`malformed test ${i}`);
        await page.waitForErrorMessage();

        expect(await page.isErrorMessageVisible()).toBe(true);

        // Reset for next iteration
        await page.resetApplication();
      }
    });

    test('should handle responses with missing required fields', async ({ page: playwrightPage }) => {
      const incompleteResponses = [
        {}, // Empty object
        { query: "test" }, // Missing other fields
        { ai_summary_answer: "answer" }, // Missing query and articles
        { query: "test", ai_summary_answer: "answer" }, // Missing articles array
        { query: "test", ai_relevant_articles: [] }, // Missing summary
      ];

      for (let i = 0; i < incompleteResponses.length; i++) {
        const response = incompleteResponses[i];
        
        await playwrightPage.route('**/api/search-query', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(response)
          });
        });

        await page.performSearch(`incomplete test ${i}`);
        
        // Should either show error or handle gracefully
        try {
          await page.waitForErrorMessage();
          expect(await page.isErrorMessageVisible()).toBe(true);
        } catch {
          // If no error shown, should at least not crash
          expect(await page.isHeroSectionVisible() || await page.areSearchResultsVisible()).toBe(true);
        }

        // Reset for next iteration
        await page.resetApplication();
      }
    });
  });

  test.describe('API Request Validation', () => {
    test('should send properly formatted requests', async ({ page: playwrightPage }) => {
      let requestCaptured = false;
      let requestData: any = null;

      await playwrightPage.route('**/api/search-query', async route => {
        const request = route.request();
        requestData = {
          method: request.method(),
          url: request.url(),
          headers: request.headers(),
          postData: JSON.parse(request.postData() || '{}')
        };
        requestCaptured = true;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "request validation test",
            ai_summary_answer: "Testing request format",
            ai_relevant_articles: [],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('request validation test');
      await page.waitForSearchResults();

      expect(requestCaptured).toBe(true);
      expect(requestData.method).toBe('POST');
      expect(requestData.url).toContain('/api/search-query');
      expect(requestData.headers['content-type']).toContain('application/json');
      expect(requestData.postData).toHaveProperty('query');
      expect(requestData.postData.query).toBe('request validation test');
    });

    test('should handle special characters in queries properly', async ({ page: playwrightPage }) => {
      const specialQueries = [
        'query with "quotes" and symbols !@#$%^&*()',
        'query with\nnewlines and\ttabs',
        'query with unicode: 你好世界 🚀🌟',
        'query with emojis: 😀😃😄😁😆',
        "query with apostrophes and 'single quotes'",
        'query with <HTML> tags and &ampersands;'
      ];

      for (let i = 0; i < specialQueries.length; i++) {
        const query = specialQueries[i];
        let receivedQuery = '';

        await playwrightPage.route('**/api/search-query', async route => {
          const postData = JSON.parse(route.request().postData() || '{}');
          receivedQuery = postData.query;

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              query: receivedQuery,
              ai_summary_answer: `Processed special query: ${receivedQuery}`,
              ai_relevant_articles: [],
              query_id: i + 1,
              timestamp: "2025-07-16T22:00:00Z"
            })
          });
        });

        await page.performSearch(query);
        await page.waitForSearchResults();

        // Verify the query was transmitted correctly
        expect(receivedQuery).toBe(query);

        // Reset for next iteration
        await page.resetApplication();
      }
    });

    test('should handle very long queries properly', async ({ page: playwrightPage }) => {
      const longQuery = 'This is a very long query that exceeds normal length expectations. '.repeat(50);

      let receivedQuery = '';

      await playwrightPage.route('**/api/search-query', async route => {
        const postData = JSON.parse(route.request().postData() || '{}');
        receivedQuery = postData.query;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: receivedQuery,
            ai_summary_answer: "Processed long query successfully",
            ai_relevant_articles: [{
              id: 1,
              title: "Long Query Test",
              content: "Testing handling of very long queries"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch(longQuery);
      await page.waitForSearchResults();

      expect(receivedQuery).toBe(longQuery);
      expect(await page.areSearchResultsVisible()).toBe(true);
    });
  });

  test.describe('Response Data Handling', () => {
    test('should handle large article datasets correctly', async ({ page: playwrightPage }) => {
      // Generate a large dataset of articles
      const largeArticleSet = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        title: `Large Dataset Article ${i + 1}`,
        content: `This is article content for article number ${i + 1}. `.repeat(20)
      }));

      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "large dataset test",
            ai_summary_answer: "Testing handling of large article datasets with comprehensive information and detailed analysis.",
            ai_relevant_articles: largeArticleSet,
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('large dataset test');
      await page.waitForSearchResults();

      expect(await page.areSearchResultsVisible()).toBe(true);
      const articleCount = await page.getArticleCardCount();
      expect(articleCount).toBe(20);

      // Test that each article can be opened
      await page.clickArticleCard(0);
      await expect(page.articleModal).toBeVisible();
      await page.closeModal();

      await page.clickArticleCard(19);
      await expect(page.articleModal).toBeVisible();
      await page.closeModal();
    });

    test('should handle articles with extreme content sizes', async ({ page: playwrightPage }) => {
      const extremeContent = 'This is an extremely long article content that simulates real-world scenarios where articles might contain extensive documentation, detailed procedures, or comprehensive guides. '.repeat(500);

      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "extreme content test",
            ai_summary_answer: "Testing extreme content handling",
            ai_relevant_articles: [{
              id: 999,
              title: "Extremely Long Article",
              content: extremeContent
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('extreme content test');
      await page.waitForSearchResults();

      expect(await page.areSearchResultsVisible()).toBe(true);
      
      // Open the article modal and verify it handles large content
      await page.clickArticleCard(0);
      await expect(page.articleModal).toBeVisible();
      
      // Modal should be scrollable for large content
      const modalContent = page.modalContent;
      await expect(modalContent).toBeVisible();
      
      // Verify the content is displayed (at least partially)
      await expect(page.page.getByText('Extremely Long Article')).toBeVisible();
    });

    test('should handle malformed article data gracefully', async ({ page: playwrightPage }) => {
      const malformedArticles = [
        { id: 1 }, // Missing title and content
        { title: "No ID Article" }, // Missing id and content
        { id: 2, title: "", content: "" }, // Empty strings
        { id: null, title: null, content: null }, // Null values
        { id: "string", title: 123, content: true }, // Wrong types
      ];

      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "malformed articles test",
            ai_summary_answer: "Testing malformed article data handling",
            ai_relevant_articles: malformedArticles,
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('malformed articles test');
      
      // Should handle gracefully without crashing
      try {
        await page.waitForSearchResults();
        expect(await page.areSearchResultsVisible()).toBe(true);
      } catch {
        // If it shows an error instead, that's also acceptable
        await page.waitForErrorMessage();
        expect(await page.isErrorMessageVisible()).toBe(true);
      }
    });
  });

  test.describe('API Performance Testing', () => {
    test('should handle slow API responses gracefully', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        // Simulate slow response
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "slow response test",
            ai_summary_answer: "Testing slow API response handling",
            ai_relevant_articles: [{
              id: 1,
              title: "Slow Response Article",
              content: "Testing slow response scenarios"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      const startTime = Date.now();
      
      await page.performSearch('slow response test');
      
      // Should show loading state during slow response
      await expect(page.loadingSpinner).toBeVisible();
      
      await page.waitForSearchResults();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeGreaterThan(2900); // Should have waited for the delay
      expect(await page.areSearchResultsVisible()).toBe(true);
    });

    test('should handle concurrent requests properly', async ({ page: playwrightPage }) => {
      let requestCount = 0;

      await playwrightPage.route('**/api/search-query', async route => {
        requestCount++;
        const currentRequest = requestCount;
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: `concurrent test ${currentRequest}`,
            ai_summary_answer: `Response ${currentRequest}`,
            ai_relevant_articles: [{
              id: currentRequest,
              title: `Concurrent Article ${currentRequest}`,
              content: `Content for request ${currentRequest}`
            }],
            query_id: currentRequest,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Perform rapid searches
      await page.performSearch('concurrent test 1');
      await page.performSearch('concurrent test 2');
      await page.performSearch('concurrent test 3');

      await page.waitForSearchResults();

      // Should handle the last request properly
      expect(await page.areSearchResultsVisible()).toBe(true);
      
      // The final displayed result should be from one of the requests
      const displayedQuery = await page.page.getByText(/concurrent test/).textContent();
      expect(displayedQuery).toContain('concurrent test');
    });
  });
});
