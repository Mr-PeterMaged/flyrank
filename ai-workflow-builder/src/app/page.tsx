import { FlowCanvas } from '@/components/flow/FlowCanvas';

export default function Home() {
  return (
    <div className="flex h-[calc(100dvh-110px)] min-h-[420px] w-full flex-col">
      <header className="flex items-center border-b px-4 py-2">
        <h1 className="text-sm font-semibold">AI Workflow Builder</h1>
      </header>
      <main className="flex-1">
        <FlowCanvas />
      </main>
    </div>
  );
}
