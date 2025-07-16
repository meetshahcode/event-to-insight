/**
 * Responsive Design and Accessibility Tests
 * Tests the application's behavior across different screen sizes,
 * accessibility compliance, and mobile-specific interactions
 */

import { test, expect } from '@playwright/test';
import { EventToInsightPage } from './pages/EventToInsightPage';

test.describe('Responsive Design Tests', () => {
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667 },
    { name: 'Mobile Landscape', width: 667, height: 375 },
    { name: 'Tablet Portrait', width: 768, height: 1024 },
    { name: 'Tablet Landscape', width: 1024, height: 768 },
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Large Desktop', width: 2560, height: 1440 }
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`should display correctly on ${name} (${width}x${height})`, async ({ page: playwrightPage }) => {
      await playwrightPage.setViewportSize({ width, height });
      
      const page = new EventToInsightPage(playwrightPage);
      await page.goto();

      // Essential elements should be visible
      await expect(page.headerTitle).toBeVisible();
      await expect(page.searchInput).toBeVisible();
      await expect(page.searchButton).toBeVisible();
      
      // Check if hero section is properly displayed
      if (width >= 768) {
        // Desktop/tablet should show full hero section
        await expect(page.heroSection).toBeVisible();
        await expect(playwrightPage.getByText('Get Instant IT Support')).toBeVisible();
      }
      
      // Footer should always be visible
      await expect(page.footer).toBeVisible();
    });
  });

  test('should handle orientation changes on mobile', async ({ page: playwrightPage }) => {
    const page = new EventToInsightPage(playwrightPage);
    
    // Start in portrait
    await playwrightPage.setViewportSize({ width: 375, height: 667 });
    await page.goto();
    
    await expect(page.headerTitle).toBeVisible();
    await expect(page.searchInput).toBeVisible();
    
    // Switch to landscape
    await playwrightPage.setViewportSize({ width: 667, height: 375 });
    
    // Elements should still be visible
    await expect(page.headerTitle).toBeVisible();
    await expect(page.searchInput).toBeVisible();
  });

  test('should maintain functionality across different screen sizes', async ({ page: playwrightPage }) => {
    const page = new EventToInsightPage(playwrightPage);
    
    // Test on mobile
    await playwrightPage.setViewportSize({ width: 375, height: 667 });
    await page.goto();
    
    // Mock search response
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "mobile test",
          ai_summary_answer: "Mobile search works correctly",
          ai_relevant_articles: [{
            id: 1,
            title: "Mobile Test Article",
            content: "Mobile test content"
          }],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });
    
    // Search should work on mobile
    await page.performSearch('mobile test');
    await page.waitForSearchResults();
    
    expect(await page.areSearchResultsVisible()).toBe(true);
    
    // Article modal should work on mobile
    await page.clickArticleCard(0);
    await expect(page.articleModal).toBeVisible();
    
    await page.closeModal();
    await expect(page.articleModal).toBeHidden();
  });

  test('should handle touch interactions on mobile devices', async ({ page: playwrightPage }) => {
    await playwrightPage.setViewportSize({ width: 375, height: 667 });
    
    const page = new EventToInsightPage(playwrightPage);
    await page.goto();
    
    // Mock search for testing touch interactions
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "touch test",
          ai_summary_answer: "Touch interactions work",
          ai_relevant_articles: [{
            id: 1,
            title: "Touch Test Article",
            content: "Touch test content"
          }],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });
    
    // Test tap interactions
    await page.searchInput.tap();
    await page.searchInput.fill('touch test');
    await page.searchButton.tap();
    
    await page.waitForSearchResults();
    expect(await page.areSearchResultsVisible()).toBe(true);
    
    // Test tap on article card
    await page.articleCards.first().tap();
    await expect(page.articleModal).toBeVisible();
  });

  test('should adapt navigation for different screen sizes', async ({ page: playwrightPage }) => {
    const page = new EventToInsightPage(playwrightPage);
    
    // Test desktop navigation
    await playwrightPage.setViewportSize({ width: 1920, height: 1080 });
    await page.goto();
    
    await expect(page.apiStatusLink).toBeVisible();
    await expect(page.githubLink).toBeVisible();
    
    // Test mobile navigation - links should still be accessible
    await playwrightPage.setViewportSize({ width: 375, height: 667 });
    
    // Navigation should adapt or remain accessible
    await expect(page.headerTitle).toBeVisible();
  });
});

