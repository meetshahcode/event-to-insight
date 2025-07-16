/**
 * UI Interaction and User Experience Tests
 * Tests user interaction patterns, keyboard navigation, form handling,
 * and overall user experience across different scenarios
 */

import { test, expect } from '@playwright/test';
import { EventToInsightPage } from './pages/EventToInsightPage';

test.describe('UI Interaction and User Experience Tests', () => {
  let page: EventToInsightPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new EventToInsightPage(playwrightPage);
    await page.goto();
  });

  test.describe('Form Interaction and Validation', () => {
    test('should handle form submission via Enter key', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "enter key test",
            ai_summary_answer: "Testing Enter key submission",
            ai_relevant_articles: [{
              id: 1,
              title: "Enter Key Test Article",
              content: "Testing form submission via Enter key"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Fill input and press Enter
      await page.searchInput.fill('enter key test');
      await page.searchInput.press('Enter');

      await page.waitForSearchResults();
      expect(await page.areSearchResultsVisible()).toBe(true);
    });

    test('should handle form submission via button click', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "button click test",
            ai_summary_answer: "Testing button click submission",
            ai_relevant_articles: [{
              id: 1,
              title: "Button Click Test Article",
              content: "Testing form submission via button click"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Fill input and click button
      await page.searchInput.fill('button click test');
      await page.searchButton.click();

      await page.waitForSearchResults();
      expect(await page.areSearchResultsVisible()).toBe(true);
    });

    test('should prevent submission of empty or whitespace-only queries', async () => {
      const invalidQueries = ['', '   ', '\t\n\r   ', '\u00A0\u00A0']; // Including non-breaking spaces

      for (const query of invalidQueries) {
        await page.searchInput.fill(query);
        await page.searchButton.click();

        // Should show validation error
        await page.waitForErrorMessage();
        expect(await page.isErrorMessageVisible()).toBe(true);
        expect(await page.getErrorMessageText()).toContain('Please enter a search query');

        // Clear the error for next iteration
        await page.resetApplication();
      }
    });

    test('should handle rapid form submissions gracefully', async ({ page: playwrightPage }) => {
      let requestCount = 0;

      await playwrightPage.route('**/api/search-query', async route => {
        requestCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: `rapid test ${requestCount}`,
            ai_summary_answer: `Rapid submission response ${requestCount}`,
            ai_relevant_articles: [],
            query_id: requestCount,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Rapid submissions
      await page.searchInput.fill('rapid test');
      await page.searchButton.click();
      await page.searchButton.click();
      await page.searchButton.click();

      await page.waitForLoadingToFinish();

      // Should handle gracefully without errors
      expect(requestCount).toBeGreaterThanOrEqual(1);
    });

    test('should disable form during submission', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Longer delay
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "disable test",
            ai_summary_answer: "Testing form disable during submission",
            ai_relevant_articles: [],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.searchInput.fill('disable test');
      await page.searchButton.click();

      // Should show loading state and disabled form
      await expect(page.loadingSpinner).toBeVisible();
      await expect(page.searchButton).toBeDisabled();

      await page.waitForLoadingToFinish();

      // Should re-enable after completion
      await expect(page.searchButton).toBeEnabled();
    });
  });

  test.describe('Keyboard Navigation and Accessibility', () => {
    test('should support full keyboard navigation', async ({ page: playwrightPage }) => {
      // Tab through interactive elements
      await page.page.keyboard.press('Tab');
      await expect(page.searchInput).toBeFocused();

      await page.page.keyboard.press('Tab');
      await expect(page.searchButton).toBeFocused();

      // Should be able to navigate to external links
      await page.page.keyboard.press('Tab');
      const focusedElement = page.page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should handle Space and Enter keys for button activation', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "keyboard activation test",
            ai_summary_answer: "Testing keyboard button activation",
            ai_relevant_articles: [],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      // Test Enter key activation
      await page.searchInput.fill('keyboard activation test');
      await page.searchButton.focus();
      await page.page.keyboard.press('Enter');

      await page.waitForSearchResults();
      expect(await page.areSearchResultsVisible()).toBe(true);

      // Reset and test Space key activation
      await page.resetApplication();
      await page.searchInput.fill('keyboard activation test');
      await page.searchButton.focus();
      await page.page.keyboard.press('Space');

      await page.waitForSearchResults();
      expect(await page.areSearchResultsVisible()).toBe(true);
    });

    test('should maintain focus management in modals', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "modal focus test",
            ai_summary_answer: "Testing modal focus management",
            ai_relevant_articles: [{
              id: 1,
              title: "Modal Focus Test Article",
              content: "Testing focus management in article modal"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('modal focus test');
      await page.waitForSearchResults();
      
      // Open modal via keyboard
      const firstCard = page.articleCards.first();
      await firstCard.focus();
      await page.page.keyboard.press('Enter');

      await expect(page.articleModal).toBeVisible();

      // Focus should be manageable within modal
      await page.modalCloseButton.focus();
      await expect(page.modalCloseButton).toBeFocused();

      // Close via keyboard
      await page.page.keyboard.press('Enter');
      await expect(page.articleModal).toBeHidden();
    });

    test('should support Escape key for modal closure', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "escape key test",
            ai_summary_answer: "Testing Escape key functionality",
            ai_relevant_articles: [{
              id: 1,
              title: "Escape Key Test Article",
              content: "Testing Escape key for modal closure"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('escape key test');
      await page.waitForSearchResults();
      await page.clickArticleCard(0);

      await expect(page.articleModal).toBeVisible();

      // Close modal with Escape key
      await page.page.keyboard.press('Escape');
      await expect(page.articleModal).toBeHidden();
    });
  });

  test.describe('Mouse and Touch Interactions', () => {
    test('should handle hover effects and visual feedback', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "hover effects test",
            ai_summary_answer: "Testing hover effects and visual feedback",
            ai_relevant_articles: [{
              id: 1,
              title: "Hover Effects Test Article",
              content: "Testing hover effects on interactive elements"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('hover effects test');
      await page.waitForSearchResults();

      // Test hover on article cards
      const firstCard = page.articleCards.first();
      await firstCard.hover();
      await expect(firstCard).toBeVisible();

      // Test hover on buttons
      await page.searchButton.hover();
      await expect(page.searchButton).toBeVisible();
    });

    test('should handle click outside to close modal', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "click outside test",
            ai_summary_answer: "Testing click outside to close modal",
            ai_relevant_articles: [{
              id: 1,
              title: "Click Outside Test Article",
              content: "Testing click outside functionality"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('click outside test');
      await page.waitForSearchResults();
      await page.clickArticleCard(0);

      await expect(page.articleModal).toBeVisible();

      // Click outside modal (on backdrop)
      await page.page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } });
      await expect(page.articleModal).toBeHidden();
    });

    test('should prevent modal closure when clicking inside content', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "click inside test",
            ai_summary_answer: "Testing click inside modal content",
            ai_relevant_articles: [{
              id: 1,
              title: "Click Inside Test Article",
              content: "Testing that clicking inside modal content doesn't close the modal"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('click inside test');
      await page.waitForSearchResults();
      await page.clickArticleCard(0);

      await expect(page.articleModal).toBeVisible();

      // Click inside modal content
      await page.modalContent.click();
      await expect(page.articleModal).toBeVisible(); // Should remain open
    });

    test('should handle double-click interactions gracefully', async ({ page: playwrightPage }) => {
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "double click test",
            ai_summary_answer: "Testing double-click interactions",
            ai_relevant_articles: [{
              id: 1,
              title: "Double Click Test Article",
              content: "Testing double-click behavior"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('double click test');
      await page.waitForSearchResults();

      // Double-click on article card
      const firstCard = page.articleCards.first();
      await firstCard.dblclick();

      await expect(page.articleModal).toBeVisible();
    });
  });

  test.describe('Input Handling and Edge Cases', () => {
    test('should handle various text input scenarios', async ({ page: playwrightPage }) => {
      const testInputs = [
        'simple query',
        'Query With Mixed CASE',
        'query with numbers 12345',
        'query with punctuation: !@#$%^&*()',
        'query with "quotes" and \'apostrophes\'',
        'query\nwith\nnewlines',
        'query\twith\ttabs',
        'very long query that exceeds normal expectations and tests the handling of extensive user input scenarios',
        '     query with leading and trailing spaces     ',
        'query with émojis 😀🎉🔥 and ünicödé',
        'query with &lt;html&gt; tags and &amp;entities&amp;',
      ];

      for (let i = 0; i < testInputs.length; i++) {
        const input = testInputs[i];

        await playwrightPage.route('**/api/search-query', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              query: input.trim(),
              ai_summary_answer: `Processed input: ${input.trim()}`,
              ai_relevant_articles: [],
              query_id: i + 1,
              timestamp: "2025-07-16T22:00:00Z"
            })
          });
        });

        await page.searchInput.fill(input);
        await page.searchButton.click();

        await page.waitForSearchResults();
        expect(await page.areSearchResultsVisible()).toBe(true);

        // Reset for next iteration
        await page.resetApplication();
      }
    });

    test('should handle cut, copy, and paste operations', async ({ page: playwrightPage }) => {
      const testText = 'clipboard test query';

      // Fill input
      await page.searchInput.fill(testText);

      // Select all and copy
      await page.searchInput.press('Control+a');
      await page.searchInput.press('Control+c');

      // Clear input
      await page.searchInput.fill('');

      // Paste back
      await page.searchInput.press('Control+v');

      const inputValue = await page.getSearchInputValue();
      expect(inputValue).toBe(testText);
    });

    test('should handle undo and redo operations in input', async ({ page: playwrightPage }) => {
      await page.searchInput.fill('original text');
      await page.searchInput.fill('modified text');

      // Undo
      await page.searchInput.press('Control+z');

      const undoValue = await page.getSearchInputValue();
      expect(undoValue).toBe('original text');

      // Redo
      await page.searchInput.press('Control+y');

      const redoValue = await page.getSearchInputValue();
      expect(redoValue).toBe('modified text');
    });

    test('should handle input field clearing and refilling', async () => {
      // Fill input
      await page.searchInput.fill('initial query');
      expect(await page.getSearchInputValue()).toBe('initial query');

      // Clear input multiple ways
      await page.searchInput.clear();
      expect(await page.getSearchInputValue()).toBe('');

      await page.searchInput.fill('second query');
      await page.searchInput.press('Control+a');
      await page.searchInput.press('Delete');
      expect(await page.getSearchInputValue()).toBe('');

      // Fill again
      await page.searchInput.fill('final query');
      expect(await page.getSearchInputValue()).toBe('final query');
    });
  });

  test.describe('State Persistence and Memory', () => {
    test('should maintain search input value during interactions', async ({ page: playwrightPage }) => {
      const query = 'persistent query test';

      await page.searchInput.fill(query);

      // Click elsewhere
      await page.headerTitle.click();
      expect(await page.getSearchInputValue()).toBe(query);

      // Focus back on input
      await page.searchInput.focus();
      expect(await page.getSearchInputValue()).toBe(query);

      // Open and close modal (if search results exist)
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: query,
            ai_summary_answer: "Testing state persistence",
            ai_relevant_articles: [{
              id: 1,
              title: "Persistence Test Article",
              content: "Testing state persistence during interactions"
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.searchButton.click();
      await page.waitForSearchResults();
      await page.clickArticleCard(0);
      await page.closeModal();

      // Input value should still be preserved
      expect(await page.getSearchInputValue()).toBe(query);
    });

    test('should handle browser refresh gracefully', async ({ page: playwrightPage }) => {
      // This test verifies that the app handles page reload correctly
      await page.goto();
      
      // Verify initial state after refresh
      expect(await page.isHeroSectionVisible()).toBe(true);
      expect(await page.getSearchInputValue()).toBe('');
      expect(await page.isResetButtonVisible()).toBe(false);

      // Should be ready for new interactions
      await page.searchInput.fill('after refresh test');
      expect(await page.getSearchInputValue()).toBe('after refresh test');
    });

    test('should handle back/forward navigation appropriately', async ({ page: playwrightPage }) => {
      // Perform a search
      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "navigation test",
            ai_summary_answer: "Testing navigation behavior",
            ai_relevant_articles: [],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('navigation test');
      await page.waitForSearchResults();

      // Navigate to external link and back
      const currentUrl = playwrightPage.url();
      await playwrightPage.goBack();
      await playwrightPage.goForward();

      // Should maintain functionality
      expect(playwrightPage.url()).toBe(currentUrl);
      await expect(page.searchInput).toBeVisible();
    });
  });

  test.describe('Visual and Layout Behavior', () => {
    test('should handle content overflow gracefully', async ({ page: playwrightPage }) => {
      const longSummary = 'This is an extremely long AI summary that tests how the application handles content overflow in various UI components. '.repeat(20);

      await playwrightPage.route('**/api/search-query', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            query: "overflow test",
            ai_summary_answer: longSummary,
            ai_relevant_articles: [{
              id: 1,
              title: "Very Long Article Title That Tests Overflow Handling in UI Components and Layout Management",
              content: "Very long content that tests overflow handling. ".repeat(50)
            }],
            query_id: 1,
            timestamp: "2025-07-16T22:00:00Z"
          })
        });
      });

      await page.performSearch('overflow test');
      await page.waitForSearchResults();

      // Should display content without breaking layout
      expect(await page.areSearchResultsVisible()).toBe(true);

      // Open modal to test overflow handling
      await page.clickArticleCard(0);
      await expect(page.articleModal).toBeVisible();
      await page.closeModal();
    });

    test('should maintain layout consistency across different content sizes', async ({ page: playwrightPage }) => {
      const contentSizes = [
        { summary: 'Short summary', title: 'Short Title', content: 'Short content' },
        { 
          summary: 'Medium length summary that provides more detail about the response', 
          title: 'Medium Length Article Title', 
          content: 'Medium length content that provides more comprehensive information about the topic at hand.' 
        },
        { 
          summary: 'Very long and comprehensive summary that provides extensive detail and thorough explanation of the topic, including various aspects and considerations that users should be aware of when dealing with this particular subject matter.',
          title: 'Very Long Article Title That Demonstrates How The Layout Handles Extended Text Content',
          content: 'Extremely comprehensive content that covers all aspects of the topic in great detail. '.repeat(10)
        }
      ];

      for (let i = 0; i < contentSizes.length; i++) {
        const { summary, title, content } = contentSizes[i];

        await playwrightPage.route('**/api/search-query', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              query: `layout test ${i + 1}`,
              ai_summary_answer: summary,
              ai_relevant_articles: [{
                id: i + 1,
                title: title,
                content: content
              }],
              query_id: i + 1,
              timestamp: "2025-07-16T22:00:00Z"
            })
          });
        });

        await page.performSearch(`layout test ${i + 1}`);
        await page.waitForSearchResults();

        // Verify layout maintains consistency
        expect(await page.areSearchResultsVisible()).toBe(true);
        
        if (i < contentSizes.length - 1) {
          await page.resetApplication();
        }
      }
    });
  });
});
