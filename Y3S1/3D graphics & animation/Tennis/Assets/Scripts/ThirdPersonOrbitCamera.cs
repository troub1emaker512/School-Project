using UnityEngine;

public class ThirdPersonOrbitCamera : MonoBehaviour
{
    [Header("Target")]
    public Transform target;

    [Header("Orbit")]
    public float distance = 6f;
    public float heightOffset = 1.0f;
    public float mouseSensitivity = 2.0f;

    [Tooltip("Up/down look limits.")]
    public float minPitch = -20f;
    public float maxPitch = 70f;

    [Header("Smoothing")]
    public float positionSmoothTime = 0.08f;

    [Header("Input")]
    public bool holdRightMouseToRotate = false;

    [Header("Collision (optional)")]
    public bool collisionEnabled = true;
    public float collisionRadius = 0.2f;
    public float collisionBuffer = 0.1f;
    public LayerMask collisionMask = ~0; // everything

    private float _yaw;
    private float _pitch;
    private Vector3 _posVel;

    private Camera _cam;

    private void Awake()
    {
        _cam = GetComponentInChildren<Camera>();
        if (_cam == null) _cam = Camera.main;

        // Start from current view direction
        Vector3 euler = transform.eulerAngles;
        _yaw = euler.y;
        _pitch = euler.x;
    }

    private void Start()
    {
        // Optional: lock cursor for a typical third-person feel
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    private void LateUpdate()
    {
        if (target == null || _cam == null) return;

        // 1) Mouse input
        bool allowRotate = !holdRightMouseToRotate || Input.GetMouseButton(1);

        if (allowRotate)
        {
            float mx = Input.GetAxis("Mouse X");
            float my = Input.GetAxis("Mouse Y");

            _yaw += mx * mouseSensitivity;
            _pitch -= my * mouseSensitivity;
            _pitch = Mathf.Clamp(_pitch, minPitch, maxPitch);
        }

        // 2) Desired rotation from yaw/pitch
        Quaternion rot = Quaternion.Euler(_pitch, _yaw, 0f);

        // 3) Desired pivot point (target + height)
        Vector3 pivot = target.position + Vector3.up * heightOffset;

        // 4) Desired camera position (behind pivot)
        Vector3 desiredCamPos = pivot - (rot * Vector3.forward * distance);

        // 5) Collision (sphere cast from pivot to desired camera position)
        if (collisionEnabled)
        {
            Vector3 dir = (desiredCamPos - pivot);
            float desiredDist = dir.magnitude;
            if (desiredDist > 0.001f)
            {
                dir /= desiredDist;

                if (Physics.SphereCast(pivot, collisionRadius, dir, out RaycastHit hit, desiredDist, collisionMask))
                {
                    float safeDist = Mathf.Max(0.5f, hit.distance - collisionBuffer);
                    desiredCamPos = pivot + dir * safeDist;
                }
            }
        }

        // 6) Smooth camera movement (rig position)
        transform.position = Vector3.SmoothDamp(transform.position, desiredCamPos, ref _posVel, positionSmoothTime);

        // 7) Look at target pivot
        transform.rotation = rot;
        _cam.transform.LookAt(pivot);
    }
}
