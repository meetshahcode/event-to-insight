/**
 * Basic Application Functionality Tests
 * Tests core features like page loading, navigation, and basic interactions
 * Ensures the application loads correctly and displays expected content
 */

import { test, expect } from '@playwright/test';
import { EventToInsightPage } from './pages/EventToInsightPage';

test.describe('Application Loading and Navigation', () => {
  let page: EventToInsightPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new EventToInsightPage(playwrightPage);
    await page.goto();
  });

  test('should load the application successfully', async () => {
    // Verify page title
    await expect(page.page).toHaveTitle(/Event-to-Insight/);
    
    // Verify main heading
    await expect(page.headerTitle).toBeVisible();
    await expect(page.headerTitle).toContainText('Event-to-Insight');
    
    // Verify subtitle
    await expect(page.headerSubtitle).toBeVisible();
    await expect(page.headerSubtitle).toContainText('AI-Powered IT Support Assistant');
  });

  test('should display hero section on initial load', async () => {
    // Hero section should be visible
    await expect(page.heroSection).toBeVisible();
    
    // Check hero content
    await expect(page.page.getByText('Get Instant IT Support')).toBeVisible();
    await expect(page.page.getByText('Ask any IT question and get AI-powered answers')).toBeVisible();
    
    // Check feature cards
    await expect(page.page.getByText('Password Issues')).toBeVisible();
    await expect(page.page.getByText('VPN & Network')).toBeVisible();
    await expect(page.page.getByText('Software & Hardware')).toBeVisible();
  });

  test('should display search bar correctly', async () => {
    // Search input should be visible and have correct placeholder
    await expect(page.searchInput).toBeVisible();
    await expect(page.searchInput).toHaveAttribute('placeholder', /Ask any IT question/);
    
    // Search button should be visible
    await expect(page.searchButton).toBeVisible();
    await expect(page.searchButton).toContainText('Search');
    
    // Search input should be focused and editable
    await page.searchInput.focus();
    await expect(page.searchInput).toBeFocused();
  });

  test('should display header navigation correctly', async () => {
    await page.checkExternalLinks();
    
    // Reset button should not be visible initially
    await expect(page.resetButton).toBeHidden();
  });

  test('should display footer correctly', async () => {
    await expect(page.footer).toBeVisible();
    await expect(page.footer).toContainText('Event-to-Insight System');
    await expect(page.footer).toContainText('Built with React, Go, and Gemini AI');
  });

  test('should have proper page structure and semantics', async () => {
    // Check for proper HTML structure
    await expect(page.page.locator('header')).toBeVisible();
    await expect(page.page.locator('main')).toBeVisible();
    await expect(page.page.locator('footer')).toBeVisible();
    
    // Check for proper headings hierarchy
    await expect(page.page.locator('h1')).toBeVisible();
    await expect(page.page.locator('h2')).toBeVisible();
    await expect(page.page.locator('h3').first()).toBeVisible();
  });

  test('should handle keyboard navigation', async () => {
    // Tab navigation should work
    await page.page.keyboard.press('Tab');
    await expect(page.searchInput).toBeFocused();
    
    await page.page.keyboard.press('Tab');
    await expect(page.searchButton).toBeFocused();
    
    // Enter key should trigger search when button is focused
    await page.searchInput.fill('test query');
    await page.searchButton.focus();
    await page.page.keyboard.press('Enter');
    
    // Should attempt to search (will show error without backend)
    await page.waitForLoadingToFinish();
  });

  test('should handle window resize gracefully', async () => {
    // Test different viewport sizes
    const viewports = [
      { width: 375, height: 667 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }  // Desktop
    ];

    for (const viewport of viewports) {
      await page.testResponsiveDesign(viewport);
    }
  });

  test('should maintain state during page interactions', async () => {
    // Fill search input
    const testQuery = 'test search query';
    await page.searchInput.fill(testQuery);
    
    // Verify input value is maintained
    expect(await page.getSearchInputValue()).toBe(testQuery);
    
    // Click somewhere else and verify value is still there
    await page.headerTitle.click();
    expect(await page.getSearchInputValue()).toBe(testQuery);
  });

  test('should handle rapid user interactions', async () => {
    // Rapid typing in search input
    await page.searchInput.fill('a');
    await page.searchInput.fill('ab');
    await page.searchInput.fill('abc');
    await page.searchInput.fill('test query');
    
    expect(await page.getSearchInputValue()).toBe('test query');
    
    // Rapid clicking should not cause issues
    await page.searchButton.click();
    await page.searchButton.click();
    await page.searchButton.click();
    
    // Should handle gracefully
    await page.waitForLoadingToFinish();
  });
});

