'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { RunHistoryEntry, RunStatus } from '@/lib/runs-store';

type Props = {
  status: RunStatus | null;
  history: RunHistoryEntry[];
  error?: string;
  onClose: () => void;
};

export function ExecutionLogPanel({ status, history, error, onClose }: Props) {
  if (!status) return null;

  return (
    <div className="absolute right-4 top-4 z-10 w-80 rounded-lg border bg-card shadow-lg">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Execution log</span>
          <Badge
            variant={status === 'failed' ? 'destructive' : status === 'completed' ? 'default' : 'secondary'}
          >
            {status}
          </Badge>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          ✕
        </button>
      </div>

      <ScrollArea className="max-h-80 p-3">
        {history.length === 0 && (
          <p className="text-xs text-muted-foreground">Waiting for the first node…</p>
        )}
        <ol className="space-y-2">
          {history.map((entry, i) => (
            <li key={`${entry.nodeId}-${i}`} className="rounded border p-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {i + 1}. {entry.label}
                </span>
                <Badge variant={entry.answer === 'YES' ? 'default' : 'destructive'} className="text-[10px]">
                  {entry.answer}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{entry.prompt}</p>
            </li>
          ))}
        </ol>
        {error && <p className="mt-2 text-xs text-destructive">Error: {error}</p>}
      </ScrollArea>
    </div>
  );
}
