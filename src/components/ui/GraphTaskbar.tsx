import { NodeIcon, LinkIcon, FileIcon } from './Icons';
import type { D3Node, D3Link, UnknownGraphData } from '../../types';
import { getNodeId, getNodePath, getLinkImports } from '../../types';
import { formatNodeForDisplay, formatLinkForDisplay } from '../../utils/formatters';

interface GraphTaskbarProps {
  hoveredNode?: D3Node | null;
  hoveredLink?: D3Link | null;
  className?: string;
}

export function GraphTaskbar({ hoveredNode, hoveredLink, className = '' }: GraphTaskbarProps) {
  if (!hoveredNode && !hoveredLink) {
    return (
      <div className={`h-8 bg-gray-50 border-t border-gray-200 flex items-center px-3 text-sm text-gray-500 ${className}`}>
        Hover over nodes or links to see details
      </div>
    );
  }

  if (hoveredNode) {
    const nodeData = hoveredNode as UnknownGraphData;
    const formatted = formatNodeForDisplay(nodeData);
    
    const formattedId = formatted.pathParent 
      ? `${formatted.pathFile} (${formatted.pathParent})`
      : formatted.pathFile;
    
    const declarationInfo = Array.from(formatted.declarations.entries())
      .map(([type, names]) => `${type}: ${names}`)
      .join(', ');
    
    const isFile = getNodePath(nodeData) || getNodeId(nodeData).includes('/');


    return (
      <div className={`h-8 bg-gray-50 border-t border-gray-200 flex items-center px-3 text-sm ${className}`}>
        <div className="flex items-center gap-2">
          {isFile ? (
            <FileIcon className="text-blue-600" size={14} />
          ) : (
            <NodeIcon className="text-green-600" size={14} />
          )}
          <span className="font-medium text-gray-900 truncate">{formattedId}</span>
          {formatted.declarations.size > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 truncate whitespace-nowrap">
                Declarations: {declarationInfo}
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  if (hoveredLink) {
    const linkData = hoveredLink as UnknownGraphData;
    const formatted = formatLinkForDisplay(linkData);
    const exports = getLinkImports(linkData);

    return (
      <div className={`h-8 bg-gray-50 border-t border-gray-200 flex items-center px-3 text-sm ${className}`}>
        <div className="flex items-center gap-2">
          <LinkIcon className="text-purple-600" size={14} />
          <span className="text-gray-600 truncate">
            <span className="font-medium text-gray-900">{formatted.from}</span>
            <span className="text-gray-400 mx-1">→</span>
            <span className="font-medium text-gray-900">{formatted.to}</span>
          </span>
          {exports.length > 0 && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 truncate whitespace-nowrap">
                Exports: {exports.map((exp: UnknownGraphData) =>
                  typeof exp === 'string' ? exp : (getNodeId(exp) || String(exp))
                ).join(', ')}
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}