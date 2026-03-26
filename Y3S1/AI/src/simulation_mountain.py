"""
simulation_mountain.py

Mountain-sandbox evaluation for the CM3020 Part B genetic algorithm task.

Why this file exists:
- Provides a consistent evaluation environment (arena + mountain).
- Evaluates a creature in PyBullet, tracking metrics required for mountain fitness:
  (1) distance to peak, (2) max height, (3) supported vs airborne ratio.

Important fixes included in this version:
- Robust URDF load: sets search paths so relative meshes resolve even when URDFs are written to tmp_urdf/.
- Better failure diagnostics: if a URDF fails to load, raises a clear error and can keep the failing URDF.
- Windows-safe parallel evaluation: ThreadedSim uses a thread pool (NOT a process pool) to avoid hangs on Windows.
- Optional progress/debug settings to make long runs feel responsive.
"""

import os
import time
import traceback
from typing import Optional

import pybullet as p

# Windows compatibility:
# multiprocessing.Pool spawns new processes that require pickling objects; that often breaks/hangs with PyBullet.
# Thread pool avoids pickling and is much safer for this coursework.
try:
    from multiprocessing.dummy import Pool as ThreadPool
except Exception:
    ThreadPool = None


class Simulation:
    def __init__(
        self,
        sim_id: int = 0,
        arena_size: float = 20.0,
        wall_height: float = 1.0,
        gui: bool = False,
        mountain_urdf: str = "gaussian_pyramid.urdf",
        verbose: bool = False,
        keep_failed_urdf: bool = False,
    ):
        """
        Parameters
        ----------
        sim_id:
            Identifier used for temp URDF filenames.
        arena_size:
            Size of the sandbox (square).
        wall_height:
            Height of arena boundary walls.
        gui:
            If True, uses PyBullet GUI (for demo/video). If False, uses DIRECT (fast GA evaluation).
        mountain_urdf:
            URDF filename inside src/shapes/ to load as terrain.
        verbose:
            If True, prints extra diagnostics (useful when debugging hangs).
        keep_failed_urdf:
            If True, if a creature URDF fails to load, the URDF file is NOT deleted (so you can inspect it).
        """
        self.gui = bool(gui)
        self.physicsClientId = p.connect(p.GUI if self.gui else p.DIRECT)

        self.sim_id = sim_id
        self.arena_size = float(arena_size)
        self.wall_height = float(wall_height)
        self.mountain_urdf = mountain_urdf
        self.verbose = bool(verbose)
        self.keep_failed_urdf = bool(keep_failed_urdf)

        # Assets directory for terrain meshes/URDFs
        self.shapes_path = os.path.join(os.path.dirname(__file__), "shapes")

        # Temp URDF directory for generated creatures
        self.tmp_urdf_dir = os.path.join(os.path.dirname(__file__), "tmp_urdf")
        os.makedirs(self.tmp_urdf_dir, exist_ok=True)

    def close(self):
        """Disconnect from PyBullet cleanly."""
        try:
            p.disconnect(self.physicsClientId)
        except Exception:
            pass

    def _set_search_paths(self, pid: int, extra_paths):
        """
        Ensure PyBullet can resolve relative mesh/URDF references.

        Note: some PyBullet builds treat setAdditionalSearchPath as a SET (overwrites),
        not an APPEND. We therefore set paths in a deliberate order.
        """
        for path in extra_paths:
            try:
                p.setAdditionalSearchPath(path, physicsClientId=pid)
            except TypeError:
                # Some builds do not accept physicsClientId
                p.setAdditionalSearchPath(path)

    def _make_arena(self, pid: int):
        """Create a floor and four boundary walls to keep creatures contained."""
        arena_size = self.arena_size
        wall_height = self.wall_height
        wall_thickness = 0.5

        # Floor
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

        # Walls along Y
        wall_shape_y = p.createCollisionShape(
            shapeType=p.GEOM_BOX,
            halfExtents=[arena_size / 2, wall_thickness / 2, wall_height / 2],
            physicsClientId=pid
        )
        p.createMultiBody(0, wall_shape_y, basePosition=[0, arena_size / 2, wall_height / 2], physicsClientId=pid)
        p.createMultiBody(0, wall_shape_y, basePosition=[0, -arena_size / 2, wall_height / 2], physicsClientId=pid)

        # Walls along X
        wall_shape_x = p.createCollisionShape(
            shapeType=p.GEOM_BOX,
            halfExtents=[wall_thickness / 2, arena_size / 2, wall_height / 2],
            physicsClientId=pid
        )
        p.createMultiBody(0, wall_shape_x, basePosition=[arena_size / 2, 0, wall_height / 2], physicsClientId=pid)
        p.createMultiBody(0, wall_shape_x, basePosition=[-arena_size / 2, 0, wall_height / 2], physicsClientId=pid)

        return floor_id

    def _load_mountain(self, pid: int):
        """Load the terrain URDF from src/shapes."""
        # Ensure terrain URDF + meshes are discoverable
        self._set_search_paths(pid, [self.shapes_path])

        mountain_position = (0, 0, -1)
        mountain_orientation = p.getQuaternionFromEuler((0, 0, 0))
        mountain_id = p.loadURDF(
            self.mountain_urdf,
            mountain_position,
            mountain_orientation,
            useFixedBase=1,
            physicsClientId=pid
        )
        return mountain_id

    def update_motors(self, cid, cr, motor_force: float = 5.0):
        """
        Apply velocity control to all joints.

        motor_force is a key experimental parameter:
        - higher -> potentially better climbing but can be unstable
        - lower -> smoother but may not climb
        """
        pid = self.physicsClientId
        for jid in range(p.getNumJoints(cid, physicsClientId=pid)):
            m = cr.get_motors()[jid]
            p.setJointMotorControl2(
                cid,
                jid,
                controlMode=p.VELOCITY_CONTROL,
                targetVelocity=m.get_output(),
                force=float(motor_force),
                physicsClientId=pid
            )

    def run_creature(
        self,
        cr,
        iterations: int = 2400,
        motor_force: float = 5.0,
        real_time: bool = False,
        show_debug: bool = False,
        real_time_step: float = 1.0 / 240.0
    ):
        """
        Evaluate a single creature.

        This function resets the world each call for fairness across individuals.
        """
        pid = self.physicsClientId

        # Reset world (keeps individuals comparable)
        p.resetSimulation(physicsClientId=pid)
        p.setPhysicsEngineParameter(enableFileCaching=0, physicsClientId=pid)
        p.setGravity(0, 0, -10, physicsClientId=pid)

        floor_id = self._make_arena(pid)
        mountain_id = self._load_mountain(pid)

        # Peak position is derived from the terrain AABB (max Z)
        aabb_min, aabb_max = p.getAABB(mountain_id, physicsClientId=pid)
        peak_pos = (0.0, 0.0, float(aabb_max[2]))

        # GUI camera setup for demos/videos
        if self.gui:
            p.resetDebugVisualizerCamera(
                cameraDistance=18,
                cameraYaw=45,
                cameraPitch=-30,
                cameraTargetPosition=[0, 0, 0],
                physicsClientId=pid
            )

        # Write creature URDF to tmp_urdf/
        xml_file = os.path.join(self.tmp_urdf_dir, f"temp_{self.sim_id}.urdf")
        xml_str = cr.to_xml()
        with open(xml_file, "w", encoding="utf-8", newline="") as f:
            f.write(xml_str)

        # IMPORTANT:
        # The creature URDF may contain mesh references like "shapes/gaussian_pyramid.obj" or "<mesh>.obj".
        # Because xml_file lives in tmp_urdf/, relative paths can break unless we set search paths.
        base_dir = os.path.dirname(__file__)          # .../src
        urdf_dir = os.path.dirname(xml_file)          # .../src/tmp_urdf
        shapes_dir = self.shapes_path                 # .../src/shapes

        # Set search paths in an order that makes shapes_dir "win" if PyBullet overwrites rather than appends.
        self._set_search_paths(pid, [base_dir, urdf_dir, shapes_dir])

        # Load the creature URDF with good error diagnostics
        try:
            cid = p.loadURDF(xml_file, physicsClientId=pid)
        except Exception as e:
            # Keep failing URDF if requested, otherwise it will be removed below.
            msg = [
                "PyBullet failed to load generated creature URDF.",
                f"URDF path: {xml_file}",
                f"keep_failed_urdf={self.keep_failed_urdf}",
                "",
                "Common causes:",
                " - Mesh paths in URDF cannot be resolved (search path issue).",
                " - Invalid geometry values (negative sizes / NaN / inf).",
                " - Malformed URDF XML.",
                "",
                "Original exception:",
                repr(e),
                "",
                "Traceback:",
                traceback.format_exc(),
            ]
            if not self.keep_failed_urdf:
                try:
                    os.remove(xml_file)
                except OSError:
                    pass
            raise RuntimeError("\n".join(msg))

        # Delete temp URDF if load succeeded (keeps folder clean)
        if not self.keep_failed_urdf:
            try:
                os.remove(xml_file)
            except OSError:
                pass

        # Spawn creature near arena edge at low height to reduce "drop onto peak" artefacts
        spawn_pos = [0, -self.arena_size / 2 + 2.0, 1.5]
        p.resetBasePositionAndOrientation(cid, spawn_pos, [0, 0, 0, 1], physicsClientId=pid)

        # Main simulation loop
        for step in range(int(iterations)):
            p.stepSimulation(physicsClientId=pid)

            # Update motors at a lower frequency than physics steps
            if step % 24 == 0:
                self.update_motors(cid=cid, cr=cr, motor_force=motor_force)

            pos, orn = p.getBasePositionAndOrientation(cid, physicsClientId=pid)

            # Supported if touching the floor OR the mountain.
            # This supports the "no flying" penalty inside your fitness definition.
            supported = (
                len(p.getContactPoints(bodyA=cid, bodyB=floor_id, physicsClientId=pid)) > 0
                or len(p.getContactPoints(bodyA=cid, bodyB=mountain_id, physicsClientId=pid)) > 0
            )

            # This updates all episode statistics used in get_mountain_fitness()
            cr.update_position(pos, supported=supported, peak_pos=peak_pos)

            # Optional GUI overlay for video narration
            if show_debug and self.gui and (step % 120 == 0):
                debug_lines = [
                    f"step: {step}/{iterations}",
                    f"best_peak_dist: {cr.get_best_peak_distance():.3f}",
                    f"max_height: {cr.get_max_height():.3f}",
                    f"air_ratio: {cr.get_air_ratio():.3f}",
                    f"supported_ratio: {cr.get_supported_ratio():.3f}",
                    f"fitness: {cr.get_mountain_fitness():.6f}",
                ]
                p.addUserDebugText(
                    "\n".join(debug_lines),
                    textPosition=[-8, -8, 6],
                    textSize=1.2,
                    lifeTime=0.2,
                    physicsClientId=pid
                )

            # Optional realtime pacing (ONLY applies to GUI demos)
            if real_time and self.gui:
                time.sleep(real_time_step)

        return cr

    def eval_population(self, pop, iterations: int, motor_force: float = 5.0):
        """Single-thread evaluation (safe everywhere)."""
        for cr in pop.creatures:
            self.run_creature(cr, iterations=int(iterations), motor_force=motor_force)


