# Polite Scraping Pipeline: deployment

## Vercel settings

| Setting | Value |
|---|---|
| Root Directory | `scraper` |
| Framework Preset | Other |
| Node.js | 24.x |
| Install Command | `node --version` (backend dependencies are not needed for static assets) |
| Build Command | `node scripts/build-vercel.mjs` |
| Output Directory | Leave unset; the build emits Build Output API v3 |
| Entry page | `/` |

No environment variables are required.

The build publishes only web assets selected in `deployment.json`. Source code, environment files, databases and notebooks are excluded. Files are served first; remaining paths are forwarded to the backend when configured. API requests stay on the frontend origin. Keep private responses uncacheable and session cookies host-only (no backend-domain cookie attribute).

## Backend setup

This is a CLI pipeline, not an HTTP API. Vercel hosts its project page. Run npm ci and npm start on a workstation or scheduled job host. Generated scraping outputs are not deployed.

## Build and verification

Run `node scripts/build-vercel.mjs` with the environment above. For a clean rebuild remove only generated `.vercel/output` first. Missing or malformed backend configuration fails the build. A successful build verifies packaging, not remote backend availability.

Existing checks: `node --check src/index.js`. After deployment, check desktop/mobile layout and the developer link, then exercise the real application workflow. Verify health, authentication, writes and logout where applicable. Configure the backend before expecting application data or jobs to work.

## Ownership

Designed and developed by [Peter Maged](https://petermaged.com/). See [LICENSE](LICENSE) for source terms. Third-party libraries, datasets and upstream materials keep their own terms. Website credits do not replace the source license.

Reference: [Vercel Build Output API](https://vercel.com/docs/build-output-api).
