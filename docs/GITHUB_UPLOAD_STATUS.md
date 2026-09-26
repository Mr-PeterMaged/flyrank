# Complete workspace upload

Updated: 2026-09-27

Scope: the complete local project trees, including previously ignored files, as explicitly requested. Git internal metadata is not project content. Every local project file is now tracked; the large native Next.js binary uses Git LFS.

| Project | Full-snapshot commit | Tracked files |
|---|---|---:|
| flyrank | `b648791d` | 72667 |
| flyrank-capstone-image-relevance | `b3b01c1f` | 2107 |
| flyrank-capstone-widget-platform | `2c842c01` | 1701 |
| LLM Usage Metering & Billing Service | `0fef26d3` | 3105 |
| Social Media Studio | `67a073eb` | 1396 |
| Your 10x Solution | `2d7379db` | 4187 |

All six full-snapshot commits were pushed to main and verified against GitHub. The 106 MB LFS object uploaded successfully. Vercel builders now safely replace prior generated output, and all 12 static/proxy build-and-rebuild checks passed. The deployment verification notebook passed. The original 136 application tests were not rerun because application behavior was unchanged in this follow-up.

The full snapshot includes local environment/configuration files and databases. It also includes native Windows dependencies; reinstall dependencies for the target operating system. The existing FlyRank data-leak CI guard rejects dataset archives in a full snapshot and has not been disabled.

## GitHub Actions observations

- Gather: application and browser tests passed; the private-runtime-file guard failed because the requested snapshot includes those files. [Run](https://github.com/Mr-PeterMaged/flyrank-capstone-widget-platform/actions/runs/36274282442).
- Lens: API tests, browser tests and npm audit passed; the runtime-data/credentials guard failed because the requested snapshot includes those files. [Run](https://github.com/Mr-PeterMaged/Flyrank-capstone-image-relevance/actions/runs/36274321749).
- ApplyTrack: Backend checks passed. [Run](https://github.com/Mr-PeterMaged/applytrack-10x-capstone/actions/runs/36274454501).

The guard failures are disclosed, not disabled or represented as passing checks.

## Restoring the complete snapshot

Clone the repository with Git LFS installed and run `git lfs pull` in flyrank to retrieve the large native binary. Repository history preserves the uploaded snapshot; empty directories and Git internal bookkeeping are not normal versioned project files. The current snapshot contains Windows runtime dependencies, so reinstall them before running on a different operating system.

## Final note

The full-snapshot commits above record 85,163 project files. Documentation updates may follow those commits. Files containing environment keys and runtime credentials were included as explicitly requested; rotate any active credentials because they are now present in repository history.
