using UnityEngine;

public class GateController : MonoBehaviour
{
    [Header("References")]
    public Rigidbody gateRb;
    public Collider lockCollider;

    [Header("Unlock Behaviour")]
    public bool pushOpenOnUnlock = true;
    public float pushTorque = 40f;

    private bool _unlocked;

    private void Reset()
    {
        gateRb = GetComponent<Rigidbody>();
    }

    public void UnlockGate()
    {
        Debug.Log("UnlockGate CALLED", this);
        if (_unlocked) return;
        _unlocked = true;

        if (lockCollider != null)
            lockCollider.enabled = false;

        if (pushOpenOnUnlock && gateRb != null)
            gateRb.AddTorque(Vector3.up * pushTorque, ForceMode.Impulse);
    }
}
