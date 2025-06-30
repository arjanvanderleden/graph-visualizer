import { useReducer, useMemo } from 'react';
import type { GraphData } from '../types';
import { graphReducer, initialState, GraphContext } from './GraphContext';
import type { GraphProviderProps, GraphContextType } from './GraphContext';


export function GraphProvider({ children }: GraphProviderProps) {
  const [state, dispatch] = useReducer(graphReducer, initialState);

  // Memoized filtered data to prevent unnecessary re-renders
  const filteredData = useMemo((): GraphData | null => {
    if (!state.data) return null;

    const { nodeFilter } = state.viewState;

    // If no filter text, return original data
    if (!nodeFilter.text.trim()) {
      return state.data;
    }

    const filterText = nodeFilter.text.toLowerCase();

    // Filter nodes based on criteria
    const filteredNodes = state.data.nodes.filter(node => {
      let matches = false;

      if (nodeFilter.filterDeclarations) {
        // Only check declarations when enabled
        if (node.declarations) {
          matches = node.declarations.some(decl => decl.name.toLowerCase().includes(filterText)
          );
        }
      } else {
        // Only check node path when declarations filtering is disabled
        matches = node.path.toLowerCase().includes(filterText);
      }

      // Apply include/exclude logic
      return nodeFilter.includeMode ? matches : !matches;
    });

    // Get set of filtered node IDs for efficient lookup
    const filteredNodeIds = new Set(filteredNodes.map(node => node.id));

    // Filter links - only include links where both source and target are in filtered nodes
    const filteredLinks = state.data.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    return {
      nodes: filteredNodes,
      links: filteredLinks,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.data, state.viewState.nodeFilter]);

  const contextValue: GraphContextType = {
    state,
    filteredData,
    setData: (data) => dispatch({ type: 'SET_DATA', payload: data }),
    setLoading: (loading) => dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    selectNode: (nodeId) => dispatch({ type: 'SELECT_NODE', payload: nodeId }),
    selectLink: (linkId) => dispatch({ type: 'SELECT_LINK', payload: linkId }),
    setConnectedEntities: (entities) => dispatch({ type: 'SET_CONNECTED_ENTITIES', payload: entities }),
    highlightNodes: (nodeIds) => dispatch({ type: 'HIGHLIGHT_NODES', payload: nodeIds }),
    setHoveredNode: (nodeId) => dispatch({ type: 'SET_HOVERED_NODE', payload: nodeId }),
    setHoveredLink: (linkId) => dispatch({ type: 'SET_HOVERED_LINK', payload: linkId }),
    setCenterNode: (nodeId) => dispatch({ type: 'SET_CENTER_NODE', payload: nodeId }),
    setSearchQuery: (query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query }),
    setHighlightDepth: (depth) => dispatch({ type: 'SET_HIGHLIGHT_DEPTH', payload: depth }),
    setNodeFilter: (filter) => dispatch({ type: 'SET_NODE_FILTER', payload: filter }),
    updateSettings: (settings) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
    resetView: () => dispatch({ type: 'RESET_VIEW' }),
  };

  return (
    <GraphContext.Provider value={contextValue}>
      {children}
    </GraphContext.Provider>
  );
}
