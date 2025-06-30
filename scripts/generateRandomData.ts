#!/usr/bin/env tsx

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Types matching the dependency graph schema
interface ImportSpecifier {
  name: string;
  alias?: string;
  isDefault: boolean;
  isNamespace: boolean;
}

interface ImportNode {
  type: 'import';
  from: string;
  imports: ImportSpecifier[];
  sourceFile: string;
  position: {
    line: number;
    column: number;
    offset: number;
  };
}

interface ExportSpecifier {
  name: string;
  isDefault: boolean;
  isNamespace: boolean;
}

interface ExportNode {
  type: 'export';
  exports: ExportSpecifier[];
  from?: string;
  sourceFile: string;
  position: {
    line: number;
    column: number;
    offset: number;
  };
}

interface Declaration {
  type: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'enum';
  name: string;
  isExported: boolean;
  isDefault: boolean;
  sourceFile: string;
  position: {
    line: number;
    column: number;
    offset: number;
  };
  // Additional properties based on type
  parameters?: Array<{ name: string; type?: string; optional: boolean }>;
  returnType?: string;
  isAsync?: boolean;
  extends?: string | string[];
  implements?: string[];
  kind?: 'const' | 'let' | 'var';
  variableType?: string;
  members?: string[];
}

interface FileNode {
  path: string;
  imports: ImportNode[];
  exports: ExportNode[];
  declarations: Declaration[];
}

interface DependencyLink {
  source: string;
  target: string;
  imports: string[];
  type: 'import' | 'export' | 're-export';
}

interface DependencyGraphData {
  nodes: FileNode[];
  links: DependencyLink[];
}

// Predefined module types and their typical exports
const MODULE_TYPES = {
  component: {
    fileTypes: ['.tsx', '.jsx'],
    exports: ['Button', 'Modal', 'Card', 'List', 'Table', 'Form', 'Input', 'Header', 'Footer', 'Nav'],
    imports: ['React', 'useState', 'useEffect', 'Props', 'styles']
  },
  service: {
    fileTypes: ['.ts', '.js'],
    exports: ['AuthService', 'ApiService', 'DataService', 'CacheService', 'StorageService'],
    imports: ['axios', 'fetch', 'config', 'logger', 'utils']
  },
  utility: {
    fileTypes: ['.ts', '.js'],
    exports: ['formatDate', 'parseJSON', 'validateEmail', 'calculateSum', 'deepClone'],
    imports: ['lodash', 'moment', 'constants']
  },
  model: {
    fileTypes: ['.ts', '.d.ts'],
    exports: ['User', 'Product', 'Order', 'Customer', 'Settings'],
    imports: ['BaseModel', 'types', 'validators']
  },
  types: {
    fileTypes: ['.ts', '.d.ts'],
    exports: ['UserType', 'ApiResponse', 'Config', 'State', 'Action'],
    imports: []
  }
};

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePath(type: keyof typeof MODULE_TYPES, index: number): string {
  const moduleType = MODULE_TYPES[type];
  const fileType = randomChoice(moduleType.fileTypes);
  const folders = {
    component: ['components', 'ui', 'views'],
    service: ['services', 'api', 'lib'],
    utility: ['utils', 'helpers', 'lib'],
    model: ['models', 'entities', 'types'],
    types: ['types', 'interfaces', '@types']
  };
  
  const folder = randomChoice(folders[type]);
  const name = randomChoice(moduleType.exports).replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
  
  return `src/${folder}/${name}-${index}${fileType}`;
}

function generateDeclarations(path: string, moduleType: keyof typeof MODULE_TYPES): Declaration[] {
  const declarations: Declaration[] = [];
  const exportNames = MODULE_TYPES[moduleType].exports;
  const numDeclarations = randomInt(1, 3);
  
  for (let i = 0; i < numDeclarations; i++) {
    const name = randomChoice(exportNames) + (i > 0 ? i : '');
    const isDefault = i === 0 && Math.random() > 0.5;
    
    const declaration: Declaration = {
      name,
      isExported: true,
      isDefault,
      sourceFile: path,
      position: {
        line: 10 + i * 20,
        column: 0,
        offset: 200 + i * 400
      },
      type: 'function' // default
    };
    
    // Assign type based on module type
    if (moduleType === 'component') {
      declaration.type = 'function';
      declaration.parameters = [{ name: 'props', type: 'Props', optional: false }];
      declaration.returnType = 'JSX.Element';
    } else if (moduleType === 'service' || moduleType === 'utility') {
      declaration.type = Math.random() > 0.5 ? 'function' : 'class';
      if (declaration.type === 'function') {
        declaration.isAsync = Math.random() > 0.5;
        declaration.parameters = [
          { name: 'data', type: 'any', optional: false }
        ];
        declaration.returnType = declaration.isAsync ? 'Promise<any>' : 'any';
      }
    } else if (moduleType === 'model' || moduleType === 'types') {
      declaration.type = Math.random() > 0.5 ? 'interface' : 'type';
      if (declaration.type === 'interface') {
        declaration.extends = Math.random() > 0.7 ? ['BaseType'] : [];
      }
    }
    
    declarations.push(declaration);
  }
  
  return declarations;
}

