using UnityEngine;

// هندسة المحركات للمهندس سهيل الهزبري
// برمجة المهندس/ سهيل الهزبري
// TACTICAL A.I. FLIGHT ENGINE - V4.5

[RequireComponent(typeof(Rigidbody))]
public class EnemyAI : MonoBehaviour
{
    [Header("Flight Parameters")]
    public float movementSpeed = 18f;
    public float rotationSpeed = 5f;
    public float avoidanceForce = 2.5f;
    public float raycastDistance = 15f;

    [Header("Combat Settings")]
    public float detectionRadius = 25f; // نطاق البحث المستهدف
    public float fireRate = 1.5f;
    private float nextFireTime = 0f;

    [Header("References")]
    public Transform playerTransform;
    public Transform laserFirePoint;
    public LineRenderer laserLineRenderer;
    public AudioSource laserAudioSource;
    public AudioClip explosionVibrationSound;

    private Rigidbody rb;

    void Start()
    {
        rb = GetComponent<Rigidbody>();
        if (laserLineRenderer != null)
        {
            laserLineRenderer.enabled = false;
        }
    }

    void FixedUpdate()
    {
        if (playerTransform == null) return;

        // 1. حساب المسافة الإقليدية لتفعيل الملاحقة
        float euclideanDistance = Vector3.Distance(transform.position, playerTransform.position);

        if (euclideanDistance <= detectionRadius)
        {
            TacticalEngagement(euclideanDistance);
        }
    }

    void TacticalEngagement(float distanceToPlayer)
    {
        // 2. الملاحقة الذكية باستخدام الوجهات (Quaternion View)
        Vector3 directionToPlayer = (playerTransform.position - transform.position).normalized;
        Vector3 movementDirection = directionToPlayer;

        // 3. نظام الأشعة المتعددة لتفادي العقبات (Multi-Raycast Whisker Casting)
        bool avoidingObstacle = false;
        Vector3 avoidanceVector = Vector3.zero;

        // شعاع الوسط
        if (Physics.Raycast(transform.position, transform.forward, out RaycastHit hitCenter, raycastDistance))
        {
            avoidanceVector += hitCenter.normal * avoidanceForce;
            avoidingObstacle = true;
        }
        
        // شعاع أيمن
        if (Physics.Raycast(transform.position, transform.forward + transform.right * 0.5f, out RaycastHit hitRight, raycastDistance * 0.8f))
        {
            avoidanceVector += hitRight.normal * avoidanceForce;
            avoidingObstacle = true;
        }

        // شعاع أيسر
        if (Physics.Raycast(transform.position, transform.forward - transform.right * 0.5f, out RaycastHit hitLeft, raycastDistance * 0.8f))
        {
            avoidanceVector += hitLeft.normal * avoidanceForce;
            avoidingObstacle = true;
        }

        if (avoidingObstacle)
        {
            movementDirection += avoidanceVector;
        }

        // المصفوفة النهائية للالتفاف السلس
        Quaternion lookRotation = Quaternion.LookRotation(movementDirection);
        transform.rotation = Quaternion.Slerp(transform.rotation, lookRotation, Time.fixedDeltaTime * rotationSpeed);
        rb.MovePosition(transform.position + transform.forward * movementSpeed * Time.fixedDeltaTime);

        // 4. إطلاق الليزر التكتيكي بناءً على المسار والتوقيت
        if (Time.time >= nextFireTime && !avoidingObstacle)
        {
            FireLaser();
            nextFireTime = Time.time + fireRate;
        }
    }

    void FireLaser()
    {
        if (laserLineRenderer == null || laserFirePoint == null) return;

        StartCoroutine(RenderLaserEffect());

        Ray ray = new Ray(laserFirePoint.position, laserFirePoint.forward);
        if (Physics.Raycast(ray, out RaycastHit hit, detectionRadius))
        {
            // التحقق من أن الشعاع أصاب اللاعب (ويتم إرسال أمر برودكاست التنكيل إذا تم تصفية اللاعب)
            if (hit.transform.CompareTag("Player"))
            {
                // Play sound logic
                if (laserAudioSource && explosionVibrationSound)
                {
                    laserAudioSource.PlayOneShot(explosionVibrationSound);
                }
                
                // Assuming PlayerHealth script reduces health
                // PlayerHealth ph = hit.transform.GetComponent<PlayerHealth>();
                // ph.TakeDamage(20f);
            }
        }
    }

    private System.Collections.IEnumerator RenderLaserEffect()
    {
        laserLineRenderer.enabled = true;
        laserLineRenderer.SetPosition(0, laserFirePoint.position);
        
        // مسار افتراضي لخط الليزر
        Vector3 endPos = laserFirePoint.position + laserFirePoint.forward * detectionRadius;
        if (Physics.Raycast(laserFirePoint.position, laserFirePoint.forward, out RaycastHit hit, detectionRadius))
        {
            endPos = hit.point;
        }
        laserLineRenderer.SetPosition(1, endPos);

        yield return new WaitForSeconds(0.1f);
        laserLineRenderer.enabled = false;
    }
}
// هندسة المحركات للمهندس سهيل الهزبري
// برمجة المهندس/ سهيل الهزبري
