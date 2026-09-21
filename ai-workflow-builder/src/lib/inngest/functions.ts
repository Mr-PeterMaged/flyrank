import { inngest } from './client';
import { askYesNo } from '../llm';
import { createRun, setCurrentNode, appendHistory, completeRun, failRun } from '../runs-store';

type GraphNode = { id: string; data: { prompt: string; label: string } };
type GraphEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle: string | null;
};

export const executeWorkflow = inngest.createFunction(
  { id: 'execute-workflow', triggers: { event: 'workflow/run.requested' } },
  async ({ event, step }) => {
    const { nodes, edges, startNodeId, runId } = event.data as {
      nodes: GraphNode[];
      edges: GraphEdge[];
      startNodeId: string;
      runId: string;
    };

    // Inngest replays this function body from the top every time it resumes
    // after a step, so every side effect here must live inside a step.run —
    // step.run's return value is memoized, but on replay the callback itself
    // does not run again, which is what stops history from being appended
    // twice for the same node.
    await step.run('init-run', () => {
      createRun(runId);
    });

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const visited = new Set<string>();
    let currentId: string | undefined = startNodeId;

    try {
      while (currentId) {
        // A graph with a cycle would otherwise run forever — stop instead of hanging.
        if (visited.has(currentId)) break;
        visited.add(currentId);

        const node = nodeMap.get(currentId);
        if (!node) break;

        // One Inngest step per node: durable, individually retried, and
        // visible in the dashboard. The progress-store writes live inside
        // the callback so they only fire once, on the real execution.
        const answer = await step.run(`node-${node.id}`, async () => {
          setCurrentNode(runId, node.id);
          const result = await askYesNo(node.data.prompt);
          appendHistory(runId, {
            nodeId: node.id,
            label: node.data.label,
            prompt: node.data.prompt,
            answer: result,
          });
          return result;
        });

        const branch = answer === 'YES' ? 'yes' : 'no';
        const nextEdge = edges.find((e) => e.source === currentId && e.sourceHandle === branch);
        currentId = nextEdge?.target;
      }

      await step.run('complete-run', () => {
        completeRun(runId);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      failRun(runId, message);
      throw err; // let Inngest record the run itself as Failed too
    }

    return { runId };
  }
);

export const functions = [executeWorkflow];
