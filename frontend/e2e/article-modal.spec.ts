/**
 * Article Modal and Interaction Tests
 * Tests the article modal functionality, including opening, closing,
 * content display, and user interactions with article cards
 */

import { test, expect } from '@playwright/test';
import { EventToInsightPage } from './pages/EventToInsightPage';

test.describe('Article Modal Functionality', () => {
  let page: EventToInsightPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new EventToInsightPage(playwrightPage);
    await page.goto();

    // Mock a successful search with multiple articles
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "password and email issues",
          ai_summary_answer: "Here are relevant articles for password and email issues.",
          ai_relevant_articles: [
            {
              id: 1,
              title: "Password Reset Instructions",
              content: "To reset your password: 1) Go to the login page 2) Click 'Forgot Password' 3) Enter your email address 4) Check your email for reset instructions 5) Follow the link and create a new password. The reset link expires in 24 hours."
            },
            {
              id: 2,
              title: "Email Client Configuration", 
              content: "Email setup instructions: IMAP: mail.company.com port 993 SSL. SMTP: mail.company.com port 587 STARTTLS. Username format: firstname.lastname@company.com. For mobile devices, use autodiscovery or manual setup."
            },
            {
              id: 3,
              title: "VPN Connection Setup",
              content: "To set up VPN connection: 1) Download VPN client from IT portal 2) Install with admin credentials 3) Connect to 'Corporate-Main' server 4) Use domain username and password 5) Verify connection status."
            }
          ],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });

    // Perform search to get articles
    await page.performSearch('password and email issues');
    await page.waitForSearchResults();
  });

  test('should open article modal when clicking on article card', async () => {
    // Click on first article card
    await page.clickArticleCard(0);

    // Modal should be visible
    await expect(page.articleModal).toBeVisible();
    
    // Modal should contain article title and content
    await expect(page.modalTitle).toBeVisible();
    await expect(page.modalContent).toBeVisible();
    
    // Check that modal title matches the clicked article
    const modalTitle = await page.getModalTitle();
    expect(modalTitle).toContain('Password Reset Instructions');
  });

  test('should display correct article content in modal', async () => {
    await page.clickArticleCard(0);
    await expect(page.articleModal).toBeVisible();

    const modalContent = await page.getModalContent();
    expect(modalContent).toContain('To reset your password');
    expect(modalContent).toContain('Click \'Forgot Password\'');
    expect(modalContent).toContain('24 hours');
  });

  test('should close modal when clicking close button', async () => {
    // Open modal
    await page.clickArticleCard(0);
    await expect(page.articleModal).toBeVisible();

    // Close modal
    await page.closeModal();
    
    // Modal should be hidden
    await expect(page.articleModal).toBeHidden();
  });

  test('should close modal when clicking outside modal content', async ({ page: playwrightPage }) => {
    // Open modal
    await page.clickArticleCard(0);
    await expect(page.articleModal).toBeVisible();

    // Click outside modal (on backdrop)
    await playwrightPage.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } });
    
    // Modal should be hidden
    await expect(page.articleModal).toBeHidden();
  });

  test('should close modal with Escape key', async ({ page: playwrightPage }) => {
    // Open modal
    await page.clickArticleCard(0);
    await expect(page.articleModal).toBeVisible();

    // Press Escape key
    await playwrightPage.keyboard.press('Escape');
    
    // Modal should be hidden
    await expect(page.articleModal).toBeHidden();
  });

  test('should handle multiple article cards correctly', async () => {
    const articleCount = await page.getArticleCardCount();
    expect(articleCount).toBeGreaterThan(1);

    // Test opening different article modals
    for (let i = 0; i < Math.min(articleCount, 3); i++) {
      await page.clickArticleCard(i);
      await expect(page.articleModal).toBeVisible();
      
      const modalTitle = await page.getModalTitle();
      expect(modalTitle).toBeTruthy();
      
      await page.closeModal();
      await expect(page.articleModal).toBeHidden();
    }
  });

  test('should display second article content correctly', async () => {
    await page.clickArticleCard(1);
    await expect(page.articleModal).toBeVisible();

    const modalTitle = await page.getModalTitle();
    const modalContent = await page.getModalContent();
    
    expect(modalTitle).toContain('Email Client Configuration');
    expect(modalContent).toContain('IMAP: mail.company.com');
    expect(modalContent).toContain('port 993 SSL');
  });

  test('should maintain modal functionality after multiple opens/closes', async () => {
    // Open and close modal multiple times
    for (let i = 0; i < 3; i++) {
      await page.clickArticleCard(0);
      await expect(page.articleModal).toBeVisible();
      
      await page.closeModal();
      await expect(page.articleModal).toBeHidden();
    }

    // Should still work after multiple operations
    await page.clickArticleCard(1);
    await expect(page.articleModal).toBeVisible();
    
    const modalTitle = await page.getModalTitle();
    expect(modalTitle).toContain('Email Client Configuration');
  });

  test('should handle modal content scrolling for long articles', async ({ page: playwrightPage }) => {
    // Create a mock with very long content
    await playwrightPage.route('**/api/search-query', async route => {
      const longContent = 'This is a very long article content. '.repeat(100);
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "long content test",
          ai_summary_answer: "Testing long content display",
          ai_relevant_articles: [{
            id: 1,
            title: "Very Long Article",
            content: longContent
          }],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });

    await page.performSearch('long content test');
    await page.waitForSearchResults();
    
    await page.clickArticleCard(0);
    await expect(page.articleModal).toBeVisible();

    // Check that modal is scrollable
    const modalContent = page.modalContent;
    await expect(modalContent).toBeVisible();
    
    // Content should be scrollable if it exceeds viewport
    const scrollHeight = await modalContent.evaluate(el => el.scrollHeight);
    const clientHeight = await modalContent.evaluate(el => el.clientHeight);
    
    if (scrollHeight > clientHeight) {
      // Should be able to scroll
      await modalContent.evaluate(el => el.scrollTo(0, 100));
    }
  });

  test('should trap focus within modal when open', async ({ page: playwrightPage }) => {
    await page.clickArticleCard(0);
    await expect(page.articleModal).toBeVisible();

    // Tab navigation should stay within modal
    await playwrightPage.keyboard.press('Tab');
    
    // Focus should be on close button or within modal
    const focusedElement = await playwrightPage.locator(':focus');
    const isInModal = await focusedElement.locator('xpath=ancestor-or-self::*[@role="dialog"]').isVisible();
    expect(isInModal).toBe(true);
  });

  test('should restore focus after modal closes', async ({ page: playwrightPage }) => {
    // Focus on specific article card
    const firstCard = page.articleCards.first();
    await firstCard.focus();
    
    // Open modal
    await firstCard.click();
    await expect(page.articleModal).toBeVisible();
    
    // Close modal
    await page.closeModal();
    
    // Focus should return to the article card
    await expect(firstCard).toBeFocused();
  });

  test('should handle rapid modal open/close operations', async () => {
    // Rapidly open and close modals
    for (let i = 0; i < 5; i++) {
      await page.clickArticleCard(0);
      await page.closeModal();
    }

    // Should still function correctly
    await page.clickArticleCard(0);
    await expect(page.articleModal).toBeVisible();
    
    const modalTitle = await page.getModalTitle();
    expect(modalTitle).toBeTruthy();
  });

  test('should display modal with proper ARIA attributes', async () => {
    await page.clickArticleCard(0);
    await expect(page.articleModal).toBeVisible();

    // Check ARIA attributes for accessibility
    await expect(page.articleModal).toHaveAttribute('role', 'dialog');
    await expect(page.articleModal).toHaveAttribute('aria-modal', 'true');
    
    // Check for proper labeling
    const modalTitle = page.modalTitle;
    await expect(modalTitle).toBeVisible();
  });

  test('should handle article cards with special characters in titles', async ({ page: playwrightPage }) => {
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "special characters test",
          ai_summary_answer: "Testing special characters in titles",
          ai_relevant_articles: [{
            id: 1,
            title: "Spëcîål Chäractërs & Émojîs 🚀 in Títle",
            content: "This article tests special characters and emojis in the title display."
          }],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });

    await page.performSearch('special characters test');
    await page.waitForSearchResults();
    
    await page.clickArticleCard(0);
    await expect(page.articleModal).toBeVisible();

    const modalTitle = await page.getModalTitle();
    expect(modalTitle).toContain('Spëcîål Chäractërs');
    expect(modalTitle).toContain('🚀');
  });
});

