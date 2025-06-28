import type { MinimalGraphData } from '../utils/dataConverter';

export const sampleGraph: MinimalGraphData = {
  "nodes": [
    {
      "id": "node_0",
      "label": "CategoryModel",
      "type": "model",
      "metadata": {
        "complexity": 1,
        "size": 2227
      }
    },
    {
      "id": "node_1", 
      "label": "CacheConfig",
      "type": "config",
      "metadata": {
        "complexity": 6,
        "size": 1103
      }
    },
    {
      "id": "node_2",
      "label": "ReportController", 
      "type": "controller",
      "metadata": {
        "complexity": 5,
        "size": 2455
      }
    },
    {
      "id": "node_3",
      "label": "ParserUtility",
      "type": "utility", 
      "metadata": {
        "complexity": 4,
        "size": 3375
      }
    },
    {
      "id": "node_4",
      "label": "SettingsController",
      "type": "controller",
      "metadata": {
        "complexity": 4,
        "size": 3916
      }
    },
    {
      "id": "node_5",
      "label": "ApiService",
      "type": "service",
      "metadata": {
        "complexity": 8,
        "size": 1892
      }
    },
    {
      "id": "node_6", 
      "label": "UserModel",
      "type": "model",
      "metadata": {
        "complexity": 7,
        "size": 2108
      }
    },
    {
      "id": "node_7",
      "label": "FormComponent",
      "type": "component",
      "metadata": {
        "complexity": 3,
        "size": 4201
      }
    },
    {
      "id": "node_8",
      "label": "ValidationUtility", 
      "type": "utility",
      "metadata": {
        "complexity": 9,
        "size": 1567
      }
    },
    {
      "id": "node_9",
      "label": "DashboardView",
      "type": "view",
      "metadata": {
        "complexity": 2,
        "size": 3294
      }
    },
    {
      "id": "node_10",
      "label": "AuthService",
      "type": "service", 
      "metadata": {
        "complexity": 10,
        "size": 2841
      }
    },
    {
      "id": "node_11",
      "label": "ButtonComponent",
      "type": "component",
      "metadata": {
        "complexity": 1,
        "size": 2067
      }
    },
    {
      "id": "node_12",
      "label": "DatabaseConfig",
      "type": "config",
      "metadata": {
        "complexity": 5,
        "size": 1784
      }
    }
  ],
  "links": [
    {
      "source": "node_7",
      "target": "node_8", 
      "type": "depends",
      "weight": 1.8,
      "metadata": {
        "strength": 4,
        "frequency": 85
      }
    },
    {
      "source": "node_2",
      "target": "node_6",
      "type": "uses", 
      "weight": 2.1,
      "metadata": {
        "strength": 3,
        "frequency": 42
      }
    },
    {
      "source": "node_5",
      "target": "node_10",
      "type": "calls",
      "weight": 1.5,
      "metadata": {
        "strength": 5,
        "frequency": 91
      }
    },
    {
      "source": "node_9",
      "target": "node_11", 
      "type": "imports",
      "weight": 1.2,
      "metadata": {
        "strength": 2,
        "frequency": 67
      }
    },
    {
      "source": "node_1",
      "target": "node_12",
      "type": "extends",
      "weight": 2.3,
      "metadata": {
        "strength": 4,
        "frequency": 23
      }
    },
    {
      "source": "node_3",
      "target": "node_8",
      "type": "references", 
      "weight": 1.7,
      "metadata": {
        "strength": 3,
        "frequency": 58
      }
    },
    {
      "source": "node_0",
      "target": "node_6",
      "type": "depends",
      "weight": 1.9,
      "metadata": {
        "strength": 2,
        "frequency": 74
      }
    }
  ]
};