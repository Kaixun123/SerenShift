const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManager, ensureHR, ensureManagerAndAbove } = require("../middlewares/authMiddleware");
const employeeController = require("../controllers/employeeController");

// Validation Rules
const employeeValidationRules = () => {
    return [
        check("id").isInt({ allow_leading_zeroes: false, gt: 0 }).withMessage("Invalid ID"),
    ];
};
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
 *     Employee:
 *       type: object
 *       properties:
 *         first_name:
 *           type: string
 *           description: The first name of the employee
 *         last_name:
 *           type: string
 *           description: The last name of the employee
 *         department:
 *           type: string
 *           description: The department of the employee
 *         position:
 *           type: string
 *           description: The position of the employee
 *         country:
 *           type: string
 *           description: The country of the employee
 *         email:
 *           type: string
 *           description: The email of the employee
 *       example:
 *         first_name: John
 *         last_name: Doe
 *         department: Engineering
 *         position: Software Engineer
 *         country: SG
 *         email: johndoe@allinone.com.sg
 */

/**
 * @swagger
 * /api/employee/colleagues:
 *   get:
 *     summary: Retrieve colleagues of the logged-in user
 *     tags: [Employee]
 *     responses:
 *       200:
 *         description: Successfully retrieved colleagues
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
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
 *                 error: An error occurred while retrieving colleagues
 */
router.get("/colleagues", ensureLoggedIn, (req, res) => employeeController.retrieveColleagues(req, res));

/**
 * @swagger
 * /api/employee/subordinates:
 *   get:
 *     summary: Retrieve subordinates of the logged-in user
 *     tags: [Employee]
 *     responses:
 *       200:
 *         description: Successfully retrieved subordinates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
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
 *                 error: An error occurred while retrieving subordinates
 */
router.get("/employee", employeeValidationRules(), vaildateParameters, (req, res) => employeeController.getEmployee(req, res));

/**
 * @swagger
 * /api/employee/employee:
 *   get:
 *     summary: Retrieve details of a specific employee
 *     tags: [Employee]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the employee
 *     responses:
 *       200:
 *         description: Successfully retrieved employee details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       422:
 *         description: Invalid input received
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                         description: Error message
 *                       param:
 *                         type: string
 *                         description: Parameter name
 *                       location:
 *                         type: string
 *                         description: Location of the parameter
 *               example:
 *                 message: Invalid Input Received
 *                 errors: [{ msg: "Invalid ID", param: "id", location: "query" }]
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
 *                 error: An error occurred while retrieving employee details
 */
router.get("/subordinates", ensureManagerAndAbove, (req, res) => employeeController.retrieveSubordinates(req, res));

module.exports = router;
