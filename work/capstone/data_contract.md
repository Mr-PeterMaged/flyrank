# Capstone data contract — Lane 2 (Refresh / Content Opportunity Scoring), full-warehouse rebuild

Rebuilds the lane from `fact_content_daily_performance` directly (78.8M-row daily panel),
instead of reusing the starter CSV's precomputed `trend_direction` / `trend_pct`. The label
here is genuinely forward-looking: computed from real future daily rows, at two independent
decision points, never from a precomputed product field.

## 1. Unit of analysis

One row = **one (client_hash_id, content_hash_id) pair, evaluated at one decision date** —
i.e. one content item's snapshot at a point in time. The same content item can appear once
per decision point (A and B below); each snapshot is a self-contained cross-section.

## 2. Time windows

Two decision points, built by `work/capstone/scripts/build_decision_frame.py`:

| Snapshot | Decision date | Feature window (trailing 90d) | Label window (forward 60d) | Role |
|---|---|---|---|---|
| A | 2026-01-31 | (2025-11-02, 2026-01-31] | (2026-01-31, 2026-04-01] | Train / dev — internal client-holdout split |
| B | 2026-03-31 | (2025-12-31, 2026-03-31] | (2026-03-31, 2026-05-30] | **Sealed test** — never touched during model dev |

Both windows sit fully inside the warehouse's available range (2025-01-27 → 2026-06-30), with
margin on both ends. A and B are independent snapshots of an evolving panel — the same content
item's B-window features are naturally correlated with its A-window label (expected in a rolling
panel), but each snapshot's own features never touch its own label window. That's the leakage
rule that matters, and it holds for both independently (verified below).

Query verification (executed, not assumed):
- `build_decision_frame.py`: pulls exact month partitions from `fact_content_daily_performance`,
  filters `report_date` strictly within each window (`>` / `<=` boundaries), aggregates
  per (client, content). Elapsed: A=236s (5 month-files), B=282s (5 month-files) — cached locally
  as `work/capstone/cache/decision_frame_{A,B}.parquet` (gitignored) so this never re-scans.
- `join_and_label.py`: joins `dim_clients` (eligibility filter) and `dim_content` (context),
  computes the label, and re-derives grain + label balance.

## 3. Eligibility filter (who gets scored)

Applied client-side and content-side, verified in `join_and_label.py`:

- `dim_clients.is_active = TRUE AND has_gsc_access = TRUE` — need real GSC demand for the label.
  From the full client dimension breakdown (executed query): only 2 of 6 (is_active, has_gsc,
  has_ga4) combinations pass this filter — 41 clients with all three TRUE, 14 with GSC but no GA4
  (kept; GA4 features just unavailable for them, flagged via `feat_days_ga4`, never blind-filled).
