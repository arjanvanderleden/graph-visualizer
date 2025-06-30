import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { useGraph } from '../../context';
import type { D3Node, D3Link } from '../../types';
import { findConnectedEntities, triggerDownload, canvasToPNG, createSVGFromGraph } from '../../utils';

interface GraphVisualizationProps {
  width: number;
  height: number;
  className?: string;
  onHoverChange?: (hoveredNode: D3Node | null, hoveredLink: D3Link | null) => void;
}

export function GraphVisualization({ width, height, className = '', onHoverChange }: GraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<D3Node, D3Link> | null>(null);
  const transformRef = useRef(d3.zoomIdentity);
  const nodesRef = useRef<D3Node[]>([]);
  const linksRef = useRef<D3Link[]>([]);
  const hoveredNodeRef = useRef<string | null>(null);
  const hoveredLinkRef = useRef<string | null>(null);
  const frameRef = useRef<number>(0);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  
  // Hover state for taskbar
  const [hoveredNode, setHoveredNodeState] = useState<D3Node | null>(null);
  const [hoveredLink, setHoveredLinkState] = useState<D3Link | null>(null);

  const {
    state: { viewState, settings },
    filteredData,
    selectNode,
    selectLink,
    setConnectedEntities,
    // highlightNodes,
    // setHoveredNode,
    // setHoveredLink,
    setCenterNode
  } = useGraph();

  // Use memoized filtered data
  const data = filteredData;

  const viewStateRef = useRef(viewState);
  const settingsRef = useRef(settings);

  // Notify parent of hover changes
  useEffect(() => {
    if (onHoverChange) {
      onHoverChange(hoveredNode, hoveredLink);
    }
  }, [hoveredNode, hoveredLink, onHoverChange]);

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

    // Sort links by importance for layered rendering
    const currentViewState = viewStateRef.current;
    const sortedLinks = [...links].sort((a, b) => {
      // Calculate importance score for each link
      const getLinkImportance = (link: D3Link): number => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        const linkId = `${sourceId}-${targetId}`;
        
        if (currentViewState.selectedLink === linkId) return 5; // Highest priority
        if (hoveredLinkRef.current === linkId) return 4;
        if (currentViewState.selectedNode && (sourceId === currentViewState.selectedNode || targetId === currentViewState.selectedNode)) return 3;
        if (currentViewState.highlightedNodes.has(sourceId) || currentViewState.highlightedNodes.has(targetId)) return 2;
        if (currentViewState.connectedEntities.has(sourceId) || currentViewState.connectedEntities.has(targetId)) return 1;
        return 0; // Normal links
      };
      
      return getLinkImportance(a) - getLinkImportance(b);
    });

    // Draw links in order of importance (important links last = on top)
    sortedLinks.forEach((link: D3Link) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const linkId = `${sourceId}-${targetId}`;

      context.beginPath();

      // Determine link color and width
      let strokeColor = '#e5e7eb';
      let lineWidth = 1 / transform.k;

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
      } else if (currentViewState.highlightedNodes.has(sourceId) || currentViewState.highlightedNodes.has(targetId)) {
        // Links connected to highlighted nodes
        strokeColor = '#f97316';
        lineWidth = 2 / transform.k;
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

    // Sort nodes by importance for layered rendering
    const sortedNodes = [...nodes].sort((a, b) => {
      // Calculate importance score for each node
      const getImportance = (node: D3Node): number => {
        if (currentViewState.selectedNode === node.id) return 4; // Highest priority
        if (hoveredNodeRef.current === node.id) return 3;
        if (currentViewState.highlightedNodes.has(node.id)) return 2;
        if (currentViewState.connectedEntities.has(node.id)) return 1;
        return 0; // Normal nodes
      };
      
      return getImportance(a) - getImportance(b);
    });

    // Draw nodes in order of importance (important nodes last = on top)
    sortedNodes.forEach((node: D3Node) => {
      const isImportant = currentViewState.selectedNode === node.id || 
                         currentViewState.highlightedNodes.has(node.id) ||
                         hoveredNodeRef.current === node.id;
      
      // Draw subtle shadow for important nodes
      if (isImportant) {
        context.save();
        context.globalAlpha = 0.3;
        context.fillStyle = '#000000';
        context.beginPath();
        context.arc(node.x + 2 / transform.k, node.y + 2 / transform.k, settingsRef.current.nodeRadius / transform.k, 0, 2 * Math.PI);
        context.fill();
        context.restore();
      }

      context.beginPath();

      // Determine node color
      if (currentViewState.selectedNode === node.id) {
        context.fillStyle = '#dc2626'; // Dark pastel red for selected
      } else if (currentViewState.highlightedNodes.has(node.id)) {
        context.fillStyle = '#ea580c'; // Darkish pastel orange for highlighted
      } else if (currentViewState.connectedEntities.has(node.id)) {
        context.fillStyle = '#6366f1'; // Purple for connected entities
      } else if (hoveredNodeRef.current === node.id) {
        context.fillStyle = '#10b981'; // Green for hover
      } else {
        context.fillStyle = '#d1d5db'; // Light gray for normal
      }

      context.arc(node.x, node.y, settingsRef.current.nodeRadius / transform.k, 0, 2 * Math.PI);
      context.fill();

      // Draw outline for selected, highlighted, connected, or hovered nodes
      if (currentViewState.selectedNode === node.id) {
        // Thick outline for selected node
        context.beginPath();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 3 / transform.k;
        context.arc(node.x, node.y, (settingsRef.current.nodeRadius + 2) / transform.k, 0, 2 * Math.PI);
        context.stroke();
      } else if (currentViewState.highlightedNodes.has(node.id)) {
        // Medium outline for highlighted nodes
        context.beginPath();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2.5 / transform.k;
        context.arc(node.x, node.y, (settingsRef.current.nodeRadius + 1.5) / transform.k, 0, 2 * Math.PI);
        context.stroke();
      } else if (currentViewState.connectedEntities.has(node.id)) {
        // Subtle outline for connected entities
        context.beginPath();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 1.5 / transform.k;
        context.arc(node.x, node.y, (settingsRef.current.nodeRadius + 1) / transform.k, 0, 2 * Math.PI);
        context.stroke();
      } else if (hoveredNodeRef.current === node.id) {
        // Thin outline for hovered node
        context.beginPath();
        context.strokeStyle = '#ffffff';
        context.lineWidth = 2 / transform.k;
        context.arc(node.x, node.y, settingsRef.current.nodeRadius / transform.k, 0, 2 * Math.PI);
        context.stroke();
      }
    });

    context.restore();
  }, []); // Empty dependencies - this prevents re-creation

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
    
    // Check if selected or highlighted nodes are in viewport
    const nodesToCheck = new Set<string>();
    
    // Add selected node
    if (viewState.selectedNode) {
      nodesToCheck.add(viewState.selectedNode);
    }
    
    // Add highlighted nodes
    viewState.highlightedNodes.forEach(nodeId => nodesToCheck.add(nodeId));
    
    // If we have nodes to check and they're not visible, zoom to fit them
    if (nodesToCheck.size > 0 && !areNodesInViewport(nodesToCheck)) {
      // Wait a bit for any ongoing animations to settle
      setTimeout(() => {
        const nodesToFit = nodesRef.current.filter(node => nodesToCheck.has(node.id));
        if (nodesToFit.length > 0) {
          zoomToFit(nodesToFit);
        }
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewState.selectedNode, viewState.selectedLink, viewState.connectedEntities, viewState.highlightedNodes, requestDraw]);

  // Update settings ref when settings change
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const findNodeAtPosition = useCallback((x: number, y: number): D3Node | null => {
    const transform = transformRef.current;
    const adjustedX = (x - transform.x) / transform.k;
    const adjustedY = (y - transform.y) / transform.k;

    return nodesRef.current.find((node: D3Node) => {
      const dx = node.x - adjustedX;
      const dy = node.y - adjustedY;
      return Math.sqrt(dx * dx + dy * dy) < settingsRef.current.nodeRadius;
    }) || null;
  }, []);

  const findLinkAtPosition = useCallback((x: number, y: number): D3Link | null => {
    const transform = transformRef.current;
    const adjustedX = (x - transform.x) / transform.k;
    const adjustedY = (y - transform.y) / transform.k;
    const threshold = 5 / transform.k; // 5 pixel threshold

    return linksRef.current.find((link: D3Link) => {
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

  const zoomToFit = useCallback((nodesToFit?: D3Node[]) => {
    if (!svgRef.current || nodesRef.current.length === 0) return;

    const nodes = nodesToFit || nodesRef.current;
    if (nodes.length === 0) return;
    
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
  }, [width, height]);

  const areNodesInViewport = useCallback((nodeIds: Set<string>): boolean => {
    if (nodeIds.size === 0) return true;
    
    const transform = transformRef.current;
    const padding = 20; // Small padding to ensure nodes are fully visible
    
    for (const nodeId of nodeIds) {
      const node = nodesRef.current.find(n => n.id === nodeId);
      if (!node || node.x === undefined || node.y === undefined) continue;
      
      // Transform node coordinates to screen space
      const screenX = node.x * transform.k + transform.x;
      const screenY = node.y * transform.k + transform.y;
      
      // Check if node is within viewport bounds
      if (screenX >= -padding && screenX <= width + padding && 
          screenY >= -padding && screenY <= height + padding) {
        return true; // At least one node is visible
      }
    }
    
    return false; // No nodes are visible
  }, [width, height]);

  const handleNodeCenter = useCallback((nodeId: string) => {
    const node = nodesRef.current.find((n: D3Node) => n.id === nodeId);
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

    if (zoomBehaviorRef.current) {
      svg.transition()
        .duration(750)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .call(zoomBehaviorRef.current.transform as any, newTransform);
    }

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
      source: link.source as unknown as D3Node,
      target: link.target as unknown as D3Node
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
        .id((d: D3Node) => d.id)
        .distance(settings.linkDistance))
      .force('charge', d3.forceManyBody().strength(settings.forceStrength))
      .force('center', d3.forceCenter(width / 2, height / 2));

    if (settings.enableCollision) {
      simulation.force('collision', d3.forceCollide().radius(settingsRef.current.nodeRadius + 2));
    }

    simulationRef.current = simulation;

    // Set up tick handler
    simulation.on('tick', () => {
      requestDraw();
    });

    // Auto-zoom to fit after simulation settles
    setTimeout(() => {
      zoomToFit();
    }, 2000); // Wait 2 seconds for simulation to settle

    return () => {
      simulation.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, height, settings.linkDistance, settings.forceStrength, settings.nodeRadius, settings.enableCollision]);

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
      } else {
        // Clicking on empty canvas - deselect everything
        selectNode(null);
        selectLink(null);
        setConnectedEntities(new Set());
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

      // Update hover state for taskbar
      setHoveredNodeState(node);
      setHoveredLinkState(link);

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
      // Clear hover state when leaving canvas
      setHoveredNodeState(null);
      setHoveredLinkState(null);
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

    // Listen for search selection events
    const handleSearchNodeSelect = (event: CustomEvent) => {
      const nodeId = event.detail;
      handleNodeSelection(nodeId);
    };

    const handleSearchLinkSelect = (event: CustomEvent) => {
      const linkId = event.detail;
      handleLinkSelection(linkId);
    };

    window.addEventListener('selectSearchNode', handleSearchNodeSelect as EventListener);
    window.addEventListener('selectSearchLink', handleSearchLinkSelect as EventListener);

    return () => {
      svg.on('.zoom', null);
      svg.on('click', null);
      svg.on('mousemove', null);
      svg.on('mouseleave', null);
      window.removeEventListener('zoomToFit', handleZoomToFit);
      window.removeEventListener('downloadSVG', handleDownloadSVG);
      window.removeEventListener('downloadPNG', handleDownloadPNG);
      window.removeEventListener('selectSearchNode', handleSearchNodeSelect as EventListener);
      window.removeEventListener('selectSearchLink', handleSearchLinkSelect as EventListener);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [width, height, findNodeAtPosition, findLinkAtPosition, handleNodeSelection, handleLinkSelection, handleNodeCenter, getLinkId, requestDraw, zoomToFit, selectNode, selectLink, setConnectedEntities, data]);

  // Update simulation parameters when settings change
  useEffect(() => {
    if (!simulationRef.current) return;

    const simulation = simulationRef.current;
    const linkForce = simulation.force('link') as d3.ForceLink<D3Node, D3Link>;
    const chargeForce = simulation.force('charge') as d3.ForceManyBody<D3Node>;

    if (linkForce) linkForce.distance(settings.linkDistance);
    if (chargeForce) chargeForce.strength(settings.forceStrength);

    if (settings.enableCollision) {
      simulation.force('collision', d3.forceCollide().radius(settingsRef.current.nodeRadius + 2));
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