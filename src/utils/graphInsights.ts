import type { GraphData, UnknownGraphData, D3Node } from '../types';
import { getNodeId } from '../types';

export interface ClusterInfo {
  id: string;
  nodes: string[];
  size: number;
  density: number;
  centralNode?: string; // node with highest degree in cluster
}

export interface GraphInsights {
  totalNodes: number;
  totalLinks: number;
  connectedComponents: ClusterInfo[];
  communities: ClusterInfo[];
  isolatedNodes: string[];
  hubNodes: Array<{ id: string; degree: number; connections: string[] }>;
  averageDegree: number;
  density: number;
  largestComponent: ClusterInfo | null;
  mostConnectedNode: { id: string; degree: number } | null;
}

/**
 * Analyzes the graph structure to provide insights about clustering and connectivity
 */
export function analyzeGraphStructure(data: GraphData): GraphInsights {
  if (!data || !data.nodes.length) {
    return getEmptyInsights();
  }

  // Build adjacency list for efficient traversal
  const adjacencyList = buildAdjacencyList(data);
  
  // Find connected components (strongly connected subgraphs)
  const connectedComponents = findConnectedComponents(data.nodes, adjacencyList);
  
  // Find communities within the largest component (if it's big enough)
  const communities = findCommunities(data, adjacencyList);
  
  // Identify isolated nodes (no connections)
  const isolatedNodes = findIsolatedNodes(data.nodes, adjacencyList);
  
  // Find hub nodes (highly connected nodes)
  const hubNodes = findHubNodes(adjacencyList);
  
  // Calculate graph metrics
  const totalNodes = data.nodes.length;
  const totalLinks = data.links.length;
  const averageDegree = totalLinks > 0 ? (totalLinks * 2) / totalNodes : 0;
  const maxPossibleLinks = (totalNodes * (totalNodes - 1)) / 2;
  const density = maxPossibleLinks > 0 ? totalLinks / maxPossibleLinks : 0;
  
  const largestComponent = connectedComponents.length > 0 
    ? connectedComponents.reduce((largest, current) => 
        current.size > largest.size ? current : largest
      )
    : null;
  
  const mostConnectedNode = hubNodes.length > 0 ? {
    id: hubNodes[0].id,
    degree: hubNodes[0].degree
  } : null;

  return {
    totalNodes,
    totalLinks,
    connectedComponents,
    communities,
    isolatedNodes,
    hubNodes,
    averageDegree: Math.round(averageDegree * 100) / 100,
    density: Math.round(density * 1000) / 1000,
    largestComponent,
    mostConnectedNode
  };
}

/**
 * Build adjacency list representation of the graph
 */
function buildAdjacencyList(data: GraphData): Map<string, Set<string>> {
  const adjacencyList = new Map<string, Set<string>>();
  
  // Initialize with all nodes
  data.nodes.forEach(node => {
    const nodeId = getNodeId(node as UnknownGraphData);
    adjacencyList.set(nodeId, new Set());
  });
  
  // Add edges (treat as undirected for clustering analysis)
  data.links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? getNodeId(link.source as UnknownGraphData) : String(link.source);
    const targetId = typeof link.target === 'object' ? getNodeId(link.target as UnknownGraphData) : String(link.target);
    
    if (adjacencyList.has(sourceId) && adjacencyList.has(targetId)) {
      adjacencyList.get(sourceId)!.add(targetId);
      adjacencyList.get(targetId)!.add(sourceId);
    }
  });
  
  return adjacencyList;
}

/**
 * Find connected components using DFS
 */
function findConnectedComponents(nodes: UnknownGraphData[], adjacencyList: Map<string, Set<string>>): ClusterInfo[] {
  const visited = new Set<string>();
  const components: ClusterInfo[] = [];
  
  nodes.forEach(node => {
    const nodeId = getNodeId(node as UnknownGraphData);
    if (!visited.has(nodeId)) {
      const component = dfsTraversal(nodeId, adjacencyList, visited);
      if (component.length > 0) {
        const componentInfo = createClusterInfo(`component-${components.length}`, component, adjacencyList);
        components.push(componentInfo);
      }
    }
  });
  
  // Sort by size (largest first)
  return components.sort((a, b) => b.size - a.size);
}

/**
 * DFS traversal to find connected nodes
 */
function dfsTraversal(startNode: string, adjacencyList: Map<string, Set<string>>, visited: Set<string>): string[] {
  const component: string[] = [];
  const stack: string[] = [startNode];
  
  while (stack.length > 0) {
    const currentNode = stack.pop()!;
    
    if (!visited.has(currentNode)) {
      visited.add(currentNode);
      component.push(currentNode);
      
      const neighbors = adjacencyList.get(currentNode) || new Set();
      neighbors.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      });
    }
  }
  
  return component;
}

/**
 * Simple community detection using modularity-based clustering
 * This is a simplified version focusing on local neighborhoods
 */
