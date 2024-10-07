const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
<<<<<<< HEAD
const { ensureManager, } = require("../middlewares/authMiddleware");

// Get the route to handle a GET request
router.get("/retrievePendingApplication", ensureManager, (req, res) => managerController.retrievePendingApplication(req, res))
=======
const { ensureLoggedIn, ensureManager, } = require("../middlewares/authMiddleware");

>>>>>>> bb83bd5 (feat:SPMPROJ-15 backend for approving and rejecting application created)

// Update the route to handle a PUT request
router.put("/approveApplication", ensureManager, (req, res) => managerController.approveApplication(req, res));
router.put("/rejectApplication", ensureManager, (req, res) => managerController.rejectApplication(req, res));


module.exports = router;