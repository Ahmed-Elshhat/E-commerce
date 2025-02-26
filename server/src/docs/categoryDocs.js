  // categoryDocs.js

  /**
   * @swagger
   * tags:
   *   name: Categories
   *   description: Category management APIs
   */

  /**
   * @swagger
   * components:
   *   schemas:
   *     Category:
   *       type: object
   *       properties:
   *         id:
   *           type: string
   *           description: Unique identifier for the category
   *         name:
   *           type: string
   *           description: Name of the category
   *         image:
   *           type: string
   *           description: URL of the category image
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: Category creation timestamp
   *         updatedAt:
   *           type: string
   *           format: date-time
   *           description: Category last update timestamp
   */

  /**
   * @swagger
   * /categories:
   *   get:
   *     summary: Get all categories
   *     tags: [Categories]
   *     parameters:
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         description: Filter by exact category name
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Number of items per page
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number for pagination
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: Keyword to filter categories by name
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
   *     responses:
   *       200:
   *         description: Successfully retrieved list of categories
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
   * /categories/{id}:
   *   get:
   *     summary: Get category by ID
   *     tags: [Categories]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: The category ID
   *     responses:
   *       200:
   *         description: Successfully retrieved category
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
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the category
 *               image:
 *                 type: string
 *                 description: URL of the category image
 *     responses:
 *       201:
 *         description: Successfully created a new category
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
 *                     _id:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     __v:
 *                       type: integer
 */

  /**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category details
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the category
 *               image:
 *                 type: string
 *                 description: Updated URL of the category image
 *     responses:
 *       200:
 *         description: Successfully updated the category
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
 *                     __v:
 *                       type: integer
 */

  /**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *     responses:
 *       204:
 *         description: Successfully deleted the category (No Content)
 */
