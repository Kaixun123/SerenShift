const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManagerAndAbove, ensureHR } = require("../middlewares/authMiddleware");
const scheduleController = require("../controllers/scheduleController");

const retrieveTeamScheduleValidationRules = () => {
    return [
        check("colleague_id").optional().isString().withMessage("Invalid Colleague ID"),
        check("start_date").optional().isISO8601().toDate().withMessage("Invalid Start Date"),
        check("end_date").optional().isISO8601().toDate().withMessage("Invalid End Date"),
    ];
};

const retrieveSubordinateScheduleValidationRules = () => {
    return [
        check("colleague_id").optional().isString().withMessage("Invalid Colleague ID"),
        check("start_date").optional().isISO8601().toDate().withMessage("Invalid Start Date"),
        check("end_date").optional().isISO8601().toDate().withMessage("Invalid End Date"),
    ];
};

const retrieveCompanyScheduleValidationRules = () => {
    return [
        check("date").optional().isISO8601().toDate().withMessage("Invalid Date")
    ];
}

const retrieveDepartmentScheduleValidationRules = () => {
    return [
        check("department").optional().isString().withMessage("Invalid Department Input"),
        check("date").optional().isISO8601().toDate().withMessage("Invalid Date")
    ];
}

// Validation Middleware
const vaildateParameters = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    return res.status(422).json({
        message: "Invalid Input Received",
        errors: errors.array()
    });
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       properties:
 *         schedule_id:
 *           type: integer
 *           description: The schedule ID
 *         start_date:
 *           type: string
 *           format: date-time
 *           description: The start date of the schedule
 *         end_date:
 *           type: string
 *           format: date-time
 *           description: The end date of the schedule
 *         schedule_type:
 *           type: string
 *           description: The type of schedule
 *         created_by:
 *           type: integer
 *           description: The ID of the user who created the schedule
 *         last_update_by:
 *           type: integer
 *           description: The ID of the user who last updated the schedule
 *         verify_by:
 *           type: integer
 *           description: The ID of the user who verified the schedule
 *         verify_timestamp:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the schedule was verified
 *         created_timestamp:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the schedule was created
 *         last_update_timestamp:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the schedule was last updated
 *       example:
 *         schedule_id: 1
 *         start_date: 2023-01-01T09:00:00.000Z
 *         end_date: 2023-01-01T18:00:00.000Z
 *         schedule_type: "WFH"
 *         created_by: 1
 *         last_update_by: 1
 *         verify_by: 2
 *         verify_timestamp: 2023-01-01T08:00:00.000Z
 *         created_timestamp: 2023-01-01T07:00:00.000Z
 *         last_update_timestamp: 2023-01-01T07:30:00.000Z
 */

/**
 * @swagger
 * /api/schedule/ownSchedule:
 *   get:
 *     summary: Retrieve own schedule
 *     tags: [Schedule]
 *     responses:
 *       200:
 *         description: Successfully retrieved own schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Schedule'
 *       404:
 *         description: No schedules found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: No schedules found for this user.
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
 *                 error: An error occurred while retrieving the schedule.
 */
router.get("/ownSchedule", ensureLoggedIn, (req, res) => scheduleController.retrieveOwnSchedule(req, res));

/**
 * @swagger
 * /api/schedule/teamSchedule:
 *   get:
 *     summary: Retrieve team schedule
 *     tags: [Schedule]
 *     parameters:
 *       - in: query
 *         name: colleague_id
 *         schema:
 *           type: string
 *         description: The ID of the colleague
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: The start date to filter schedules
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: The end date to filter schedules
 *     responses:
 *       200:
 *         description: Successfully retrieved team schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   AM:
 *                     type: array
 *                     items:
 *                       type: string
 *                   PM:
 *                     type: array
 *                     items:
 *                       type: string
 *                   FullDay:
 *                     type: array
 *                     items:
 *                       type: string
 *       404:
 *         description: No WFH schedules found for this team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: No WFH schedules found for this team.
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
 *                 error: An error occurred while retrieving the team schedule.
 */
router.get("/teamSchedule", retrieveTeamScheduleValidationRules(), vaildateParameters, ensureLoggedIn, (req, res) => scheduleController.retrieveTeamSchedule(req, res));

/**
 * @swagger
 * /api/schedule/subordinateSchedule:
 *   get:
 *     summary: Retrieve subordinate schedule
 *     tags: [Schedule]
 *     parameters:
 *       - in: query
 *         name: colleague_id
 *         schema:
 *           type: string
 *         description: The ID of the colleague
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: The start date to filter schedules
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: The end date to filter schedules
 *     responses:
 *       200:
 *         description: Successfully retrieved subordinate schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   AM:
 *                     type: array
 *                     items:
 *                       type: string
 *                   PM:
 *                     type: array
 *                     items:
 *                       type: string
 *                   FullDay:
 *                     type: array
 *                     items:
 *                       type: string
 *       404:
 *         description: No WFH schedules found for this team
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *               example:
 *                 message: No WFH schedules found for this team.
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
 *                 error: An error occurred while retrieving the team schedule.
 */
router.get("/subordinateSchedule", retrieveSubordinateScheduleValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => scheduleController.retrieveSubordinateSchedule(req, res));

/**
 * @swagger
 * /api/schedule/companySchedule:
 *   get:
 *     summary: Retrieve company schedule
 *     tags: [Schedule]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: The date to filter schedules
 *     responses:
 *       200:
 *         description: Successfully retrieved company schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   wfo:
 *                     type: integer
 *                     description: Number of employees working from office
 *                   wfh:
 *                     type: integer
 *                     description: Number of employees working from home
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
 *                 error: An error occurred while retrieving staff data.
 */
router.get("/companySchedule", retrieveCompanyScheduleValidationRules(), vaildateParameters, ensureHR, (req, res) => scheduleController.retrieveCompanySchedule(req, res));

/**
 * @swagger
 * /api/schedule/departmentSchedule:
 *   get:
 *     summary: Retrieve department schedule
 *     tags: [Schedule]
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: The department to filter schedules
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: The date to filter schedules
 *     responses:
 *       200:
 *         description: Successfully retrieved department schedule
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wfhStats:
 *                   type: object
 *                   properties:
 *                     department:
 *                       type: string
 *                       description: The department name
 *                     wfh:
 *                       type: object
 *                       properties:
 *                         am:
 *                           type: number
 *                           description: Percentage of employees working from home in the morning
 *                         pm:
 *                           type: number
 *                           description: Percentage of employees working from home in the afternoon
 *                         fullDay:
 *                           type: number
 *                           description: Percentage of employees working from home for the full day
 *                 wfhStaff:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: The employee ID
 *                       name:
 *                         type: string
 *                         description: The employee name
 *                       wfhPeriod:
 *                         type: string
 *                         description: The period the employee is working from home (AM, PM, Full-Day)
 *                       position:
 *                         type: string
 *                         description: The employee position
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
 *                 error: An error occurred while retrieving staff data.
 */
router.get("/departmentSchedule", retrieveDepartmentScheduleValidationRules(), vaildateParameters, ensureHR, (req, res) => scheduleController.retrieveDepartmentSchedule(req, res));

module.exports = router;