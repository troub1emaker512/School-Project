import os
import time
import pybullet as p
import pybullet_data as pd

def main():
    p.connect(p.GUI)
    p.setPhysicsEngineParameter(enableFileCaching=0)
    p.configureDebugVisualizer(p.COV_ENABLE_GUI, 0)

    p.setAdditionalSearchPath(pd.getDataPath())

    plane_shape = p.createCollisionShape(p.GEOM_PLANE)
    floor = p.createMultiBody(plane_shape, plane_shape)
    p.setGravity(0, 0, -10)

    # ---- ADD THIS: load the mountain ----
    mountain_urdf = os.path.join("src", "shapes", "gaussian_pyramid.urdf")
    p.loadURDF(mountain_urdf, (0, 0, -1), useFixedBase=1)
    # ------------------------------------

    # Optional: set a sensible camera angle
    p.resetDebugVisualizerCamera(cameraDistance=12, cameraYaw=45, cameraPitch=-35, cameraTargetPosition=(0, 0, 2))

    try:
        while p.isConnected():
            p.stepSimulation()
            time.sleep(1.0 / 240.0)
    except KeyboardInterrupt:
        pass
    finally:
        if p.isConnected():
            p.disconnect()

if __name__ == "__main__":
    main()
