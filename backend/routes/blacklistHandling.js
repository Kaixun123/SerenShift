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


router.get("/getBlockedDates", getBlacklistDatesValidationRules(), vaildateParameters, ensureLoggedIn, (req, res) => blacklistController.getBlacklistDates(req, res));
router.get("/getBlacklistDates", ensureManagerAndAbove, (req, res) => blacklistController.getBlacklistDatesManager(req, res));
router.get("/getBlacklistDate/:blacklist_id", getBlacklistDateValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => blacklistController.getBlacklistDate(req, res));
router.post("/createBlacklistDate", createBlacklistDateValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => blacklistController.createBlacklistDate(req, res));
router.patch("/updateBlacklistDate/:blacklist_id", updateBlacklistDateValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => blacklistController.updateBlacklistDate(req, res));
router.delete("/deleteBlacklistDate/:blacklist_id", deleteBlacklistDateValidationRules(), vaildateParameters, ensureManagerAndAbove, (req, res) => blacklistController.deleteBlacklistDate(req, res));

module.exports = router;