class ThreadedSim:
    """
    Windows-safe evaluator using a thread pool.
    This avoids multiprocessing spawn/pickling issues that commonly cause "hangs".

    Note:
    - Threads may not speed up as much as processes (Python GIL), but PyBullet calls are native and
      can still provide some wall-clock improvement depending on your machine.
    - If you suspect any instability, use Simulation.eval_population (single-thread).
    """

    def __init__(self, pool_size: int, arena_size: float = 20.0, wall_height: float = 1.0):
        if ThreadPool is None:
            raise RuntimeError("ThreadPool not available in this Python environment.")

        self.pool_size = int(pool_size)
        self.sims = [
            Simulation(i, arena_size=arena_size, wall_height=wall_height, gui=False)
            for i in range(self.pool_size)
        ]

    @staticmethod
    def _run_one(sim: Simulation, cr, iterations: int, motor_force: float):
        sim.run_creature(cr, iterations=int(iterations), motor_force=motor_force)
        return cr

    def eval_population(self, pop, iterations: int, motor_force: float = 5.0):
        # Assign individuals to simulators round-robin
        tasks = []
        for i, cr in enumerate(pop.creatures):
            sim = self.sims[i % self.pool_size]
            tasks.append((sim, cr, int(iterations), float(motor_force)))

        with ThreadPool(self.pool_size) as pool:
            pop.creatures = pool.starmap(ThreadedSim._run_one, tasks)
