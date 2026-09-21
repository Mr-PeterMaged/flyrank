import { create } from 'zustand';
import {
  applyEdgeChanges,
  applyNodeChanges,
  addEdge,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
} from '@xyflow/react';

export type DecisionNodeData = {
  label: string;
  prompt: string;
};

export type DecisionNode = Node<DecisionNodeData, 'decision'>;
export type DecisionEdge = Edge<{ branch: 'YES' | 'NO' }>;

let nextId = 1;
export function newNodeId() {
  return `node-${nextId++}`;
}

export type NodeRunStatus = 'idle' | 'current' | 'yes' | 'no';

type FlowState = {
  nodes: DecisionNode[];
  edges: DecisionEdge[];
  nodeStatus: Record<string, NodeRunStatus>;
  onNodesChange: OnNodesChange<DecisionNode>;
  onEdgesChange: OnEdgesChange<DecisionEdge>;
  onConnect: (connection: Connection) => void;
  addNode: () => void;
  updateNodePrompt: (id: string, prompt: string) => void;
  updateNodeLabel: (id: string, label: string) => void;
  deleteNode: (id: string) => void;
  setGraph: (nodes: DecisionNode[], edges: DecisionEdge[]) => void;
  setNodeStatus: (status: Record<string, NodeRunStatus>) => void;
  resetNodeStatus: () => void;
};

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  nodeStatus: {},

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    // sourceHandle is "yes" or "no" — set on the DecisionNode's two output handles.
    const branch = connection.sourceHandle === 'no' ? 'NO' : 'YES';
    set({
      edges: addEdge(
        {
          ...connection,
          id: `edge-${connection.source}-${connection.sourceHandle}-${connection.target}`,
          type: 'branch',
          data: { branch },
        },
        get().edges
      ),
    });
  },

  addNode: () => {
    const id = newNodeId();
    const count = get().nodes.length;
    // Lay new nodes out in a loose grid so they never spawn on top of each other.
    const col = count % 4;
    const row = Math.floor(count / 4);
    const node: DecisionNode = {
      id,
      type: 'decision',
      position: { x: 80 + col * 300, y: 80 + row * 220 },
      data: { label: `Node ${id.split('-')[1]}`, prompt: 'Is this...?' },
    };
    set({ nodes: [...get().nodes, node] });
  },

  updateNodePrompt: (id, prompt) => {
    set({
      nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, prompt } } : n)),
    });
  },

  updateNodeLabel: (id, label) => {
    set({
      nodes: get().nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)),
    });
  },

  deleteNode: (id) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    });
  },

  setGraph: (nodes, edges) => set({ nodes, edges }),

  setNodeStatus: (status) => set({ nodeStatus: status }),
  resetNodeStatus: () => set({ nodeStatus: {} }),
}));
