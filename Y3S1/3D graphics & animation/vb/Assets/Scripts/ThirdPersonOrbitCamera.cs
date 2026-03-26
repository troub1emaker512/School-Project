using UnityEngine;

public class ThirdPersonOrbitCamera : MonoBehaviour
{
    public Transform target;                         // Player
    public Vector3 targetOffset = new Vector3(0f, 1.5f, 0f);

    [Header("Distance")]
    public float distance = 6f;
    public float minDistance = 2f;
    public float maxDistance = 10f;

    [Header("Mouse Look")]
    public float sensitivityX = 3f;
    public float sensitivityY = 2f;
    public float minPitch = -20f;
    public float maxPitch = 60f;

    [Header("Smoothing")]
    public float positionSmooth = 12f;

    [Header("Optional: Camera Collision")]
    public bool enableCollision = true;
    public LayerMask collisionMask;                  // set to Default + Environment, exclude Player
    public float collisionRadius = 0.25f;

    private float yaw;
    private float pitch;

    void Start()
    {
        if (target == null)
        {
            Debug.LogError("ThirdPersonOrbitCamera: Assign a target (Player).");
            enabled = false;
            return;
        }

        Vector3 angles = transform.eulerAngles;
        yaw = angles.y;
        pitch = angles.x;

        // Optional: lock cursor for 3rd person controls
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    void LateUpdate()
    {
        // Mouse input
        yaw += Input.GetAxis("Mouse X") * sensitivityX;
        pitch -= Input.GetAxis("Mouse Y") * sensitivityY;
        pitch = Mathf.Clamp(pitch, minPitch, maxPitch);

        // Zoom (optional)
        float scroll = Input.GetAxis("Mouse ScrollWheel");
        if (Mathf.Abs(scroll) > 0.001f)
        {
            distance = Mathf.Clamp(distance - scroll * 2f, minDistance, maxDistance);
        }

        Quaternion rot = Quaternion.Euler(pitch, yaw, 0f);
        Vector3 targetPos = target.position + targetOffset;

        // Desired camera position
        Vector3 desiredPos = targetPos - (rot * Vector3.forward * distance);

        // Collision handling: push camera forward if blocked
        if (enableCollision)
        {
            Vector3 dir = (desiredPos - targetPos).normalized;
            float desiredDist = Vector3.Distance(targetPos, desiredPos);

            if (Physics.SphereCast(targetPos, collisionRadius, dir, out RaycastHit hit, desiredDist, collisionMask, QueryTriggerInteraction.Ignore))
            {
                desiredPos = targetPos + dir * (hit.distance - 0.05f);
            }
        }

        // Smooth follow
        transform.position = Vector3.Lerp(transform.position, desiredPos, positionSmooth * Time.deltaTime);
        transform.rotation = rot;
    }
}
