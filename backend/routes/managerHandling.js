const express = require('express');
const router = express.Router();
const managerController = require('../controllers/managerController');
const { ensureLoggedIn, ensureManager, } = require("../middlewares/authMiddleware");


// Update the route to handle a PUT request
router.put("/approveApplication", ensureManager, (req, res) => managerController.approveApplication(req, res));
router.put("/rejectApplication", ensureManager, (req, res) => managerController.rejectApplication(req, res));


module.exports = router;