test.describe('Error Handling and Edge Cases', () => {
  let page: EventToInsightPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new EventToInsightPage(playwrightPage);
    await page.goto();
  });

  test('should handle empty search queries', async () => {
    // Try to search with empty query
    await page.performSearch('');
    
    // Should show error message
    await page.waitForErrorMessage();
    expect(await page.getErrorMessageText()).toContain('Please enter a search query');
  });

  test('should handle whitespace-only queries', async () => {
    // Try to search with only whitespace
    await page.performSearch('   \t\n   ');
    
    // Should show error message
    await page.waitForErrorMessage();
    expect(await page.getErrorMessageText()).toContain('Please enter a search query');
  });

  test('should handle network errors gracefully', async () => {
    // Simulate offline condition
    await page.simulateNetworkConditions('offline');
    
    // Try to perform search
    await page.performSearch('test query');
    
    // Should show network error
    await page.waitForErrorMessage();
    expect(await page.getErrorMessageText()).toContain('Failed to search');
    
    // Restore network
    await page.simulateNetworkConditions('fast');
  });

  test('should handle very long queries', async () => {
    const longQuery = 'a'.repeat(1000);
    await page.performSearch(longQuery);
    
    // Should handle long queries without breaking
    await page.waitForLoadingToFinish();
  });

  test('should handle special characters in queries', async () => {
    const specialCharQuery = 'password reset @#$%^&*(){}[]|\\:";\'<>?,./ 🚀🔧';
    await page.performSearch(specialCharQuery);
    
    // Should handle special characters gracefully
    await page.waitForLoadingToFinish();
  });

  test('should handle unicode characters', async () => {
    const unicodeQuery = 'Comment réinitialiser le mot de passe? パスワードリセット 密码重置';
    await page.performSearch(unicodeQuery);
    
    // Should handle unicode gracefully
    await page.waitForLoadingToFinish();
  });

  test('should maintain accessibility during error states', async () => {
    // Trigger error state
    await page.performSearch('');
    await page.waitForErrorMessage();
    
    // Error message should be accessible
    await expect(page.errorMessage).toBeVisible();
    await expect(page.errorMessage).toHaveAttribute('role', 'alert');
    
    // Should still be navigable with keyboard
    await page.searchInput.focus();
    await expect(page.searchInput).toBeFocused();
  });
});

test.describe('Performance and Loading', () => {
  test('should load within acceptable time limits', async ({ page: playwrightPage }) => {
    const startTime = Date.now();
    
    const page = new EventToInsightPage(playwrightPage);
    await page.goto();
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Essential elements should be visible
    await expect(page.headerTitle).toBeVisible();
    await expect(page.searchInput).toBeVisible();
  });

  test('should handle concurrent searches gracefully', async ({ page: playwrightPage }) => {
    const page = new EventToInsightPage(playwrightPage);
    await page.goto();
    
    // Start multiple searches rapidly
    const searches = [
      page.performSearch('password'),
      page.performSearch('vpn'),
      page.performSearch('email')
    ];
    
    // Wait for all to complete
    await Promise.all(searches);
    await page.waitForLoadingToFinish();
    
    // Application should remain stable
    await expect(page.searchInput).toBeVisible();
    await expect(page.searchButton).toBeVisible();
  });

  test('should handle browser refresh correctly', async ({ page: playwrightPage }) => {
    const page = new EventToInsightPage(playwrightPage);
    await page.goto();
    
    // Fill some data
    await page.searchInput.fill('test query');
    
    // Refresh page
    await playwrightPage.reload();
    await page.waitForPageLoad();
    
    // Should reset to initial state
    expect(await page.isHeroSectionVisible()).toBe(true);
    expect(await page.getSearchInputValue()).toBe('');
  });
});
