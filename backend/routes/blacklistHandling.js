const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManagerAndAbove } = require("../middlewares/authMiddleware");
const blacklistController = require("../controllers/blacklistController");

// Retrieve Blacklist Dates
const getBlacklistDatesValidationRules = () => {
    return [
        check("start_date").optional().isISO8601().toDate().withMessage("Invalid Start Date"),
        check("end_date").optional().isISO8601().toDate().withMessage("Invalid End Date")
    ]
};

// Retrieve Specific Blacklist Date
const getBlacklistDateValidationRules = () => {
    return [
        check("blacklist_id").isInt().withMessage("Invalid Blacklist ID")
    ];
};

// Create New Blacklist Date Vaildation Rules
const createBlacklistDateValidationRules = () => {
    return [
        check("startDateTime").isISO8601().toDate().withMessage("Invalid Start Date For Blacklist"),
        check("endDateTime").isISO8601().toDate().withMessage("Invalid End Date for Blacklist"),
        check("remarks").isString().isLength({ max: 255 }).withMessage("Remarks Is Too Long For Blacklist"),
        check("recurrenceRule").optional().isString().isIn(['day', 'week', 'month']).withMessage("Invalid Recurrence Rule For Blacklist"),
        check("recurrenceEndDateTime").optional().isISO8601().toDate().withMessage("Invalid Recurrence End Date For Blacklist")
    ];
};

// Update Blacklist Date Vaildation Rules
const updateBlacklistDateValidationRules = () => {
    return [
        check("blacklist_id").isInt().withMessage("Invalid Blacklist ID"),
        check("startDateTime").isISO8601().toDate().withMessage("Invalid Start Date For Blacklist"),
        check("endDateTime").isISO8601().toDate().withMessage("Invalid End Date for Blacklist"),
        check("remarks").isString().isLength({ max: 255 }).withMessage("Remarks Is Too Long For Blacklist")
    ]
};