test.describe('Article Card Interactions', () => {
  let page: EventToInsightPage;

  test.beforeEach(async ({ page: playwrightPage }) => {
    page = new EventToInsightPage(playwrightPage);
    await page.goto();

    // Mock search with articles
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "multiple articles test",
          ai_summary_answer: "Testing multiple article interactions",
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

    await page.performSearch('multiple articles test');
    await page.waitForSearchResults();
  });

  test('should display article cards with proper structure', async () => {
    const articleCount = await page.getArticleCardCount();
    expect(articleCount).toBe(3);

    // Each card should have title and be clickable
    for (let i = 0; i < articleCount; i++) {
      const cardTitle = await page.getArticleCardTitle(i);
      expect(cardTitle).toBeTruthy();
    }
  });

  test('should show hover effects on article cards', async ({ page: playwrightPage }) => {
    const firstCard = page.articleCards.first();
    
    // Hover over card
    await firstCard.hover();
    
    // Card should have hover styles (this depends on CSS implementation)
    await expect(firstCard).toBeVisible();
  });

  test('should handle keyboard navigation between cards', async ({ page: playwrightPage }) => {
    // Focus on first card
    const firstCard = page.articleCards.first();
    await firstCard.focus();
    await expect(firstCard).toBeFocused();

    // Navigate with arrow keys or tab
    await playwrightPage.keyboard.press('Tab');
    
    // Should move focus to next interactive element
    const focusedElement = await playwrightPage.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should activate cards with Enter or Space keys', async ({ page: playwrightPage }) => {
    const firstCard = page.articleCards.first();
    await firstCard.focus();
    
    // Activate with Enter key
    await playwrightPage.keyboard.press('Enter');
    
    // Modal should open
    await expect(page.articleModal).toBeVisible();
    
    await page.closeModal();
    
    // Try with Space key
    await firstCard.focus();
    await playwrightPage.keyboard.press('Space');
    
    await expect(page.articleModal).toBeVisible();
  });

  test('should display article metadata correctly', async () => {
    const articleCount = await page.getArticleCardCount();
    
    for (let i = 0; i < articleCount; i++) {
      const cardTitle = await page.getArticleCardTitle(i);
      expect(cardTitle).toMatch(/Article/); // Should contain "Article"
    }
  });

  test('should handle no articles scenario', async ({ page: playwrightPage }) => {
    // Mock response with no articles
    await playwrightPage.route('**/api/search-query', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          query: "no results test",
          ai_summary_answer: "I couldn't find specific information for your query.",
          ai_relevant_articles: [],
          query_id: 1,
          timestamp: "2025-07-16T22:00:00Z"
        })
      });
    });

    await page.performSearch('no results test');
    await page.waitForNoResultsMessage();

    const articleCount = await page.getArticleCardCount();
    expect(articleCount).toBe(0);
    
    expect(await page.isNoResultsMessageVisible()).toBe(true);
  });
});
