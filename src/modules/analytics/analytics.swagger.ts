/**
 * @swagger
 * tags:
 *   - name: Analytics
 *     description: Tenant-scoped analytics events and reporting
 */

/**
 * @swagger
 * /api/v1/analytics/events:
 *   post:
 *     tags: [Analytics]
 *     summary: Track an analytics event
 *   get:
 *     tags: [Analytics]
 *     summary: List analytics events
 */

/**
 * @swagger
 * /api/v1/analytics/events/{id}:
 *   get:
 *     tags: [Analytics]
 *     summary: Get analytics event by ID
 */

/**
 * @swagger
 * /api/v1/analytics/summary:
 *   get:
 *     tags: [Analytics]
 *     summary: Get analytics summary counts
 */

/**
 * @swagger
 * /api/v1/analytics/trend:
 *   get:
 *     tags: [Analytics]
 *     summary: Get analytics event trend
 */

/**
 * @swagger
 * /api/v1/analytics/top-events:
 *   get:
 *     tags: [Analytics]
 *     summary: Get most frequent analytics events
 */
