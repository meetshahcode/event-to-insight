import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface Article {
  id: number;
  title: string;
  content: string;
}

export interface SearchRequest {
  query: string;
}

export interface SearchResponse {
  query: string;
  ai_summary_answer: string;
  ai_relevant_articles: Article[];
  query_id: number;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
}

// API functions
export const searchAPI = {
  // Search for answers
  searchQuery: async (query: string): Promise<SearchResponse> => {
    const response = await api.post<SearchResponse>('/search-query', {
      query,
    });
    return response.data;
  },

  // Get all articles
  getAllArticles: async (): Promise<Article[]> => {
    const response = await api.get<Article[]>('/articles');
    return response.data;
  },

  // Get specific article
  getArticle: async (id: number): Promise<Article> => {
    const response = await api.get<Article>(`/articles/${id}`);
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; service: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