function generateRandomDependencyGraph(nodeCount: number, density: number): DependencyGraphData {
  const nodes: FileNode[] = [];
  const moduleTypes = Object.keys(MODULE_TYPES) as (keyof typeof MODULE_TYPES)[];
  
  // Generate nodes
  for (let i = 0; i < nodeCount; i++) {
    const moduleType = randomChoice(moduleTypes);
    const path = generatePath(moduleType, i);
    const declarations = generateDeclarations(path, moduleType);
    
    nodes.push({
      path,
      imports: [],
      exports: [],
      declarations
    });
  }
  
  // Generate links and populate imports
  const targetLinkCount = Math.floor(nodeCount * density);
  const links: DependencyLink[] = [];
  const linkSet = new Set<string>();
  
  let attempts = 0;
  const maxAttempts = targetLinkCount * 10;
  
  while (links.length < targetLinkCount && attempts < maxAttempts) {
    const sourceIdx = randomInt(0, nodeCount - 1);
    const targetIdx = randomInt(0, nodeCount - 1);
    
    if (sourceIdx === targetIdx) {
      attempts++;
      continue;
    }
    
    const linkKey = `${sourceIdx}-${targetIdx}`;
    if (linkSet.has(linkKey)) {
      attempts++;
      continue;
    }
    
    linkSet.add(linkKey);
    
    const sourceNode = nodes[sourceIdx];
    const targetNode = nodes[targetIdx];
    
    // Get available exports from target
    const availableExports = targetNode.declarations
      .filter(d => d.isExported)
      .map(d => d.name);
    
    if (availableExports.length === 0) {
      attempts++;
      continue;
    }
    
    // Import 1-3 random exports
    const numImports = Math.min(randomInt(1, 3), availableExports.length);
    const imports = availableExports
      .sort(() => Math.random() - 0.5)
      .slice(0, numImports);
    
    // Add import to source node
    const importNode: ImportNode = {
      type: 'import',
      from: `./${targetNode.path.replace('src/', '../')}`.replace(/\.[tj]sx?$/, ''),
      imports: imports.map(name => ({
        name,
        isDefault: targetNode.declarations.find(d => d.name === name)?.isDefault || false,
        isNamespace: false
      })),
      sourceFile: sourceNode.path,
      position: {
        line: 1 + sourceNode.imports.length,
        column: 0,
        offset: sourceNode.imports.length * 50
      }
    };
    
    sourceNode.imports.push(importNode);
    
    // Create link
    links.push({
      source: sourceNode.path,
      target: targetNode.path,
      imports,
      type: 'import'
    });
    
    attempts++;
  }
  
  return { nodes, links };
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: tsx generateRandomData.ts <nodeCount> [density] [outputFile]');
    console.log('  nodeCount: Number of nodes to generate');
    console.log('  density: Average links per node (default: 1.5)');
    console.log('  outputFile: Optional output file path (default: sample-graph-{nodeCount}.json)');
    process.exit(1);
  }
  
  const nodeCount = parseInt(args[0]);
  const density = args[1] ? parseFloat(args[1]) : 1.5;
  const outputFile = args[2] || `sample-graph-${nodeCount}.json`;
  
  if (isNaN(nodeCount) || nodeCount <= 0) {
    console.error('Error: nodeCount must be a positive integer');
    process.exit(1);
  }
  
  if (isNaN(density) || density < 0) {
    console.error('Error: density must be a non-negative number');
    process.exit(1);
  }
  
  console.log(`Generating dependency graph with ${nodeCount} nodes and density ${density}...`);
  
  const graphData = generateRandomDependencyGraph(nodeCount, density);
  
  console.log(`Generated ${graphData.nodes.length} nodes and ${graphData.links.length} links`);
  
  // Ensure output directory exists
  try {
    mkdirSync('data', { recursive: true });
  } catch {
    // Directory might already exist
  }
  
  const outputPath = join('data', outputFile);
  writeFileSync(outputPath, JSON.stringify(graphData, null, 2));
  
  console.log(`Saved to: ${outputPath}`);
  
  // Print some statistics
  const avgDegree = (graphData.links.length * 2) / graphData.nodes.length;
  console.log(`\nStatistics:`);
  console.log(`  Nodes: ${graphData.nodes.length}`);
  console.log(`  Links: ${graphData.links.length}`);
  console.log(`  Average degree: ${avgDegree.toFixed(2)}`);
  console.log(`  Actual density: ${(graphData.links.length / graphData.nodes.length).toFixed(2)}`);
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateRandomDependencyGraph, type DependencyGraphData, type FileNode, type DependencyLink };