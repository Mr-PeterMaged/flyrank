// A run's progress, kept in memory for the lifetime of the dev server process.
// The Inngest function executes inside this same Next.js process (both run
// through the local Dev Server), so it can write here directly — no second
// HTTP round trip, and the client polls this store's own route, not Inngest's
// internal dev API, which isn't meant for an app to depend on.

export type RunStatus = 'running' | 'completed' | 'failed';

export type RunHistoryEntry = {
  nodeId: string;
  label: string;
  prompt: string;
  answer: 'YES' | 'NO';
};

export type RunRecord = {
  status: RunStatus;
  history: RunHistoryEntry[];
  currentNodeId: string | null;
  error?: string;
  startedAt: string;
  updatedAt: string;
};

const runs = new Map<string, RunRecord>();

export function createRun(runId: string) {
  const now = new Date().toISOString();
  runs.set(runId, { status: 'running', history: [], currentNodeId: null, startedAt: now, updatedAt: now });
}

export function setCurrentNode(runId: string, nodeId: string) {
  const run = runs.get(runId);
  if (!run) return;
  run.currentNodeId = nodeId;
  run.updatedAt = new Date().toISOString();
}

export function appendHistory(runId: string, entry: RunHistoryEntry) {
  const run = runs.get(runId);
  if (!run) return;
  run.history.push(entry);
  run.updatedAt = new Date().toISOString();
}

export function completeRun(runId: string) {
  const run = runs.get(runId);
  if (!run) return;
  run.status = 'completed';
  run.currentNodeId = null;
  run.updatedAt = new Date().toISOString();
}

export function failRun(runId: string, error: string) {
  const run = runs.get(runId);
  if (!run) return;
  run.status = 'failed';
  run.error = error;
  run.currentNodeId = null;
  run.updatedAt = new Date().toISOString();
}

export function getRun(runId: string): RunRecord | undefined {
  return runs.get(runId);
}
