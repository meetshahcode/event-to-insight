import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import SearchBar from '../components/SearchBar'
import { searchAPI } from '../services/api'

// Mock the API
vi.mock('../services/api', () => ({
  searchAPI: {
    searchQuery: vi.fn(),
  },
}))

const mockSearchAPI = searchAPI as jest.Mocked<typeof searchAPI>

describe('SearchBar', () => {
  const mockOnSearchResult = vi.fn()
  const mockOnSearchError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders search input and button', () => {
    render(
      <SearchBar 
        onSearchResult={mockOnSearchResult} 
        onSearchError={mockOnSearchError} 
      />
    )
    
    expect(screen.getByPlaceholderText(/Ask any IT question/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
  })

  test('calls onSearchResult when search is successful', async () => {
    const mockResult = {
      query: 'test query',
      ai_summary_answer: 'test answer',
      ai_relevant_articles: [],
      query_id: 1,
      timestamp: '2023-01-01T00:00:00Z',
    }

    mockSearchAPI.searchQuery.mockResolvedValue(mockResult)

    render(
      <SearchBar 
        onSearchResult={mockOnSearchResult} 
        onSearchError={mockOnSearchError} 
      />
    )

    const input = screen.getByPlaceholderText(/Ask any IT question/i)
    const button = screen.getByRole('button', { name: /search/i })

    fireEvent.change(input, { target: { value: 'test query' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockSearchAPI.searchQuery).toHaveBeenCalledWith('test query')
      expect(mockOnSearchResult).toHaveBeenCalledWith(mockResult)
    })
  })

  test('calls onSearchError when search fails', async () => {
    const mockError = new Error('API Error')
    mockSearchAPI.searchQuery.mockRejectedValue(mockError)

    render(
      <SearchBar 
        onSearchResult={mockOnSearchResult} 
        onSearchError={mockOnSearchError} 
      />
    )

    const input = screen.getByPlaceholderText(/Ask any IT question/i)
    const button = screen.getByRole('button', { name: /search/i })

    fireEvent.change(input, { target: { value: 'test query' } })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnSearchError).toHaveBeenCalledWith('Failed to search. Please try again.')
    })
  })

  test('shows error for empty query', async () => {
    render(
      <SearchBar 
        onSearchResult={mockOnSearchResult} 
        onSearchError={mockOnSearchError} 
      />
    )

    const button = screen.getByRole('button', { name: /search/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnSearchError).toHaveBeenCalledWith('Please enter a search query')
    })
  })
})
