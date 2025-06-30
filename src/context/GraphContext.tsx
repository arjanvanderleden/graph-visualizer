import { createContext } from 'react';
import type { ReactNode } from 'react';
import type { GraphData, GraphViewState, GraphSettings, NodeFilter } from '../types';

interface GraphState {
  data: GraphData | null;
  viewState: GraphViewState;
  settings: GraphSettings;
  isLoading: boolean;
  error: string | null;
}

type GraphAction =
  | { type: 'SET_DATA'; payload: GraphData; }
  | { type: 'SET_LOADING'; payload: boolean; }
  | { type: 'SET_ERROR'; payload: string | null; }
  | { type: 'SELECT_NODE'; payload: string | null; }
  | { type: 'SELECT_LINK'; payload: string | null; }
  | { type: 'SET_CONNECTED_ENTITIES'; payload: Set<string>; }
  | { type: 'HIGHLIGHT_NODES'; payload: Set<string>; }
  | { type: 'SET_HOVERED_NODE'; payload: string | null; }
  | { type: 'SET_HOVERED_LINK'; payload: string | null; }
  | { type: 'SET_CENTER_NODE'; payload: string | null; }
  | { type: 'SET_SEARCH_QUERY'; payload: string; }
  | { type: 'SET_HIGHLIGHT_DEPTH'; payload: number; }
  | { type: 'SET_NODE_FILTER'; payload: Partial<NodeFilter>; }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<GraphSettings>; }
  | { type: 'CLEAR_SELECTION'; }
  | { type: 'RESET_VIEW'; };

export const initialState: GraphState = {
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
    nodeFilter: {
      text: '',
      includeMode: true,
      filterDeclarations: false,
    },
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

export function graphReducer(state: GraphState, action: GraphAction): GraphState {
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

    case 'SET_NODE_FILTER':
      return {
        ...state,
        viewState: {
          ...state.viewState,
          nodeFilter: {
            ...state.viewState.nodeFilter,
            ...action.payload,
          },
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

export interface GraphContextType {
  state: GraphState;
  filteredData: GraphData | null;
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
  setNodeFilter: (filter: Partial<NodeFilter>) => void;
  updateSettings: (settings: Partial<GraphSettings>) => void;
  clearSelection: () => void;
  resetView: () => void;
}

export const GraphContext = createContext<GraphContextType | undefined>(undefined);

export interface GraphProviderProps {
  children: ReactNode;
}


