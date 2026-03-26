"""
run_ga_baseline.py

Part B GA runner.

Why this version:
- Adds progress printing so runs do not look like they "hang" during PyBullet evaluation.
- Writes a clean log.csv and config.json into a run folder (helps report + video provenance).
- Flushes the log each generation so you do not lose results if interrupted.
"""

import argparse
import csv
import json
import os
import time
import random
import numpy as np

import population
import simulation_mountain as simulation
import genome
import creature


def _fmt(x, dp):
    """Format numeric values for clean CSV output."""
    try:
        return f"{float(x):.{dp}f}"
    except Exception:
        return ""


def _select_parent_index(fit_map, pop_size):
    """
    Roulette selection.
    If total fitness is 0 (no signal), fall back to uniform random selection.
    """
    if len(fit_map) == 0 or fit_map[-1] <= 0:
        return np.random.randint(0, pop_size)
    return population.Population.select_parent(fit_map)


def run_ga(
    pop_size=10,
    gene_count=3,
    generations=50,
    sim_steps=2400,
    point_rate=0.1,
    point_amount=0.25,
    shrink_rate=0.25,
    grow_rate=0.1,
    seed=1,
    run_dir=None,
    motor_force=5.0,
    delimiter=",",
    use_threads=0,
    progress_every=1,
):
    """
    Runs GA and writes:
    - <run_dir>/config.json
    - <run_dir>/log.csv
    - <run_dir>/elites/elite_gen_XXXX.csv

    progress_every:
        Print progress every N creatures during evaluation (1 = print every creature).
    """

    # Reproducibility
    np.random.seed(seed)
    random.seed(seed)

    # Prepare output folders
    if run_dir is None:
        run_dir = os.path.join("runs", f"run_pop{pop_size}_genes{gene_count}_seed{seed}_{time.strftime('%Y%m%d_%H%M%S')}")
    os.makedirs(run_dir, exist_ok=True)

    elites_dir = os.path.join(run_dir, "elites")
    os.makedirs(elites_dir, exist_ok=True)

    log_path = os.path.join(run_dir, "log.csv")
    config_path = os.path.join(run_dir, "config.json")

    # Save config (for report/video provenance)
    config = {
        "pop_size": pop_size,
        "gene_count": gene_count,
        "generations": generations,
        "sim_steps": sim_steps,
        "point_rate": point_rate,
        "point_amount": point_amount,
        "shrink_rate": shrink_rate,
        "grow_rate": grow_rate,
        "seed": seed,
        "motor_force": motor_force,
        "delimiter": delimiter,
        "use_threads": use_threads,
        "progress_every": progress_every,
        "run_dir": run_dir,
        "timestamp_local": time.strftime("%Y-%m-%d %H:%M:%S"),
    }
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    # Create population
    pop = population.Population(pop_size=pop_size, gene_count=gene_count)

    # Choose evaluator
    # IMPORTANT: process-based multiprocessing often hangs on Windows.
    # ThreadedSim is safer if you want parallelism, but start with 0/1 threads until stable.
    if use_threads and int(use_threads) > 1:
        sim = simulation.ThreadedSim(pool_size=int(use_threads))
        sim_mode = f"ThreadedSim({use_threads})"
    else:
        sim = simulation.Simulation(gui=False)
        sim_mode = "Simulation(DIRECT)"

    print("=== GA RUN START ===")
    print(f"run_dir: {run_dir}")
    print(f"mode: {sim_mode}")
    print(f"pop_size={pop_size}, gene_count={gene_count}, generations={generations}, sim_steps={sim_steps}, motor_force={motor_force}")
    print(f"seed={seed}")
    print("====================")

    header = [
        "generation",
        "max_fitness",
        "mean_fitness",
        "max_links",
        "mean_links",
        "best_peak_dist",
        "mean_peak_dist",
        "best_max_height",
        "mean_max_height",
        "best_air_ratio",
        "mean_air_ratio",
        "best_supported_ratio",
        "mean_supported_ratio",
        "time_sec",
    ]

    with open(log_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f, delimiter=delimiter, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(header)
        f.flush()

        for gen in range(int(generations)):
            t0 = time.time()

            # --- Evaluate population ---
            if sim_mode.startswith("ThreadedSim"):
                # ThreadedSim evaluates the population internally
                sim.eval_population(pop, iterations=sim_steps, motor_force=motor_force)
            else:
                # Single-thread: print progress so it doesn't look frozen
                for i, cr in enumerate(pop.creatures):
                    if progress_every and (i % int(progress_every) == 0):
                        print(f"[gen {gen+1}/{generations}] evaluating creature {i+1}/{pop_size} ...", end="\r")
                    sim.run_creature(cr, iterations=sim_steps, motor_force=motor_force)
                print(" " * 80, end="\r")  # clear line

            # --- Collect metrics ---
            fits = [cr.get_mountain_fitness() for cr in pop.creatures]
            links = [len(cr.get_expanded_links()) for cr in pop.creatures]

            peak_dists = [cr.get_best_peak_distance() for cr in pop.creatures]
            max_heights = [cr.get_max_height() for cr in pop.creatures]
            air_ratios = [cr.get_air_ratio() for cr in pop.creatures]
            supported_ratios = [cr.get_supported_ratio() for cr in pop.creatures]

            max_fit = float(np.max(fits))
            mean_fit = float(np.mean(fits))
            max_links = int(np.max(links))
            mean_links = float(np.mean(links))

            best_idx = int(np.argmax(fits))

            best_peak_dist = float(peak_dists[best_idx])
            mean_peak_dist = float(np.mean(peak_dists))

            best_max_height = float(max_heights[best_idx])
            mean_max_height = float(np.mean(max_heights))

            best_air_ratio = float(air_ratios[best_idx])
            mean_air_ratio = float(np.mean(air_ratios))

            best_supported_ratio = float(supported_ratios[best_idx])
            mean_supported_ratio = float(np.mean(supported_ratios))

            dt = float(time.time() - t0)

            writer.writerow([
                gen,
                _fmt(max_fit, 6),
                _fmt(mean_fit, 6),
                max_links,
                _fmt(mean_links, 2),
                _fmt(best_peak_dist, 3),
                _fmt(mean_peak_dist, 3),
                _fmt(best_max_height, 3),
                _fmt(mean_max_height, 3),
                _fmt(best_air_ratio, 3),
                _fmt(mean_air_ratio, 3),
                _fmt(best_supported_ratio, 3),
                _fmt(mean_supported_ratio, 3),
                _fmt(dt, 2),
            ])
            f.flush()

            print(
                f"Gen {gen:03d}: max_fit={max_fit:.6f} "
                f"best_peak_dist={best_peak_dist:.3f} max_height={best_max_height:.3f} "
                f"supported={best_supported_ratio:.3f} time={dt:.2f}s"
            )

            # --- Selection + reproduction ---
            fit_map = population.Population.get_fitness_map(fits)

            new_creatures = []
            for _ in range(len(pop.creatures)):
                p1_ind = _select_parent_index(fit_map, len(pop.creatures))
                p2_ind = _select_parent_index(fit_map, len(pop.creatures))

                p1 = pop.creatures[p1_ind]
                p2 = pop.creatures[p2_ind]

                dna = genome.Genome.crossover(p1.dna, p2.dna)
                dna = genome.Genome.point_mutate(dna, rate=point_rate, amount=point_amount)
                dna = genome.Genome.shrink_mutate(dna, rate=shrink_rate)
                dna = genome.Genome.grow_mutate(dna, rate=grow_rate)

                cr_new = creature.Creature(gene_count)
                cr_new.update_dna(dna)
                new_creatures.append(cr_new)

            # Elitism: keep best unchanged, save elite DNA for GUI replay/video
            elite_src = pop.creatures[best_idx]
            elite_copy = creature.Creature(gene_count)
            elite_copy.update_dna(elite_src.dna)
            new_creatures[0] = elite_copy

            elite_path = os.path.join(elites_dir, f"elite_gen_{gen:04d}.csv")
            genome.Genome.to_csv(elite_src.dna, elite_path, precision=6)

            pop.creatures = new_creatures

    # Best-effort cleanup
    try:
        if hasattr(sim, "close"):
            sim.close()
    except Exception:
        pass

    print("=== GA RUN COMPLETE ===")
    print(f"Outputs in: {run_dir}")
    print(f"Log: {log_path}")
    print(f"Elites: {elites_dir}")


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument("--pop_size", type=int, default=10)
    parser.add_argument("--gene_count", type=int, default=3)
    parser.add_argument("--generations", type=int, default=50)
    parser.add_argument("--sim_steps", type=int, default=2400)

    parser.add_argument("--point_rate", type=float, default=0.1)
    parser.add_argument("--point_amount", type=float, default=0.25)
    parser.add_argument("--shrink_rate", type=float, default=0.25)
    parser.add_argument("--grow_rate", type=float, default=0.1)

    parser.add_argument("--seed", type=int, default=1)
    parser.add_argument("--motor_force", type=float, default=5.0)

    parser.add_argument("--run_dir", type=str, default=None)
    parser.add_argument("--delimiter", type=str, default=",", help="If Excel shows one column, try ';'")
    parser.add_argument("--use_threads", type=int, default=0, help="Set >1 to enable ThreadedSim thread pool")
    parser.add_argument("--progress_every", type=int, default=1, help="Print progress every N creatures")

    args = parser.parse_args()

    run_ga(
        pop_size=args.pop_size,
        gene_count=args.gene_count,
        generations=args.generations,
        sim_steps=args.sim_steps,
        point_rate=args.point_rate,
        point_amount=args.point_amount,
        shrink_rate=args.shrink_rate,
        grow_rate=args.grow_rate,
        seed=args.seed,
        run_dir=args.run_dir,
        motor_force=args.motor_force,
        delimiter=args.delimiter,
        use_threads=args.use_threads,
        progress_every=args.progress_every,
    )


if __name__ == "__main__":
    main()
