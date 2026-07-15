/**
 * @swagger
 * tags:
 *   - name: Search
 *     description: Global tenant search
 */

/**
 * @swagger
 * /api/v1/search:
 *   get:
 *     tags: [Search]
 *     summary: Search across tenant resources
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *           minimum: 1
 *           maximum: 25
 *       - in: query
 *         name: types
 *         description: Comma-separated resource types to search
 *         schema:
 *           type: string
 *           example: projects,tasks,bugs
 *     responses:
 *       200:
 *         description: Search results fetched successfully
 */
