import React, { useState } from 'react';
import { Search, BookOpen, ExternalLink } from 'lucide-react';
import { bibleService, BibleVerse } from '../services/BibleService';

interface BibleSearchProps {
  onVerseSelect?: (verse: BibleVerse) => void;
}

const BibleSearch: React.FC<BibleSearchProps> = ({ onVerseSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const searchResults = await bibleService.searchVerses(query.trim());
      if (searchResults.length > 0) {
        setResults(searchResults);
      } else {
        // If no results found, provide Bible Gateway search option
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen size={20} className="text-primary-600" />
        <h3 className="font-semibold text-gray-900">Search Scripture</h3>
      </div>
      
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search for verses..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Search size={16} />
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {results.map((verse, index) => (
            <div
              key={index}
              className={`p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
                onVerseSelect ? 'cursor-pointer' : ''
              }`}
              onClick={() => onVerseSelect?.(verse)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-medium text-primary-600">
                  {verse.book} {verse.chapter}:{verse.verse}
                </span>
              </div>
              <p className="text-gray-800 text-sm leading-relaxed">
                {verse.text}
              </p>
            </div>
          ))}
        </div>
      )}

      {query && results.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-4">
          <p className="mb-3">No verses found matching "{query}" in our local database.</p>
          <a
            href={bibleService.getBibleGatewaySearchUrl(query)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            Search on Bible Gateway
            <ExternalLink size={14} />
          </a>
        </div>
      )}
    </div>
  );
};

export default BibleSearch;