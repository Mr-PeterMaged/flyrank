# Capstone Report — Refresh / Content Opportunity Scoring (Lane 2, full-warehouse rebuild)

- **Author:** Peter Maged
- **Lane:** Lane 2 — Refresh / Content Opportunity Scoring (rebuilt from the full Hugging Face
  warehouse release, not the starter CSV)
- **Repo:** https://github.com/Mr-PeterMaged/flyrank
- **Date:** 2026-09-14

## 0. Abstract

Which pages in a client's content inventory should a reviewer with limited time look at first?
Using FlyRank's full pseudonymized warehouse release (78.8M daily rows across 519,606 content
items), I built two independent time snapshots directly from the raw daily search/engagement
facts — never from a precomputed decision field — and defined "declining" as a ≥20% drop in
daily click rate over the following 60 days. A random forest trained on the first snapshot and
sealed-tested once on a second, later snapshot lifted precision@50 from 0.48→0.70 (dev holdout)
and 0.68→0.96 (sealed test), both clear of their respective base rates (0.35 and 0.61). The
output is a ranked review queue with plain-language reason codes, meant to shorten a manual
audit, not to replace editorial judgment.

## 1. Problem framing

**Decision supported:** which content items a human reviewer should look at first for refresh,
metadata, or engagement work, given limited review capacity.

**Unit of analysis:** one content item (`content_hash_id`), scoped to one client
(`client_hash_id`), evaluated at a specific decision date.

**Output:** a ranked list — decline probability, rank position, a reason code, an action
suggestion (review / monitor).

**Action a human takes:** an editor pulls the top-N ranked pages into this sprint's refresh
queue instead of reviewing the inventory in an arbitrary order.

**Cost of a wrong call:** a false positive costs a reviewer's time on a page that wasn't
actually declining; a false negative lets a real decline go unnoticed until it's worse. Neither
is catastrophic, which is why this is framed as **decision support**, not an automated action.

**Why ML helps:** with hundreds of thousands of content items and a handful of reviewer-hours per
week, an ordering problem this size needs a ranking signal — a rule can express one or two
ideas; a model can weigh a dozen at once and be checked against a transparent baseline.

## 2. Data safety

**Source:** `FlyRank/internship-warehouse` (Hugging Face, gated, build
`flyrank_pseudonymized_warehouse_release_v20260703`) — `dim_clients`, `dim_content`, and
`fact_content_daily_performance` (2025-01-27 → 2026-06-30). The starter CSV was **not** used for
the final result; the full data contract and every verification query are in
[`work/capstone/data_contract.md`](capstone/data_contract.md).

**Excluded on purpose:**
- `last_optimized_date` / `optimization_eligible_date` — reflect a past editorial *decision*,
  not an observed outcome; including them risks learning what the product already decided to fix.
- `fact_content_query_90d` (the entire table) — its window is fixed
  (`window_start = 2026-04-02`, confirmed by query — a single distinct value across the whole
  table) and sits inside or after both of my label windows, so there's no safe way to use it as
  a pre-decision feature without leaking label-period query mix.
- FlyRank's own decision flags/scores (`health_score`, `priority_score`, `action_type`,
  `needs_ctr_fix`) — not shipped in this release at all, by design.

**Leakage risk considered most carefully:** the label (`is_declining_v2`) is computed only from
rows dated *after* the decision date; every feature is computed only from rows dated *on or
before* it. This was checked mechanically, not just asserted — see §4.

No client names, domains, URLs, titles, or raw queries appear anywhere in this repo. All IDs are
pseudonyms used for joining/grouping/splitting only.

## 3. Baseline

A transparent rule, using only feature-window signal (nothing from the label window):

```
demand_ok       = feat_impressions >= 50
decline_signal  = max(0, 1 − momentum_ratio)          # momentum_ratio = recent-45d / early-45d click rate, inside the SAME feature window
baseline_score  = decline_signal × log(1 + feat_impressions)   if demand_ok else 0
```

This is "declining with demand" from the lane guide, made concrete: it ranks pages whose click
rate was *already* falling inside the trailing 90-day window, weighted by how much real traffic
they carry — fully explainable to a non-technical reviewer in one sentence, and built from
exactly the same feature-window data the model gets, so the comparison is fair.

**Baseline numbers** (same split, same metric as the model — see §5): precision@50 = 0.48 on the
A holdout (base rate 0.35) and 0.68 on the B sealed test (base rate 0.61).

## 4. Model / analysis

**Method:** random forest (300 trees, max depth 10, min 20 samples/leaf), chosen over logistic
regression and a single decision tree by average precision on the A holdout — all three beat
the baseline; the forest generalized best.

**Label (proxy), one sentence:** a content item "declines" if its daily GSC click rate drops
≥20% from the trailing 90-day average to the following 60-day average, computed fresh at each
decision point from raw daily facts (never a reused `trend_direction`-style field).

