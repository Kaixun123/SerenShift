const express = require("express");
const router = express.Router();
const multer = require('multer');
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManagerAndAbove, ensureManager } = require("../middlewares/authMiddleware");
const applicationController = require("../controllers/applicationController");
const upload = multer({ storage: multer.memoryStorage() });

// Create New Application Validation Rules
const createNewApplicationValidationRules = () => {
    return [
        check("application_type").isString().isIn(['Regular', 'Ad Hoc']).withMessage("Invalid Application Type"),
        check("startDate").isISO8601().toDate().withMessage("Invalid Start Date For Application"),
        check("endDate").isISO8601().toDate().withMessage("Invalid End Date for Application"),
        check("requestor_remarks").optional().isString().isLength({ max: 255 }).withMessage("Requestor Remarks Is Too Long For Application"),
        check("recurrence_rule").optional().isString().withMessage("Invalid Recurrence Rule For Application"),
        check("recurrence_end_date").optional().isISO8601().toDate().withMessage("Invalid Recurrence End Date For Application"),
    ];
};

// Approve Pending Application Validation Rules
const approvePendingApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }).withMessage("Invalid Application ID"),
        check("approverRemarks").isString().isLength({ max: 255 }).withMessage("Approver Remarks Is Too Long"),
    ];
};

// Reject Pending Application Validation Rules
const rejectPendingApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }).withMessage("Invalid Application ID"),
        check("approverRemarks").isString().isLength({ max: 255 }).withMessage("Approver Remarks Is Too Long"),
    ];
};

// Withdraw Pending Application Validation Rules
const withdrawPendingApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }).withMessage("Invalid Application ID"),
    ];
};

// Withdraw Approved Application Validation Rules
const withdrawApprovedApplicationValidationRules = () => {
    return [
        check("application_id").isInt({ allow_leading_zeroes: false, gt: 0 }).withMessage("Invalid Application ID"),
        // check("rejectedDates").optional().isArray().withMessage("Rejected Dates Must Be An Array of Dates"),
    ];
};


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
 *     Application:
 *       type: object
 *       properties:
 *         application_id:
 *           type: integer
 *           description: The application ID
 *         application_type:
 *           type: string
 *           description: The type of application
 *         start_date:
 *           type: string
 *           format: date
 *           description: The start date of the application
 *         end_date:
 *           type: string
 *           format: date
 *           description: The end date of the application
 *         requestor_remarks:
 *           type: string
 *           description: Remarks from the requestor
 *         approver_remarks:
 *           type: string
 *           description: Remarks from the approver
 *         created_by:
 *           type: integer
 *           description: The ID of the user who created the application
 *         last_update_by:
 *           type: integer
 *           description: The ID of the user who last updated the application
 *         verify_by:
 *           type: integer
 *           description: The ID of the user who verified the application
 *         verify_timestamp:
 *           type: string
 *           format: date-time
 *           description: The timestamp when the application was verified
 *         status:
 *           type: string
 *           description: The status of the application
 *       example:
 *         application_id: 1
 *         application_type: Regular
 *         start_date: 2023-01-01
 *         end_date: 2023-01-10
 *         requestor_remarks: Need to work from home
 *         approver_remarks: Approved
 *         created_by: 1
 *         last_update_by: 2
 *         verify_by: 3
 *         verify_timestamp: 2023-01-01T10:00:00Z
 *         status: Approved
 */

/**
 * @swagger
 * /api/application/retrieveApplications:
 *   get:
 *     summary: Retrieve application data based on userId and status
 *     tags: [Application]
 *     responses:
 *       200:
 *         description: Successfully retrieved applications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Application'
 *       404:
 *         description: Employee not found
 *       500:
 *         description: An error occurred while fetching application
 */
router.get("/retrieveApplications", ensureLoggedIn, (req, res) => applicationController.retrieveApplications(req, res));

/**
 * @swagger
 * /api/application/retrievePendingApplications:
 *   get:
 *     summary: Retrieve pending applications of subordinates
 *     tags: [Application]
 *     responses:
 *       200:
 *         description: Successfully retrieved pending applications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Application'
 *       500:
 *         description: An error occurred while fetching application
 */
router.get("/retrievePendingApplications", ensureManagerAndAbove, (req, res) => applicationController.retrievePendingApplications(req, res));

/**
 * @swagger
 * /api/application/retrieveApprovedApplication:
 *   get:
 *     summary: Retrieve approved applications of subordinates
 *     tags: [Application]
 *     responses:
 *       200:
 *         description: Successfully retrieved approved applications
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Application'
 *       500:
 *         description: An error occurred while fetching application
 */
router.get("/retrieveApprovedApplication", ensureManagerAndAbove, (req, res) => applicationController.retrieveApprovedApplications(req, res));

/**
 * @swagger
 * /api/application/createNewApplication:
 *   post:
 *     summary: Create a new application
 *     tags: [Application]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               application_type:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               requestor_remarks:
 *                 type: string
 *               recurrence_rule:
 *                 type: string
 *               recurrence_end_date:
 *                 type: string
 *                 format: date
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: New application successfully created
 *       400:
 *         description: Invalid application period
 *       500:
 *         description: An error occurred while creating new application
 */
router.post("/createNewApplication", createNewApplicationValidationRules(), ensureLoggedIn, upload.array('files'), (req, res) => applicationController.createNewApplication(req, res))

