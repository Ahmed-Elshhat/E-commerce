
/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: Authentication management APIs
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated user ID
 *         accessToken:
 *           type: string
 *           description: OAuth2 access token for authentication
 *         googleId:
 *           type: string
 *           description: Unique Google ID for OAuth authentication
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: Unique email address
 *         password:
 *           type: string
 *           format: password
 *           description: User password (hashed)
 *         role:
 *           type: string
 *           enum: [user, employee, admin]
 *           description: User role (default is "user")
 *         active:
 *           type: boolean
 *           default: true
 *           description: Whether the user is active
 *       example:
 *         id: "65f3a456b2345c789d01ef99"
 *         accessToken: "ya29.a0AfH6SM..."
 *         googleId: "112233445566778899"
 *         name: "John Doe"
 *         email: "johndoe@example.com"
 *         password: "hashedpassword"
 *         role: "user"
 *         active: true
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Sign up a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Unique email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Password for the account
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Must match the password
 *     responses:
 *       201:
 *         description: User signed up successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: User's full name
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: User's email address
 *                     role:
 *                       type: string
 *                       description: User role (default is "user")
 *                     active:
 *                       type: boolean
 *                       description: Whether the user is active
 *                     addresses:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of user addresses
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Account creation timestamp
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Last update timestamp
 *                     id:
 *                       type: string
 *                       description: User ID
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *               example:
 *                 user:
 *                   name: "example user"
 *                   email: "user@example.com"
 *                   role: "user"
 *                   active: true
 *                   addresses: []
 *                   createdAt: "2025-02-23T23:00:23.905Z"
 *                   updatedAt: "2025-02-23T23:00:23.905Z"
 *                   id: "67bba8876e4c24294df3e165"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error (e.g., passwords do not match)
 *       409:
 *         description: Email already exists
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Registered email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User password
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: User's full name
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: User's email address
 *                     role:
 *                       type: string
 *                       description: User role (e.g., "admin", "user")
 *                     active:
 *                       type: boolean
 *                       description: Whether the user is active
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: Account creation timestamp
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Last update timestamp
 *                     addresses:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of user addresses
 *                     id:
 *                       type: string
 *                       description: User ID
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *               example:
 *                 user:
 *                   name: "example user"
 *                   email: "user@example.com"
 *                   role: "admin"
 *                   active: true
 *                   createdAt: "2025-01-22T05:37:33.798Z"
 *                   updatedAt: "2025-01-22T05:37:33.798Z"
 *                   addresses: []
 *                   id: "6790841d6360eb03c6f7d852"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
