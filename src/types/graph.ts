export interface ImportData {
  type: string;
  sourceFile: string;
  position: {
    line: number;
    column: number;
    offset: number;
  };
  from: string;
  imports: Array<{
    name: string;
    alias?: string;
    isDefault: boolean;
    isNamespace: boolean;
  }>;
}

export interface ExportData {
  name: string;
  isDefault: boolean;
  isNamespace: boolean;
}

export interface Declaration {
  name: string;
  type: string;
  line?: number;
}

export interface GraphNode {
  id: string;
  path: string;
  imports: ImportData[];
  exports: ExportData[];
  declarations: Declaration[];
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  imports: string[];
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface D3Node extends Omit<GraphNode, 'fx' | 'fy'> {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

export interface D3Link extends Omit<GraphLink, 'source' | 'target'> {
  source: D3Node;
  target: D3Node;
  index?: number;
}

export interface GraphViewState {
  selectedNode: string | null;
  selectedLink: string | null;
  connectedEntities: Set<string>;
  highlightedNodes: Set<string>;
  hoveredNode: string | null;
  hoveredLink: string | null;
  centerNode: string | null;
  searchQuery: string;
  highlightDepth: number;
}

export interface GraphSettings {
  forceStrength: number;
  linkDistance: number;
  nodeRadius: number;
  enableCollision: boolean;
  animationSpeed: number;
}