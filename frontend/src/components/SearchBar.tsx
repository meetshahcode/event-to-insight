import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { searchAPI, SearchResponse } from '../services/api';

interface SearchBarProps {
  onSearchResult: (result: SearchResponse) => void;
  onSearchError: (error: string) => void;
  onNoResults: (message: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchResult, onSearchError, onNoResults }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      onSearchError('Please enter a search query');
      return;
    }

    setIsLoading(true);
    try {
      const result = await searchAPI.searchQuery(query.trim());
      
      // Check if this is a "no results found" response
      if (result.ai_relevant_articles.length === 0 && 
          result.ai_summary_answer.includes("couldn't find specific information")) {
        onNoResults(result.ai_summary_answer);
      } else {
        onSearchResult(result);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to search. Please try again.';
      onSearchError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask any IT question (e.g., 'How do I reset my password?')"
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          disabled={isLoading}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
