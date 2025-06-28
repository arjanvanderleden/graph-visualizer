import { useState } from 'react';
import { useGraph } from '../../context';

export function FilterComponent() {
  const { state, setNodeFilter } = useGraph();
  const { nodeFilter } = state.viewState;
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTextChange = (text: string) => {
    setNodeFilter({ text });
  };

  const handleIncludeModeToggle = () => {
    setNodeFilter({ includeMode: !nodeFilter.includeMode });
  };

  const handleDeclarationFilterToggle = () => {
    setNodeFilter({ filterDeclarations: !nodeFilter.filterDeclarations });
  };

  const handleClearFilter = () => {
    setNodeFilter({ 
      text: '', 
      includeMode: true, 
      filterDeclarations: false 
    });
  };

  const hasActiveFilter = nodeFilter.text.trim() !== '';

  return (
    <div className="space-y-3">
      {/* Main filter input - inset style */}
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={nodeFilter.text}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Filter nodes..."
            className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm shadow-neumorphic-inset border border-white/20 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400/50 transition-all duration-200"
          />
          
          {/* Filter controls button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`absolute left-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all duration-200 flex items-center justify-center ${
              isExpanded || hasActiveFilter
                ? 'bg-blue-400/20 text-blue-600'
                : 'bg-gray-200/50 text-gray-500 hover:bg-gray-200/70'
            }`}
            title="Filter options"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
        
        {/* Clear filter button */}
        {hasActiveFilter && (
          <button
            onClick={handleClearFilter}
            className="absolute right-12 top-1/2 -translate-y-1/2 p-1 rounded-md bg-gray-200/50 hover:bg-gray-200/70 text-gray-500 hover:text-gray-700 transition-all duration-200"
            title="Clear filter"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded filter options - no panel styling */}
      {isExpanded && (
        <div className="space-y-4 text-sm">
          
          {/* Include/Exclude toggle */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Filter mode:</span>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={nodeFilter.includeMode}
                onChange={handleIncludeModeToggle}
                className="sr-only"
              />
              <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                nodeFilter.includeMode ? 'bg-green-400' : 'bg-red-400'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                  nodeFilter.includeMode ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
              <span className={`ml-2 font-medium ${
                nodeFilter.includeMode ? 'text-green-600' : 'text-red-600'
              }`}>
                {nodeFilter.includeMode ? 'Include' : 'Exclude'}
              </span>
            </label>
          </div>

          {/* Declaration filter toggle */}
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Filter declarations:</span>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={nodeFilter.filterDeclarations}
                onChange={handleDeclarationFilterToggle}
                className="sr-only"
              />
              <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                nodeFilter.filterDeclarations ? 'bg-blue-400' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                  nodeFilter.filterDeclarations ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </div>
              <span className={`ml-2 font-medium ${
                nodeFilter.filterDeclarations ? 'text-blue-600' : 'text-gray-600'
              }`}>
                Search in function/class names
              </span>
            </label>
          </div>

          {/* Filter description */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-gray-500">
              {nodeFilter.includeMode ? 'Show only' : 'Hide'} nodes {
                nodeFilter.filterDeclarations 
                  ? 'containing the text in declaration names'
                  : 'containing the text in path'
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}