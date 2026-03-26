using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float moveSpeed = 6f;
    public float acceleration = 25f;

    [Header("Jump")]
    public float jumpForce = 7f;
    public Transform groundCheck;            // empty object at feet
    public float groundCheckRadius = 0.25f;
    public LayerMask groundMask;             // set to Ground layer

    [Header("References")]
    public Transform cameraTransform;

    private Rigidbody rb;
    private Vector3 moveInput;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();

        if (cameraTransform == null && Camera.main != null)
            cameraTransform = Camera.main.transform;
    }

    void Update()
    {
        // WASD input
        float h = Input.GetAxisRaw("Horizontal");
        float v = Input.GetAxisRaw("Vertical");
        moveInput = new Vector3(h, 0f, v).normalized;

        // Jump
        if (Input.GetButtonDown("Jump") && IsGrounded())
        {
            rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
        }
    }

    void FixedUpdate()
    {
        if (cameraTransform == null) return;

        // Move relative to camera facing (ignoring camera pitch)
        Vector3 camForward = cameraTransform.forward;
        camForward.y = 0f;
        camForward.Normalize();

        Vector3 camRight = cameraTransform.right;
        camRight.y = 0f;
        camRight.Normalize();

        Vector3 desiredDir = (camForward * moveInput.z + camRight * moveInput.x).normalized;
        Vector3 desiredVelocity = desiredDir * moveSpeed;

        // Keep existing Y velocity (gravity/jump), drive XZ toward desired
        Vector3 currentVel = rb.linearVelocity;
        Vector3 targetVel = new Vector3(desiredVelocity.x, currentVel.y, desiredVelocity.z);

        rb.linearVelocity = Vector3.MoveTowards(currentVel, targetVel, acceleration * Time.fixedDeltaTime);
    }

    bool IsGrounded()
    {
        if (groundCheck == null) return false;
        return Physics.CheckSphere(groundCheck.position, groundCheckRadius, groundMask, QueryTriggerInteraction.Ignore);
    }

    // Optional: visualize ground check
    void OnDrawGizmosSelected()
    {
        if (groundCheck == null) return;
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(groundCheck.position, groundCheckRadius);
    }
}
