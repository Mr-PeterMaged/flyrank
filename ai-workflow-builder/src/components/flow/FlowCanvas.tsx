'use client';

import { useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore } from '@/lib/store';
import { DecisionNode } from './DecisionNode';
import { BranchEdge } from './BranchEdge';
import { Button } from '@/components/ui/button';

const nodeTypes: NodeTypes = { decision: DecisionNode };
const edgeTypes: EdgeTypes = { branch: BranchEdge };

export function FlowCanvas() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);
  const [running, setRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<string | null>(null);

  const defaultEdgeOptions = useMemo(() => ({ type: 'branch' as const }), []);

  async function runWorkflow() {
    if (nodes.length === 0) {
      setRunStatus('Add at least one node first.');
      return;
    }
    // The start node is whichever node has no incoming edge.
    const targets = new Set(edges.map((e) => e.target));
    const startNode = nodes.find((n) => !targets.has(n.id)) ?? nodes[0];

    setRunning(true);
    setRunStatus(null);
    try {
      const res = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodes.map((n) => ({ id: n.id, data: { prompt: n.data.prompt, label: n.data.label } })),
          edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle })),
          startNodeId: startNode.id,
        }),
      });
      const json = await res.json();
      setRunStatus(res.ok ? `Started (event ${json.eventId}) — watch the Inngest dashboard.` : json.error);
    } catch (err) {
      setRunStatus(err instanceof Error ? err.message : 'Failed to start run');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <Button onClick={addNode} size="sm">
          + Add node
        </Button>
        <Button onClick={runWorkflow} size="sm" variant="default" disabled={running} className="bg-emerald-600 hover:bg-emerald-700">
          {running ? 'Starting…' : '▶ Run workflow'}
        </Button>
        {runStatus && <span className="rounded bg-card px-2 py-1 text-xs shadow">{runStatus}</span>}
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}
