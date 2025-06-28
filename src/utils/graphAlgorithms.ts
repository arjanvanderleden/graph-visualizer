import type { GraphData, GraphNode } from '../types';

export function findNeighborsAtDepth(
  data: GraphData,
  nodeId: string,
  depth: number
): Set<string> {
  if (depth <= 0) return new Set([nodeId]);
  
  const neighbors = new Set<string>([nodeId]);
  const visited = new Set<string>();
  const queue: Array<{ id: string; currentDepth: number }> = [{ id: nodeId, currentDepth: 0 }];
  
  while (queue.length > 0) {
    const { id: currentId, currentDepth } = queue.shift()!;
    
    if (visited.has(currentId) || currentDepth >= depth) continue;
    visited.add(currentId);
    
    const currentNeighbors = data.links
      .filter(link => link.source === currentId || link.target === currentId)
      .map(link => link.source === currentId ? link.target : link.source)
      .filter(neighborId => typeof neighborId === 'string') as string[];
      
    for (const neighborId of currentNeighbors) {
      neighbors.add(neighborId);
      if (currentDepth < depth - 1) {
        queue.push({ id: neighborId, currentDepth: currentDepth + 1 });
      }
    }
  }
  
  return neighbors;
}

export function filterNodesBySearch(nodes: GraphNode[], query: string): Set<string> {
  if (!query.trim()) return new Set();
  
  const lowerQuery = query.toLowerCase();
  return new Set(
    nodes
      .filter(node => 
        node.path.toLowerCase().includes(lowerQuery) ||
        node.imports.some(imp => 
          imp.from.toLowerCase().includes(lowerQuery) ||
          imp.imports.some(i => i.name.toLowerCase().includes(lowerQuery))
        ) ||
        node.declarations.some(decl => 
          decl.name.toLowerCase().includes(lowerQuery)
        )
      )
      .map(node => node.id)
  );
}

export function calculateNodeDegree(data: GraphData, nodeId: string): number {
  return data.links.filter(link => 
    link.source === nodeId || link.target === nodeId
  ).length;
}

export function getConnectedComponents(data: GraphData): string[][] {
  const visited = new Set<string>();
  const components: string[][] = [];
  
  for (const node of data.nodes) {
    if (!visited.has(node.id)) {
      const component: string[] = [];
      const stack = [node.id];
      
      while (stack.length > 0) {
        const currentId = stack.pop()!;
        if (visited.has(currentId)) continue;
        
        visited.add(currentId);
        component.push(currentId);
        
        const neighbors = data.links
          .filter(link => link.source === currentId || link.target === currentId)
          .map(link => link.source === currentId ? link.target : link.source)
          .filter(neighborId => typeof neighborId === 'string' && !visited.has(neighborId)) as string[];
          
        stack.push(...neighbors);
      }
      
      components.push(component);
    }
  }
  
  return components;
}