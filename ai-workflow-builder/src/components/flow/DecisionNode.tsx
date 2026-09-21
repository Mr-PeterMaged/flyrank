'use client';

import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useFlowStore, type DecisionNode as DecisionNodeType } from '@/lib/store';

export function DecisionNode({ id, data, selected }: NodeProps<DecisionNodeType>) {
  const updateNodePrompt = useFlowStore((s) => s.updateNodePrompt);
  const updateNodeLabel = useFlowStore((s) => s.updateNodeLabel);
  const deleteNode = useFlowStore((s) => s.deleteNode);

  return (
    <div
      className={`w-64 rounded-lg border bg-card text-card-foreground shadow-sm ${
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />

      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <Input
          value={data.label}
          onChange={(e) => updateNodeLabel(id, e.target.value)}
          className="h-7 border-none bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-1"
        />
        <button
          onClick={() => deleteNode(id)}
          className="text-xs text-muted-foreground hover:text-destructive"
          title="Delete node"
        >
          ✕
        </button>
      </div>

      <div className="p-3">
        <Textarea
          value={data.prompt}
          onChange={(e) => updateNodePrompt(id, e.target.value)}
          placeholder="Ask a yes/no question…"
          className="min-h-16 resize-none text-sm nodrag"
        />
      </div>

      <div className="relative flex justify-between px-3 pb-2 text-[10px] font-medium">
        <span className="text-emerald-600">YES</span>
        <span className="text-red-600">NO</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="yes"
        style={{ left: '25%' }}
        className="!bg-emerald-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="no"
        style={{ left: '75%' }}
        className="!bg-red-500"
      />
    </div>
  );
}
