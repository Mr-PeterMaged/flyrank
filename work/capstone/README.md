# work/capstone/

Working area for the capstone's full-warehouse rebuild (Lane 2: Refresh / Content Opportunity
Scoring, built from `fact_content_daily_performance` instead of the starter CSV).

- `queries/` — DuckDB SQL against `hf://datasets/FlyRank/internship-warehouse/...`, one file per stage
- `scripts/` — copied/adapted pipeline pieces for the warehouse features (mirrors `scripts/01-05`, never edits them)

The required deliverables stay at their repo-convention paths, not here:
`work/notebooks/capstone.ipynb` and `work/capstone_report.md`. This folder just holds the
work that feeds them. No dataset files committed here — see `.gitignore`.
