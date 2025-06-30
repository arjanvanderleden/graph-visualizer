import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGraph } from '../../context';
import type { ClusterInfo } from '../../utils/graphInsights';
import { formatNodeForDisplay } from '../../utils/formatters';

interface InsightsModalProps {
  community: ClusterInfo;
  isOpen: boolean;
  onClose: () => void;
}

export function InsightsModal({ community, isOpen, onClose }: InsightsModalProps) {
  const { filteredData, highlightNodes, selectNode } = useGraph();
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'exports' | 'connections'>('overview');

  if (!isOpen || !filteredData) return null;

  // Get detailed information about nodes in the community
  const communityNodes = filteredData.nodes.filter(node =>
    community.nodes.includes(node.id)
  );

  // Get all exported declarations from community nodes
  const allExportedDeclarations = communityNodes.flatMap(node => {
    if (!node.declarations || !Array.isArray(node.declarations)) return [];
    return node.declarations
      .filter(decl => decl.isExported)
      .map(decl => ({
        nodeId: node.id,
        declaration: decl,
        formatted: formatNodeForDisplay(node)
      }));
  });

  // Get all declarations from community nodes
  const allDeclarations = communityNodes.flatMap(node => {
    if (!node.declarations || !Array.isArray(node.declarations)) return [];
    return node.declarations.map(decl => ({
      nodeId: node.id,
      declaration: decl,
      formatted: formatNodeForDisplay(node)
    }));
  });

  // Get connections between community nodes and external nodes
  const communityNodeIds = new Set(community.nodes);
  const externalConnections = filteredData.links.filter(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;

    // One node in community, one outside
    return (communityNodeIds.has(sourceId) && !communityNodeIds.has(targetId)) ||
      (!communityNodeIds.has(sourceId) && communityNodeIds.has(targetId));
  });

  const handleNodeClick = (nodeId: string) => {
    selectNode(nodeId);
    onClose();
  };

  const handleHighlightCommunity = () => {
    highlightNodes(new Set(community.nodes));
  };

  const formatNodeName = (nodeId: string): string => {
    return nodeId.split('/').pop() || nodeId;
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-[90%] max-h-[90vh] mx-auto overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {community.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {community.size} files • {Math.round(community.density * 100)}% cohesion
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleHighlightCommunity}
                className="px-3 py-1.5 text-sm bg-green-200 hover:bg-green-300 text-green-800 rounded-lg transition-colors"
                title="Highlight all nodes in community"
              >
                Highlight All
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                title="Close modal"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'overview', label: 'Overview', count: community.size },
              { key: 'files', label: 'Files', count: communityNodes.length },
              { key: 'exports', label: 'Exports', count: allExportedDeclarations.length },
              { key: 'connections', label: 'External Links', count: externalConnections.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Community Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Files:</span>
                      <span className="font-medium">{community.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cohesion:</span>
                      <span className="font-medium">{Math.round(community.density * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">External links:</span>
                      <span className="font-medium">{externalConnections.length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-700 mb-2">Content Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total exports:</span>
                      <span className="font-medium">{allExportedDeclarations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total declarations:</span>
                      <span className="font-medium">{allDeclarations.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {community.centralNode && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h3 className="font-medium text-gray-700 mb-2">Hub File</h3>
                  <div
                    className="text-sm cursor-pointer hover:text-yellow-800 transition-colors"
                    onClick={() => handleNodeClick(community.centralNode!)}
                    title="Click to select this file"
                  >
                    📁 {formatNodeName(community.centralNode)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    This file has the most connections within the community
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700 mb-4">Files in Community</h3>
              <div className="grid gap-2">
                {communityNodes.map((node) => {
                  const formatted = formatNodeForDisplay(node);
                  return (
                    <div
                      key={node.id}
                      className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleNodeClick(node.id)}
                      title="Click to select this file"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            📁 {formatted.pathFile}
                          </div>
                          {formatted.pathParent && (
                            <div className="text-xs text-gray-500 truncate">
                              {formatted.pathParent}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 ml-2">
                          {node.exports?.length || 0} exports
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'exports' && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700 mb-4">Exported Declarations</h3>
              <div className="space-y-3">
                {allExportedDeclarations.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No exported declarations found in this community
                  </div>
                ) : (
                  allExportedDeclarations.map((item, index) => (
                    <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-blue-800">
                              {item.declaration.name}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-blue-200 text-blue-700 rounded">
                              {item.declaration.type}
                            </span>
                            {item.declaration.isDefault && (
                              <span className="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-700 rounded">
                                default
                              </span>
                            )}
                          </div>
                          <div
                            className="text-xs text-gray-600 truncate cursor-pointer hover:text-blue-700 transition-colors mt-1"
                            onClick={() => handleNodeClick(item.nodeId)}
                            title="Click to select this file"
                          >
                            from {item.formatted.pathFile}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'connections' && (
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700 mb-4">External Connections</h3>
              <div className="space-y-3">
                {externalConnections.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    This community has no external connections
                  </div>
                ) : (
                  externalConnections.map((link, index) => {
                    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
                    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
                    const isSourceInCommunity = communityNodeIds.has(sourceId);

                    return (
                      <div key={index} className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="flex items-center space-x-2 text-sm">
                          <span
                            className={`font-medium cursor-pointer hover:text-purple-800 transition-colors ${!isSourceInCommunity ? 'text-green-700' : 'text-gray-700'
                              }`}
                            onClick={() => handleNodeClick(targetId)}
                            title="Click to select this file"
                          >
                            {formatNodeName(targetId)}
                            {!isSourceInCommunity && ' (in community)'}
                          </span>
                          <span className="text-gray-500">→</span>
                          <span
                            className={`font-medium cursor-pointer hover:text-purple-800 transition-colors ${isSourceInCommunity ? 'text-green-700' : 'text-gray-700'
                              }`}
                            onClick={() => handleNodeClick(sourceId)}
                            title="Click to select this file"
                          >
                            {formatNodeName(sourceId)}
                            {isSourceInCommunity && ' (in community)'}
                          </span>
                        </div>
                        {link.imports && link.imports.length > 0 && (
                          <div className="text-xs text-gray-600 mt-1">
                            {formatNodeName(sourceId)} imports: {link.imports.map(imp => {
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
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}