- `dim_clients.gsc_data_start <= feature_window_start` — guarantees a full, uncut trailing
  90-day history per client (no client's tracking started mid-feature-window).
- `dim_content.is_published = TRUE AND is_deleted = FALSE` — scoring a deleted/unpublished page
  is not an actionable recommendation.
- `feat_impressions >= 50` — minimum-volume filter (lane guide §8): avoids scoring pages with too
  little demand for the click-rate signal to mean anything.

Rows surviving all filters: **A = 65,829**, **B = 103,784** (grain probe —
`GROUP BY client_hash_id, content_hash_id HAVING COUNT(*) > 1` — returned 0 rows in both: the
grain holds).

## 4. Field classification

| Field | Bucket | Why |
|---|---|---|
| `feat_impressions`, `feat_clicks`, `feat_sessions`, `feat_engaged_sessions`, `feat_engagement_sec`, `feat_sessions_ai`, `feat_scroll_events`, `feat_avg_position`, `feat_clicks_per_day` | **Feature** | All computed only from rows dated on/before the decision date |
| `feat_days_gsc`, `feat_days_ga4`, `feat_days_total` | **Feature** (coverage flags) | How much of the 90-day window actually had GSC/GA4 data — prevents a blind fillna from injecting a missingness signal |
| `content_type`, `main_intent`, `word_count`, `backlinks`, `search_volume`, `competition`, `competition_level` | **Feature** | Static/slow-moving content metadata from `dim_content`, known before the decision date |
| `content_created_date` (→ age at decision date) | **Feature** (derived) | Age is knowable before the decision |
| `label_impressions`, `label_clicks`, `label_sessions`, `click_rate_change`, `is_declining_v2` | **Label / proxy** | Computed ONLY from rows strictly after the decision date — never a feature |
| `client_hash_id`, `content_hash_id` | **Context** | Grouping/joining/splitting only (client-holdout split within A, temporal split A→B) — never a model feature |
| `last_optimized_date`, `optimization_eligible_date` | **Excluded** | Reflects a past editorial *decision* (something FlyRank already acted on), not an observed outcome — including it risks learning "what the product already decided to fix" rather than discovering signal |
| `fact_content_query_90d` (whole table) | **Excluded** | Fixed single window (`window_start = 2026-04-02`, verified by query — only one distinct value), which sits inside or after both A's and B's label windows. No safe way to use it as a pre-decision feature for either snapshot without leaking label-period query mix. |
| `health_score`, `priority_score`, `action_type`, `needs_ctr_fix`, etc. | **Excluded** | Not shipped in this release at all (by design, per `DATA_USE.md` / lane guide §4) — nothing to accidentally include |

## 5. Missing values

Checked per snapshot (both A and B show the same pattern, confirming it's structural, not
a one-off aggregation bug):

| Field | Missing % (A / B) | Pattern |
|---|---|---|
| `content_type` | 0.0% / 0.0% | Always present |
| `main_intent` | 3.6% / 3.1% | Small, likely a genuine gap in keyword metadata |
| `word_count` | 46.6% / 38.9% | Follows `content_type` (some content types never carry a word count) — **never blind-fillna(0)**; add a `has_word_count` flag instead, matching the starter dataset's documented gotcha |
| `backlinks` | 50.0% / 44.2% | Same content-type-linked pattern as `word_count` |
| `search_volume` | 4.1% / 3.6% | Small, keyword-metadata gap |

`label_impressions`/`label_clicks` are never NULL (COALESCEd to 0 — a page can legitimately earn
zero clicks in the label window); `is_declining_v2` is NULL only when `feat_clicks == 0` (35.8%
of A, 35.6% of B) — those rows have no click rate to measure a *change* against, so they're
excluded from label balance/training, not coerced into a fake 0/1.

## 6. Label definition

```
click_rate_change = (label_clicks / 60) / (feat_clicks / feat_days_total) - 1
is_declining_v2   = 1  if feat_clicks > 0 AND click_rate_change <= -0.20
                    0  if feat_clicks > 0 AND click_rate_change >  -0.20
                    NULL if feat_clicks == 0   (excluded from labeled set)
```

A page "declines" if its daily click rate drops ≥20% from the trailing 90-day average to the
forward 60-day average. This is a genuinely forward-looking proxy — no product flag, no
pre-computed `trend_direction`, computed fresh from raw daily facts at each decision point.

**Observed base rates** (executed, not assumed): A = 35.0% declining (of 42,277 labeled rows),
B = 60.8% declining (of 66,859 labeled rows). This gap is real and worth investigating further
(seasonal effect vs. a platform-wide shift between Q4 2025→Q1 2026 and Q1→Q2 2026 cohorts) —
flagged here rather than smoothed over; it directly affects how "beats the baseline" should be
read on B (a much higher base rate mechanically changes what precision@K looks like).

## 7. Split design

- **A (train/dev):** grouped client-holdout split (≈80/20 by `client_hash_id`, no client's
  content in both halves) — mirrors the starter pipeline's convention, used for model selection.
- **B (sealed test):** touched only once, after the model trained on A is finalized. This is a
  temporal holdout, not a random one — B's decision date (2026-03-31) and its entire label window
  (Apr-May 2026) are strictly after A's label window ends (2026-04-01, i.e. essentially
  concurrent-to-later) — evaluating on B tests whether the signal generalizes to a later period,
  not just to unseen clients.

## 8. Output

One row per eligible content item per decision point: a predicted decline probability, a
ranked position, a reason code (from the top contributing features), and a suggested action
(review/monitor) — the same ranked-queue shape as the starter pipeline, now built from the full
warehouse instead of the anonymized sample.

## How to reproduce

```bash
python work/capstone/scripts/build_decision_frame.py --decision-date 2026-01-31 --feature-days 90 --label-days 60 --tag A
python work/capstone/scripts/build_decision_frame.py --decision-date 2026-03-31 --feature-days 90 --label-days 60 --tag B
python work/capstone/scripts/join_and_label.py --tag A --feat-start 2025-11-02
python work/capstone/scripts/join_and_label.py --tag B --feat-start 2025-12-31
```

Requires `HF_TOKEN` in a local `.env` (gitignored) with a Hugging Face **read** token that has
accepted the `FlyRank/internship-warehouse` gate. Caches land in `work/capstone/cache/`
(gitignored — parquet files never enter git).
