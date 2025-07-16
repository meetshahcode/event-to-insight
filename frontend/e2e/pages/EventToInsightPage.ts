/**
 * Page Object Model for Event-to-Insight Application
 * Provides reusable methods for interacting with the application UI
 * Follows Playwright best practices for maintainable E2E tests
 */

import { Page, Locator, expect } from '@playwright/test';
// Removed import to avoid dependency issues for now

export class EventToInsightPage {
  readonly page: Page;
  
  // Header elements
  readonly headerTitle: Locator;
  readonly headerSubtitle: Locator;
  readonly resetButton: Locator;
  readonly apiStatusLink: Locator;
  readonly githubLink: Locator;
  
  // Search elements
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly loadingSpinner: Locator;
  
  // Content elements
  readonly heroSection: Locator;
  readonly searchResults: Locator;
  readonly errorMessage: Locator;
  readonly noResultsMessage: Locator;
  readonly articleCards: Locator;
  
  // Modal elements
  readonly articleModal: Locator;
  readonly modalCloseButton: Locator;
  readonly modalTitle: Locator;
  readonly modalContent: Locator;
  
  // Footer elements
  readonly footer: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Initialize locators
    this.headerTitle = page.getByRole('heading', { name: 'Event-to-Insight' });
    this.headerSubtitle = page.locator('header').getByText('AI-Powered IT Support Assistant');
    this.resetButton = page.getByRole('button', { name: 'Reset' });
    this.apiStatusLink = page.getByRole('link', { name: 'API Status' });
    this.githubLink = page.getByRole('link', { name: 'GitHub' });
    
    this.searchInput = page.getByPlaceholder(/Ask any IT question/);
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.loadingSpinner = page.locator('.animate-spin');
    
    this.heroSection = page.locator('.text-center.py-12');
    this.searchResults = page.locator('.w-full.max-w-4xl.mx-auto.space-y-6');
    this.errorMessage = page.locator('.bg-red-50');
    this.noResultsMessage = page.locator('.bg-yellow-50');
    this.articleCards = page.locator('.px-6.py-4.hover\\:bg-gray-50');
    
    this.articleModal = page.locator('[role="dialog"]');
    this.modalCloseButton = page.getByRole('button', { name: 'Close' });
    this.modalTitle = this.articleModal.locator('h2');
    this.modalContent = this.articleModal.locator('.text-gray-700');
    
    this.footer = page.locator('footer');
  }

  /**
   * Navigate to the application home page
   */
  async goto() {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  /**
   * Wait for the page to fully load
   */
  async waitForPageLoad() {
    await expect(this.headerTitle).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Perform a search query
   * @param query - The search query string
   */
  async performSearch(query: string) {
    await this.searchInput.fill(query);
    // Wait for button to be enabled before clicking
    await expect(this.searchButton).toBeEnabled();
    await this.searchButton.click();
  }

  /**
   * Wait for search results to appear
   */
  async waitForSearchResults() {
    await expect(this.searchResults).toBeVisible({ timeout: 30000 });
  }

  /**
   * Wait for error message to appear
   */
  async waitForErrorMessage() {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Wait for no results message to appear
   */
  async waitForNoResultsMessage() {
    await expect(this.noResultsMessage).toBeVisible({ timeout: 5000 });
  }

  /**
   * Wait for loading state to finish
   */
  async waitForLoadingToFinish() {
    await expect(this.loadingSpinner).toBeHidden({ timeout: 30000 });
  }

  /**
   * Click on an article card by index
   * @param index - The index of the article card (0-based)
   */
  async clickArticleCard(index: number = 0) {
    const articleCard = this.articleCards.nth(index);
    await expect(articleCard).toBeVisible();
    await articleCard.click();
  }

  /**
   * Close the article modal
   */
  async closeModal() {
    await this.modalCloseButton.click();
    await expect(this.articleModal).toBeHidden();
  }

  /**
   * Reset the application state
   */
  async resetApplication() {
    await this.resetButton.click();
    await expect(this.heroSection).toBeVisible();
  }

  /**
   * Check if hero section is visible (initial state)
   */
  async isHeroSectionVisible() {
    return await this.heroSection.isVisible();
  }

  /**
   * Check if search results are visible
   */
  async areSearchResultsVisible() {
    return await this.searchResults.isVisible();
  }

  /**
   * Check if error message is visible
   */
  async isErrorMessageVisible() {
    return await this.errorMessage.isVisible();
  }

  /**
   * Check if no results message is visible
   */
  async isNoResultsMessageVisible() {
    return await this.noResultsMessage.isVisible();
  }

  /**
   * Get the current search input value
   */
  async getSearchInputValue() {
    return await this.searchInput.inputValue();
  }

  /**
   * Get the error message text
   */
  async getErrorMessageText() {
    return await this.errorMessage.textContent();
  }

  /**
   * Get the no results message text
   */
  async getNoResultsMessageText() {
    return await this.noResultsMessage.textContent();
  }

  /**
   * Get the article modal title
   */
  async getModalTitle() {
    return await this.modalTitle.textContent();
  }

  /**
   * Get the article modal content
   */
  async getModalContent() {
    return await this.modalContent.textContent();
  }

  /**
   * Count the number of article cards displayed
   */
  async getArticleCardCount() {
    return await this.articleCards.count();
  }

  /**
   * Get article card title by index
   * @param index - The index of the article card
   */
  async getArticleCardTitle(index: number) {
    const card = this.articleCards.nth(index);
    const title = card.locator('h3');
    return await title.textContent();
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoadingSpinnerVisible() {
    return await this.loadingSpinner.isVisible();
  }

  /**
   * Check if reset button is visible
   */
  async isResetButtonVisible() {
    return await this.resetButton.isVisible();
  }

  /**
   * Check external links accessibility
   */
  async checkExternalLinks() {
    // Check API Status link
    await expect(this.apiStatusLink).toBeVisible();
    await expect(this.apiStatusLink).toHaveAttribute('href', /localhost:8080/);
    await expect(this.apiStatusLink).toHaveAttribute('target', '_blank');
    
    // Check GitHub link
    await expect(this.githubLink).toBeVisible();
    await expect(this.githubLink).toHaveAttribute('href', /github.com/);
    await expect(this.githubLink).toHaveAttribute('target', '_blank');
  }

  /**
   * Verify page accessibility features
   */
  async verifyAccessibility() {
    // Check for proper headings
    await expect(this.page.locator('h1')).toBeVisible();
    
    // Check for alt text on images (if any)
    const images = this.page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      await expect(images.nth(i)).toHaveAttribute('alt');
    }
    
    // Check for proper form labels
    await expect(this.searchInput).toHaveAttribute('placeholder');
    
    // Check for keyboard navigation
    await this.searchInput.focus();
    await expect(this.searchInput).toBeFocused();
  }

  /**
   * Test responsive design at different viewport sizes
   */
  async testResponsiveDesign(viewport: { width: number; height: number }) {
    await this.page.setViewportSize(viewport);
    await this.waitForPageLoad();
    
    // Verify essential elements are still visible
    await expect(this.headerTitle).toBeVisible();
    await expect(this.searchInput).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /**
   * Simulate network conditions
   */
  async simulateNetworkConditions(condition: 'offline' | 'slow' | 'fast') {
    switch (condition) {
      case 'offline':
        await this.page.context().setOffline(true);
        break;
      case 'slow':
        await this.page.route('**/*', route => {
          setTimeout(() => route.continue(), 2000);
        });
        break;
      case 'fast':
        await this.page.context().setOffline(false);
        break;
    }
  }
}
