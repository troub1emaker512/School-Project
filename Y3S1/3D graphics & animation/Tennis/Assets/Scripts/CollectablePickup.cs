using UnityEngine;

public class CollectablePickup : MonoBehaviour
{
    private bool _pickedUp;

    private void OnTriggerEnter(Collider other)
    {
        if (_pickedUp) return;

        if (!other.CompareTag("Player")) return;

        _pickedUp = true;

        // Increment count
        CollectableManager.Instance.AddOne();

        // Remove from scene
        Destroy(gameObject);
    }
}
