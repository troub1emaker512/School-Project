"""
demo_gui_elite.py

GUI demo/replay tool for Part B video evidence.

Loads a saved elite DNA CSV (produced by run_ga_baseline.py) and replays
the creature in the mountain environment using PyBullet GUI.

Usage:
    python demo_gui_elite.py --elite_csv ../runs/baseline_seed1/elites/elite_gen_0049.csv --gene_count 3 --sim_steps 4800
"""

import argparse
import genome
import creature
import simulation_mountain as simulation


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--elite_csv", type=str, required=True, help="Path to elite_gen_XXXX.csv DNA file")
    parser.add_argument("--gene_count", type=int, default=3, help="Gene count used to construct the Creature object")
    parser.add_argument("--sim_steps", type=int, default=2400, help="Simulation steps for the replay")
    parser.add_argument("--arena_size", type=float, default=20.0)
    parser.add_argument("--wall_height", type=float, default=1.0)
    parser.add_argument("--motor_force", type=float, default=20.0, help="Higher looks better in video; keep consistent if comparing")
    parser.add_argument("--loop", action="store_true", help="Replay continuously (useful for recording)")
    args = parser.parse_args()

    # Load DNA and build creature
    dna = genome.Genome.from_csv(args.elite_csv)
    cr = creature.Creature(args.gene_count)
    cr.update_dna(dna)

    # GUI sim
    sim = simulation.Simulation(arena_size=args.arena_size, wall_height=args.wall_height, gui=True)

    while True:
        sim.run_creature(
            cr,
            iterations=args.sim_steps,
            motor_force=args.motor_force,
            real_time=True,
            show_debug=True,
        )
        if not args.loop:
            break


if __name__ == "__main__":
    main()
