import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { GraphData, GraphViewState, GraphSettings } from '../types';

interface GraphState {
  data: GraphData | null;
  viewState: GraphViewState;
  settings: GraphSettings;
  isLoading: boolean;
  error: string | null;
}

type GraphAction =
  | { type: 'SET_DATA'; payload: GraphData }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'SELECT_LINK'; payload: string | null }
  | { type: 'SET_CONNECTED_ENTITIES'; payload: Set<string> }
  | { type: 'HIGHLIGHT_NODES'; payload: Set<string> }
  | { type: 'SET_HOVERED_NODE'; payload: string | null }
  | { type: 'SET_HOVERED_LINK'; payload: string | null }
  | { type: 'SET_CENTER_NODE'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_HIGHLIGHT_DEPTH'; payload: number }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GraphSettings> }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'RESET_VIEW' };

const initialState: GraphState = {
  data: null,
  viewState: {
    selectedNode: null,
    selectedLink: null,
    connectedEntities: new Set(),
    highlightedNodes: new Set(),
    hoveredNode: null,
    hoveredLink: null,
    centerNode: null,
    searchQuery: '',
    highlightDepth: 1,
  },
  settings: {
    forceStrength: -300,
    linkDistance: 100,
    nodeRadius: 8,
    enableCollision: true,
    animationSpeed: 1,
  },
  isLoading: false,
  error: null,
};

function graphReducer(state: GraphState, action: GraphAction): GraphState {
  switch (action.type) {
    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        error: null,
        isLoading: false,
        viewState: { ...initialState.viewState },
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? null : state.error,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SELECT_NODE':
      return {
        ...state,
        viewState: {
          ...state.viewState,
          selectedNode: action.payload,
          selectedLink: null, // Clear link selection
        },
      };

    case 'SELECT_LINK':
      return {
        ...state,
        viewState: {
          ...state.viewState,
          selectedLink: action.payload,
          selectedNode: null, // Clear node selection
        },
      };

    case 'SET_CONNECTED_ENTITIES':
      return {
        ...state,
        viewState: {
          ...state.viewState,
          connectedEntities: action.payload,
        },
      };

    case 'HIGHLIGHT_NODES':
      return {
        ...state,
        viewState: {
          ...state.viewState,
          highlightedNodes: action.payload,
        },
      };

    case 'SET_HOVERED_NODE':
      return {
        ...state,
        viewState: {
          ...state.viewState,
          hoveredNode: action.payload,
        },
      };

    case 'SET_HOVERED_LINK':
      return {
        ...state,
        viewState: {
          ...state.viewState,
          hoveredLink: action.payload,
        },
      };

    case 'SET_CENTER_NODE':
      return {
        ...state,
        viewState: {
          ...state.viewState,
          centerNode: action.payload,
        },
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        viewState: {
          ...state.viewState,
          searchQuery: action.payload,
        },
      };

    case 'SET_HIGHLIGHT_DEPTH':
      return {
        ...state,
        viewState: {
          ...state.viewState,
          highlightDepth: Math.max(1, action.payload),
        },
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    case 'CLEAR_SELECTION':
      return {
        ...state,
        viewState: {
          ...state.viewState,
          selectedNode: null,
          selectedLink: null,
          connectedEntities: new Set(),
          highlightedNodes: new Set(),
          hoveredNode: null,
          hoveredLink: null,
        },
      };

    case 'RESET_VIEW':
      return {
        ...state,
        viewState: { ...initialState.viewState },
      };

    default:
      return state;
  }
}

interface GraphContextType {
  state: GraphState;
  setData: (data: GraphData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectNode: (nodeId: string | null) => void;
  selectLink: (linkId: string | null) => void;
  setConnectedEntities: (entities: Set<string>) => void;
  highlightNodes: (nodeIds: Set<string>) => void;
  setHoveredNode: (nodeId: string | null) => void;
  setHoveredLink: (linkId: string | null) => void;
  setCenterNode: (nodeId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setHighlightDepth: (depth: number) => void;
  updateSettings: (settings: Partial<GraphSettings>) => void;
  clearSelection: () => void;
  resetView: () => void;
}

const GraphContext = createContext<GraphContextType | undefined>(undefined);

interface GraphProviderProps {
  children: ReactNode;
}

export function GraphProvider({ children }: GraphProviderProps) {
  const [state, dispatch] = useReducer(graphReducer, initialState);

  const contextValue: GraphContextType = {
    state,
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

export function useGraph() {
  const context = useContext(GraphContext);
  if (context === undefined) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
}