const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManager, ensureHR } = require("../middlewares/authMiddleware");
const hrController = require("../controllers/hrController");

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

router.get("/totalstaffstat", ensureHR, (req, res) => hrController.retrieveTotalStaffStat(req, res));
router.get("/deptstaffstat", ensureHR, (req, res) => hrController.retrieveDeptStaffStat(req, res));

module.exports = router;