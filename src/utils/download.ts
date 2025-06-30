// Download utilities for graph visualization
import type { D3Node, D3Link } from '../types';

export const downloadSVG = () => {
  // Dispatch custom event for SVG download
  const event = new CustomEvent('downloadSVG');
  window.dispatchEvent(event);
};

export const downloadPNG = () => {
  // Dispatch custom event for PNG download
  const event = new CustomEvent('downloadPNG');
  window.dispatchEvent(event);
};

// Utility function to trigger file download
export const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Convert canvas to PNG blob
export const canvasToPNG = (canvas: HTMLCanvasElement): Promise<Blob> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, 'image/png');
  });
};

// Create SVG from graph data with proper normalization
export const createSVGFromGraph = (
  nodes: D3Node[], 
  links: D3Link[], 
  width: number, 
  height: number,
  viewState?: { selectedNode?: string | null; selectedLink?: string | null; connectedEntities?: Set<string> }
): string => {
  if (nodes.length === 0) return '';

  // Calculate bounds of the graph
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nodes.forEach(node => {
    if (node.x !== undefined && node.y !== undefined) {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    }
  });

  // Add padding
  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;
  const padding = Math.max(graphWidth, graphHeight) * 0.1;
  
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;

  // Calculate scale to fit the graph in the SVG
  const scaleX = width / (maxX - minX);
  const scaleY = height / (maxY - minY);
  const scale = Math.min(scaleX, scaleY);

  // Transform function to normalize coordinates
  const transformX = (x: number) => (x - minX) * scale;
  const transformY = (y: number) => (y - minY) * scale;

  // Generate link ID for comparison (currently unused but might be needed for future features)
  // const getLinkId = (link: any): string => {
  //   const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
  //   const targetId = typeof link.target === 'object' ? link.target.id : link.target;
  //   return `${sourceId}-${targetId}`;
  // };

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
  <defs>
    <style>
      .link { stroke: #e5e7eb; stroke-width: 1; }
      .link-selected { stroke: #3b82f6; stroke-width: 3; }
      .link-connected { stroke: #6366f1; stroke-width: 2; }
      .node { fill: #d1d5db; stroke: #ffffff; stroke-width: 1; }
      .node-selected { fill: #3b82f6; stroke: #ffffff; stroke-width: 2; }
      .node-connected { fill: #6366f1; stroke: #ffffff; stroke-width: 1.5; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#f9fafb"/>
  
  <!-- Links -->
  ${links.map(link => {
    const sourceX = typeof link.source === 'object' ? link.source.x : 0;
    const sourceY = typeof link.source === 'object' ? link.source.y : 0;
    const targetX = typeof link.target === 'object' ? link.target.x : 0;
    const targetY = typeof link.target === 'object' ? link.target.y : 0;
    
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const linkId = `${sourceId}-${targetId}`;
    
    let linkClass = 'link';
    if (viewState?.selectedLink === linkId) {
      linkClass = 'link-selected';
    } else if (viewState?.selectedNode && (sourceId === viewState.selectedNode || targetId === viewState.selectedNode)) {
      linkClass = 'link-connected';
    } else if (viewState?.connectedEntities?.has(sourceId) && viewState?.connectedEntities?.has(targetId)) {
      linkClass = 'link-connected';
    }
    
    return `<line x1="${transformX(sourceX)}" y1="${transformY(sourceY)}" x2="${transformX(targetX)}" y2="${transformY(targetY)}" class="${linkClass}" />`;
  }).join('\n  ')}
  
  <!-- Nodes -->
  ${nodes.map(node => {
    let nodeClass = 'node';
    if (viewState?.selectedNode === node.id) {
      nodeClass = 'node-selected';
    } else if (viewState?.connectedEntities?.has(node.id)) {
      nodeClass = 'node-connected';
    }
    
    const radius = nodeClass === 'node-selected' ? 10 : nodeClass === 'node-connected' ? 9 : 8;
    return `<circle cx="${transformX(node.x)}" cy="${transformY(node.y)}" r="${radius}" class="${nodeClass}" />`;
  }).join('\n  ')}
</svg>`;
  
  return svg;
};