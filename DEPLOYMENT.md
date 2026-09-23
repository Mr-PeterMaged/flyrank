# Vercel deployment map

All project implementations and this deployment preparation are maintained by [Peter Maged](https://petermaged.com/). The original FlyRank starter materials retain their upstream attribution.

Create separate Vercel projects from this repository when independent URLs are desired:

| Root Directory | Website | Backend |
|---|---|---|
| `.` | Portfolio with the research paper at `/paper/` | None |
| `portfolio` | Standalone portfolio | None |
| `paper` | Standalone research paper | None |
| `ai-workflow-builder` | AI workflow canvas | External persistent Next.js server + Inngest + model provider |
| `todo-api` | Task API product page and API proxy | External Node.js + PostgreSQL + Supabase |
| `background-job` | Background jobs product page and API proxy | External single Node.js process + Inngest |
| `pdf-report-generator` | PDF service product page and API proxy | External Node.js + persistent SQLite/files + Chromium |
| `scraper` | Scraping pipeline product page | CLI runs separately |

Each subproject has its own `README.md`, `LICENSE` and `DEPLOYMENT.md`. For static/proxy projects use **Other**, **Node.js 24.x**, install command `node --version`, build command `node scripts/build-vercel.mjs`, and leave Output Directory unset. Build Output API v3 config is generated in `.vercel/output`. For Next.js use its supplied configuration.

Set `BACKEND_ORIGIN` on each backend-dependent Vercel project to its external HTTPS server origin without a trailing slash. No database, model or service keys are needed in the static frontend build. Configure service secrets on the backend and run that project's documented setup. Rebuild after changing the origin. Existing prototype authentication/state limitations are documented per project.

Only explicitly selected web assets are published; data, notebooks, certificates, local configuration and source files are excluded. A successful frontend build does not mean an external database, job runner or model service has been provisioned.

For repeat local builds, remove only the generated `.vercel/output` under the relevant project. Check the site on mobile and desktop, verify the footer link, and exercise the backend workflow before considering the deployment live.

Reference: [Vercel Build Output API](https://vercel.com/docs/build-output-api).
