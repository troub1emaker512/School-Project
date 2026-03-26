"""
plot_results.py

Generate report-ready plots and summary tables from one or more GA run directories.

Input:
- One or more run directories created by run_ga_baseline.py (each should contain log.csv and config.json)

Output:
- PNG plots (mean ± std across seeds)
- summary.csv (final generation mean/std)
- per_run_final.csv (final-gen values per run, useful for tables in report)

Usage:
    python plot_results.py --run_dirs ../runs/baseline_seed1 ../runs/baseline_seed2 ../runs/baseline_seed3 --out_dir ../plots/baseline
"""

import argparse
import os
import json
import csv
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


def _sniff_delimiter(path):
    with open(path, "r", encoding="utf-8", newline="") as f:
        sample = f.read(2048)
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=[",", ";", "\t"])
        return dialect.delimiter
    except Exception:
        return ","


def load_log(log_path):
    delim = _sniff_delimiter(log_path)
    df = pd.read_csv(log_path, delimiter=delim)
    # ensure numeric columns are numeric
    for c in df.columns:
        if c != "generation":
            df[c] = pd.to_numeric(df[c], errors="coerce")
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce").astype(int)
    return df


def plot_mean_std(df_all, metric, out_path, ylabel):
    """
    df_all must have columns: generation, metric, run_id
    """
    g = df_all.groupby("generation")[metric].agg(["mean", "std"]).fillna(0.0)

    x = g.index.values
    y = g["mean"].values
    s = g["std"].values

    plt.figure()
    plt.plot(x, y)
    plt.fill_between(x, y - s, y + s, alpha=0.2)
    plt.xlabel("Generation")
    plt.ylabel(ylabel)
    plt.title(f"{ylabel} vs Generation")
    plt.tight_layout()
    plt.savefig(out_path, dpi=200)
    plt.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run_dirs", nargs="+", required=True, help="Run directories, each containing log.csv")
    parser.add_argument("--out_dir", type=str, required=True, help="Output directory for plots/tables")
    args = parser.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)

    all_rows = []
    final_rows = []

    for run_id, rd in enumerate(args.run_dirs):
        log_path = os.path.join(rd, "log.csv")
        if not os.path.exists(log_path):
            raise FileNotFoundError(f"Missing log.csv in: {rd}")

        df = load_log(log_path)
        df["run_id"] = run_id
        df["run_dir"] = os.path.basename(rd)

        # Try to read config for nicer labels / seed info
        cfg_path = os.path.join(rd, "config.json")
        seed = None
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                seed = cfg.get("seed", None)
            except Exception:
                seed = None
        df["seed"] = seed

        all_rows.append(df)

        # Final generation row for per-run final table
        final_gen = int(df["generation"].max())
        df_final = df[df["generation"] == final_gen].copy()
        df_final["final_gen"] = final_gen
        final_rows.append(df_final)

    df_all = pd.concat(all_rows, ignore_index=True)
    df_final_all = pd.concat(final_rows, ignore_index=True)

    # Metrics expected from run_ga_baseline.py
    metrics = [
        ("max_fitness", "Best Fitness (max_fitness)", "best_fitness.png"),
        ("best_peak_dist", "Best Peak Distance (lower is better)", "best_peak_dist.png"),
        ("best_max_height", "Best Max Height", "best_max_height.png"),
        ("best_supported_ratio", "Best Supported Ratio (higher is better)", "best_supported_ratio.png"),
        ("best_air_ratio", "Best Air Ratio (lower is better)", "best_air_ratio.png"),
    ]

    for col, ylabel, filename in metrics:
        if col not in df_all.columns:
            continue
        out_path = os.path.join(args.out_dir, filename)
        plot_mean_std(df_all, col, out_path, ylabel)

    # Summary table (mean/std at final generation across runs)
    summary_rows = []
    final_gen = int(df_all["generation"].max())
    df_final = df_all[df_all["generation"] == final_gen]

    for col, _, _ in metrics:
        if col not in df_final.columns:
            continue
        summary_rows.append({
            "metric": col,
            "final_gen": final_gen,
            "mean": float(df_final[col].mean()),
            "std": float(df_final[col].std(ddof=0)),
        })

    summary = pd.DataFrame(summary_rows)
    summary["mean"] = summary["mean"].round(6)
    summary["std"] = summary["std"].round(6)
    summary.to_csv(os.path.join(args.out_dir, "summary.csv"), index=False)

    # Per-run finals (useful to insert into report tables)
    keep_cols = ["run_dir", "seed", "final_gen"] + [m[0] for m in metrics if m[0] in df_final_all.columns]
    per_run = df_final_all[keep_cols].copy()
    for col in per_run.columns:
        if col not in ("run_dir", "seed"):
            per_run[col] = pd.to_numeric(per_run[col], errors="coerce")
    per_run = per_run.round(6)
    per_run.to_csv(os.path.join(args.out_dir, "per_run_final.csv"), index=False)

    print(f"Wrote plots and tables to: {args.out_dir}")


if __name__ == "__main__":
    main()
