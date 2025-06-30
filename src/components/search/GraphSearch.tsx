import { useState, useRef, useEffect } from 'react';
import { useGraph } from '../../context';
import { searchGraphEntities, selectSearchResult, type SearchResult } from '../../utils';

interface GraphSearchProps {
  className?: string;
}

export function GraphSearch({ className = '' }: GraphSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  const { filteredData } = useGraph();

  // Search when term changes
  useEffect(() => {
    if (!searchTerm.trim() || !filteredData) {
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const searchResults = searchGraphEntities(filteredData, searchTerm);
    setResults(searchResults);
    setIsOpen(searchResults.length > 0);
    setSelectedIndex(-1);
  }, [searchTerm, filteredData]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    selectSearchResult(result);
    setSearchTerm('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  // Handle input focus/blur
  const handleFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on results
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Search nodes and links..."
          className="w-full px-4 py-2 pl-10 bg-white/10 backdrop-blur-sm rounded-xl shadow-neumorphic-inset focus:outline-none focus:shadow-neumorphic transition-all duration-200 text-gray-700 placeholder-gray-500"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Search Results */}
      {isOpen && results.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 rounded-xl shadow-neumorphic border border-gray-200 max-h-64 overflow-y-auto z-50"
        >
          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.id}`}
              className={`p-3 cursor-pointer transition-colors duration-150 ${
                index === selectedIndex
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
              } ${
                index === 0 ? 'rounded-t-xl' : ''
              } ${
                index === results.length - 1 ? 'rounded-b-xl' : 'border-b border-gray-200'
              }`}
              onClick={() => handleSelectResult(result)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      result.type === 'node' ? 'bg-blue-400' : 'bg-purple-400'
                    }`} />
                    <span className="font-medium text-gray-700 truncate">
                      {result.displayText}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {result.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 truncate">
                    <span className="font-medium">{result.matchedProperty}:</span> {result.matchedValue}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && results.length === 0 && searchTerm.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 rounded-xl shadow-neumorphic border border-gray-200 p-4 z-50">
          <div className="text-center text-gray-600">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm">No results found for "{searchTerm}"</p>
          </div>
        </div>
      )}
    </div>
  );
}