/**
 * @swagger
 * tags:
 *   - name: Notifications
 *     description: Notification inbox management
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Get current user's notifications
 *   post:
 *     tags: [Notifications]
 *     summary: Create notification
 */

/**
 * @swagger
 * /api/v1/notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 */

/**
 * @swagger
 * /api/v1/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 */

/**
 * @swagger
 * /api/v1/notifications/{id}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification by ID
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete notification
 */

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 */

/**
 * @swagger
 * /api/v1/notifications/{id}/archive:
 *   patch:
 *     tags: [Notifications]
 *     summary: Archive notification
 */
