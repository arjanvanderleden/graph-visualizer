import { useState, useEffect } from 'react';
import { GraphProvider, useGraph } from './context';
import { FileUpload } from './components/upload';
import { GraphVisualization } from './components/graph';
import { GraphSearch } from './components/search';
import { FilterComponent } from './components/filter';
import { downloadSVG, downloadPNG, findConnectedEntities } from './utils';

function AppContent() {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showFileUpload, setShowFileUpload] = useState(false);
  const { state, setData, selectNode, setConnectedEntities } = useGraph();

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

  const mainWidth = windowSize.width;
  const mainHeight = windowSize.height - 64;

  const handleEntitySelect = (entityId: string) => {
    // Select the entity and find its connected entities
    selectNode(entityId);
    if (state.data) {
      const connected = findConnectedEntities(state.data, entityId, null);
      setConnectedEntities(connected);
    }
  };

  // Helper function to truncate paths with ellipsis at start
  const truncatePath = (path: string, maxLength: number = 40) => {
    if (path.length <= maxLength) return path;
    return '...' + path.slice(-(maxLength - 3));
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
              {state.data.nodes.length} nodes · {state.data.links.length} links
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
            const node = state.data?.nodes.find(n => n.id === state.viewState.selectedNode);
            return (
              <div className="mt-6">
                <h2 className="text-base font-medium mb-4 text-gray-700">
                  Selected Node
                </h2>
                <div className="p-4 rounded-xl bg-green-100/60 backdrop-blur-sm shadow-neumorphic-inset text-sm border border-green-200/40">
                  <div className="font-medium text-gray-700 mb-2" title={node?.path || state.viewState.selectedNode}>
                    {truncatePath(node?.path || state.viewState.selectedNode)}
                  </div>
                  {node?.declarations && node.declarations.length > 0 && (
                    <div className="text-xs text-gray-600 mb-2">
                      {node.declarations.length} declaration{node.declarations.length !== 1 ? 's' : ''}
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
            const link = state.data?.links.find(l => {
              const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
              const targetId = typeof l.target === 'string' ? l.target : l.target.id;
              return `${sourceId}-${targetId}` === state.viewState.selectedLink;
            });
            if (!link) return null;

            const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
            const targetId = typeof link.target === 'string' ? link.target : link.target.id;
            const sourceNode = state.data?.nodes.find(n => n.id === sourceId);
            const targetNode = state.data?.nodes.find(n => n.id === targetId);

            return (
              <div className="mt-6">
                <h2 className="text-base font-medium mb-4 text-gray-700">
                  Selected Link
                </h2>
                <div className="p-4 rounded-xl bg-green-100/60 backdrop-blur-sm shadow-neumorphic-inset text-sm border border-green-200/40">
                  <div className="font-medium text-gray-700 mb-2">
                    {link.type} dependency
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="truncate" title={sourceNode?.path || sourceId}>
                      From: {truncatePath(sourceNode?.path || sourceId, 30)}
                    </div>
                    <div className="truncate" title={targetNode?.path || targetId}>
                      To: {truncatePath(targetNode?.path || targetId, 30)}
                    </div>
                    {link.imports && link.imports.length > 0 && (
                      <div className="mt-2">
                        Imports: {link.imports.map(imp =>
                          typeof imp === 'string' ? imp : (imp.name || imp.importedName || String(imp))
                        ).join(', ')}
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
                  const node = state.data?.nodes.find(n => n.id === entityId);
                  return (
                    <div
                      key={entityId}
                      className="p-3 rounded-xl bg-blue-100/50 backdrop-blur-sm shadow-neumorphic-inset text-sm border border-blue-200/30 cursor-pointer hover:bg-blue-100/70 transition-colors duration-200"
                      onClick={() => handleEntitySelect(entityId)}
                    >
                      <div className="font-medium truncate text-gray-700">
                        {node?.path?.split('/').pop() || entityId}
                      </div>
                      <div className="text-xs text-gray-600 truncate" title={node?.path || entityId}>
                        {truncatePath(node?.path || entityId, 35)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
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