// Delete Blacklist Date Vaildation Rules
const deleteBlacklistDateValidationRules = () => {
    return [
        check("blacklist_id").isInt().withMessage("Invalid Blacklist ID")
    ]
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
 *     Blacklist:
 *       type: object
 *       properties:
 *         blacklist_id:
 *           type: integer
 *           description: The blacklist ID
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: The start date of the blacklist
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: The end date of the blacklist
 *         created_by:
 *           type: integer
 *           description: The ID of the user who created the blacklist
 *         last_update_by:
 *           type: integer
 *           description: The ID of the user who last updated the blacklist
 *         remarks:
 *           type: string
 *           description: Remarks for the blacklist
 *       example:
 *         blacklist_id: 1
 *         start_date: 2023-01-01T00:00:00.000Z
 *         end_date: 2023-01-02T00:00:00.000Z
 *         created_by: 1
 *         last_update_by: 1
 *         remarks: "Holiday"
 */

/**
 * @swagger
 * /api/blacklist/getBlockedDates:
 *   get:
 *     summary: Retrieve blacklist dates when an individual employee is applying
 *     tags: [Blacklist]
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: The start date to filter blacklist dates
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: The end date to filter blacklist dates
 *     responses:
 *       200:
 *         description: Successfully retrieved blacklist dates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Blacklist'
 *       404:
 *         description: No blacklist dates found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: No Blacklist Dates Found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Internal Server Error
 */
router.get("/getBlockedDates", getBlacklistDatesValidationRules(), vaildateParameters, ensureLoggedIn, (req, res) => blacklistController.getBlacklistDates(req, res));

/**
 * @swagger
 * /api/blacklist/getBlacklistDates:
 *   get:
 *     summary: Retrieve blacklist dates for reporting manager
 *     tags: [Blacklist]
 *     responses:
 *       200:
 *         description: Successfully retrieved blacklist dates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Blacklist'
 *       404:
 *         description: No blacklist dates found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: No Blacklist Dates Found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Internal Server Error
 */
router.get("/getBlacklistDates", ensureManagerAndAbove, (req, res) => blacklistController.getBlacklistDatesManager(req, res));

/**
 * @swagger
 * /api/blacklist/getBlacklistDate/{blacklist_id}:
 *   get:
 *     summary: Retrieve a specific blacklist date
 *     tags: [Blacklist]
 *     parameters:
 *       - in: path
 *         name: blacklist_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the blacklist date
 *     responses:
 *       200:
 *         description: Successfully retrieved the blacklist date
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blacklist'
 *       404:
 *         description: Blacklist date not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Blacklist Date Not Found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Internal Server Error
 */
router.get("/getBlacklistDate/:blacklist_id", getBlacklistDateValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => blacklistController.getBlacklistDate(req, res));

/**
 * @swagger
 * /api/blacklist/createBlacklistDate:
 *   post:
 *     summary: Create a new blacklist date
 *     tags: [Blacklist]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: The start date and time of the blacklist
 *               endDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: The end date and time of the blacklist
 *               remarks:
 *                 type: string
 *                 description: Remarks for the blacklist
 *               recurrenceRule:
 *                 type: string
 *                 description: Recurrence rule for the blacklist
 *               recurrenceEndDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: The end date and time for the recurrence
 *             example:
 *               startDateTime: 2023-01-01T00:00:00.000Z
 *               endDateTime: 2023-01-02T00:00:00.000Z
 *               remarks: "Holiday"
 *               recurrenceRule: "week"
 *               recurrenceEndDateTime: 2023-12-31T00:00:00.000Z
 *     responses:
 *       201:
 *         description: Blacklist date created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *                 blacklist_id:
 *                   type: integer
 *                   description: The ID of the created blacklist date
 *               example:
 *                 message: Blacklist Date Created Successfully
 *                 blacklist_id: 1
 *       400:
 *         description: A conflicting blacklist date entry already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: A Conflicting Blacklist Date Entry Already Exists
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Internal Server Error
 */
router.post("/createBlacklistDate", createBlacklistDateValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => blacklistController.createBlacklistDate(req, res));

/**
 * @swagger
 * /api/blacklist/updateBlacklistDate/{blacklist_id}:
 *   patch:
 *     summary: Update an existing blacklist date
 *     tags: [Blacklist]
 *     parameters:
 *       - in: path
 *         name: blacklist_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the blacklist date
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: The start date and time of the blacklist
 *               endDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: The end date and time of the blacklist
 *               remarks:
 *                 type: string
 *                 description: Remarks for the blacklist
 *             example:
 *               startDateTime: 2023-01-01T00:00:00.000Z
 *               endDateTime: 2023-01-02T00:00:00.000Z
 *               remarks: "Holiday"
 *     responses:
 *       200:
 *         description: Blacklist date updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *               example:
 *                 message: Blacklist Date Updated Successfully
 *       400:
 *         description: A conflicting blacklist date entry already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: A Conflicting Blacklist Date Entry Already Exists
 *       404:
 *         description: Blacklist date not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Blacklist Date Not Found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Internal Server Error
 */
router.patch("/updateBlacklistDate/:blacklist_id", updateBlacklistDateValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => blacklistController.updateBlacklistDate(req, res));

/**
 * @swagger
 * /api/blacklist/deleteBlacklistDate/{blacklist_id}:
 *   delete:
 *     summary: Delete an existing blacklist date
 *     tags: [Blacklist]
 *     parameters:
 *       - in: path
 *         name: blacklist_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the blacklist date
 *     responses:
 *       200:
 *         description: Blacklist date deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *               example:
 *                 message: Blacklist Date Deleted Successfully
 *       400:
 *         description: Blacklist date has already passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Blacklist Date Has Already Passed
 *       404:
 *         description: Blacklist date not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Blacklist Date Not Found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: Internal Server Error
 */
router.delete("/deleteBlacklistDate/:blacklist_id", deleteBlacklistDateValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => blacklistController.deleteBlacklistDate(req, res));

module.exports = router;
