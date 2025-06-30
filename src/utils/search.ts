import type { GraphData, UnknownGraphData } from "../types";

export interface SearchResult {
  type: "node" | "link";
  id: string;
  displayText: string;
  matchedProperty: string;
  matchedValue: string;
  entity: UnknownGraphData;
}

// Properties to search in nodes
const NODE_SEARCH_PROPERTIES = ["id", "path", "name", "label"];

// Properties to search in links
const LINK_SEARCH_PROPERTIES = ["type", "source", "target", "imports"];

// Search nodes and links by text
export const searchGraphEntities = (data: GraphData, searchTerm: string, maxResults: number = 20): SearchResult[] => {
  if (!searchTerm.trim() || !data) return [];

  const term = searchTerm.toLowerCase().trim();
  const results: SearchResult[] = [];

  // Search nodes
  data.nodes.forEach((node) => {
    NODE_SEARCH_PROPERTIES.forEach((prop) => {
      const nodeData = node as UnknownGraphData;
      const value = nodeData[prop];
      if (value && typeof value === "string" && value.toLowerCase().includes(term)) {
        const displayText = nodeData.path || node.id || nodeData.name || String(node.id);
        results.push({
          type: "node",
          id: node.id,
          displayText: displayText.split("/").pop() || displayText, // Show just filename for paths
          matchedProperty: prop,
          matchedValue: String(value),
          entity: node,
        });
      }
    });
  });

  // Search links
  data.links.forEach((link) => {
    const sourceId = typeof link.source === "string" ? link.source : link.source.id;
    const targetId = typeof link.target === "string" ? link.target : link.target.id;
    const linkId = `${sourceId}-${targetId}`;

    LINK_SEARCH_PROPERTIES.forEach((prop) => {
      const linkData = link as UnknownGraphData;
      const value = linkData[prop];

      // Handle both string and array properties
      let matches = false;
      let matchedValue = "";

      if (prop === "imports" && Array.isArray(value)) {
        // Search in imports array
        const matchingImports = value.filter((imp) => typeof imp === "string" && imp.toLowerCase().includes(term));
        if (matchingImports.length > 0) {
          matches = true;
          matchedValue = matchingImports.join(", ");
        }
      } else if (value && typeof value === "string" && value.toLowerCase().includes(term)) {
        matches = true;
        matchedValue = String(value);
      }

      if (matches) {
        const sourceNode = data.nodes.find((n) => n.id === sourceId);
        const targetNode = data.nodes.find((n) => n.id === targetId);
        const sourceName = sourceNode?.path?.split("/").pop() || sourceId;
        const targetName = targetNode?.path?.split("/").pop() || targetId;

        results.push({
          type: "link",
          id: linkId,
          displayText: `${sourceName} → ${targetName}`,
          matchedProperty: prop,
          matchedValue,
          entity: link,
        });
      }
    });
  });

  // Remove duplicates and limit results
  const uniqueResults = results.filter(
    (result, index, self) => index === self.findIndex((r) => r.type === result.type && r.id === result.id)
  );

  return uniqueResults.slice(0, maxResults);
};

// Dispatch search selection command
export const selectSearchResult = (result: SearchResult) => {
  if (result.type === "node") {
    const event = new CustomEvent("selectSearchNode", { detail: result.id });
    window.dispatchEvent(event);
  } else {
    const event = new CustomEvent("selectSearchLink", { detail: result.id });
    window.dispatchEvent(event);
  }
};
