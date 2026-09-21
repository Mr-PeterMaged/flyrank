import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { inngest } from '@/lib/inngest/client';

export async function POST(req: Request) {
  const body = await req.json();
  const { nodes, edges, startNodeId } = body;

  if (!Array.isArray(nodes) || nodes.length === 0) {
    return NextResponse.json({ error: 'nodes is required' }, { status: 400 });
  }
  if (!startNodeId) {
    return NextResponse.json({ error: 'startNodeId is required' }, { status: 400 });
  }

  const runId = randomUUID();

  await inngest.send({
    name: 'workflow/run.requested',
    data: { nodes, edges, startNodeId, runId },
  });

  return NextResponse.json({ runId }, { status: 202 });
}
