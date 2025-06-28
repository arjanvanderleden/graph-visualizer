import { useState, useMemo } from 'react';

interface PropertyMapperProps {
  data: any;
  onMapping: (mapping: PropertyMapping) => void;
  onCancel: () => void;
}

export interface PropertyMapping {
  nodeId: string;
  linkSource: string;
  linkTarget: string;
  linkType: 'links' | 'edges';
}

export function PropertyMapper({ data, onMapping, onCancel }: PropertyMapperProps) {
  const [nodeId, setNodeId] = useState<string>('');
  const [linkSource, setLinkSource] = useState<string>('');
  const [linkTarget, setLinkTarget] = useState<string>('');
  
  // Detect if data has links or edges
  const linkType = useMemo(() => {
    if (data.links && Array.isArray(data.links)) return 'links';
    if (data.edges && Array.isArray(data.edges)) return 'edges';
    return 'links';
  }, [data]);
  
  // Extract string/number properties from first node
  const nodeProperties = useMemo(() => {
    if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      return [];
    }
    
    const firstNode = data.nodes[0];
    const props: string[] = [];
    
    for (const [key, value] of Object.entries(firstNode)) {
      if (typeof value === 'string' || typeof value === 'number') {
        props.push(key);
      }
    }
    
    return props;
  }, [data.nodes]);
  
  // Extract string/number properties from first link/edge
  const linkProperties = useMemo(() => {
    const links = data[linkType];
    if (!links || !Array.isArray(links) || links.length === 0) {
      return [];
    }
    
    const firstLink = links[0];
    const props: string[] = [];
    
    for (const [key, value] of Object.entries(firstLink)) {
      if (typeof value === 'string' || typeof value === 'number') {
        props.push(key);
      }
    }
    
    return props;
  }, [data, linkType]);
  
  // Auto-detect common property names
  useMemo(() => {
    // Auto-select node ID
    const idCandidates = ['id', 'ID', 'nodeId', 'node_id', 'name', 'label'];
    for (const candidate of idCandidates) {
      if (nodeProperties.includes(candidate)) {
        setNodeId(candidate);
        break;
      }
    }
    
    // Auto-select link source
    const sourceCandidates = ['source', 'from', 'src', 'sourceId', 'source_id'];
    for (const candidate of sourceCandidates) {
      if (linkProperties.includes(candidate)) {
        setLinkSource(candidate);
        break;
      }
    }
    
    // Auto-select link target
    const targetCandidates = ['target', 'to', 'dest', 'targetId', 'target_id'];
    for (const candidate of targetCandidates) {
      if (linkProperties.includes(candidate)) {
        setLinkTarget(candidate);
        break;
      }
    }
  }, [nodeProperties, linkProperties]);
  
  const handleSubmit = () => {
    if (nodeId && linkSource && linkTarget) {
      onMapping({
        nodeId,
        linkSource,
        linkTarget,
        linkType
      });
    }
  };
  
  const isValid = nodeId && linkSource && linkTarget;
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full shadow-neumorphic">
        <h2 className="text-lg font-medium text-gray-700 mb-4">
          Map Graph Properties
        </h2>
        
        <p className="text-sm text-gray-600 mb-6">
          Select which properties to use for the graph visualization
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Node Identifier
            </label>
            <select
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm rounded-xl shadow-neumorphic-inset focus:outline-none focus:shadow-neumorphic transition-all duration-200 text-gray-700"
            >
              <option value="">Select property...</option>
              {nodeProperties.map(prop => (
                <option key={prop} value={prop}>
                  {prop}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {linkType === 'edges' ? 'Edge' : 'Link'} Source
            </label>
            <select
              value={linkSource}
              onChange={(e) => setLinkSource(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm rounded-xl shadow-neumorphic-inset focus:outline-none focus:shadow-neumorphic transition-all duration-200 text-gray-700"
            >
              <option value="">Select property...</option>
              {linkProperties.map(prop => (
                <option key={prop} value={prop}>
                  {prop}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {linkType === 'edges' ? 'Edge' : 'Link'} Target
            </label>
            <select
              value={linkTarget}
              onChange={(e) => setLinkTarget(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 backdrop-blur-sm rounded-xl shadow-neumorphic-inset focus:outline-none focus:shadow-neumorphic transition-all duration-200 text-gray-700"
            >
              <option value="">Select property...</option>
              {linkProperties.map(prop => (
                <option key={prop} value={prop}>
                  {prop}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gradient-to-br from-gray-50 to-gray-200 rounded-xl shadow-neumorphic-raised hover:shadow-neumorphic-pressed active:shadow-neumorphic-pressed transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              isValid
                ? 'text-gray-700 bg-gradient-to-br from-gray-50 to-gray-200 shadow-neumorphic-raised hover:shadow-neumorphic-pressed active:shadow-neumorphic-pressed'
                : 'text-gray-500 bg-gradient-to-br from-gray-100 to-gray-300 shadow-neumorphic-pressed cursor-not-allowed'
            }`}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}