import { inngest } from './client';
import { askYesNo } from '../llm';

type GraphNode = { id: string; data: { prompt: string; label: string } };
type GraphEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle: string | null;
};

type HistoryEntry = {
  nodeId: string;
  label: string;
  prompt: string;
  answer: 'YES' | 'NO';
};

export const executeWorkflow = inngest.createFunction(
  { id: 'execute-workflow', triggers: { event: 'workflow/run.requested' } },
  async ({ event, step }) => {
    const { nodes, edges, startNodeId } = event.data as {
      nodes: GraphNode[];
      edges: GraphEdge[];
      startNodeId: string;
    };

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const history: HistoryEntry[] = [];
    const visited = new Set<string>();

    let currentId: string | undefined = startNodeId;

    while (currentId) {
      // A graph with a cycle would otherwise run forever — stop instead of hanging.
      if (visited.has(currentId)) break;
      visited.add(currentId);

      const node = nodeMap.get(currentId);
      if (!node) break;

      // One Inngest step per node: durable and individually retried/visible in the dashboard.
      const answer = await step.run(`node-${node.id}`, () => askYesNo(node.data.prompt));

      history.push({ nodeId: node.id, label: node.data.label, prompt: node.data.prompt, answer });

      const branch = answer === 'YES' ? 'yes' : 'no';
      const nextEdge = edges.find((e) => e.source === currentId && e.sourceHandle === branch);
      currentId = nextEdge?.target;
    }

    return { history };
  }
);

export const functions = [executeWorkflow];
