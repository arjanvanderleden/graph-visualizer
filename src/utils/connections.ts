import type { GraphData } from '../types';

export function findConnectedEntities(data: GraphData, nodeId?: string | null, linkId?: string | null): Set<string> {
  const connected = new Set<string>();
  
  if (nodeId) {
    // Find all nodes connected to this node via links
    data.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      if (sourceId === nodeId) {
        connected.add(targetId);
      } else if (targetId === nodeId) {
        connected.add(sourceId);
      }
    });
  } else if (linkId) {
    // Find the two nodes connected by this link
    const link = data.links.find(l => {
      const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
      const targetId = typeof l.target === 'string' ? l.target : l.target.id;
      return `${sourceId}-${targetId}` === linkId;
    });
    
    if (link) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      connected.add(sourceId);
      connected.add(targetId);
    }
  }
  
  return connected;
}