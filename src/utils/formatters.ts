import type { UnknownGraphData } from "../types";
import { getNodeId, isDependencyGraphNode } from "../types";

export interface FormattedNodeData {
  pathFile: string; // last segment of path or id
  pathParent: string; // rest of segments
  declarations: Map<string, string>; // declaration names grouped by type
}

export interface FormattedLinkData {
  from: string; // formatted source
  to: string; // formatted target
}

/**
 * Formats a node for display purposes
 */
export function formatNodeForDisplay(node: UnknownGraphData): FormattedNodeData {
  const nodeId = getNodeId(node);
  const segments = nodeId.split("/");

  let pathFile: string;
  let pathParent: string;

  if (segments.length > 1) {
    pathFile = segments[segments.length - 1];
    pathParent = segments.slice(0, -1).join("/");
  } else {
    pathFile = nodeId;
    pathParent = "";
  }

  const declarations = new Map<string, string>();

  if (isDependencyGraphNode(node)) {
    // Group declarations by type
    node.declarations
      .filter((decl) => decl.isExported)
      .forEach((decl) => {
        const existing = declarations.get(decl.type) || "";
        const newValue = existing ? `${existing}, ${decl.name}` : decl.name;
        declarations.set(decl.type, newValue);
      });
  }

  return {
    pathFile,
    pathParent,
    declarations,
  };
}

/**
 * Formats a link for display purposes
 * Note: source and target are reversed because links represent imports
 * but we want to show them as exports (from target to source)
 */
export function formatLinkForDisplay(link: UnknownGraphData): FormattedLinkData {
  const sourceId = typeof link.source === "object" ? getNodeId(link.source) : String(link.source);
  const targetId = typeof link.target === "object" ? getNodeId(link.target) : String(link.target);

  // Check if this looks like a dependency graph link
  const isDependencyLink = link.type === "import" || link.type === "export" || link.type === "re-export";

  if (isDependencyLink) {
    // For dependency links: show as exports (target → source)
    return {
      from: formatPathSegment(targetId), // target (where export comes from)
      to: formatPathSegment(sourceId), // source (where import goes to)
    };
  } else {
    // For generic links: show as-is (source → target)
    return {
      from: formatPathSegment(sourceId),
      to: formatPathSegment(targetId),
    };
  }
}

/**
 * Helper function to format a path segment showing "filename (rest of path)"
 */
function formatPathSegment(path: string): string {
  const segments = path.split("/");
  if (segments.length > 1) {
    const filename = segments[segments.length - 1];
    const restPath = segments.slice(0, -1).join("/");
    return `${filename} (${restPath})`;
  }
  return path;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand("copy");
      document.body.removeChild(textArea);
      return result;
    }
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}
