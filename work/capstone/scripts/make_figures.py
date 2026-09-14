"""Capstone figures: baseline-vs-model precision@50 (with base rate marked) and
feature importances. Palette: validated categorical slots 1 (blue) / 2 (orange)
from the dataviz skill's reference palette -- a pre-validated adjacent pair."""
import json
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[3]
OUT = REPO_ROOT / "work" / "outputs"
FIG = REPO_ROOT / "work" / "figures"
FIG.mkdir(parents=True, exist_ok=True)

BLUE = "#2a78d6"    # baseline
ORANGE = "#eb6834"  # model
INK = "#0b0b0b"
MUTED = "#52514e"


def precision_chart():
    results = json.load(open(OUT / "capstone_warehouse_model_results.json"))
    best = results["best_model"]

    groups = ["A holdout\n(dev)", "B sealed test\n(never touched during dev)"]
    baseline_p50 = [results["baseline_A_holdout"]["precision_at_50"], results["baseline_B_sealed"]["precision_at_50"]]
    model_p50 = [results[f"{best}_A_holdout"]["precision_at_50"], results[f"{best}_B_sealed"]["precision_at_50"]]
    base_rates = [results["baseline_A_holdout"]["base_rate"], results["baseline_B_sealed"]["base_rate"]]

    fig, ax = plt.subplots(figsize=(7, 4.5))
    x = range(len(groups))
    w = 0.32
    ax.bar([i - w / 2 for i in x], baseline_p50, width=w, color=BLUE, label="Rule baseline")
    ax.bar([i + w / 2 for i in x], model_p50, width=w, color=ORANGE, label=f"Model ({best.replace('_', ' ')})")

    for i, br in enumerate(base_rates):
        ax.hlines(br, i - w, i + w, colors=MUTED, linestyles="dashed", linewidth=1.5)
        ax.text(i + w * 1.05, br, f"base rate {br:.2f}", va="center", ha="left", fontsize=8, color=MUTED)

    for i, v in enumerate(baseline_p50):
        ax.text(i - w / 2, v + 0.02, f"{v:.2f}", ha="center", fontsize=9, color=INK)
    for i, v in enumerate(model_p50):
        ax.text(i + w / 2, v + 0.02, f"{v:.2f}", ha="center", fontsize=9, color=INK)

    ax.set_xticks(list(x))
    ax.set_xticklabels(groups)
    ax.set_ylabel("Precision@50")
    ax.set_ylim(0, 1.08)
    ax.set_title("Model vs. rule baseline: precision@50, shown against the base rate")
    ax.legend(loc="lower right", frameon=False)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    out_path = FIG / "capstone_precision_at_50_comparison.png"
    fig.savefig(out_path, dpi=150)
    print(f"saved {out_path}")


def feature_importance_chart():
    imp = pd.read_json(OUT / "capstone_warehouse_feature_importance.json", typ="series").sort_values()
    fig, ax = plt.subplots(figsize=(6.5, 5))
    ax.barh(imp.index, imp.values, color=BLUE)
    ax.set_xlabel("Feature importance (random forest, sealed-test model)")
    ax.set_title("What the model actually used")
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    out_path = FIG / "capstone_feature_importance.png"
    fig.savefig(out_path, dpi=150)
    print(f"saved {out_path}")


if __name__ == "__main__":
    precision_chart()
    feature_importance_chart()
