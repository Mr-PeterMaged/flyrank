"""Build one decision-point frame from the warehouse: aggregate a trailing
feature window and a forward label window per (client, content), then join
dim_content + dim_clients context. Caches the result locally as parquet
(gitignored) under work/capstone/cache/.

Never edit scripts/ — this is a capstone-only, warehouse-only path, kept
separate from the starter-CSV pipeline.
"""
import argparse
import os
import re
import time
from pathlib import Path

import duckdb

REPO_ROOT = Path(__file__).resolve().parents[3]
BASE = "hf://datasets/FlyRank/internship-warehouse"


def month_files(start_month: str, end_month: str) -> list[str]:
    """List of explicit monthly parquet paths from start_month..end_month inclusive (YYYY-MM)."""
    y0, m0 = map(int, start_month.split("-"))
    y1, m1 = map(int, end_month.split("-"))
    months = []
    y, m = y0, m0
    while (y, m) <= (y1, m1):
        months.append(f"{y:04d}-{m:02d}")
        m += 1
        if m == 13:
            m, y = 1, y + 1
    return [f"{BASE}/fact_content_daily_performance/month={mo}/data_0.parquet" for mo in months]


def get_con() -> duckdb.DuckDBPyConnection:
    token = os.environ.get("HF_TOKEN")
    if not token:
        env_path = REPO_ROOT / ".env"
        if env_path.exists():
            token = re.search(r"HF_TOKEN=(\S+)", env_path.read_text()).group(1)
    if not token:
        raise RuntimeError(
            "No HF_TOKEN found. Set it as an env var (Colab: getpass + os.environ), "
            "or put HF_TOKEN=... in a local .env (gitignored) -- never hardcode it in a cell."
        )
    con = duckdb.connect()
    con.execute(f"CREATE OR REPLACE SECRET hf (TYPE huggingface, TOKEN '{token}')")
    return con


