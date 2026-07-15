/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication APIs
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a tenant and user
 *     responses:
 *       201:
 *         description: User registered successfully
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive JWT token
 *     responses:
 *       200:
 *         description: Login successful
 */

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user
 */

/**
 * @swagger
 * /api/v1/auth/sessions:
 *   get:
 *     tags: [Auth]
 *     summary: Get active sessions
 */

/**
 * @swagger
 * /api/v1/auth/sessions/{id}:
 *   delete:
 *     tags: [Auth]
 *     summary: Revoke session
 */
