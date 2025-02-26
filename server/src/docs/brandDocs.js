// brandDocs.js

/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: Brand management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Brand:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the brand
 *         name:
 *           type: string
 *           description: Name of the brand
 *         image:
 *           type: string
 *           description: URL of the brand image
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Brand creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Brand last update timestamp
 */

/**
 * @swagger
 * /brands:
 *   get:
 *     summary: Get all brands
 *     tags: [Brands]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Keyword to filter brands by name
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sorting criteria (e.g., name, createdAt)
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Select specific fields to return (comma-separated)
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by exact brand name
 *     responses:
 *       200:
 *         description: Successfully retrieved list of brands
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: integer
 *                   description: Number of results returned
 *                 paginationResults:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     numberOfPages:
 *                       type: integer
 *                     next:
 *                       type: integer
 *                       nullable: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       image:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 */

/**
 * @swagger
 * /brands/{id}:
 *   get:
 *     summary: Get a brand by ID
 *     tags: [Brands]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand ID
 *     responses:
 *       200:
 *         description: Successfully retrieved brand data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     image:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 */

/**
 * @swagger
 * /brands:
 *   post:
 *     summary: Create a new brand
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the brand
 *               image:
 *                 type: string
 *                 description: URL of the brand image
 *     responses:
 *       201:
 *         description: Brand created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     image:
 *                       type: string
 *                     _id:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 */

/**
 * @swagger
 * /brands/{id}:
 *   put:
 *     summary: Update a brand by ID
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated brand name
 *               image:
 *                 type: string
 *                 description: Updated brand image
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     image:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 */

/**
 * @swagger
 * /brands/{id}:
 *   delete:
 *     summary: Delete a brand by ID
 *     tags: [Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand ID
 *     responses:
 *       204:
 *         description: Successfully deleted the brand (No Content)
 */
