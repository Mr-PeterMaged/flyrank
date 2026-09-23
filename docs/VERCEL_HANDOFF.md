# Vercel handoff — Peter Maged

Prepared: 2026-09-23

Six repositories now include developer credits, project documentation, source licenses and deployment guides. Backend-dependent frontends use external persistent services as requested. No Vercel deployment was created during this task.

| Project | GitHub | Root Directory |
|---|---|---|
| Portfolio and nested projects | [flyrank](https://github.com/Mr-PeterMaged/flyrank) | See `flyrank/DEPLOYMENT.md` |
| Gather | [widget platform](https://github.com/Mr-PeterMaged/flyrank-capstone-widget-platform) | `.` |
| Lens | [image relevance](https://github.com/Mr-PeterMaged/Flyrank-capstone-image-relevance) | `.` |
| Social Media Studio | [social studio](https://github.com/Mr-PeterMaged/flyrank-capstone-social-studio) | `.` |
| ApplyTrack | [ApplyTrack](https://github.com/Mr-PeterMaged/applytrack-10x-capstone) | `.` |
| LLM Metering & Billing | [metering billing](https://github.com/Mr-PeterMaged/flyrank-capstone-metering-billing) | `.` |

## Start on Vercel

1. Provision each backend according to its `DEPLOYMENT.md`; keep database, model and service secrets there.
2. Import the GitHub repository and select the documented Root Directory.
3. Static/proxy projects: **Other**, **Node.js 24.x**; supplied `vercel.json` configures install/build commands. Leave Output Directory unset. AI Workflow Builder uses **Next.js**.
4. Set `BACKEND_ORIGIN` to the real external HTTPS backend origin, with no trailing slash. Static portfolio/paper/scraper pages do not need it.
5. Set `PUBLIC_BASE_URL` on Gather, Social Studio and ApplyTrack backends to the public frontend origin. ApplyTrack also needs `COOKIE_SECURE=1`.
6. Deploy and verify authentication, writes, jobs and downloads against the real services.

## Verification

136 application tests passed: Gather 21, Lens 15, Social Studio 82, ApplyTrack 12, billing 6. Browser acceptance passed for Gather, Lens and ApplyTrack. Project frontends passed desktop/mobile footer and overflow checks. Next.js build and ESLint passed. Twelve static/proxy packages built, including optional root/standalone portfolio targets. The monorepo deployment notebook ran top to bottom.

Real Stripe checkout, real social publishing, live model inference and hosted backend connections still need service configuration. Prototype access-control and in-memory state limitations are documented per project. The certificate directory contains documents only and is not a website or Git repository. Existing unrelated PDFs and local editor settings were kept out of the commits.

## GitHub delivery

All six `main` branches were pushed and verified against GitHub: flyrank `49133ce`; Lens `306fc94`; Gather `ef9ec46`; billing `81d3ff1`; Social Studio `8b62216`; ApplyTrack `d6a5615`.