function findCommunities(data: GraphData, adjacencyList: Map<string, Set<string>>): ClusterInfo[] {
  const communities: ClusterInfo[] = [];
  const processed = new Set<string>();
  
  // Only analyze the largest component if it has enough nodes
  const components = findConnectedComponents(data.nodes, adjacencyList);
  const largestComponent = components.length > 0 ? components[0] : null;
  
  if (!largestComponent || largestComponent.size < 6) {
    return communities; // Not enough nodes for meaningful community detection
  }
  
  // Simple community detection: group nodes by shared neighborhood similarity
  largestComponent.nodes.forEach(nodeId => {
    if (processed.has(nodeId)) return;
    
    const community = findLocalCommunity(nodeId, adjacencyList, processed, largestComponent.nodes);
    if (community.length >= 3) { // Minimum community size
      const communityInfo = createClusterInfo(`community-${communities.length}`, community, adjacencyList, data.nodes as D3Node[]);
      communities.push(communityInfo);
    }
  });
  
  return communities.sort((a, b) => b.size - a.size);
}

/**
 * Find local community around a node based on shared neighbors
 */
function findLocalCommunity(startNode: string, adjacencyList: Map<string, Set<string>>, processed: Set<string>, componentNodes: string[]): string[] {
  const community = new Set([startNode]);
  const startNeighbors = adjacencyList.get(startNode) || new Set();
  
  // Add nodes that share many neighbors with the start node
  componentNodes.forEach(nodeId => {
    if (processed.has(nodeId) || nodeId === startNode) return;
    
    const nodeNeighbors = adjacencyList.get(nodeId) || new Set();
    const commonNeighbors = new Set([...startNeighbors].filter(n => nodeNeighbors.has(n)));
    
    // If nodes share enough neighbors or are directly connected, add to community
    const similarity = commonNeighbors.size / Math.max(startNeighbors.size, nodeNeighbors.size, 1);
    const areConnected = startNeighbors.has(nodeId);
    
    if (similarity > 0.3 || (areConnected && similarity > 0.1)) {
      community.add(nodeId);
    }
  });
  
  // Mark all community members as processed
  community.forEach(nodeId => processed.add(nodeId));
  
  return Array.from(community);
}

/**
 * Find isolated nodes (nodes with no connections)
 */
function findIsolatedNodes(nodes: UnknownGraphData[], adjacencyList: Map<string, Set<string>>): string[] {
  return nodes
    .map(node => getNodeId(node as UnknownGraphData))
    .filter(nodeId => {
      const neighbors = adjacencyList.get(nodeId);
      return !neighbors || neighbors.size === 0;
    });
}

/**
 * Find hub nodes (nodes with high degree centrality)
 */
function findHubNodes(adjacencyList: Map<string, Set<string>>): Array<{ id: string; degree: number; connections: string[] }> {
  const hubNodes: Array<{ id: string; degree: number; connections: string[] }> = [];
  
  adjacencyList.forEach((neighbors, nodeId) => {
    const degree = neighbors.size;
    if (degree > 0) {
      hubNodes.push({
        id: nodeId,
        degree,
        connections: Array.from(neighbors)
      });
    }
  });
  
  // Sort by degree (highest first) and return top hub nodes
  return hubNodes
    .sort((a, b) => b.degree - a.degree)
    .slice(0, Math.min(10, Math.ceil(hubNodes.length * 0.1))); // Top 10% or max 10 nodes
}

/**
 * Create cluster info with metrics
 */
function createClusterInfo(id: string, nodes: string[], adjacencyList: Map<string, Set<string>>, allNodes?: D3Node[]): ClusterInfo {
  const size = nodes.length;
  
  // Calculate internal density (how connected nodes are within the cluster)
  let internalEdges = 0;
  const nodeSet = new Set(nodes);
  
  nodes.forEach(nodeId => {
    const neighbors = adjacencyList.get(nodeId) || new Set();
    neighbors.forEach(neighbor => {
      if (nodeSet.has(neighbor) && nodeId < neighbor) { // Count each edge once
        internalEdges++;
      }
    });
  });
  
  const maxPossibleEdges = (size * (size - 1)) / 2;
  const density = maxPossibleEdges > 0 ? internalEdges / maxPossibleEdges : 0;
  
  // Find central node (node with highest degree within the cluster)
  let centralNode: string | undefined;
  let maxDegree = -1;
  
  nodes.forEach(nodeId => {
    const neighbors = adjacencyList.get(nodeId) || new Set();
    const internalDegree = Array.from(neighbors).filter(n => nodeSet.has(n)).length;
    
    if (internalDegree > maxDegree) {
      maxDegree = internalDegree;
      centralNode = nodeId;
    }
  });
  
  // Generate intelligent ID for communities
  let finalId = id;
  if (id.startsWith('community-') && allNodes) {
    const communityName = generateCommunityName(nodes, allNodes);
    finalId = communityName.toLowerCase().replace(/\s+/g, '-');
  }
  
  return {
    id: finalId,
    nodes,
    size,
    density: Math.round(density * 1000) / 1000,
    centralNode
  };
}

