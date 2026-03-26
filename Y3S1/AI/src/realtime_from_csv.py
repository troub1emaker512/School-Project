import os
import sys
import time
import numpy as np
import pybullet as p

import genome
import creature


def make_arena(pid, arena_size=20.0, wall_height=1.0):
    wall_thickness = 0.5

    # Floor (big box)
    floor_shape = p.createCollisionShape(
        shapeType=p.GEOM_BOX,
        halfExtents=[arena_size / 2, arena_size / 2, wall_thickness],
        physicsClientId=pid
    )
    floor_id = p.createMultiBody(
        baseMass=0,
        baseCollisionShapeIndex=floor_shape,
        basePosition=[0, 0, -wall_thickness],
        physicsClientId=pid
    )

    # Two walls along Y (north/south)
    wall_shape_y = p.createCollisionShape(
        shapeType=p.GEOM_BOX,
        halfExtents=[arena_size / 2, wall_thickness / 2, wall_height / 2],
        physicsClientId=pid
    )
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_shape_y,
                      basePosition=[0, arena_size / 2, wall_height / 2], physicsClientId=pid)
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_shape_y,
                      basePosition=[0, -arena_size / 2, wall_height / 2], physicsClientId=pid)

    # Two walls along X (east/west)
    wall_shape_x = p.createCollisionShape(
        shapeType=p.GEOM_BOX,
        halfExtents=[wall_thickness / 2, arena_size / 2, wall_height / 2],
        physicsClientId=pid
    )
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_shape_x,
                      basePosition=[arena_size / 2, 0, wall_height / 2], physicsClientId=pid)
    p.createMultiBody(baseMass=0, baseCollisionShapeIndex=wall_shape_x,
                      basePosition=[-arena_size / 2, 0, wall_height / 2], physicsClientId=pid)

    return floor_id


def load_mountain(pid):
    shapes_path = os.path.join(os.path.dirname(__file__), "shapes")
    p.setAdditionalSearchPath(shapes_path, physicsClientId=pid)

    mountain_position = (0, 0, -1)
    mountain_orientation = p.getQuaternionFromEuler((0, 0, 0))
    mountain_id = p.loadURDF(
        "gaussian_pyramid.urdf",
        mountain_position,
        mountain_orientation,
        useFixedBase=1,
        physicsClientId=pid
    )
    return mountain_id


def main(csv_file):
    assert os.path.exists(csv_file), f"Tried to load {csv_file} but it does not exist"

    pid = p.connect(p.GUI)
    p.setPhysicsEngineParameter(enableFileCaching=0, physicsClientId=pid)
    p.configureDebugVisualizer(p.COV_ENABLE_GUI, 0, physicsClientId=pid)
    p.resetSimulation(physicsClientId=pid)
    p.setGravity(0, 0, -10, physicsClientId=pid)

    arena_size = 20.0
    make_arena(pid, arena_size=arena_size, wall_height=1.0)
    load_mountain(pid)

    # Camera (so you actually see the mountain)
    p.resetDebugVisualizerCamera(
        cameraDistance=14,
        cameraYaw=35,
        cameraPitch=-35,
        cameraTargetPosition=(0, 0, 2),
        physicsClientId=pid
    )

    # Load genome from CSV (this must be an elite_gen_XXXX.csv, not ga_baseline_log.csv)
    dna = genome.Genome.from_csv(csv_file)
    cr = creature.Creature(gene_count=1)
    cr.update_dna(dna)

    # Write creature URDF next to this script (stable path)
    urdf_path = os.path.join(os.path.dirname(__file__), "temp_replay.urdf")
    with open(urdf_path, "w", encoding="utf-8") as f:
        f.write(cr.to_xml())

    rob = p.loadURDF(urdf_path, physicsClientId=pid)

    # Spawn near the edge (same idea as simulation_mountain.py)
    spawn_pos = [0, -arena_size / 2 + 2.0, 1.5]
    p.resetBasePositionAndOrientation(rob, spawn_pos, [0, 0, 0, 1], physicsClientId=pid)
    start_pos, _ = p.getBasePositionAndOrientation(rob, physicsClientId=pid)

    wait_time = 1.0 / 240.0
    total_time = 60.0  # seconds (increase as needed)
    elapsed = 0.0
    step = 0
    dist_moved = 0.0

    try:
        while p.isConnected(physicsClientId=pid) and elapsed < total_time:
            p.stepSimulation(physicsClientId=pid)
            step += 1

            if step % 24 == 0:
                motors = cr.get_motors()
                assert len(motors) == p.getNumJoints(rob, physicsClientId=pid), "Motor/joint mismatch"

                for jid in range(p.getNumJoints(rob, physicsClientId=pid)):
                    vel = motors[jid].get_output()
                    p.setJointMotorControl2(
                        rob,
                        jid,
                        controlMode=p.VELOCITY_CONTROL,
                        targetVelocity=vel,
                        force=5,
                        physicsClientId=pid
                    )

                new_pos, _ = p.getBasePositionAndOrientation(rob, physicsClientId=pid)
                dist_moved = float(np.linalg.norm(np.asarray(start_pos) - np.asarray(new_pos)))
                print(dist_moved)

            time.sleep(wait_time)
            elapsed += wait_time

    except KeyboardInterrupt:
        pass
    finally:
        if p.isConnected(physicsClientId=pid):
            p.disconnect(physicsClientId=pid)

    print("TOTAL DISTANCE MOVED:", dist_moved)


if __name__ == "__main__":
    assert len(sys.argv) == 2, "Usage: python realtime_from_csv.py elite_gen_XXXX.csv"
    main(sys.argv[1])
