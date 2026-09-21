'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlowStore, type NodeRunStatus } from '@/lib/store';
import { DecisionNode } from './DecisionNode';
import { BranchEdge } from './BranchEdge';
import { ExecutionLogPanel } from './ExecutionLogPanel';
import { Button } from '@/components/ui/button';
import type { RunRecord } from '@/lib/runs-store';

const nodeTypes: NodeTypes = { decision: DecisionNode };
const edgeTypes: EdgeTypes = { branch: BranchEdge };

const STORAGE_KEY = 'ai-workflow-builder:graph';
const POLL_MS = 1000;

export function FlowCanvas() {
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);
  const setGraph = useFlowStore((s) => s.setGraph);
  const setNodeStatus = useFlowStore((s) => s.setNodeStatus);
  const resetNodeStatus = useFlowStore((s) => s.resetNodeStatus);

  const [running, setRunning] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [run, setRun] = useState<RunRecord | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const defaultEdgeOptions = useMemo(() => ({ type: 'branch' as const }), []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function applyRunToCanvas(record: RunRecord) {
    const status: Record<string, NodeRunStatus> = {};
    for (const entry of record.history) {
      status[entry.nodeId] = entry.answer === 'YES' ? 'yes' : 'no';
    }
    if (record.currentNodeId) {
      status[record.currentNodeId] = 'current';
    }
    setNodeStatus(status);
  }

  function pollRun(runId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/workflows/run/${runId}`);
      if (!res.ok) return;
      const record: RunRecord = await res.json();
      setRun(record);
      applyRunToCanvas(record);
      if (record.status !== 'running' && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, POLL_MS);
  }

  async function runWorkflow() {
    if (nodes.length === 0) {
      setStartError('Add at least one node first.');
      return;
    }
    // The start node is whichever node has no incoming edge.
    const targets = new Set(edges.map((e) => e.target));
    const startNode = nodes.find((n) => !targets.has(n.id)) ?? nodes[0];

    setRunning(true);
    setStartError(null);
    resetNodeStatus();
    setRun(null);

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
      if (!res.ok) {
        setStartError(json.error ?? 'Failed to start run');
        return;
      }
      setRun({ status: 'running', history: [], currentNodeId: startNode.id, startedAt: '', updatedAt: '' });
      pollRun(json.runId);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Failed to start run');
    } finally {
      setRunning(false);
    }
  }

  function saveWorkflow() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
    setSaveMessage('Saved.');
    setTimeout(() => setSaveMessage(null), 1500);
  }

  function loadWorkflow() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setSaveMessage('No saved workflow found.');
      setTimeout(() => setSaveMessage(null), 1500);
      return;
    }
    const { nodes: savedNodes, edges: savedEdges } = JSON.parse(raw);
    setGraph(savedNodes, savedEdges);
    resetNodeStatus();
    setSaveMessage('Loaded.');
    setTimeout(() => setSaveMessage(null), 1500);
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
        <Button onClick={addNode} size="sm">
          + Add node
        </Button>
        <Button
          onClick={runWorkflow}
          size="sm"
          variant="default"
          disabled={running}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {running ? 'Starting…' : '▶ Run workflow'}
        </Button>
        <Button onClick={saveWorkflow} size="sm" variant="outline">
          Save
        </Button>
        <Button onClick={loadWorkflow} size="sm" variant="outline">
          Load
        </Button>
        {(startError || saveMessage) && (
          <span className="rounded bg-card px-2 py-1 text-xs shadow">{startError ?? saveMessage}</span>
        )}
      </div>

      <ExecutionLogPanel
        status={run?.status ?? null}
        history={run?.history ?? []}
        error={run?.error}
        onClose={() => setRun(null)}
      />

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