/**
 * Extract words from camelCase, PascalCase, snake_case, kebab-case, dot.separated names
 */
function extractWordsFromName(name: string): string[] {
  // Replace dots, underscores, and hyphens with spaces
  let normalized = name.replace(/[._-]/g, ' ');
  
  // Split camelCase and PascalCase
  normalized = normalized.replace(/([a-z])([A-Z])/g, '$1 $2');
  normalized = normalized.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  
  // Split into words and filter out empty strings, single characters, and common programming terms
  const words = normalized.split(/\s+/)
    .map(word => word.toLowerCase())
    .filter(word => word.length > 1)
    .filter(word => !['get', 'set', 'is', 'has', 'use', 'make', 'create', 'init', 'handle', 'on', 'to', 'from', 'with', 'for', 'of', 'the', 'and', 'or', 'not'].includes(word));
  
  return words;
}

/**
 * Generate a community name based on the most frequent words in exported declarations
 */
function generateCommunityName(nodes: string[], allNodes: D3Node[]): string {
  const wordFrequency = new Map<string, number>();
  
  // Collect all exported declarations from community nodes
  nodes.forEach(nodeId => {
    const node = allNodes.find(n => n.id === nodeId);
    if (!node || !node.declarations) return;
    
    // Process exported declarations
    node.declarations
      .filter(decl => decl.isExported)
      .forEach(decl => {
        const words = extractWordsFromName(decl.name);
        words.forEach(word => {
          wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
        });
      });
  });
  
  // If no exported declarations, try file names
  if (wordFrequency.size === 0) {
    nodes.forEach(nodeId => {
      const fileName = nodeId.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') || '';
      const words = extractWordsFromName(fileName);
      words.forEach(word => {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      });
    });
  }
  
  // Find the most frequent word
  let mostFrequentWord = '';
  let maxFrequency = 0;
  
  wordFrequency.forEach((frequency, word) => {
    if (frequency > maxFrequency) {
      maxFrequency = frequency;
      mostFrequentWord = word;
    }
  });
  
  // Capitalize first letter
  if (mostFrequentWord) {
    return mostFrequentWord.charAt(0).toUpperCase() + mostFrequentWord.slice(1) + ' Community';
  }
  
  return 'General Community';
}

/**
 * Get empty insights structure
 */
function getEmptyInsights(): GraphInsights {
  return {
    totalNodes: 0,
    totalLinks: 0,
    connectedComponents: [],
    communities: [],
    isolatedNodes: [],
    hubNodes: [],
    averageDegree: 0,
    density: 0,
    largestComponent: null,
    mostConnectedNode: null
  };
}

/**
 * Get human-readable summary of graph insights
 */
export function getInsightsSummary(insights: GraphInsights): string[] {
  const summary: string[] = [];
  
  if (insights.totalNodes === 0) {
    return ['No graph data available'];
  }
  
  // Basic structure
  summary.push(`📊 ${insights.totalNodes} nodes, ${insights.totalLinks} connections`);
  
  // Connectivity
  if (insights.connectedComponents.length > 1) {
    summary.push(`🔗 ${insights.connectedComponents.length} separate components`);
    if (insights.largestComponent) {
      summary.push(`📈 Largest component: ${insights.largestComponent.size} nodes (${Math.round(insights.largestComponent.size / insights.totalNodes * 100)}%)`);
    }
  } else {
    summary.push(`🔗 All nodes are connected`);
  }
  
  // Isolation
  if (insights.isolatedNodes.length > 0) {
    summary.push(`🏝️ ${insights.isolatedNodes.length} isolated nodes`);
  }
  
  // Communities
  if (insights.communities.length > 0) {
    summary.push(`👥 ${insights.communities.length} communities detected`);
    const avgCommunitySize = insights.communities.reduce((sum, c) => sum + c.size, 0) / insights.communities.length;
    summary.push(`📏 Average community size: ${Math.round(avgCommunitySize)} nodes`);
  }
  
  // Hub analysis
  if (insights.mostConnectedNode) {
    summary.push(`⭐ Most connected: ${insights.mostConnectedNode.id.split('/').pop()} (${insights.mostConnectedNode.degree} connections)`);
  }
  
  // Density
  if (insights.density > 0.7) {
    summary.push(`🎯 Highly connected graph (${Math.round(insights.density * 100)}% density)`);
  } else if (insights.density < 0.1) {
    summary.push(`🕸️ Sparse graph (${Math.round(insights.density * 100)}% density)`);
  } else {
    summary.push(`⚖️ Moderately connected (${Math.round(insights.density * 100)}% density)`);
  }
  
  return summary;
}