using UnityEngine;
using TMPro;

public class CollectableManager : MonoBehaviour
{
    public static CollectableManager Instance { get; private set; }

    [Header("Progress")]
    public int requiredToUnlock = 5;
    public int collected = 0;

    [Header("Gate")]
    public GateController gateToUnlock;

    [Header("UI (optional)")]
    public TextMeshProUGUI counterText;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }
        Instance = this;
    }

    private void Start()
    {
        UpdateUI();
    }

    public void AddOne()
    {
        collected++;
        UpdateUI();

        if (gateToUnlock != null && collected >= requiredToUnlock)
            gateToUnlock.UnlockGate();
    }

    private void UpdateUI()
    {
        if (counterText != null)
            counterText.text = $"Collected: {collected}/{requiredToUnlock}";
    }
}