/**
 * @swagger
 * /api/application/approveApplication:
 *   patch:
 *     summary: Approve a pending application
 *     tags: [Application]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application_id:
 *                 type: integer
 *               approverRemarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application approved successfully
 *       400:
 *         description: Application is not in Pending status or cannot approve application which has passed
 *       404:
 *         description: Application not found
 *       500:
 *         description: An error occurred while approving the application
 */
router.patch("/approveApplication", approvePendingApplicationValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => applicationController.approvePendingApplication(req, res));

/**
 * @swagger
 * /api/application/rejectApplication:
 *   patch:
 *     summary: Reject a pending application
 *     tags: [Application]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application_id:
 *                 type: integer
 *               approverRemarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application rejected successfully
 *       400:
 *         description: Application is not in Pending status or cannot reject application which has started
 *       404:
 *         description: Application not found
 *       500:
 *         description: An error occurred while rejecting the application
 */
router.patch("/rejectApplication", rejectPendingApplicationValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => applicationController.rejectPendingApplication(req, res));

/**
 * @swagger
 * /api/application/withdrawPending:
 *   patch:
 *     summary: Withdraw a pending application
 *     tags: [Application]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Application updated to withdrawn successfully
 *       404:
 *         description: Application not found or not authorized
 *       500:
 *         description: An error occurred while withdrawing the application
 */
router.patch("/withdrawPending", withdrawPendingApplicationValidationRules(), vaildateParameters, ensureLoggedIn, (req, res) => applicationController.withdrawPendingApplication(req, res));

/**
 * @swagger
 * /api/application/withdrawApproved:
 *   patch:
 *     summary: Withdraw an approved application
 *     tags: [Application]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Application updated to withdrawn successfully
 *       404:
 *         description: Application not found or not authorized
 *       500:
 *         description: An error occurred while withdrawing the application
 */
router.patch("/withdrawApproved", withdrawApprovedApplicationValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => applicationController.withdrawApprovedApplication(req, res));

/**
 * @swagger
 * /api/application/withdrawSpecificApproved:
 *   patch:
 *     summary: Withdraw specific dates from a multiday application
 *     tags: [Application]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application_id:
 *                 type: integer
 *               withdrawDates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: date
 *               remarks:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Specific dates successfully withdrawn
 *       404:
 *         description: No approved application found for application_id
 *       500:
 *         description: An error occurred while withdrawing specific dates
 */
router.patch("/withdrawSpecificApproved", withdrawApprovedApplicationValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => applicationController.withdrawSpecificDates(req, res));

/**
 * @swagger
 * /api/application/updatePendingApplication:
 *   patch:
 *     summary: Update a pending application
 *     tags: [Application]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               application_id:
 *                 type: integer
 *               application_type:
 *                 type: string
 *               originalStartDate:
 *                 type: string
 *                 format: date
 *               originalEndDate:
 *                 type: string
 *                 format: date
 *               newStartDate:
 *                 type: string
 *                 format: date
 *               newEndDate:
 *                 type: string
 *                 format: date
 *               requestor_remarks:
 *                 type: string
 *               recurrence_rule:
 *                 type: string
 *               recurrence_end_date:
 *                 type: string
 *                 format: date
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Pending application successfully updated
 *       400:
 *         description: Invalid application period
 *       404:
 *         description: Pending application not found
 *       500:
 *         description: An error occurred while updating the application
 */
router.patch("/updatePendingApplication", ensureLoggedIn, upload.array('files'), (req, res) => applicationController.updatePendingApplication(req, res));

/**
 * @swagger
 * /api/application/withdrawApprovedApplicationByEmployee:
 *   patch:
 *     summary: Withdraw an approved application by an employee
 *     tags: [Application]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Withdrawal request of approved application successfully sent to the manager
 *       404:
 *         description: Employee or approved application not found
 *       500:
 *         description: An error occurred while withdrawing application
 */
router.patch("/withdrawApprovedApplicationByEmployee", ensureLoggedIn, (req, res) => applicationController.withdrawApprovedApplicationByEmployee(req, res));

/**
 * @swagger
 * /api/application/rejectWithdrawalOfApprovedApplication:
 *   patch:
 *     summary: Reject the withdrawal of an approved application
 *     tags: [Application]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               application_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Reject withdrawal of approved application successfully
 *       404:
 *         description: Application not found or not authorized
 *       500:
 *         description: An error occurred while approving withdrawal of approved application
 */
router.patch("/rejectWithdrawalOfApprovedApplication", ensureManagerAndAbove, (req, res) => applicationController.rejectWithdrawalOfApprovedApplication(req, res));

/**
 * @swagger
 * /api/application/updateApprovedApplication:
 *   patch:
 *     summary: Update an approved application
 *     tags: [Application]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               application_id:
 *                 type: integer
 *               application_type:
 *                 type: string
 *               originalStartDate:
 *                 type: string
 *                 format: date
 *               originalEndDate:
 *                 type: string
 *                 format: date
 *               newStartDate:
 *                 type: string
 *                 format: date
 *               newEndDate:
 *                 type: string
 *                 format: date
 *               requestor_remarks:
 *                 type: string
 *               recurrence_rule:
 *                 type: string
 *               recurrence_end_date:
 *                 type: string
 *                 format: date
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Application has been updated for manager approval
 *       400:
 *         description: Invalid application period
 *       404:
 *         description: Pending application not found
 *       500:
 *         description: An error occurred while retrieving the schedule
 */
router.patch("/updateApprovedApplication", ensureLoggedIn, upload.array('files'), (req, res) => applicationController.updateApprovedApplication(req, res));

module.exports = router;
