/**
 * @swagger
 * tags:
 *   - name: Email
 *     description: Tenant-scoped email sending and delivery logs
 */

/**
 * @swagger
 * /api/v1/emails:
 *   post:
 *     tags: [Email]
 *     summary: Send or queue an email
 *   get:
 *     tags: [Email]
 *     summary: List email logs
 */

/**
 * @swagger
 * /api/v1/emails/summary:
 *   get:
 *     tags: [Email]
 *     summary: Get email delivery summary
 */

/**
 * @swagger
 * /api/v1/emails/{id}:
 *   get:
 *     tags: [Email]
 *     summary: Get email log by ID
 */

/**
 * @swagger
 * /api/v1/emails/{id}/retry:
 *   patch:
 *     tags: [Email]
 *     summary: Retry a queued or failed email
 */
