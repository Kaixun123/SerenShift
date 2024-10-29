const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const { ensureLoggedIn, ensureManagerAndAbove } = require("../middlewares/authMiddleware");
const notificationController = require("../controllers/notificationController")

router.get("/retrieveNotifications", ensureLoggedIn, (req, res) => notificationController.retrieveNotifications(req, res));
router.patch("/updateNotificationReadStatus", ensureLoggedIn, (req, res) => notificationController.updateNotificationReadStatus(req, res));
router.delete("/clearNotifications", ensureLoggedIn, (req, res) => notificationController.clearNotifications(req, res));
router.put("/sendEmail", (req, res) => notificationController.sendEmail(req, res));

module.exports = router;
