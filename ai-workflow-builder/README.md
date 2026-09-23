# AI Workflow Builder — Peter Maged

**Designed and developed by [Peter Maged](https://petermaged.com/).** A visual decision workflow product for prototyping AI-assisted business processes.

Next.js, React Flow, TypeScript, Inngest and an OpenAI-compatible model adapter power the editor and execution workflow. See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel frontend/external backend settings and the current state/authentication limits. Source: [MIT License](LICENSE). Project enquiries: [petermaged.com](https://petermaged.com/).

## Technical guide

# AI Workflow Builder

A visual editor for AI decision workflows: each node holds a prompt, an LLM answers it with
exactly **YES** or **NO**, and that answer picks which edge — and which node — runs next. The
canvas is [React Flow](https://reactflow.dev/); execution runs as an
[Inngest](https://www.inngest.com/) function, one step per node.

## Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript + Tailwind
- [React Flow](https://reactflow.dev/) (`@xyflow/react`) — the canvas
- [Inngest](https://www.inngest.com/) — durable workflow execution, step-per-node
- [Gemini](https://ai.google.dev/) via the `openai` SDK — Google's Gemini API exposes an
  OpenAI-compatible endpoint, so the official `openai` package works unmodified against it by
  pointing `baseURL` at Google instead of OpenAI. Swapping to real OpenAI (or any other
  OpenAI-compatible provider) is three env vars, nothing else.
- [shadcn/ui](https://ui.shadcn.com/) — node/panel styling

## Install & run

Two terminals.

```
# terminal 1 — the app
npm install
cp .env.example .env.local   # then fill in GEMINI_API_KEY
npm run dev

# terminal 2 — the Inngest Dev Server
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

App: `http://localhost:3000`. Inngest dashboard: `http://localhost:8288`.

`GEMINI_API_KEY` comes from [Google AI Studio](https://aistudio.google.com/) — free tier, no
card. `GEMINI_MODEL` in `.env.example` is pinned to whatever model was current when this was
built; Google's model lineup moves fast, so if a request 404s with "model no longer available,"
the error message names the current replacement — update `.env.local` to match.

## Project structure

```
src/
  app/
    page.tsx              the React Flow canvas page
    api/inngest/route.ts  Inngest's Next.js serve handler
  components/
    flow/                 canvas, custom nodes, edges
    ui/                   shadcn components
  lib/
    llm.ts                askYesNo() — one prompt in, "YES" | "NO" out, nothing else
    inngest/
      client.ts           the Inngest client
      functions.ts        the workflow-execution function (one step per node)
    store.ts               local graph state (nodes, edges, prompts)
```

## Status

Phase 1 (setup) — done. Phases 2–4 build the editor, execution, and polish on top of this.
