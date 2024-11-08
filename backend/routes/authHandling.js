const express = require('express');
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn } = require("../middlewares/authMiddleware");
const authController = require('../controllers/authController')
// Validation Rules
const loginValidationRules = () => {
    return [
        check("emailAddress").isEmail().notEmpty().withMessage("Invalid email address").trim(),
        check("password").isString().notEmpty().withMessage("Password cannot be empty").trim(),
    ];
}
// Validation Middleware
const vaildateParameters = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return res.status(422).json({
        message: "Invaild Input Received",
        errors: errors.array()
    });
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Login:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: The email of the user
 *         password:
 *           type: string
 *           description: The password of the user
 *       example:
 *         email: johndoe@allinone.com.sg
 *         password: password123
 * 
 * /api/auth/login:
 *   post:
 *     summary: Logs in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Login'
 *     responses:
 *       200:
 *         description: Login successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 token:
 *                   type: string
 *                   description: JWT token
 *               example:
 *                 message: Login successfully
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Invalid credentials
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Internal server error
 * 
 * /api/auth/logout:
 *   get:
 *     summary: Logs out a user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *               example:
 *                 message: Logged out successfully
 * 
 * /api/auth/me:
 *   get:
 *     summary: Retrieves the authenticated user's information
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successfully retrieved user information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Employee not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Internal server error
 * 
 * /api/auth/validateToken:
 *   get:
 *     summary: Validates the JWT token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *               example:
 *                 message: Token is valid
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Invalid token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 error: Internal server error
 */
router.patch('/extendDuration', ensureLoggedIn, (req, res) => authController.extendDuration(req, res))
router.post('/login', loginValidationRules(), vaildateParameters, (req, res) => authController.login(req, res))
router.get('/logout', ensureLoggedIn, (req, res) => authController.logout(req, res))
router.get('/me', ensureLoggedIn, (req, res) => authController.me(req, res))
router.get('/validateToken', ensureLoggedIn, (req, res) => authController.validateToken(req, res))

module.exports = router;