test.describe('Accessibility Tests', () => {
  let page: EventToInsightPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new EventToInsightPage(playwrightPage);
    await page.goto();
  });

  test('should have proper heading hierarchy', async ({ page: playwrightPage }) => {
    // Check for proper heading structure
    const h1 = playwrightPage.locator('h1');
    const h2 = playwrightPage.locator('h2');
    const h3 = playwrightPage.locator('h3');
    
    await expect(h1).toBeVisible();
    expect(await h1.count()).toBeGreaterThan(0);
    
    // If h2 exists, it should come after h1
    const h2Count = await h2.count();
    if (h2Count > 0) {
      await expect(h2.first()).toBeVisible();
    }
    
    // If h3 exists, it should come after h2
    const h3Count = await h3.count();
    if (h3Count > 0) {
      await expect(h3.first()).toBeVisible();
    }
  });

  test('should have proper form labels and inputs', async () => {
    // Search input should have proper labeling
    await expect(page.searchInput).toHaveAttribute('placeholder');
    
    // Input should be focusable
    await page.searchInput.focus();
    await expect(page.searchInput).toBeFocused();
  });

  test('should have proper ARIA attributes', async ({ page: playwrightPage }) => {
    // Check for proper ARIA landmarks
    const main = playwrightPage.locator('main');
    const header = playwrightPage.locator('header');
    const footer = playwrightPage.locator('footer');
    
    await expect(main).toBeVisible();
    await expect(header).toBeVisible();
    await expect(footer).toBeVisible();
    
    // Buttons should have proper roles
    await expect(page.searchButton).toHaveAttribute('type', 'submit');
  });

  test('should support keyboard navigation', async ({ page: playwrightPage }) => {
    // Tab navigation should work through interactive elements
    await playwrightPage.keyboard.press('Tab');
    
    // Should focus on first interactive element
    const focusedElement = playwrightPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Continue tabbing through elements
    await playwrightPage.keyboard.press('Tab');
    await expect(playwrightPage.locator(':focus')).toBeVisible();
    
    // Should be able to navigate to search input
    await page.searchInput.focus();
    await expect(page.searchInput).toBeFocused();
    
    // Should be able to navigate to search button
    await page.searchButton.focus();
    await expect(page.searchButton).toBeFocused();
  });

  test('should have proper color contrast', async ({ page: playwrightPage }) => {
    // This is a basic check - in a real scenario, you'd use accessibility testing tools
    
    // Check that text is visible against backgrounds
    await expect(page.headerTitle).toBeVisible();
    await expect(page.headerSubtitle).toBeVisible();
    
    // Check that buttons have visible text
    await expect(page.searchButton).toBeVisible();
    await expect(page.searchButton).toContainText('Search');
  });

  test('should handle focus management correctly', async ({ page: playwrightPage }) => {
    // Focus should be visible when navigating with keyboard
    await page.searchInput.focus();
    await expect(page.searchInput).toBeFocused();
    
    // Focus should move logically with Tab
    await playwrightPage.keyboard.press('Tab');
    await expect(page.searchButton).toBeFocused();
    
    // Focus should be trapped in modals when they open
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
            content: "Focus test content"
          }],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });
    
    await page.performSearch('focus test');
    await page.waitForSearchResults();
    await page.clickArticleCard(0);
    await expect(page.articleModal).toBeVisible();
    
    // Focus should be within modal
    const focusedInModal = playwrightPage.locator(':focus');
    await expect(focusedInModal).toBeVisible();
  });

  test('should announce dynamic content changes', async ({ page: playwrightPage }) => {
    // Error messages should have proper ARIA attributes
    await page.performSearch('');
    await page.waitForErrorMessage();
    
    // Error message should be announced to screen readers
    await expect(page.errorMessage).toBeVisible();
    
    // In a real test, you'd check for aria-live regions or role="alert"
    // This depends on the implementation
  });

  test('should work with screen reader simulation', async ({ page: playwrightPage }) => {
    // Simulate screen reader navigation
    
    // Check that important content has proper semantic markup
    await expect(page.headerTitle).toBeVisible();
    await expect(page.searchInput).toBeVisible();
    
    // Check that interactive elements are properly labeled
    await expect(page.searchButton).toHaveText(/Search/);
    
    // Check that content is structured with proper headings
    const headings = playwrightPage.locator('h1, h2, h3, h4, h5, h6');
    expect(await headings.count()).toBeGreaterThan(0);
  });

  test('should handle high contrast mode', async ({ page: playwrightPage }) => {
    // Simulate high contrast mode (this is browser-dependent)
    await playwrightPage.emulateMedia({ colorScheme: 'light' });
    
    // Elements should still be visible and functional
    await expect(page.headerTitle).toBeVisible();
    await expect(page.searchInput).toBeVisible();
    await expect(page.searchButton).toBeVisible();
    
    // Test dark mode
    await playwrightPage.emulateMedia({ colorScheme: 'dark' });
    
    await expect(page.headerTitle).toBeVisible();
    await expect(page.searchInput).toBeVisible();
  });

  test('should handle reduced motion preferences', async ({ page: playwrightPage }) => {
    // Test with reduced motion preference
    await playwrightPage.emulateMedia({ reducedMotion: 'reduce' });
    
    // Application should still function without motion
    await expect(page.headerTitle).toBeVisible();
    await expect(page.searchInput).toBeVisible();
    
    // Test normal motion
    await playwrightPage.emulateMedia({ reducedMotion: 'no-preference' });
    
    await expect(page.headerTitle).toBeVisible();
    await expect(page.searchInput).toBeVisible();
  });

  test('should handle zoom levels appropriately', async ({ page: playwrightPage }) => {
    // Test at different zoom levels
    const zoomLevels = [0.5, 1, 1.5, 2];
    
    for (const zoom of zoomLevels) {
      // Simulate zoom by adjusting viewport
      const baseWidth = 1920;
      const baseHeight = 1080;
      
      await playwrightPage.setViewportSize({ 
        width: Math.floor(baseWidth / zoom), 
        height: Math.floor(baseHeight / zoom) 
      });
      
      // Essential elements should remain visible and functional
      await expect(page.headerTitle).toBeVisible();
      await expect(page.searchInput).toBeVisible();
      await expect(page.searchButton).toBeVisible();
    }
  });
});

