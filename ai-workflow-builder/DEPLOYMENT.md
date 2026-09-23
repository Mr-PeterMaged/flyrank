# AI Workflow Builder deployment

Designed and developed by [Peter Maged](https://petermaged.com/).

## Vercel frontend

Import `Mr-PeterMaged/flyrank` and select **Root Directory: `ai-workflow-builder`**. Use the Next.js preset, Node.js 24.x, `npm ci` and `npm run build`; keep the default output directory. Set `BACKEND_ORIGIN` to the external workflow server's HTTPS origin without a trailing slash. This is the only required frontend environment variable. The build rejects missing configuration on Vercel and obvious proxy loops.

All `/api/*` requests are rewritten before local API routes to the external backend. The canvas and developer footer are served by Vercel. Do not put LLM keys in browser variables.

## External backend

Deploy this same subdirectory on a persistent Node.js host. Run `npm ci`, `npm run build`, then `npm start -- --hostname 0.0.0.0 --port 3000` (substitute the host's port). Leave `BACKEND_ORIGIN` unset on that host to use its local API routes. Supply `GEMINI_API_KEY`, `GEMINI_BASE_URL`, `GEMINI_MODEL`, `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`. Remove the local-only `INNGEST_DEV=1` value and register the backend `/api/inngest` URL with Inngest Cloud.

The existing run store is in memory. Keep one persistent process: restarting loses progress, and multiple replicas cannot share it. Durable shared state and authenticated/rate-limited run submission are required before unrestricted public or business-critical use. Apply host access controls to prevent anonymous visitors spending the configured model budget.

## Verification

Run `npm run lint` and `npm run build`. After configuring the external services, open the Vercel URL, add a small decision graph, execute it and check progress, completion and failure reporting. Local build checks do not certify real provider connectivity.

Source license: [MIT](LICENSE). Third-party components retain their own licenses.
