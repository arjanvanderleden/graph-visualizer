import type { GraphData as ComplexGraphData } from '../types';

export interface MinimalNode {
  id: string;
  label: string;
  type?: string;
  metadata?: Record<string, unknown>;
  x?: number;
  y?: number;
}

export interface MinimalLink {
  source: string;
  target: string;
  type?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
}

export interface MinimalGraphData {
  nodes: MinimalNode[];
  links: MinimalLink[];
}

export function convertComplexToMinimal(complexData: ComplexGraphData): MinimalGraphData {
  return {
    nodes: complexData.nodes.map(node => ({
      id: node.id,
      label: node.path.split('/').pop() || node.path,
      type: 'file',
      metadata: {
        path: node.path,
        imports: node.imports.length,
        exports: node.exports.length,
        declarations: node.declarations.length
      },
      x: node.x,
      y: node.y
    })),
    links: complexData.links.map(link => ({
      source: typeof link.source === 'string' ? link.source : link.source.id,
      target: typeof link.target === 'string' ? link.target : link.target.id,
      type: link.type,
      weight: link.imports.length || 1,
      metadata: {
        imports: link.imports
      }
    }))
  };
}

export function convertMinimalToComplex(minimalData: MinimalGraphData): ComplexGraphData {
  return {
    nodes: minimalData.nodes.map(node => ({
      id: node.id,
      path: (node.metadata?.path as string) || node.label,
      imports: [],
      exports: [],
      declarations: [],
      x: node.x,
      y: node.y
    })),
    links: minimalData.links.map(link => ({
      source: link.source,
      target: link.target,
      imports: (link.metadata?.imports as string[]) || [],
      type: link.type || 'unknown'
    }))
  };
}