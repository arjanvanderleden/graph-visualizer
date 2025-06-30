import { useState, useEffect } from 'react';
import { GraphProvider, useGraph } from './context';
import { FileUpload } from './components/upload';
import { GraphVisualization } from './components/graph';
import { GraphSearch } from './components/search';
import { FilterComponent } from './components/filter';
import { GraphTaskbar } from './components/ui';
import { GraphInsights } from './components/insights';
import { downloadSVG, downloadPNG, findConnectedEntities } from './utils';
import type { D3Node, D3Link } from './types';
import { formatNodeForDisplay, formatLinkForDisplay, copyToClipboard } from './utils/formatters';
import { CopyIcon } from './components/ui/Icons';

function AppContent() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<D3Node | null>(null);
  const [hoveredLink, setHoveredLink] = useState<D3Link | null>(null);
  const { state, filteredData, setData, selectNode, setConnectedEntities } = useGraph();

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // const mainWidth = windowSize.width;
  // const mainHeight = windowSize.height - 64;

  const handleEntitySelect = (entityId: string) => {
    // Select the entity and find its connected entities
    selectNode(entityId);
    if (filteredData) {
      const connected = findConnectedEntities(filteredData, entityId, null);
      setConnectedEntities(connected);
    }
  };

  const handleHoverChange = (node: D3Node | null, link: D3Link | null) => {
    setHoveredNode(node);
    setHoveredLink(link);
  };


  return (
    <div className="min-h-screen relative bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Full-screen canvas background */}
      {state.data && !showFileUpload ? (
        <div className="fixed inset-0">
          <GraphVisualization
            width={windowSize.width}
            height={windowSize.height}
            className="w-full h-full"
            onHoverChange={handleHoverChange}
          />
        </div>
      ) : (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="max-w-md w-full p-8">
            <FileUpload
              onDataLoaded={(data) => {
                setData(data);
                setShowFileUpload(false);
              }}
              onCancel={state.data ? () => setShowFileUpload(false) : undefined}
              showCancel={!!state.data}
            />
          </div>
        </div>
      )}

      {/* Overlay Header */}
      <header className="fixed top-0 left-0 right-0 z-10 h-16 flex items-center px-6 bg-white/5 backdrop-blur-lg border-b border-white/10">
        <h1 className="text-xl font-medium text-gray-700">
          Graph Visualizer
        </h1>
        <div className="ml-auto flex items-center space-x-4">
          {state.data && (
            <div className="text-sm text-gray-600">
              {filteredData ? (
                filteredData.nodes.length !== state.data.nodes.length || 
                filteredData.links.length !== state.data.links.length ? (
                  // Show filtered vs total when filtering is active
                  <span>
                    {filteredData.nodes.length} / {state.data.nodes.length} nodes · {' '}
                    {filteredData.links.length} / {state.data.links.length} links
                  </span>
                ) : (
                  // Show total when no filtering
                  <span>
                    {state.data.nodes.length} nodes · {state.data.links.length} links
                  </span>
                )
              ) : (
                <span>
                  {state.data.nodes.length} nodes · {state.data.links.length} links
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Overlay Sidebar */}
      {state.data && (
        <aside className="fixed top-16 right-0 bottom-0 z-10 w-80 p-6 overflow-y-auto bg-white/5 backdrop-blur-lg border-l border-white/10">
          <div className="space-y-6">

            {/* Filter */}
            <div>
              <FilterComponent />
            </div>

            {/* Insights */}
            <div>
              <GraphInsights />
            </div>

            {/* Search */}
            <div>
              <GraphSearch />
            </div>

            <div>
              <div className="flex items-center justify-between">
                {/* Zoom - Left aligned */}
                <button
                  className="p-1.5 h-10 w-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-200 shadow-neumorphic-raised hover:shadow-neumorphic-pressed active:shadow-neumorphic-pressed transition-all duration-200 flex items-center justify-center group"
                  onClick={() => {
                    const event = new CustomEvent('zoomToFit');
                    window.dispatchEvent(event);
                  }}
                  title="Fit to View"
                >
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                
                <div className="flex items-center gap-2">
                  {/* Downloads - Right aligned with separator */}
                  <button
                    className="p-1.5 h-10 w-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-200 shadow-neumorphic-raised hover:shadow-neumorphic-pressed active:shadow-neumorphic-pressed transition-all duration-200 flex items-center justify-center group"
                    onClick={downloadSVG}
                    title="Download SVG"
                  >
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                  <button
                    className="p-1.5 h-10 w-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-200 shadow-neumorphic-raised hover:shadow-neumorphic-pressed active:shadow-neumorphic-pressed transition-all duration-200 flex items-center justify-center group"
                    onClick={downloadPNG}
                    title="Download PNG"
                  >
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  <div className="w-px h-8 bg-gray-300/50"></div>
                  
                  {/* Upload - Far right */}
                  <button
                    className="p-1.5 h-10 w-10 rounded-lg bg-gradient-to-br from-gray-50 to-gray-200 shadow-neumorphic-raised hover:shadow-neumorphic-pressed active:shadow-neumorphic-pressed transition-all duration-200 flex items-center justify-center group"
                    onClick={() => setShowFileUpload(true)}
                    title="Load New File"
                  >
                    <svg className="w-4 h-4 text-gray-600 group-hover:text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {state.viewState.selectedNode && (() => {
            const node = filteredData?.nodes.find(n => n.id === state.viewState.selectedNode);
            if (!node) return null;
            
            const formatted = formatNodeForDisplay(node);
            const fullPath = formatted.pathParent 
              ? `${formatted.pathParent}/${formatted.pathFile}`
              : formatted.pathFile;
            
            const handleCopyPath = async () => {
              const success = await copyToClipboard(fullPath);
              if (success) {
                // You could add a toast notification here
                console.log('Path copied to clipboard');
              }
            };
            
            return (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium text-gray-700">
                    Selected Node
                  </h2>
                  <button
                    onClick={handleCopyPath}
                    className="p-1.5 rounded-lg bg-gradient-to-br from-gray-50 to-gray-200 shadow-neumorphic-raised hover:shadow-neumorphic-pressed active:shadow-neumorphic-pressed transition-all duration-200 flex items-center justify-center group"
                    title="Copy path to clipboard"
                  >
                    <CopyIcon className="text-gray-600 group-hover:text-gray-800" size={12} />
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-green-100/60 backdrop-blur-sm shadow-neumorphic-inset text-sm border border-green-200/40">
                  <div className="font-medium text-gray-700 mb-2 truncate" title={fullPath}>
                    {formatted.pathFile}
                    {formatted.pathParent && (
                      <span className="text-gray-500 text-xs ml-1">({formatted.pathParent})</span>
                    )}
                  </div>
                  {formatted.declarations.size > 0 && (
                    <div className="text-xs text-gray-600 mb-2">
                      {Array.from(formatted.declarations.entries()).map(([type, names]) => (
                        <div key={type} className="truncate">
                          <span className="font-medium">{type}:</span> {names}
                        </div>
                      ))}
                    </div>
                  )}
                  {node?.imports && node.imports.length > 0 && (
                    <div className="text-xs text-gray-600">
                      {node.imports.length} import{node.imports.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {state.viewState.selectedLink && (() => {
            const link = filteredData?.links.find(l => {
              const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
              const targetId = typeof l.target === 'string' ? l.target : l.target.id;
              return `${sourceId}-${targetId}` === state.viewState.selectedLink;
            });
            if (!link) return null;

            const formatted = formatLinkForDisplay(link);
            const linkText = `${formatted.from} → ${formatted.to}`;
            
            const handleCopyLink = async () => {
              const success = await copyToClipboard(linkText);
              if (success) {
                console.log('Link copied to clipboard');
              }
            };

            return (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-medium text-gray-700">
                    Selected Link
                  </h2>
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg bg-gradient-to-br from-gray-50 to-gray-200 shadow-neumorphic-raised hover:shadow-neumorphic-pressed active:shadow-neumorphic-pressed transition-all duration-200 flex items-center justify-center group"
                    title="Copy link to clipboard"
                  >
                    <CopyIcon className="text-gray-600 group-hover:text-gray-800" size={12} />
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-green-100/60 backdrop-blur-sm shadow-neumorphic-inset text-sm border border-green-200/40">
                  <div className="font-medium text-gray-700 mb-2">
                    {link.type} dependency
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="truncate" title={linkText}>
                      {formatted.from} → {formatted.to}
                    </div>
                    {link.imports && link.imports.length > 0 && (
                      <div className="mt-2 truncate">
                        Imports: {link.imports.map(imp => {
                          if (typeof imp === 'string') return imp;
                          if (imp && typeof imp === 'object') {
                            const impObj = imp as Record<string, unknown>;
                            return impObj.name || impObj.importedName || String(imp);
                          }
                          return String(imp);
                        }).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {state.viewState.connectedEntities.size > 0 && (
            <div className="mt-6">
              <h2 className="text-base font-medium mb-4 text-gray-700">
                Connected Entities
              </h2>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {Array.from(state.viewState.connectedEntities).map(entityId => {
                  const node = filteredData?.nodes.find(n => n.id === entityId);
                  if (!node) return null;
                  
                  const formatted = formatNodeForDisplay(node);
                  const fullPath = formatted.pathParent 
                    ? `${formatted.pathParent}/${formatted.pathFile}`
                    : formatted.pathFile;
                  
                  const handleCopyEntityPath = async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    const success = await copyToClipboard(fullPath);
                    if (success) {
                      console.log('Entity path copied to clipboard');
                    }
                  };
                  
                  return (
                    <div
                      key={entityId}
                      className="p-3 rounded-xl bg-blue-100/50 backdrop-blur-sm shadow-neumorphic-inset text-sm border border-blue-200/30 cursor-pointer hover:bg-blue-100/70 transition-colors duration-200 group"
                      onClick={() => handleEntitySelect(entityId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-gray-700">
                            {formatted.pathFile}
                          </div>
                          <div className="text-xs text-gray-600 truncate" title={fullPath}>
                            {formatted.pathParent || 'No parent path'}
                          </div>
                        </div>
                        <button
                          onClick={handleCopyEntityPath}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded bg-blue-200/50 hover:bg-blue-300/50 transition-all duration-200"
                          title="Copy path to clipboard"
                        >
                          <CopyIcon className="text-gray-600" size={10} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      )}
      
      {/* Taskbar at bottom */}
      {state.data && !showFileUpload && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <GraphTaskbar
            hoveredNode={hoveredNode}
            hoveredLink={hoveredLink}
          />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <GraphProvider>
      <AppContent />
    </GraphProvider>
  );
}

export default App;
