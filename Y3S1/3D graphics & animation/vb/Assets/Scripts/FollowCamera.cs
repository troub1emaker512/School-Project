using UnityEngine;

public class FollowCamera : MonoBehaviour
{
    public Transform target;                 // Player
    public Vector3 offset = new Vector3(0f, 6f, -10f);
    public float followSmooth = 8f;
    public float rotateSmooth = 10f;

    void LateUpdate()
    {
        if (target == null) return;

        // Smooth position follow
        Vector3 desiredPos = target.position + offset;
        transform.position = Vector3.Lerp(transform.position, desiredPos, followSmooth * Time.deltaTime);

        // Smooth look at target
        Quaternion desiredRot = Quaternion.LookRotation(target.position - transform.position, Vector3.up);
        transform.rotation = Quaternion.Slerp(transform.rotation, desiredRot, rotateSmooth * Time.deltaTime);
    }
}
