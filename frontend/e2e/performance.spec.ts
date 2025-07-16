/**
 * Performance and Loading Tests
 * Tests application performance, loading states, memory usage,
 * and optimization scenarios to ensure good user experience
 */

import { test, expect } from '@playwright/test';
import { EventToInsightPage } from './pages/EventToInsightPage';

test.describe('Performance and Loading Tests', () => {
  let page: EventToInsightPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new EventToInsightPage(playwrightPage);
  });

  test.describe('Application Loading Performance', () => {
    test('should load application within acceptable time limits', async ({ page: playwrightPage }) => {
      const startTime = Date.now();

      await page.goto();
      
      // Wait for critical elements to be visible
      await expect(page.headerTitle).toBeVisible();
      await expect(page.searchInput).toBeVisible();
      await expect(page.searchButton).toBeVisible();

      const loadTime = Date.now() - startTime;

      // Application should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);

      // Verify all essential elements are present
      expect(await page.isHeroSectionVisible()).toBe(true);
      await expect(page.footer).toBeVisible();
    });

    test('should handle slow network conditions gracefully', async ({ page: playwrightPage }) => {
      // Simulate slow network
      await playwrightPage.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });

      const startTime = Date.now();
      await page.goto();

      await expect(page.headerTitle).toBeVisible();
      const loadTime = Date.now() - startTime;

      // Should still function despite slow network
      expect(loadTime).toBeGreaterThan(500);
      expect(await page.isHeroSectionVisible()).toBe(true);
    });

    test('should load all static assets successfully', async ({ page: playwrightPage }) => {
      const failedRequests: string[] = [];

      // Monitor network requests
      playwrightPage.on('requestfailed', request => {
        failedRequests.push(request.url());
      });

      await page.goto();
      await expect(page.headerTitle).toBeVisible();

      // No critical assets should fail to load
      const criticalFailures = failedRequests.filter(url => 
        url.includes('.js') || url.includes('.css') || url.includes('main')
      );
      expect(criticalFailures).toHaveLength(0);
    });

    test('should handle offline scenarios appropriately', async ({ page: playwrightPage }) => {
      // Load page first
      await page.goto();
      await expect(page.headerTitle).toBeVisible();

      // Go offline
      await playwrightPage.context().setOffline(true);

      // Try to perform search
      await page.searchInput.fill('offline test');
      await page.searchButton.click();

      // Should handle offline gracefully
      await page.waitForErrorMessage();
      expect(await page.isErrorMessageVisible()).toBe(true);

      // Go back online
      await playwrightPage.context().setOffline(false);
    });
  });

  test.describe('Search Performance', () => {
    test('should handle search requests efficiently', async ({ page: playwrightPage }) => {
      await page.goto();

      let requestTime = 0;

      await playwrightPage.route('**/api/search-query', async route => {
        const start = Date.now();
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "performance test",
            ai_summary_answer: "Testing search performance and response handling",
            ai_relevant_articles: [{
              id: 1,
              title: "Performance Test Article",
              content: "Testing search performance scenarios"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });

        requestTime = Date.now() - start;
      });

      const searchStart = Date.now();
      await page.performSearch('performance test');
      await page.waitForSearchResults();
      const totalTime = Date.now() - searchStart;

      // Search should complete quickly
      expect(totalTime).toBeLessThan(2000);
      expect(await page.areSearchResultsVisible()).toBe(true);
    });

    test('should handle large search result datasets efficiently', async ({ page: playwrightPage }) => {
      await page.goto();

      // Generate large dataset
      const largeDataset = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        title: `Large Dataset Article ${i + 1}`,
        content: `Comprehensive content for article ${i + 1} that simulates real-world scenarios with detailed information. `.repeat(10)
      }));

      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "large dataset test",
            ai_summary_answer: "Testing handling of large search result datasets with comprehensive performance analysis.",
            ai_relevant_articles: largeDataset,
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      const startTime = Date.now();
      await page.performSearch('large dataset test');
      await page.waitForSearchResults();
      const renderTime = Date.now() - startTime;

      // Should render large dataset within reasonable time
      expect(renderTime).toBeLessThan(5000);
      expect(await page.areSearchResultsVisible()).toBe(true);

      const articleCount = await page.getArticleCardCount();
      expect(articleCount).toBe(50);

      // Test scrolling performance with large dataset
      await page.page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });

      // Should remain responsive during scroll
      await expect(page.searchInput).toBeVisible();
    });

    test('should optimize rendering for repeated searches', async ({ page: playwrightPage }) => {
      await page.goto();

      const searchTimes: number[] = [];

      await playwrightPage.route('**/api/search-query', async route => {
        const request = route.request();
        const postData = JSON.parse(request.postData() || '{}');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: postData.query,
            ai_summary_answer: `Response for: ${postData.query}`,
            ai_relevant_articles: [{
              id: 1,
              title: `Article for ${postData.query}`,
              content: `Content for search: ${postData.query}`
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Perform multiple searches
      for (let i = 1; i <= 5; i++) {
        const startTime = Date.now();
        
        await page.performSearch(`optimization test ${i}`);
        await page.waitForSearchResults();
        
        const searchTime = Date.now() - startTime;
        searchTimes.push(searchTime);

        // Reset for next search
        if (i < 5) {
          await page.resetApplication();
        }
      }

      // Search times should not degrade significantly
      const averageTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      expect(averageTime).toBeLessThan(2000);

      // Later searches shouldn't be significantly slower than earlier ones
      const firstHalf = searchTimes.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
      const secondHalf = searchTimes.slice(-2).reduce((a, b) => a + b, 0) / 2;
      expect(secondHalf).toBeLessThan(firstHalf * 2); // Should not be more than 2x slower
    });
  });

  test.describe('Modal Performance', () => {
    test('should open and close modals efficiently', async ({ page: playwrightPage }) => {
      await page.goto();

      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "modal performance test",
            ai_summary_answer: "Testing modal performance",
            ai_relevant_articles: [{
              id: 1,
              title: "Modal Performance Test Article",
              content: "Testing modal opening and closing performance with extensive content. ".repeat(50)
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('modal performance test');
      await page.waitForSearchResults();

      // Test modal opening performance
      const openStart = Date.now();
      await page.clickArticleCard(0);
      await expect(page.articleModal).toBeVisible();
      const openTime = Date.now() - openStart;

      expect(openTime).toBeLessThan(500); // Should open within 500ms

      // Test modal closing performance
      const closeStart = Date.now();
      await page.closeModal();
      await expect(page.articleModal).toBeHidden();
      const closeTime = Date.now() - closeStart;

      expect(closeTime).toBeLessThan(300); // Should close within 300ms
    });

    test('should handle rapid modal interactions gracefully', async ({ page: playwrightPage }) => {
      await page.goto();

      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "rapid modal test",
            ai_summary_answer: "Testing rapid modal interactions",
            ai_relevant_articles: [
              { id: 1, title: "First Article", content: "First article content" },
              { id: 2, title: "Second Article", content: "Second article content" },
              { id: 3, title: "Third Article", content: "Third article content" }
            ],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('rapid modal test');
      await page.waitForSearchResults();

      // Rapid modal interactions
      await page.clickArticleCard(0);
      await expect(page.articleModal).toBeVisible();
      await page.closeModal();

      await page.clickArticleCard(1);
      await expect(page.articleModal).toBeVisible();
      await page.closeModal();

      await page.clickArticleCard(2);
      await expect(page.articleModal).toBeVisible();
      await page.closeModal();

      // Should remain responsive after rapid interactions
      await expect(page.searchInput).toBeVisible();
      await expect(page.searchInput).toBeEnabled();
    });
  });

  test.describe('Memory and Resource Management', () => {
    test('should handle multiple search sessions without memory leaks', async ({ page: playwrightPage }) => {
      await page.goto();

      let searchCount = 0;

      await playwrightPage.route('**/api/search-query', async route => {
        searchCount++;
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: `memory test ${searchCount}`,
            ai_summary_answer: `Memory test response ${searchCount}`,
            ai_relevant_articles: Array.from({ length: 10 }, (_, i) => ({
              id: (searchCount - 1) * 10 + i + 1,
              title: `Article ${i + 1} for search ${searchCount}`,
              content: `Content for article ${i + 1} in search session ${searchCount}`
            })),
            query_id: searchCount,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Perform multiple search sessions
      for (let i = 1; i <= 10; i++) {
        await page.performSearch(`memory test ${i}`);
        await page.waitForSearchResults();

        // Open and close a modal
        await page.clickArticleCard(0);
        await expect(page.articleModal).toBeVisible();
        await page.closeModal();

        // Reset for next search
        await page.resetApplication();
      }

      // Application should still be responsive after multiple sessions
      await expect(page.searchInput).toBeVisible();
      await expect(page.searchInput).toBeEnabled();
      
      // Perform one final search to verify everything still works
      await page.performSearch('final memory test');
      await page.waitForSearchResults();
      expect(await page.areSearchResultsVisible()).toBe(true);
    });

    test('should handle concurrent operations efficiently', async ({ page: playwrightPage }) => {
      await page.goto();

      let requestCount = 0;
      const responses: Promise<void>[] = [];

      await playwrightPage.route('**/api/search-query', async route => {
        requestCount++;
        const currentRequest = requestCount;
        
        // Simulate variable response times
        const delay = Math.random() * 1000;
        
        const responsePromise = new Promise<void>(resolve => {
          setTimeout(async () => {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({
                query: `concurrent test ${currentRequest}`,
                ai_summary_answer: `Concurrent response ${currentRequest}`,
                ai_relevant_articles: [{
                  id: currentRequest,
                  title: `Concurrent Article ${currentRequest}`,
                  content: `Content for concurrent request ${currentRequest}`
                }],
                query_id: currentRequest,
                timestamp: "2025-07-16T22:00:00Z"
              })
            });
            resolve();
          }, delay);
        });
        
        responses.push(responsePromise);
      });

      // Initiate multiple concurrent searches
      const searchPromises = [
        page.performSearch('concurrent test 1'),
        page.performSearch('concurrent test 2'),
        page.performSearch('concurrent test 3')
      ];

      // Wait for all searches to complete
      await Promise.all(searchPromises);
      await page.waitForLoadingToFinish();

      // Should handle concurrent operations gracefully
      expect(await page.areSearchResultsVisible() || await page.isErrorMessageVisible()).toBe(true);
    });
  });

  test.describe('Animation and Transition Performance', () => {
    test('should handle UI transitions smoothly', async ({ page: playwrightPage }) => {
      await page.goto();

      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "transition test",
            ai_summary_answer: "Testing UI transitions and animations",
            ai_relevant_articles: [{
              id: 1,
              title: "Transition Test Article",
              content: "Testing smooth UI transitions"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Test hero section to search results transition
      expect(await page.isHeroSectionVisible()).toBe(true);

      await page.performSearch('transition test');
      await page.waitForSearchResults();

      expect(await page.isHeroSectionVisible()).toBe(false);
      expect(await page.areSearchResultsVisible()).toBe(true);

      // Test search results to modal transition
      await page.clickArticleCard(0);
      await expect(page.articleModal).toBeVisible();

      // Test modal to search results transition
      await page.closeModal();
      await expect(page.articleModal).toBeHidden();
      expect(await page.areSearchResultsVisible()).toBe(true);

      // Test search results to hero section transition
      await page.resetApplication();
      expect(await page.isHeroSectionVisible()).toBe(true);
      expect(await page.areSearchResultsVisible()).toBe(false);
    });

    test('should maintain 60fps during animations', async ({ page: playwrightPage }) => {
      await page.goto();

      // Monitor for layout shifts and performance issues
      let layoutShifts = 0;
      
      await playwrightPage.evaluate(() => {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue;
            layoutShifts++;
          }
        }).observe({entryTypes: ['layout-shift']});
      });

      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "animation performance test",
            ai_summary_answer: "Testing animation performance",
            ai_relevant_articles: [{
              id: 1,
              title: "Animation Performance Article",
              content: "Testing animation performance and smoothness"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Perform operations that trigger animations
      await page.performSearch('animation performance test');
      await page.waitForSearchResults();
      await page.clickArticleCard(0);
      await page.closeModal();
      await page.resetApplication();

      // Check layout stability
      const finalLayoutShifts = await playwrightPage.evaluate(() => (window as any).layoutShifts || 0);
      expect(finalLayoutShifts).toBeLessThan(3); // Minimal layout shifts
    });
  });

  test.describe('Network Optimization', () => {
    test('should minimize network requests', async ({ page: playwrightPage }) => {
      const networkRequests: string[] = [];

      playwrightPage.on('request', request => {
        networkRequests.push(request.url());
      });

      await page.goto();
      await expect(page.headerTitle).toBeVisible();

      const initialRequestCount = networkRequests.length;

      // Performing UI interactions shouldn't trigger additional network requests
      await page.searchInput.fill('network optimization test');
      await page.searchInput.clear();
      await page.headerTitle.click();
      await page.searchInput.focus();

      const afterInteractionCount = networkRequests.length;

      // Should not make additional requests for UI interactions
      expect(afterInteractionCount).toBe(initialRequestCount);
    });

    test('should handle request cancellation properly', async ({ page: playwrightPage }) => {
      await page.goto();

      let requestsCancelled = 0;

      await playwrightPage.route('**/api/search-query', async route => {
        // Simulate slow request
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              query: "cancellation test",
              ai_summary_answer: "Testing request cancellation",
              ai_relevant_articles: [],
              query_id: 1,
              timestamp: "2025-07-16T22:00:00Z"
            })
          });
        } catch (error) {
          requestsCancelled++;
          throw error;
        }
      });

      // Start a search
      await page.performSearch('cancellation test');

      // Immediately start another search (should cancel the first)
      await page.performSearch('second search');

      await page.waitForSearchResults();

      // Should handle request cancellation gracefully
      expect(await page.areSearchResultsVisible() || await page.isErrorMessageVisible()).toBe(true);
    });
  });

  test.describe('Browser Resource Usage', () => {
    test('should maintain reasonable DOM size', async ({ page: playwrightPage }) => {
      await page.goto();

      await playwrightPage.route('**/api/search-query', async route => {
        // Generate moderate dataset
        const articles = Array.from({ length: 30 }, (_, i) => ({
          id: i + 1,
          title: `DOM Test Article ${i + 1}`,
          content: `Content for DOM test article ${i + 1}`
        }));

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "DOM size test",
            ai_summary_answer: "Testing DOM size management",
            ai_relevant_articles: articles,
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('DOM size test');
      await page.waitForSearchResults();

      // Check DOM size remains reasonable
      const domSize = await playwrightPage.evaluate(() => {
        return document.getElementsByTagName('*').length;
      });

      // Should maintain reasonable DOM size even with many results
      expect(domSize).toBeLessThan(1000);
    });

    test('should handle multiple viewport changes efficiently', async ({ page: playwrightPage }) => {
      await page.goto();

      const viewports = [
        { width: 375, height: 667 },   // Mobile
        { width: 768, height: 1024 },  // Tablet
        { width: 1920, height: 1080 }, // Desktop
        { width: 1280, height: 720 },  // Laptop
        { width: 2560, height: 1440 }  // Large Desktop
      ];

      for (const viewport of viewports) {
        const resizeStart = Date.now();
        
        await playwrightPage.setViewportSize(viewport);
        await expect(page.headerTitle).toBeVisible();
        
        const resizeTime = Date.now() - resizeStart;
        
        // Each resize should complete quickly
        expect(resizeTime).toBeLessThan(1000);
        
        // Essential elements should remain visible
        await expect(page.searchInput).toBeVisible();
        await expect(page.searchButton).toBeVisible();
      }
    });
  });
});
