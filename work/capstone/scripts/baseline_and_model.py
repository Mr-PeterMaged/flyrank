"""Capstone modeling: transparent baseline vs learned model, on the warehouse-rebuilt
Lane 2 (Refresh/Content Opportunity Scoring) frames.

Train + select on snapshot A only (grouped client-holdout split). Snapshot B is touched
exactly once, at the very end, as the sealed test -- never used for feature engineering,
tuning, or model selection.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

REPO_ROOT = Path(__file__).resolve().parents[3]
CACHE = REPO_ROOT / "work" / "capstone" / "cache"
OUT = REPO_ROOT / "work" / "outputs"
FIG = REPO_ROOT / "work" / "figures"
SEED = 42

NUMERIC_FEATURES = [
    "feat_impressions", "feat_clicks", "feat_sessions", "feat_engaged_sessions",
    "feat_engagement_sec", "feat_sessions_ai", "feat_scroll_events",
    "feat_avg_position", "feat_days_gsc", "feat_days_ga4",
    "ctr", "engagement_rate", "momentum_ratio", "age_days",
    "word_count", "backlinks", "search_volume", "competition",
]
CATEGORICAL_FEATURES = ["content_type", "main_intent", "competition_level"]
HAS_FLAGS = ["has_word_count", "has_backlinks", "has_search_volume", "has_position", "has_age"]


def engineer(df: pd.DataFrame, decision_date: str) -> pd.DataFrame:
    df = df.copy()
    d0 = pd.Timestamp(decision_date)

    # clients with has_ga4_access=False have NULL (not zero) GA4 sums -- feat_days_ga4==0
    # is already the honest "no GA4 data" flag, so these are safe to zero-fill here.
    ga4_cols = ["feat_sessions", "feat_engaged_sessions", "feat_engagement_sec",
                "feat_sessions_ai", "feat_scroll_events"]
    df[ga4_cols] = df[ga4_cols].fillna(0)

    df["ctr"] = np.where(df["feat_impressions"] > 0, df["feat_clicks"] / df["feat_impressions"], 0.0)
    df["engagement_rate"] = np.where(
        df["feat_sessions"] > 0, df["feat_engaged_sessions"] / df["feat_sessions"], 0.0
    )

    early_rate = df["feat_clicks_early_half"] / df["feat_days_early_half"].replace(0, np.nan)
    recent_rate = df["feat_clicks_recent_half"] / df["feat_days_recent_half"].replace(0, np.nan)
    # momentum_ratio > 1 = accelerating, < 1 = internally decelerating already, inside the
    # feature window only -- never touches the label window.
    df["momentum_ratio"] = (recent_rate / early_rate.replace(0, np.nan)).fillna(1.0).clip(0, 5)

    age_days = (d0 - pd.to_datetime(df["content_created_date"])).dt.days
    df["has_age"] = age_days.notna().astype(int)
    df["age_days"] = age_days.clip(lower=0).fillna(age_days.median())

    df["has_position"] = df["feat_avg_position"].notna().astype(int)
    # no GSC position data for this window -> treat as effectively invisible, not rank 0
    df["feat_avg_position"] = df["feat_avg_position"].fillna(100.0)

    for col, flag in [("word_count", "has_word_count"), ("backlinks", "has_backlinks"),
                       ("search_volume", "has_search_volume")]:
        df[flag] = df[col].notna().astype(int)
        df[col] = df[col].fillna(0)

    df["competition"] = df["competition"].fillna(df["competition"].median())
    for col in CATEGORICAL_FEATURES:
        df[col] = df[col].fillna("unknown").astype("category")

    return df


def baseline_score(df: pd.DataFrame) -> pd.Series:
    """Transparent rule: rank by internal within-window momentum decline, gated by
    real demand -- no model, no fitting, fully explainable. This is the 'declining
    with demand' idea from the lane guide, computed honestly from feature-window-only
    signal (never the label window)."""
    demand_ok = df["feat_impressions"] >= 50
    decline_signal = (1.0 - df["momentum_ratio"]).clip(lower=0)
    score = np.where(demand_ok, decline_signal * np.log1p(df["feat_impressions"]), 0.0)
    return pd.Series(score, index=df.index)


def precision_at_k(y_true, score, k=50):
    order = np.argsort(-score)
    top_k = order[:k]
    return y_true.iloc[top_k].mean() if hasattr(y_true, "iloc") else y_true[top_k].mean()


def build_design_matrix(df: pd.DataFrame, scaler: StandardScaler | None = None, fit_scaler: bool = False):
    num_cols = NUMERIC_FEATURES + HAS_FLAGS
    X_num = df[num_cols].astype(float)
    if scaler is not None:
        values = scaler.fit_transform(X_num) if fit_scaler else scaler.transform(X_num)
        X_num = pd.DataFrame(values, columns=num_cols, index=df.index)
    X_cat = pd.get_dummies(df[CATEGORICAL_FEATURES], dummy_na=False)
    return pd.concat([X_num, X_cat], axis=1)


def main():
    a = pd.read_parquet(CACHE / "contract_frame_A.parquet")
    b = pd.read_parquet(CACHE / "contract_frame_B.parquet")

    a = engineer(a, "2026-01-31")
    b = engineer(b, "2026-03-31")

    a_lab = a.dropna(subset=["is_declining_v2"]).reset_index(drop=True)
    b_lab = b.dropna(subset=["is_declining_v2"]).reset_index(drop=True)

    print(f"A labeled rows: {len(a_lab)} | B labeled rows: {len(b_lab)}")
    print(f"A base rate: {a_lab['is_declining_v2'].mean():.3f} | B base rate: {b_lab['is_declining_v2'].mean():.3f}")

    # grouped client-holdout split within A only
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=SEED)
    train_idx, holdout_idx = next(gss.split(a_lab, groups=a_lab["client_hash_id"]))
    a_train, a_holdout = a_lab.iloc[train_idx], a_lab.iloc[holdout_idx]
    assert set(a_train["client_hash_id"]) & set(a_holdout["client_hash_id"]) == set(), "client leakage in split"
    print(f"A train: {len(a_train)} rows / {a_train['client_hash_id'].nunique()} clients | "
          f"A holdout: {len(a_holdout)} rows / {a_holdout['client_hash_id'].nunique()} clients")

    scaler = StandardScaler()
    X_train_design = build_design_matrix(a_train, scaler=scaler, fit_scaler=True)
    X_holdout_design = build_design_matrix(a_holdout, scaler=scaler).reindex(columns=X_train_design.columns, fill_value=0)

    nan_cols = X_train_design.columns[X_train_design.isna().any()].tolist()
    if nan_cols:
        print("NaN found in design matrix columns:", nan_cols)
        for c in nan_cols:
            print(f"  {c}: {X_train_design[c].isna().sum()} NaNs")
    y_train = a_train["is_declining_v2"].astype(int)
    y_holdout = a_holdout["is_declining_v2"].astype(int)

    results = {}

    # baseline, on A holdout
    base_score_holdout = baseline_score(a_holdout)
    results["baseline_A_holdout"] = {
        "precision_at_50": float(precision_at_k(y_holdout, base_score_holdout.values, 50)),
        "average_precision": float(average_precision_score(y_holdout, base_score_holdout)),
        "base_rate": float(y_holdout.mean()),
    }

    models = {
        "logistic_regression": LogisticRegression(max_iter=1000, class_weight="balanced", random_state=SEED),
        "decision_tree": DecisionTreeClassifier(max_depth=6, min_samples_leaf=50, random_state=SEED),
        "random_forest": RandomForestClassifier(
            n_estimators=300, max_depth=10, min_samples_leaf=20, random_state=SEED, n_jobs=-1
        ),
    }

    fitted = {}
    for name, model in models.items():
        model.fit(X_train_design, y_train)
        fitted[name] = model
        proba = model.predict_proba(X_holdout_design)[:, 1]
        results[f"{name}_A_holdout"] = {
            "precision_at_50": float(precision_at_k(y_holdout, proba, 50)),
            "average_precision": float(average_precision_score(y_holdout, proba)),
            "roc_auc": float(roc_auc_score(y_holdout, proba)),
        }
        print(f"[A holdout] {name}: P@50={results[f'{name}_A_holdout']['precision_at_50']:.3f} "
              f"AP={results[f'{name}_A_holdout']['average_precision']:.3f}")

    print(f"[A holdout] baseline: P@50={results['baseline_A_holdout']['precision_at_50']:.3f} "
          f"AP={results['baseline_A_holdout']['average_precision']:.3f} "
          f"base_rate={results['baseline_A_holdout']['base_rate']:.3f}")

    best_name = max(
        ("logistic_regression", "decision_tree", "random_forest"),
        key=lambda n: results[f"{n}_A_holdout"]["average_precision"],
    )
    print(f"Best model on A holdout by average precision: {best_name}")

    # ---- SEALED TEST: touch B exactly once, with the model already finalized ----
    X_b_design = build_design_matrix(b_lab, scaler=scaler).reindex(columns=X_train_design.columns, fill_value=0)
    y_b = b_lab["is_declining_v2"].astype(int)

    base_score_b = baseline_score(b_lab)
    results["baseline_B_sealed"] = {
        "precision_at_50": float(precision_at_k(y_b, base_score_b.values, 50)),
        "average_precision": float(average_precision_score(y_b, base_score_b)),
        "base_rate": float(y_b.mean()),
    }

    best_model = fitted[best_name]
    proba_b = best_model.predict_proba(X_b_design)[:, 1]
    results[f"{best_name}_B_sealed"] = {
        "precision_at_50": float(precision_at_k(y_b, proba_b, 50)),
        "average_precision": float(average_precision_score(y_b, proba_b)),
        "roc_auc": float(roc_auc_score(y_b, proba_b)),
    }
    print(f"[B SEALED] baseline: P@50={results['baseline_B_sealed']['precision_at_50']:.3f} "
          f"AP={results['baseline_B_sealed']['average_precision']:.3f} base_rate={results['baseline_B_sealed']['base_rate']:.3f}")
    print(f"[B SEALED] {best_name}: P@50={results[f'{best_name}_B_sealed']['precision_at_50']:.3f} "
          f"AP={results[f'{best_name}_B_sealed']['average_precision']:.3f}")

    results["best_model"] = best_name
    results["numeric_features"] = NUMERIC_FEATURES
    results["categorical_features"] = CATEGORICAL_FEATURES
    results["seed"] = SEED

    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / "capstone_warehouse_model_results.json", "w") as f:
        json.dump(results, f, indent=2)
    print(f"Saved metrics -> {OUT / 'capstone_warehouse_model_results.json'}")

    # feature importances (best model, if tree-based) for the interpretation section
    if best_name in ("decision_tree", "random_forest"):
        importances = pd.Series(best_model.feature_importances_, index=X_train_design.columns)
        top15 = importances.sort_values(ascending=False).head(15)
        top15.to_json(OUT / "capstone_warehouse_feature_importance.json", indent=2)
        print("Top features:\n", top15)

    # ranked B queue with reason codes, for the recommendations section (cached locally, gitignored)
    b_ranked = b_lab.copy()
    b_ranked["model_score"] = proba_b
    b_ranked["baseline_score"] = base_score_b.values
    b_ranked = b_ranked.sort_values("model_score", ascending=False).reset_index(drop=True)

    def reason_code(row):
        reasons = []
        if row["momentum_ratio"] < 0.7:
            reasons.append("internal momentum already declining")
        if row["feat_impressions"] >= 200:
            reasons.append("high demand (impressions)")
        if row["ctr"] < 0.01:
            reasons.append("low CTR for its demand")
        if row["feat_avg_position"] is not None and row["feat_avg_position"] <= 10:
            reasons.append("page-one visibility at risk")
        return "; ".join(reasons) if reasons else "model signal without a single dominant rule"

    b_ranked["reason_code"] = b_ranked.apply(reason_code, axis=1)
    cache_cols = ["client_hash_id", "content_hash_id", "model_score", "baseline_score",
                  "is_declining_v2", "reason_code", "feat_impressions", "momentum_ratio", "ctr"]
    b_ranked[cache_cols].to_parquet(CACHE / "ranked_queue_B.parquet")
    print(f"Ranked B queue cached -> {CACHE / 'ranked_queue_B.parquet'}")

    print("\nTop 10 of the ranked sealed-test queue (pseudonymous IDs only):")
    print(b_ranked[cache_cols].head(10).to_string(index=False))


if __name__ == "__main__":
    main()
