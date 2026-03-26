"""
plot_partB_suite.py

Scan a runs directory (created by run_ga_baseline.py) and generate:
- Per-experiment plots (mean ± std across seeds)
- Per-experiment summary.csv and per_run_final.csv
- A master inventory CSV that flags incomplete runs

Usage:
  cd src
  python plot_partB_suite.py --runs_dir ../runs --out_dir ../plots

Expected run dir naming (recommended):
  baseline_seed1, baseline_seed2, ...
  pop10_seed1, pop25_seed1, ...
  mut010_seed1, mut025_seed1, ...
  genes3_seed1, genes6_seed1, ...
  steps2400_seed1, steps4800_seed1, ...
"""

import argparse
import os
import json
import csv
import re
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pandas.errors import EmptyDataError


PATTERN = re.compile(r"^(baseline|pop\d+|mut\d+|genes\d+|steps\d+)_seed\d+$")


def sniff_delimiter(path):
    with open(path, "r", encoding="utf-8", newline="") as f:
        sample = f.read(2048)
    try:
        d = csv.Sniffer().sniff(sample, delimiters=[",", ";", "\t"])
        return d.delimiter
    except Exception:
        return ","


def load_log(log_path):
    delim = sniff_delimiter(log_path)
    try:
        df = pd.read_csv(log_path, delimiter=delim)
    except EmptyDataError:
        return None
    if df is None or df.empty:
        return None
    # Coerce numerics
    if "generation" in df.columns:
        df["generation"] = pd.to_numeric(df["generation"], errors="coerce").astype("Int64")
    for c in df.columns:
        if c != "generation":
            df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def plot_mean_std(df_all, metric, out_path, ylabel):
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


def build_group_plots(run_dirs, out_dir):
    os.makedirs(out_dir, exist_ok=True)

    metrics = [
        ("max_fitness", "Best Fitness (max_fitness)", "best_fitness.png"),
        ("best_peak_dist", "Best Peak Distance (lower is better)", "best_peak_dist.png"),
        ("best_max_height", "Best Max Height", "best_max_height.png"),
        ("best_supported_ratio", "Best Supported Ratio (higher is better)", "best_supported_ratio.png"),
        ("best_air_ratio", "Best Air Ratio (lower is better)", "best_air_ratio.png"),
    ]

    rows = []
    finals = []

    for run_id, rd in enumerate(run_dirs):
        log_path = os.path.join(rd, "log.csv")
        df = load_log(log_path)
        if df is None:
            continue

        df = df.copy()
        df["run_id"] = run_id
        df["run_dir"] = os.path.basename(rd)

        # Seed from config if available
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

        rows.append(df)

        final_gen = int(df["generation"].max())
        df_final = df[df["generation"] == final_gen].copy()
        df_final["final_gen"] = final_gen
        finals.append(df_final)

    if not rows:
        return False

    df_all = pd.concat(rows, ignore_index=True)
    df_final_all = pd.concat(finals, ignore_index=True)

    # Plots
    for col, ylabel, filename in metrics:
        if col not in df_all.columns:
            continue
        plot_mean_std(df_all, col, os.path.join(out_dir, filename), ylabel)

    # Summary at final generation (across runs)
    final_gen = int(df_all["generation"].max())
    df_final = df_all[df_all["generation"] == final_gen]

    summary_rows = []
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
    summary.to_csv(os.path.join(out_dir, "summary.csv"), index=False)

    # Per-run final table
    keep_cols = ["run_dir", "seed", "final_gen"] + [m[0] for m in metrics if m[0] in df_final_all.columns]
    per_run = df_final_all[keep_cols].copy()
    for c in per_run.columns:
        if c not in ("run_dir", "seed"):
            per_run[c] = pd.to_numeric(per_run[c], errors="coerce")
    per_run = per_run.round(6)
    per_run.to_csv(os.path.join(out_dir, "per_run_final.csv"), index=False)

    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--runs_dir", required=True)
    ap.add_argument("--out_dir", required=True)
    ap.add_argument("--min_rows", type=int, default=10, help="Minimum log.csv rows to be considered usable")
    args = ap.parse_args()

    os.makedirs(args.out_dir, exist_ok=True)

    # Inventory all runs
    inventory = []
    groups = {}  # group_name -> list of run dirs

    for name in sorted(os.listdir(args.runs_dir)):
        path = os.path.join(args.runs_dir, name)

        if not os.path.isdir(path):
            # ignore loose CSVs etc.
            inventory.append({"name": name, "type": "file", "usable": False, "reason": "not a run directory"})
            continue

        log_path = os.path.join(path, "log.csv")
        cfg_path = os.path.join(path, "config.json")

        if not os.path.exists(log_path):
            inventory.append({"name": name, "type": "dir", "usable": False, "reason": "missing log.csv"})
            continue

        df = load_log(log_path)
        if df is None:
            inventory.append({"name": name, "type": "dir", "usable": False, "reason": "empty/unreadable log.csv"})
            continue

        rows = int(len(df))
        gen_max = int(df["generation"].max()) if "generation" in df.columns else None
        usable = rows >= args.min_rows

        seed = None
        ts = None
        if os.path.exists(cfg_path):
            try:
                with open(cfg_path, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                seed = cfg.get("seed", None)
                ts = cfg.get("timestamp_local", None)
            except Exception:
                pass

        inventory.append({
            "name": name,
            "type": "dir",
            "usable": usable,
            "rows": rows,
            "gen_max": gen_max,
            "seed": seed,
            "timestamp_local": ts,
            "reason": "" if usable else f"too short (<{args.min_rows} rows)",
        })

        m = PATTERN.match(name)
        if usable and m:
            group = m.group(1)  # baseline/pop10/mut025/etc
            groups.setdefault(group, []).append(path)

    # Write inventory CSV
    inv_df = pd.DataFrame(inventory)
    inv_df.to_csv(os.path.join(args.out_dir, "runs_inventory.csv"), index=False)

    # Build plots per group
    made_any = False
    for group_name, rdirs in groups.items():
        out = os.path.join(args.out_dir, group_name)
        ok = build_group_plots(rdirs, out)
        made_any = made_any or ok

    if not made_any:
        print("No usable run groups found. Check runs_inventory.csv for why runs were skipped.")
    else:
        print(f"Done. Plots + tables written under: {args.out_dir}")


if __name__ == "__main__":
    main()
