import React from 'react';
import { Article } from '../services/api';
import { FileText, Calendar, User } from 'lucide-react';

interface SearchResultsProps {
  query: string;
  summary: string;
  articles: Article[];
  timestamp: string;
  onArticleClick: (article: Article) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  summary,
  articles,
  timestamp,
  onArticleClick,
}) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Query Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <User className="h-4 w-4" />
          <span>Your question:</span>
          <Calendar className="h-4 w-4 ml-4" />
          <span>{formatTimestamp(timestamp)}</span>
        </div>
        <p className="text-gray-800 font-medium">{query}</p>
      </div>

      {/* AI Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">
          AI Assistant Answer
        </h2>
        <p className="text-blue-800 leading-relaxed">{summary}</p>
      </div>

      {/* Relevant Articles */}
      {articles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Relevant Knowledge Base Articles ({articles.length})
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Click on any article to view the full content
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {articles.map((article) => (
              <div
                key={article.id}
                onClick={() => onArticleClick(article)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
              >
                <div className="flex items-start space-x-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 hover:text-blue-600">
                      {article.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {article.content.substring(0, 150)}
                      {article.content.length > 150 && '...'}
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      Article ID: {article.id}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Articles Found */}
      {articles.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            No Specific Articles Found
          </h3>
          <p className="text-yellow-800">
            The AI assistant provided a general answer based on common IT practices. 
            For more specific help, please contact your IT support team or try 
            rephrasing your question.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchResults;