def build(decision_date: str, feature_days: int, label_days: int, tag: str, min_feature_impressions: int = 50):
    """decision_date: the cutoff 'today'. Feature window = (decision_date - feature_days, decision_date].
    Label window = (decision_date, decision_date + label_days]."""
    con = get_con()

    from datetime import date, timedelta

    d0 = date.fromisoformat(decision_date)
    feat_start = d0 - timedelta(days=feature_days)
    label_end = d0 + timedelta(days=label_days)

    def months_between(a, b):
        out = []
        y, m = a.year, a.month
        while (y, m) <= (b.year, b.month):
            out.append(f"{y:04d}-{m:02d}")
            m += 1
            if m == 13:
                m, y = 1, y + 1
        return out

    # exclusive '>' boundaries mean the day right at feat_start/d0 contributes nothing,
    # so start each range one day in to avoid pulling a whole extra month for zero rows.
    feat_month_list = months_between(feat_start + timedelta(days=1), d0)
    label_month_list = months_between(d0 + timedelta(days=1), label_end)

    feat_paths = [f"{BASE}/fact_content_daily_performance/month={mo}/data_0.parquet" for mo in feat_month_list]
    label_paths = [f"{BASE}/fact_content_daily_performance/month={mo}/data_0.parquet" for mo in label_month_list]

    feat_union = " UNION ALL ".join(f"SELECT * FROM read_parquet('{p}')" for p in feat_paths)
    label_union = " UNION ALL ".join(f"SELECT * FROM read_parquet('{p}')" for p in label_paths)
    feat_mid = feat_start + (d0 - feat_start) / 2

    t0 = time.time()
    query = f"""
    WITH feat_raw AS ({feat_union}),
    feat AS (
        SELECT
            client_hash_id, content_hash_id,
            SUM(gsc_impressions) AS feat_impressions,
            SUM(gsc_clicks) AS feat_clicks,
            SUM(CASE WHEN gsc_avg_position > 0 THEN gsc_sum_position ELSE 0 END) AS feat_sum_position_weighted,
            SUM(CASE WHEN gsc_avg_position > 0 THEN gsc_impressions ELSE 0 END) AS feat_position_impr_base,
            SUM(ga4_sessions) AS feat_sessions,
            SUM(ga4_engaged_sessions) AS feat_engaged_sessions,
            SUM(ga4_total_engagement_sec) AS feat_engagement_sec,
            SUM(sessions_ai) AS feat_sessions_ai,
            SUM(scroll_events) AS feat_scroll_events,
            SUM(CASE WHEN gsc_data_available THEN 1 ELSE 0 END) AS feat_days_gsc,
            SUM(CASE WHEN ga4_data_available THEN 1 ELSE 0 END) AS feat_days_ga4,
            COUNT(*) AS feat_days_total,
            -- internal momentum: split the feature window itself in half so the baseline
            -- and the model can see a within-window trend without touching the label window
            SUM(CASE WHEN report_date > DATE '{feat_mid}' THEN gsc_clicks ELSE 0 END) AS feat_clicks_recent_half,
            SUM(CASE WHEN report_date <= DATE '{feat_mid}' THEN gsc_clicks ELSE 0 END) AS feat_clicks_early_half,
            SUM(CASE WHEN report_date > DATE '{feat_mid}' THEN gsc_impressions ELSE 0 END) AS feat_impressions_recent_half,
            SUM(CASE WHEN report_date > DATE '{feat_mid}' THEN 1 ELSE 0 END) AS feat_days_recent_half,
            SUM(CASE WHEN report_date <= DATE '{feat_mid}' THEN 1 ELSE 0 END) AS feat_days_early_half
        FROM feat_raw
        WHERE report_date > DATE '{feat_start}' AND report_date <= DATE '{d0}'
        GROUP BY 1, 2
    ),
    label_raw AS ({label_union}),
    label AS (
        SELECT
            client_hash_id, content_hash_id,
            SUM(gsc_impressions) AS label_impressions,
            SUM(gsc_clicks) AS label_clicks,
            SUM(ga4_sessions) AS label_sessions
        FROM label_raw
        WHERE report_date > DATE '{d0}' AND report_date <= DATE '{label_end}'
        GROUP BY 1, 2
    )
    SELECT
        f.client_hash_id, f.content_hash_id,
        f.feat_impressions, f.feat_clicks, f.feat_sessions, f.feat_engaged_sessions,
        f.feat_engagement_sec, f.feat_sessions_ai, f.feat_scroll_events,
        f.feat_days_gsc, f.feat_days_ga4, f.feat_days_total,
        f.feat_clicks_recent_half, f.feat_clicks_early_half,
        f.feat_impressions_recent_half, f.feat_days_recent_half, f.feat_days_early_half,
        CASE WHEN f.feat_position_impr_base > 0
             THEN f.feat_sum_position_weighted / f.feat_position_impr_base ELSE NULL END AS feat_avg_position,
        COALESCE(l.label_impressions, 0) AS label_impressions,
        COALESCE(l.label_clicks, 0) AS label_clicks,
        COALESCE(l.label_sessions, 0) AS label_sessions
    FROM feat f
    LEFT JOIN label l USING (client_hash_id, content_hash_id)
    WHERE f.feat_impressions >= {min_feature_impressions}
    """
    df = con.sql(query).df()
    elapsed = time.time() - t0
    print(f"[{tag}] decision_date={decision_date} feat_window=({feat_start},{d0}] "
          f"label_window=({d0},{label_end}] rows={len(df)} elapsed={elapsed:.1f}s "
          f"feat_months={feat_month_list} label_months={label_month_list}")

    cache_dir = REPO_ROOT / "work" / "capstone" / "cache"
    cache_dir.mkdir(parents=True, exist_ok=True)
    out_path = cache_dir / f"decision_frame_{tag}.parquet"
    df.to_parquet(out_path)
    print(f"[{tag}] cached -> {out_path} ({out_path.stat().st_size / 1e6:.1f} MB)")
    return df


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--decision-date", required=True)
    ap.add_argument("--feature-days", type=int, default=90)
    ap.add_argument("--label-days", type=int, default=60)
    ap.add_argument("--tag", required=True)
    ap.add_argument("--min-feature-impressions", type=int, default=50)
    args = ap.parse_args()
    build(args.decision_date, args.feature_days, args.label_days, args.tag, args.min_feature_impressions)
