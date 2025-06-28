import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useGraph } from '../../context';
import type { D3Node, D3Link } from '../../types';
import { findNeighborsAtDepth, findConnectedEntities, triggerDownload, canvasToPNG, createSVGFromGraph } from '../../utils';

interface GraphVisualizationProps {
  width: number;
  height: number;
  className?: string;
}

export function GraphVisualization({ width, height, className = '' }: GraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const transformRef = useRef(d3.zoomIdentity);
  const nodesRef = useRef<D3Node[]>([]);
  const linksRef = useRef<D3Link[]>([]);
  const hoveredNodeRef = useRef<string | null>(null);
  const hoveredLinkRef = useRef<string | null>(null);
  const frameRef = useRef<number>();
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  const { 
    state: { data, viewState, settings },
    selectNode,
    selectLink,
    setConnectedEntities,
    highlightNodes,
    setHoveredNode,
    setHoveredLink,
    setCenterNode
  } = useGraph();
  
  const viewStateRef = useRef(viewState);

  // Generate link IDs for selection
  const getLinkId = useCallback((link: D3Link): string => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return `${sourceId}-${targetId}`;
  }, []);

  // Draw function that uses refs instead of state
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const transform = transformRef.current;
    const nodes = nodesRef.current;
    const links = linksRef.current;

    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.translate(transform.x, transform.y);
    context.scale(transform.k, transform.k);

    // Draw links
    links.forEach((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const linkId = `${sourceId}-${targetId}`;
      
      context.beginPath();
      
      // Determine link color and width
      let strokeColor = '#e5e7eb';
      let lineWidth = 1 / transform.k;
      
      const currentViewState = viewStateRef.current;
      
      if (currentViewState.selectedLink === linkId) {
        strokeColor = '#3b82f6';
        lineWidth = 4 / transform.k; // Thicker for selected
      } else if (hoveredLinkRef.current === linkId) {
        strokeColor = '#10b981';
        lineWidth = 2 / transform.k;
      } else if (currentViewState.selectedNode && (sourceId === currentViewState.selectedNode || targetId === currentViewState.selectedNode)) {
        // Links connected to selected node
        strokeColor = '#6366f1';
        lineWidth = 2.5 / transform.k;
      } else if (currentViewState.connectedEntities.has(sourceId) && currentViewState.connectedEntities.has(targetId)) {
        // Links between connected entities
        strokeColor = '#a5b4fc';
        lineWidth = 1.5 / transform.k;
      } else if (currentViewState.connectedEntities.has(sourceId) || currentViewState.connectedEntities.has(targetId)) {
        // Links involving connected entities
        strokeColor = '#c7d2fe';
        lineWidth = 1.2 / transform.k;
      }
      
      context.strokeStyle = strokeColor;
      context.lineWidth = lineWidth;
      context.moveTo(link.source.x, link.source.y);
      context.lineTo(link.target.x, link.target.y);
      context.stroke();
    });

    // Draw nodes
    nodes.forEach((node: any) => {
      context.beginPath();
      
      // Determine node color
      const currentViewState = viewStateRef.current;
      
      if (currentViewState.selectedNode === node.id) {
        context.fillStyle = '#3b82f6'; // Blue for selected
      } else if (currentViewState.connectedEntities.has(node.id)) {
        context.fillStyle = '#6366f1'; // Purple for connected entities
      } else if (hoveredNodeRef.current === node.id) {
        context.fillStyle = '#10b981'; // Green for hover
      } else {
        context.fillStyle = '#d1d5db'; // Light gray for normal
      }
      
      context.arc(node.x, node.y, settings.nodeRadius / transform.k, 0, 2 * Math.PI);
      context.fill();

      // Draw outline for selected, connected, or hovered nodes
      if (currentViewState.selectedNode === node.id) {
        // Thick outline for selected node
        context.beginPath();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 3 / transform.k;
        context.arc(node.x, node.y, (settings.nodeRadius + 2) / transform.k, 0, 2 * Math.PI);
        context.stroke();
      } else if (currentViewState.connectedEntities.has(node.id)) {
        // Subtle outline for connected entities
        context.beginPath();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 1.5 / transform.k;
        context.arc(node.x, node.y, (settings.nodeRadius + 1) / transform.k, 0, 2 * Math.PI);
        context.stroke();
      } else if (hoveredNodeRef.current === node.id) {
        // Thin outline for hovered node
        context.beginPath();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2 / transform.k;
        context.arc(node.x, node.y, settings.nodeRadius / transform.k, 0, 2 * Math.PI);
        context.stroke();
      }
    });

    context.restore();
  }, []); // No dependencies - this prevents re-creation

  // Request animation frame for drawing
  const requestDraw = useCallback(() => {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = requestAnimationFrame(draw);
  }, [draw]);

  // Update viewState ref and force redraw when view state changes
  useEffect(() => {
    viewStateRef.current = viewState;
    requestDraw();
  }, [viewState.selectedNode, viewState.selectedLink, viewState.connectedEntities, requestDraw]);

  const findNodeAtPosition = useCallback((x: number, y: number): D3Node | null => {
    const transform = transformRef.current;
    const adjustedX = (x - transform.x) / transform.k;
    const adjustedY = (y - transform.y) / transform.k;
    
    return nodesRef.current.find((node: any) => {
      const dx = node.x - adjustedX;
      const dy = node.y - adjustedY;
      return Math.sqrt(dx * dx + dy * dy) < settings.nodeRadius;
    }) || null;
  }, [settings.nodeRadius]);

  const findLinkAtPosition = useCallback((x: number, y: number): D3Link | null => {
    const transform = transformRef.current;
    const adjustedX = (x - transform.x) / transform.k;
    const adjustedY = (y - transform.y) / transform.k;
    const threshold = 5 / transform.k; // 5 pixel threshold

    return linksRef.current.find((link: any) => {
      const distance = distanceToLineSegment(
        adjustedX, adjustedY,
        link.source.x, link.source.y,
        link.target.x, link.target.y
      );
      return distance < threshold;
    }) || null;
  }, []);

  // Helper function to calculate distance from point to line segment
  const distanceToLineSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  };

  const handleNodeSelection = useCallback((nodeId: string) => {
    if (viewState.selectedNode === nodeId) {
      // Deselect if clicking the same node
      selectNode(null);
      setConnectedEntities(new Set());
    } else {
      // Select new node
      selectNode(nodeId);
      if (data) {
        const connected = findConnectedEntities(data, nodeId, null);
        setConnectedEntities(connected);
      }
    }
  }, [data, viewState.selectedNode, selectNode, setConnectedEntities]);

  const handleLinkSelection = useCallback((linkId: string) => {
    if (viewState.selectedLink === linkId) {
      // Deselect if clicking the same link
      selectLink(null);
      setConnectedEntities(new Set());
    } else {
      // Select new link
      selectLink(linkId);
      if (data) {
        const connected = findConnectedEntities(data, null, linkId);
        setConnectedEntities(connected);
      }
    }
  }, [data, viewState.selectedLink, selectLink, setConnectedEntities]);

  const zoomToFit = useCallback(() => {
    if (!svgRef.current || nodesRef.current.length === 0) return;

    const nodes = nodesRef.current;
    const margin = 50; // Margin around the graph

    // Calculate bounds
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

    // Add padding to bounds
    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate scale to fit graph with margin
    const scaleX = (width - margin * 2) / graphWidth;
    const scaleY = (height - margin * 2) / graphHeight;
    const scale = Math.min(scaleX, scaleY, 2); // Cap at 2x zoom

    // Create transform
    const newTransform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(scale)
      .translate(-centerX, -centerY);

    // Apply transform with animation using existing zoom behavior
    if (zoomBehaviorRef.current && svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition()
        .duration(1000)
        .call(zoomBehaviorRef.current.transform, newTransform);
    }
  }, [width, height, requestDraw]);

  const handleNodeCenter = useCallback((nodeId: string) => {
    const node = nodesRef.current.find((n: any) => n.id === nodeId);
    if (!node) return;

    const svg = d3.select(svgRef.current);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const currentTransform = transformRef.current;
    const scale = Math.min(currentTransform.k, 2);
    
    const newTransform = d3.zoomIdentity
      .translate(centerX, centerY)
      .scale(scale)
      .translate(-node.x, -node.y);

    svg.transition()
      .duration(750)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        newTransform
      );
    
    setCenterNode(nodeId);
  }, [width, height, setCenterNode]);

  // Initialize simulation only when data changes
  useEffect(() => {
    if (!data) return;

    // Create copies of nodes and links for D3
    const nodes: D3Node[] = data.nodes.map(node => ({ 
      ...node, 
      x: node.x || Math.random() * width, 
      y: node.y || Math.random() * height 
    }));
    
    const links: D3Link[] = data.links.map(link => ({ 
      ...link,
      source: link.source as any,
      target: link.target as any
    }));

    // Update refs
    nodesRef.current = nodes;
    linksRef.current = links;

    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create new simulation
    const simulation = d3.forceSimulation<D3Node>(nodes)
      .force('link', d3.forceLink<D3Node, D3Link>(links)
        .id((d: any) => d.id)
        .distance(settings.linkDistance))
      .force('charge', d3.forceManyBody().strength(settings.forceStrength))
      .force('center', d3.forceCenter(width / 2, height / 2));

    if (settings.enableCollision) {
      simulation.force('collision', d3.forceCollide().radius(settings.nodeRadius + 2));
    }

    simulationRef.current = simulation;

    // Set up tick handler
    simulation.on('tick', requestDraw);

    // Auto-zoom to fit after simulation settles
    let tickCount = 0;
    const originalTick = simulation.on('tick');
    simulation.on('tick', () => {
      if (originalTick) originalTick.call(simulation);
      tickCount++;
      
      // After enough ticks for the simulation to settle
      if (tickCount === 100) {
        zoomToFit();
      }
    });

    return () => {
      simulation.stop();
    };
  }, [data, width, height, settings.linkDistance, settings.forceStrength, settings.nodeRadius, settings.enableCollision, requestDraw]);

  // Handle canvas setup and interactions
  useEffect(() => {
    if (!canvasRef.current || !svgRef.current) return;

    const canvas = canvasRef.current;
    const svg = d3.select(svgRef.current);
    
    canvas.width = width;
    canvas.height = height;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.001, 1000]) // Much wider zoom range
      .on('zoom', (event) => {
        transformRef.current = event.transform;
        requestDraw();
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    const handleClick = (event: MouseEvent) => {
      const [x, y] = d3.pointer(event);
      const node = findNodeAtPosition(x, y);
      const link = !node ? findLinkAtPosition(x, y) : null;
      
      if (node) {
        if (event.detail === 2) {
          handleNodeCenter(node.id);
        } else {
          handleNodeSelection(node.id);
        }
      } else if (link) {
        const linkId = getLinkId(link);
        handleLinkSelection(linkId);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const [x, y] = d3.pointer(event);
      const node = findNodeAtPosition(x, y);
      const link = !node ? findLinkAtPosition(x, y) : null;
      
      const newHoveredNodeId = node?.id || null;
      const newHoveredLinkId = link ? getLinkId(link) : null;
      
      let needsRedraw = false;
      
      // Update node hover state
      if (hoveredNodeRef.current !== newHoveredNodeId) {
        hoveredNodeRef.current = newHoveredNodeId;
        needsRedraw = true;
      }
      
      // Update link hover state
      if (hoveredLinkRef.current !== newHoveredLinkId) {
        hoveredLinkRef.current = newHoveredLinkId;
        needsRedraw = true;
      }
      
      // Update cursor and redraw if needed
      if (needsRedraw) {
        canvas.style.cursor = (node || link) ? 'pointer' : 'default';
        requestDraw();
      }
    };

    const handleMouseLeave = () => {
      if (hoveredNodeRef.current || hoveredLinkRef.current) {
        hoveredNodeRef.current = null;
        hoveredLinkRef.current = null;
        canvas.style.cursor = 'default';
        requestDraw();
      }
    };

    svg.on('click', handleClick);
    svg.on('mousemove', handleMouseMove);
    svg.on('mouseleave', handleMouseLeave);

    // Listen for zoom to fit events
    const handleZoomToFit = () => zoomToFit();
    window.addEventListener('zoomToFit', handleZoomToFit);

    // Listen for download events
    const handleDownloadSVG = () => {
      if (!data) return;
      
      const svgContent = createSVGFromGraph(
        nodesRef.current,
        linksRef.current,
        width,
        height,
        viewStateRef.current
      );
      
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      triggerDownload(blob, 'graph.svg');
    };

    const handleDownloadPNG = async () => {
      if (!canvasRef.current) return;
      
      try {
        const blob = await canvasToPNG(canvasRef.current);
        triggerDownload(blob, 'graph.png');
      } catch (error) {
        console.error('Failed to download PNG:', error);
      }
    };

    window.addEventListener('downloadSVG', handleDownloadSVG);
    window.addEventListener('downloadPNG', handleDownloadPNG);

    return () => {
      svg.on('.zoom', null);
      svg.on('click', null);
      svg.on('mousemove', null);
      svg.on('mouseleave', null);
      window.removeEventListener('zoomToFit', handleZoomToFit);
      window.removeEventListener('downloadSVG', handleDownloadSVG);
      window.removeEventListener('downloadPNG', handleDownloadPNG);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [width, height, findNodeAtPosition, findLinkAtPosition, handleNodeSelection, handleLinkSelection, handleNodeCenter, getLinkId, requestDraw, zoomToFit]);

  // Update simulation parameters when settings change
  useEffect(() => {
    if (!simulationRef.current) return;

    const simulation = simulationRef.current;
    const linkForce = simulation.force('link') as d3.ForceLink<D3Node, D3Link>;
    const chargeForce = simulation.force('charge') as d3.ForceManyBody<D3Node>;
    
    if (linkForce) linkForce.distance(settings.linkDistance);
    if (chargeForce) chargeForce.strength(settings.forceStrength);
    
    if (settings.enableCollision) {
      simulation.force('collision', d3.forceCollide().radius(settings.nodeRadius + 2));
    } else {
      simulation.force('collision', null);
    }

    simulation.alpha(0.3).restart();
  }, [settings]);

  if (!data) {
    return null;
  }

  return (
    <div className={`${className} relative`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
      />
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="absolute inset-0 cursor-default"
      />
    </div>
  );
}