import { useState, useEffect } from 'react';
import { useGraph } from '../../context';
import { analyzeGraphStructure, getInsightsSummary } from '../../utils/graphInsights';
import type { GraphInsights as GraphInsightsType, ClusterInfo } from '../../utils/graphInsights';
import { InsightsModal } from './InsightsModal';

interface GraphInsightsProps {
  className?: string;
}

export function GraphInsights({ className = '' }: GraphInsightsProps) {
  const { state, filteredData, highlightNodes } = useGraph();
  const [insights, setInsights] = useState<GraphInsightsType | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedCommunity, setSelectedCommunity] = useState<ClusterInfo | null>(null);

  useEffect(() => {
    if (filteredData) {
      const analysis = analyzeGraphStructure(filteredData);
      setInsights(analysis);
    } else {
      setInsights(null);
    }
  }, [filteredData]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatNodeName = (nodeId: string): string => {
    return nodeId.split('/').pop() || nodeId;
  };

  const handleNodeClick = (nodeId: string) => {
    highlightNodes(new Set([nodeId]));
  };

  if (!insights) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="text-sm text-gray-500">No graph data to analyze</div>
      </div>
    );
  }

  const summary = getInsightsSummary(insights);

  return (
    <div className={`${className}`}>
      <div className="space-y-4">
        {/* Summary Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">📊 Graph Insights</h3>
            {state.viewState.highlightedNodes.size > 0 && (
              <button
                onClick={() => highlightNodes(new Set())}
                className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                title="Clear highlights"
              >
                Clear ({state.viewState.highlightedNodes.size})
              </button>
            )}
          </div>
          <div className="space-y-2">
            {summary.map((item, index) => (
              <div key={index} className="text-xs text-gray-600 bg-gray-50/50 rounded-lg px-3 py-2">
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Communities */}
        {insights.communities.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('communities')}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              title="Communities: Groups of nodes that are more densely connected to each other than to the rest of the graph. Think of them as tightly-knit neighborhoods within your codebase."
            >
              <span>👥 Communities ({insights.communities.length})</span>
              <span className="text-xs">
                {expandedSections.has('communities') ? '▼' : '▶'}
              </span>
            </button>

            {expandedSections.has('communities') && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {insights.communities.slice(0, 15).map((community, index) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    index={index}
                    onShowDetails={setSelectedCommunity}
                  />
                ))}
                {insights.communities.length > 15 && (
                  <div className="text-xs text-gray-500 px-2">
                    ... and {insights.communities.length - 15} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hub Nodes */}
        {insights.hubNodes.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('hubs')}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              title="Hub Nodes: Highly connected nodes that many other nodes depend on. These are often critical files like utilities, types, or core modules that could be bottlenecks if changed."
            >
              <span>⭐ Hub Nodes ({insights.hubNodes.length})</span>
              <span className="text-xs">
                {expandedSections.has('hubs') ? '▼' : '▶'}
              </span>
            </button>

            {expandedSections.has('hubs') && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {insights.hubNodes.slice(0, 15).map((hub) => (
                  <div
                    key={hub.id}
                    className="flex items-center justify-between text-xs bg-yellow-50/50 rounded px-2 py-1 cursor-pointer hover:bg-yellow-100/70 transition-colors"
                    onClick={() => handleNodeClick(hub.id)}
                    title={`Click to highlight: ${hub.id}`}
                  >
                    <span className="truncate flex-1">
                      {formatNodeName(hub.id)}
                    </span>
                    <span className="text-gray-500 ml-2">{hub.degree}</span>
                  </div>
                ))}
                {insights.hubNodes.length > 15 && (
                  <div className="text-xs text-gray-500 px-2">
                    ... and {insights.hubNodes.length - 15} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Isolated Nodes */}
        {insights.isolatedNodes.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('isolated')}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              title="Isolated Nodes: Files or modules with no connections to other parts of the graph. These might be unused code, standalone utilities, or entry points that don't import anything."
            >
              <span>🏝️ Isolated ({insights.isolatedNodes.length})</span>
              <span className="text-xs">
                {expandedSections.has('isolated') ? '▼' : '▶'}
              </span>
            </button>

            {expandedSections.has('isolated') && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {insights.isolatedNodes.slice(0, 20).map((nodeId) => (
                  <div
                    key={nodeId}
                    className="text-xs text-gray-600 bg-red-50/50 rounded px-2 py-1 truncate cursor-pointer hover:bg-red-100/70 transition-colors"
                    onClick={() => handleNodeClick(nodeId)}
                    title={`Click to highlight: ${nodeId}`}
                  >
                    {formatNodeName(nodeId)}
                  </div>
                ))}
                {insights.isolatedNodes.length > 20 && (
                  <div className="text-xs text-gray-500 px-2">
                    ... and {insights.isolatedNodes.length - 20} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Connected Components */}
        {insights.connectedComponents.length > 1 && (
          <div>
            <button
              onClick={() => toggleSection('components')}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              title="Connected Components: Separate groups of nodes that are linked together. Each component is isolated from others - there's no path between different components."
            >
              <span>🔗 Components ({insights.connectedComponents.length})</span>
              <span className="text-xs">
                {expandedSections.has('components') ? '▼' : '▶'}
              </span>
            </button>

            {expandedSections.has('components') && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                {insights.connectedComponents.slice(0, 10).map((component, index) => (
                  <ComponentCard key={component.id} component={component} index={index} />
                ))}
                {insights.connectedComponents.length > 10 && (
                  <div className="text-xs text-gray-500 px-2">
                    ... and {insights.connectedComponents.length - 10} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Community Modal */}
      {selectedCommunity && (
        <InsightsModal
          community={selectedCommunity}
          isOpen={!!selectedCommunity}
          onClose={() => setSelectedCommunity(null)}
        />
      )}
    </div>
  );
}

function ComponentCard({ component, index }: { component: ClusterInfo; index: number; }) {
  const { highlightNodes } = useGraph();

  const formatNodeName = (nodeId: string): string => {
    return nodeId.split('/').pop() || nodeId;
  };

  const handleComponentClick = () => {
    highlightNodes(new Set(component.nodes));
  };

  const handleCentralNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (component.centralNode) {
      highlightNodes(new Set([component.centralNode]));
    }
  };

  return (
    <div
      className="bg-blue-50/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-100/70 transition-colors"
      onClick={handleComponentClick}
      title={`Click to highlight all ${component.size} nodes in component`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">
          Component {index + 1}
        </span>
        <span className="text-xs text-gray-500">
          {component.size} nodes
        </span>
      </div>
      <div className="text-xs text-gray-600">
        <div>Density: {Math.round(component.density * 100)}%</div>
        {component.centralNode && (
          <div
            className="truncate mt-1 hover:text-gray-800 cursor-pointer"
            onClick={handleCentralNodeClick}
            title={`Click to highlight central node: ${component.centralNode}`}
          >
            Central: {formatNodeName(component.centralNode)}
          </div>
        )}
      </div>
    </div>
  );
}

function CommunityCard({ community, index, onShowDetails }: {
  community: ClusterInfo;
  index: number;
  onShowDetails: (community: ClusterInfo) => void;
}) {
  const { highlightNodes } = useGraph();

  const formatNodeName = (nodeId: string): string => {
    return nodeId.split('/').pop() || nodeId;
  };

  const handleCommunityClick = () => {
    highlightNodes(new Set(community.nodes));
  };

  const handleHubNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (community.centralNode) {
      highlightNodes(new Set([community.centralNode]));
    }
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDetails(community);
  };

  return (
    <div
      className="bg-green-50/50 rounded-lg px-3 py-2 cursor-pointer hover:bg-green-100/70 transition-colors"
      onClick={handleCommunityClick}
      title={`Click to highlight all ${community.size} nodes in community`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700">
          {community.id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleDetailsClick}
            className="p-1 rounded hover:bg-green-200/50 transition-colors"
            title="Show detailed information"
          >
            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <span className="text-xs text-gray-500">
            {community.size} nodes
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-600">
        <div>Cohesion: {Math.round(community.density * 100)}%</div>
        {community.centralNode && (
          <div
            className="truncate mt-1 hover:text-gray-800 cursor-pointer"
            onClick={handleHubNodeClick}
            title={`Click to highlight hub node: ${community.centralNode}`}
          >
            Hub: {formatNodeName(community.centralNode)}
          </div>
        )}
      </div>
    </div>
  );
}