**Feature list actually used** (17 numeric + 3 categorical, one-hot):
`feat_impressions, feat_clicks, feat_sessions, feat_engaged_sessions, feat_engagement_sec,
feat_sessions_ai, feat_scroll_events, feat_avg_position, feat_days_gsc, feat_days_ga4, ctr,
engagement_rate, momentum_ratio, age_days, word_count, backlinks, search_volume, competition`
+ `has_word_count, has_backlinks, has_search_volume, has_position, has_age` (missingness flags,
never blind-filled) + one-hot `content_type, main_intent, competition_level`.

**Left out on purpose:** `client_hash_id` / `content_hash_id` (grouping only), anything from the
label window, anything from `fact_content_query_90d` (§2), and FlyRank's own decision flags
(not present in this release anyway).

## 5. Evaluation

**Split:** two layers, both time- or group-aware, never a plain random row split:
1. **A (dev):** grouped 80/20 client holdout (no client's content in both halves) — used for
   model selection only.
2. **B (sealed test):** an entirely separate, later decision snapshot (2026-03-31 vs. A's
   2026-01-31), touched exactly once, after the model trained on A was finalized. This tests
   whether the signal survives into a later period, not just onto unseen clients.

| | Baseline P@50 | Model P@50 | Base rate | Baseline AP | Model AP |
|---|---:|---:|---:|---:|---:|
| A holdout (dev) | 0.48 | **0.70** | 0.35 | 0.43 | 0.60 |
| B sealed test | 0.68 | **0.96** | 0.61 | 0.64 | 0.66 |

*(base rate = majority-class share — the honest floor any score has to clear; see
`work/figures/capstone_precision_at_50_comparison.png`.)*

**Reading the base rate honestly:** on B, the baseline's raw 0.68 looks decent until you notice
the base rate there is 0.61 — the rule is barely above chance. The model's 0.96 is a real,
large lift over that same 0.61 floor. This is exactly why the report template asks for base
rate next to precision@K: the number alone would have overstated the baseline.

**Error look:** most of the holdout's false positives are pages with a genuinely falling
momentum ratio that recovered anyway inside the 60-day label window — i.e., the model (and the
baseline) both correctly read the trailing signal; the miss is about the future being
genuinely uncertain, not a modeling bug.

## 6. Interpretation

Top feature importances (random forest): `momentum_ratio` (0.18) dominates — the within-window
trend is the single strongest signal — followed by `word_count` (0.13), `age_days` (0.11), and
`feat_impressions` (0.10). Coverage flags (`feat_days_gsc`, `feat_days_ga4`) rank ahead of most
raw engagement counts, meaning *how much history a page actually had* matters almost as much as
what happened in it (see `work/figures/capstone_feature_importance.png`).

**Surprise / negative result worth stating plainly:** the decline base rate nearly doubled
between the two snapshots (35% → 61%, two months apart). That's a real, unexplained shift in
the panel, not a bug — the grain and eligibility checks pass cleanly on both (§2 of the data
contract). I'm not claiming to know why; flagging it is the honest move, and it's the reason the
sealed-test comparison is read against B's own base rate rather than A's.

## 7. Recommendation

Pull the model's ranked top-N per client each cycle into the refresh queue, using the reason
code to brief the reviewer in one line — e.g. *"internal momentum already declining; high
demand (impressions); low CTR for its demand; page-one visibility at risk"* is a concrete,
explainable brief, not a black-box score. Given the observed lift, I'd trust the top ~50 per
client as strong candidates for a first pass, with lower-ranked items treated as monitor-only.
**Confidence:** directional and decision-support — this ranks *risk of decline*, it does not
promise a refresh will fix it, and it says nothing about *why* Google's ranking moved.

**Limits:** built on ~55 eligible clients (of 104) with sufficient GSC history and access;
results may not transfer to clients with thin tracking history. The 60-day label window is a
design choice — a shorter or longer window could rank differently.

## 8. Reproducibility

```bash
# requires HF_TOKEN in a local .env (gitignored) with warehouse gate access
python work/capstone/scripts/build_decision_frame.py --decision-date 2026-01-31 --feature-days 90 --label-days 60 --tag A
python work/capstone/scripts/build_decision_frame.py --decision-date 2026-03-31 --feature-days 90 --label-days 60 --tag B
python work/capstone/scripts/join_and_label.py --tag A --feat-start 2025-11-02
python work/capstone/scripts/join_and_label.py --tag B --feat-start 2025-12-31
python work/capstone/scripts/baseline_and_model.py
python work/capstone/scripts/make_figures.py
```

Seed: `42` everywhere (client split + random forest). Environment: `requirements.txt` plus
`duckdb`, `huggingface_hub`, `pyarrow` (all pinned versions recorded via `pip freeze` at
submission time). The sealed-test evaluation is checkable, not just claimed: the exact script
that builds the B frame (`build_decision_frame.py --tag B`) and the metrics file it produced
(`work/outputs/capstone_warehouse_model_results.json`) are both committed.

## 9. Acknowledgments & data credit

Built on the FlyRank ML Internship dataset — https://flyrank.ai

---

> **Claims checklist:** observed / measured / directional / decision-support language used
> throughout · base rate reported next to every precision@K · no causal claims · no "predicted
> Google's algorithm" · no client-identifying details anywhere · numbers above match a fresh
> re-run of the commands in §8.
