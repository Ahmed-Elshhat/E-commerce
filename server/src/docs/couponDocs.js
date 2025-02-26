/**
 * @swagger
 * tags:
 *   - name: Coupons
 *     description: Coupon management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       required:
 *         - name
 *         - expire
 *         - discount
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the coupon
 *         name:
 *           type: string
 *           description: Unique name of the coupon
 *         expire:
 *           type: string
 *           format: date
 *           description: Expiration date of the coupon
 *         discount:
 *           type: number
 *           enum: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
 *           description: Discount percentage
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the coupon was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the coupon was last updated
 *       example:
 *         id: "65f3a456b2345c789d01ef23"
 *         name: "SUMMER50"
 *         expire: "2025-06-30T00:00:00.000Z"
 *         discount: 50
 *         createdAt: "2025-02-24T12:00:00.000Z"
 *         updatedAt: "2025-02-24T12:00:00.000Z"
 */

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Get all coupons
 *     tags: [Coupons]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of coupons per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter coupons by name
 *       - in: query
 *         name: expire
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by expiration date (YYYY-MM-DD)
 *       - in: query
 *         name: discount
 *         schema:
 *           type: number
 *         description: Filter by discount percentage (e.g., 10, 20, 30)
 *       - in: query
 *         name: fields
 *         schema:
 *           type: string
 *         description: Select specific fields (comma-separated, e.g., "name,expire,discount")
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort results (e.g., "-expire" for descending order)
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search for coupons by keyword
 *     responses:
 *       200:
 *         description: A list of coupons
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Coupon'
 */

/**
 * @swagger
 * /coupons/{id}:
 *   get:
 *     summary: Get a coupon by ID
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The coupon ID
 *     responses:
 *       200:
 *         description: Successfully retrieved the coupon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Coupon'
 */

/**
 * @swagger
 * /coupons:
 *   post:
 *     summary: Create a new coupon
 *     tags: [Coupons]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - expire
 *               - discount
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique name of the coupon
 *               expire:
 *                 type: string
 *                 format: date
 *                 description: Expiration date of the coupon (YYYY-MM-DD)
 *               discount:
 *                 type: number
 *                 enum: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
 *                 description: Discount percentage
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The auto-generated ID of the coupon
 *                 name:
 *                   type: string
 *                   description: Name of the coupon
 *                 expire:
 *                   type: string
 *                   format: date
 *                   description: Expiration date of the coupon
 *                 discount:
 *                   type: number
 *                   description: Discount percentage
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of when the coupon was created
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of when the coupon was last updated
 *               example:
 *                 id: "65f3a456b2345c789d01ef23"
 *                 name: "SUMMER50"
 *                 expire: "2025-06-30T00:00:00.000Z"
 *                 discount: 50
 *                 createdAt: "2025-02-24T12:00:00.000Z"
 *                 updatedAt: "2025-02-24T12:00:00.000Z"
 */

/**
 * @swagger
 * /coupons/{id}:
 *   put:
 *     summary: Update an existing coupon
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The coupon ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unique name of the coupon
 *               expire:
 *                 type: string
 *                 format: date
 *                 description: Expiration date of the coupon (YYYY-MM-DD)
 *               discount:
 *                 type: number
 *                 enum: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
 *                 description: Discount percentage
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The auto-generated ID of the coupon
 *                 name:
 *                   type: string
 *                   description: Name of the coupon
 *                 expire:
 *                   type: string
 *                   format: date
 *                   description: Expiration date of the coupon
 *                 discount:
 *                   type: number
 *                   description: Discount percentage
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of when the coupon was created
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp of when the coupon was last updated
 *               example:
 *                 id: "65f3a456b2345c789d01ef23"
 *                 name: "WINTER25"
 *                 expire: "2025-12-31T00:00:00.000Z"
 *                 discount: 25
 *                 createdAt: "2025-02-24T12:00:00.000Z"
 *                 updatedAt: "2025-03-01T14:30:00.000Z"
 */

/**
 * @swagger
 * /coupons/{id}:
 *   delete:
 *     summary: Delete a coupon by ID
 *     tags: [Coupons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The coupon ID
 *     responses:
 *       204:
 *         description: Successfully deleted the coupon (No Content)
 */
