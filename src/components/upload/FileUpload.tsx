import { useCallback, useState } from 'react';
import type { GraphData } from '../../types';
import { PropertyMapper, type PropertyMapping } from './PropertyMapper';

interface FileUploadProps {
  onDataLoaded: (data: GraphData) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  className?: string;
}

export function FileUpload({ onDataLoaded, onCancel, showCancel = false, className = '' }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genericData, setGenericData] = useState<any>(null);
  const [showMapper, setShowMapper] = useState(false);

  const isDependencyFormat = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.nodes) || !Array.isArray(data.links)) return false;
    
    return data.nodes.every((node: any) => 
      typeof node === 'object' && 
      typeof node.path === 'string' &&
      Array.isArray(node.imports) &&
      Array.isArray(node.exports) &&
      Array.isArray(node.declarations)
    ) && data.links.every((link: any) =>
      typeof link === 'object' &&
      typeof link.source === 'string' &&
      typeof link.target === 'string' &&
      Array.isArray(link.imports) &&
      typeof link.type === 'string'
    );
  };
  
  const isGenericFormat = (data: any): boolean => {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.nodes)) return false;
    if (!Array.isArray(data.links) && !Array.isArray(data.edges)) return false;
    
    // Check that nodes have at least some properties
    return data.nodes.length > 0 && typeof data.nodes[0] === 'object';
  };

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.json')) {
      setError('Please upload a JSON file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (isDependencyFormat(data)) {
        // Process dependency format - links are already resolved by the dependency graph creator
        const processedData: GraphData = {
          nodes: data.nodes.map((node: any) => ({
            ...node,
            id: node.path
          })),
          links: data.links // Use links directly as provided
        };
        
        onDataLoaded(processedData);
      } else if (isGenericFormat(data)) {
        // Show property mapper for generic format
        setGenericData(data);
        setShowMapper(true);
      } else {
        throw new Error('Invalid graph data format. Expected either dependency graph format or generic format with nodes and links/edges.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded]);
  
  const handleMapping = useCallback((mapping: PropertyMapping) => {
    if (!genericData) return;
    
    const links = genericData[mapping.linkType] || [];
    
    // Transform generic data to internal format
    const basicData: GraphData = {
      nodes: genericData.nodes.map((node: any) => ({
        id: String(node[mapping.nodeId]),
        path: String(node[mapping.nodeId]),
        imports: [],
        exports: [],
        declarations: [],
        // Preserve original data
        ...node
      })),
      links: links.map((link: any) => ({
        source: String(link[mapping.linkSource]),
        target: String(link[mapping.linkTarget]),
        imports: [],
        type: 'dependency',
        // Preserve original data
        ...link
      }))
    };
    
    // For generic data, use the mapped links directly
    const processedData: GraphData = {
      nodes: basicData.nodes,
      links: basicData.links // Use links as mapped from generic format
    };
    
    setShowMapper(false);
    setGenericData(null);
    onDataLoaded(processedData);
  }, [genericData, onDataLoaded]);
  
  const handleCancelMapping = useCallback(() => {
    setShowMapper(false);
    setGenericData(null);
    setError('File upload cancelled');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  return (
    <div className={`${className}`}>
      <div
        className={`
          relative rounded-2xl p-12 text-center transition-all duration-300
          ${isDragOver 
            ? 'bg-white/15 backdrop-blur-lg shadow-neumorphic-inset scale-[1.02]' 
            : 'bg-white/10 backdrop-blur-lg shadow-neumorphic hover:shadow-neumorphic-inset'
          }
          ${isLoading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".json"
          onChange={handleFileInput}
          className="hidden"
          disabled={isLoading}
        />
        
        <div className="space-y-6">
          <div className="mx-auto w-16 h-16 text-gray-500">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isLoading ? 'Processing...' : 'Upload Graph Data'}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Drag and drop your JSON file here, or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Supports dependency graph JSON format
            </p>
          </div>
          
          <div className="mt-6 space-y-3">
            {(isLoading || error) && (
              <button
                onClick={() => {
                  setIsLoading(false);
                  setError(null);
                  const fileInput = document.getElementById('file-input') as HTMLInputElement;
                  if (fileInput) fileInput.value = '';
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gradient-to-br from-gray-50 to-gray-200 rounded-xl shadow-neumorphic-raised hover:shadow-neumorphic-pressed active:shadow-neumorphic-pressed transition-all duration-200"
              >
                {isLoading ? 'Cancel Upload' : 'Clear Error'}
              </button>
            )}
            
            {showCancel && onCancel && (
              <button
                onClick={onCancel}
                className="w-full px-4 py-2 text-sm font-medium text-gray-600 bg-gradient-to-br from-gray-50 to-gray-200 rounded-xl shadow-neumorphic-raised hover:shadow-neumorphic-pressed active:shadow-neumorphic-pressed transition-all duration-200"
              >
                Continue with Current Graph
              </button>
            )}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl shadow-neumorphic-inset">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      
      {showMapper && genericData && (
        <PropertyMapper
          data={genericData}
          onMapping={handleMapping}
          onCancel={handleCancelMapping}
        />
      )}
    </div>
  );
}