"""Join a cached decision-frame (from build_decision_frame.py) with dim_content
and dim_clients, apply the client-eligibility filter, compute the forward-looking
decline label, and print the data-contract verification checks (grain, counts,
missingness, label balance) required before this frame is trusted for anything.
"""
import argparse
import os
import re
from pathlib import Path

import duckdb

REPO_ROOT = Path(__file__).resolve().parents[3]
BASE = "hf://datasets/FlyRank/internship-warehouse"


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


def run(tag: str, feat_start: str, decline_threshold: float = -0.20):
    con = get_con()
    cache_path = REPO_ROOT / "work" / "capstone" / "cache" / f"decision_frame_{tag}.parquet"

    query = f"""
    WITH raw AS (SELECT * FROM read_parquet('{cache_path.as_posix()}')),
    clients AS (
        SELECT client_hash_id, is_active, has_gsc_access, gsc_data_start
        FROM read_parquet('{BASE}/dim_clients.parquet')
        WHERE is_active = TRUE AND has_gsc_access = TRUE AND gsc_data_start <= DATE '{feat_start}'
    ),
    content AS (
        SELECT content_hash_id, client_hash_id, content_type, main_intent,
               word_count, backlinks, search_volume, competition, competition_level,
               content_created_date, last_optimized_date, is_published, is_deleted
        FROM read_parquet('{BASE}/dim_content.parquet')
    ),
    joined AS (
        SELECT r.*, c.content_type, c.main_intent, c.word_count, c.backlinks,
               c.search_volume, c.competition, c.competition_level,
               c.content_created_date, c.last_optimized_date, c.is_published, c.is_deleted
        FROM raw r
        JOIN clients cl ON cl.client_hash_id = r.client_hash_id
        JOIN content c ON c.content_hash_id = r.content_hash_id AND c.client_hash_id = r.client_hash_id
        WHERE c.is_published = TRUE AND c.is_deleted = FALSE
    )
    SELECT *,
        (feat_clicks::DOUBLE / GREATEST(feat_days_total, 1)) AS feat_clicks_per_day,
        (label_clicks::DOUBLE / GREATEST(60, 1)) AS label_clicks_per_day,
        CASE WHEN feat_clicks > 0
             THEN (label_clicks::DOUBLE / GREATEST(60,1)) / (feat_clicks::DOUBLE / GREATEST(feat_days_total,1)) - 1
             ELSE NULL END AS click_rate_change,
        CASE
            WHEN feat_clicks > 0 AND
                 ((label_clicks::DOUBLE / GREATEST(60,1)) / (feat_clicks::DOUBLE / GREATEST(feat_days_total,1)) - 1) <= {decline_threshold}
            THEN 1
            WHEN feat_clicks = 0 THEN NULL
            ELSE 0
        END AS is_declining_v2
    FROM joined
    """
    df = con.sql(query).df()

    print(f"=== [{tag}] rows after client+content eligibility join: {len(df)} ===")

    # grain check
    dupe = con.sql(f"""
        SELECT client_hash_id, content_hash_id, COUNT(*) c
        FROM ({query}) GROUP BY 1,2 HAVING c > 1 LIMIT 5
    """).df()
    print(f"[{tag}] grain probe (want 0 rows):\n", dupe)

    # label balance / base rate
    n_labeled = df["is_declining_v2"].notna().sum()
    n_pos = (df["is_declining_v2"] == 1).sum()
    print(f"[{tag}] labeled rows (feat_clicks>0): {n_labeled} / {len(df)} "
          f"({100*n_labeled/len(df):.1f}%)")
    if n_labeled:
        print(f"[{tag}] base rate of is_declining_v2==1: {100*n_pos/n_labeled:.1f}%")

    # missingness on key context fields
    for col in ["content_type", "main_intent", "word_count", "backlinks", "search_volume"]:
        miss = df[col].isna().mean() * 100
        print(f"[{tag}] missing {col}: {miss:.1f}%")

    out_path = REPO_ROOT / "work" / "capstone" / "cache" / f"contract_frame_{tag}.parquet"
    df.to_parquet(out_path)
    print(f"[{tag}] cached -> {out_path} ({out_path.stat().st_size/1e6:.1f} MB)")
    return df


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--tag", required=True)
    ap.add_argument("--feat-start", required=True, help="feature window start date (YYYY-MM-DD) for the gsc_data_start filter")
    ap.add_argument("--decline-threshold", type=float, default=-0.20)
    args = ap.parse_args()
    run(args.tag, args.feat_start, args.decline_threshold)