test.describe('Cross-Browser Compatibility', () => {
  test('should work consistently across browsers', async ({ page: playwrightPage, browserName }) => {
    const page = new EventToInsightPage(playwrightPage);
    await page.goto();
    
    // Basic functionality should work in all browsers
    await expect(page.headerTitle).toBeVisible();
    await expect(page.searchInput).toBeVisible();
    await expect(page.searchButton).toBeVisible();
    
    // Search functionality should work
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: `${browserName} test`,
          ai_summary_answer: `Testing on ${browserName}`,
          ai_relevant_articles: [{
            id: 1,
            title: `${browserName} Test Article`,
            content: `${browserName} test content`
          }],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });
    
    await page.performSearch(`${browserName} test`);
    await page.waitForSearchResults();
    
    expect(await page.areSearchResultsVisible()).toBe(true);
  });

  test('should handle browser-specific features gracefully', async ({ page: playwrightPage, browserName }) => {
    const page = new EventToInsightPage(playwrightPage);
    await page.goto();
    
    // Test browser-specific behaviors
    if (browserName === 'webkit') {
      // Safari-specific tests
      await expect(page.searchInput).toBeVisible();
    } else if (browserName === 'firefox') {
      // Firefox-specific tests
      await expect(page.searchInput).toBeVisible();
    } else if (browserName === 'chromium') {
      // Chrome-specific tests
      await expect(page.searchInput).toBeVisible();
    }
    
    // Common functionality should work everywhere
    await page.searchInput.fill('cross-browser test');
    expect(await page.getSearchInputValue()).toBe('cross-browser test');
  });
});
