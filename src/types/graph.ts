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

export interface D3Node extends Omit<GraphNode, "fx" | "fy"> {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

export interface D3Link extends Omit<GraphLink, "source" | "target"> {
  source: D3Node;
  target: D3Node;
  index?: number;
}

export interface NodeFilter {
  text: string;
  includeMode: boolean; // true = include matching nodes, false = exclude matching nodes
  filterDeclarations: boolean; // whether to filter by declaration names
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
  nodeFilter: NodeFilter;
}

export interface GraphSettings {
  forceStrength: number;
  linkDistance: number;
  nodeRadius: number;
  enableCollision: boolean;
  animationSpeed: number;
}

// ===============================
// FLEXIBLE TYPE SYSTEM FOR UNKNOWN DATA
// ===============================

// Generic type for unknown graph data structures - can contain any properties
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnknownGraphData = any;

// Strongly typed interface for dependency graph data (based on schema)
export interface DependencyGraphData {
  nodes: DependencyGraphNode[];
  links: DependencyGraphLink[];
  name?: string;
  description?: string;
  created?: string;
}

export interface DependencyGraphNode {
  path: string;
  imports: DependencyImportNode[];
  exports: DependencyExportNode[];
  declarations: DependencyDeclaration[];
  // Extended with common visualization properties
  id?: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
}

export interface DependencyGraphLink {
  source: string;
  target: string;
  imports: string[];
  type: "import" | "export" | "re-export";
}

export interface DependencyImportNode {
  type: "import";
  from: string;
  imports: ImportSpecifier[];
  sourceFile: string;
  position: Position;
}

export interface DependencyExportNode {
  type: "export";
  exports: ExportSpecifier[];
  from?: string;
  sourceFile: string;
  position: Position;
}

export interface DependencyDeclaration {
  type: "function" | "class" | "interface" | "type" | "variable" | "enum";
  name: string;
  isExported: boolean;
  isDefault: boolean;
  sourceFile: string;
  position: Position;
}

export interface ImportSpecifier {
  name: string;
  alias?: string;
  isDefault: boolean;
  isNamespace: boolean;
}

export interface ExportSpecifier {
  name: string;
  alias?: string;
  isDefault: boolean;
  isNamespace: boolean;
}

export interface Position {
  line: number;
  column: number;
  offset: number;
}

export function isDependencyGraphNode(node: UnknownGraphData): node is DependencyGraphNode {
  return (
    typeof node.path === "string" &&
    Array.isArray(node.imports) &&
    Array.isArray(node.exports) &&
    Array.isArray(node.declarations)
  );
}

// Type guards to discriminate between data types
export function isDependencyGraphData(data: UnknownGraphData): data is DependencyGraphData {
  if (!data || typeof data !== "object") return false;

  // Check for required structure
  if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) return false;

  return data.nodes[0] ? isDependencyGraphNode(data.nodes[0]) : true; // Empty arrays are valid
}

export function isGenericGraphData(data: UnknownGraphData): data is GraphData {
  if (!data || typeof data !== "object") return false;

  // Check for required structure
  if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) return false;

  // Check for generic graph properties in first node
  if (data.nodes.length > 0) {
    const firstNode = data.nodes[0];
    return typeof firstNode.id === "string";
  }

  return true; // Empty arrays are valid
}

// Helper functions to safely access properties from unknown data
export function getNodeId(node: UnknownGraphData): string {
  return node?.id || node?.path || String(node);
}

export function getNodePath(node: UnknownGraphData): string | undefined {
  return node?.path;
}

export function getNodeName(node: UnknownGraphData): string | undefined {
  return node?.name || node?.label;
}

export function getNodeDeclarations(node: UnknownGraphData): UnknownGraphData[] {
  return Array.isArray(node?.declarations) ? node.declarations : [];
}

export function getLinkImports(link: UnknownGraphData): string[] {
  return Array.isArray(link?.imports) ? link.imports : [];
}

export function getLinkType(link: UnknownGraphData): string {
  return link?.type || "unknown";
}
