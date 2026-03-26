using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class BallController : MonoBehaviour
{
    [Header("Movement")]
    [Tooltip("Acceleration force applied while holding WASD.")]
    public float moveForce = 20f;

    [Tooltip("Maximum horizontal speed (XZ). Helps keep control stable.")]
    public float maxSpeed = 8f;

    [Header("Stopping")]
    [Tooltip("How quickly horizontal movement decays when no input is held. Higher = stops faster.")]
    public float stopDamping = 8f;

    [Tooltip("If horizontal speed is below this, snap it to zero to prevent micro-sliding.")]
    public float stopThreshold = 0.05f;

    [Header("Grounding (optional but recommended)")]
    public LayerMask groundMask = ~0; // Everything by default
    public float groundCheckDistance = 0.6f;

    private Rigidbody _rb;

    private void Awake()
    {
        _rb = GetComponent<Rigidbody>();
    }

    private void FixedUpdate()
    {
        float h = Input.GetAxisRaw("Horizontal"); // A/D
        float v = Input.GetAxisRaw("Vertical");   // W/S

        Vector3 input = new Vector3(h, 0f, v);
        if (input.sqrMagnitude > 1f) input.Normalize();

        bool grounded = IsGrounded();

        if (grounded)
        {
            if (input.sqrMagnitude > 0.001f)
            {
                // Move with force while input is held
                Vector3 force = input * moveForce;
                _rb.AddForce(force, ForceMode.Acceleration);
            }
            else
            {
                // No input: damp horizontal velocity so the ball settles
                ApplyStopDamping();
            }
        }

        LimitHorizontalSpeed();
    }

    private bool IsGrounded()
    {
        return Physics.Raycast(transform.position, Vector3.down, groundCheckDistance, groundMask);
    }

    private void ApplyStopDamping()
    {
        Vector3 vel = _rb.linearVelocity;
        Vector3 horizontal = new Vector3(vel.x, 0f, vel.z);

        // Snap tiny drift to zero
        if (horizontal.magnitude < stopThreshold)
        {
            _rb.linearVelocity = new Vector3(0f, vel.y, 0f);
            return;
        }

        // Smoothly reduce horizontal velocity toward zero
        Vector3 damped = Vector3.Lerp(horizontal, Vector3.zero, stopDamping * Time.fixedDeltaTime);
        _rb.linearVelocity = new Vector3(damped.x, vel.y, damped.z);
    }

    private void LimitHorizontalSpeed()
    {
        Vector3 vel = _rb.linearVelocity;
        Vector3 horizontal = new Vector3(vel.x, 0f, vel.z);

        if (horizontal.magnitude > maxSpeed)
        {
            Vector3 limited = horizontal.normalized * maxSpeed;
            _rb.linearVelocity = new Vector3(limited.x, vel.y, limited.z);
        }
    }
}
