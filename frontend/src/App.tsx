import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import SearchResults from './components/SearchResults';
import ArticleModal from './components/ArticleModal';
import { SearchResponse, Article } from './services/api';
import { HelpCircle, Github, Server } from 'lucide-react';

function App() {
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearchResult = (result: SearchResponse) => {
    setSearchResult(result);
    setError('');
  };

  const handleSearchError = (errorMessage: string) => {
    setError(errorMessage);
    setSearchResult(null);
  };

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedArticle(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Event-to-Insight
                </h1>
                <p className="text-sm text-gray-600">
                  AI-Powered IT Support Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="http://localhost:8080/api/health"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"
              >
                <Server className="h-4 w-4" />
                <span>API Status</span>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        {!searchResult && !error && (
          <div className="text-center py-12">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Get Instant IT Support
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Ask any IT question and get AI-powered answers with relevant knowledge base articles
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Password Issues</h3>
                  <p className="text-sm text-gray-600">Reset passwords, account lockouts, and authentication problems</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">VPN & Network</h3>
                  <p className="text-sm text-gray-600">VPN setup, network connectivity, and remote access</p>
                </div>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-2">Software & Hardware</h3>
                  <p className="text-sm text-gray-600">Application issues, printer problems, and device setup</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <SearchBar 
            onSearchResult={handleSearchResult}
            onSearchError={handleSearchError}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Search Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResult && (
          <SearchResults
            query={searchResult.query}
            summary={searchResult.ai_summary_answer}
            articles={searchResult.ai_relevant_articles}
            timestamp={searchResult.timestamp}
            onArticleClick={handleArticleClick}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              Event-to-Insight System - AI-Powered IT Support Assistant
            </p>
            <p className="text-xs mt-2">
              Built with React, Go, and Gemini AI
            </p>
          </div>
        </div>
      </footer>

      {/* Article Modal */}
      <ArticleModal
        article={selectedArticle}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default App;
