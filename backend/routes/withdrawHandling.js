const express = require('express');
const router = express.Router();
const withdrawController = require('../controllers/withdrawController');
const { ensureLoggedIn } = require("../middlewares/authMiddleware");


// Update the route to handle a PUT request
router.put("/withdrawPending", ensureLoggedIn, (req, res) => withdrawController.withdrawPendingApplications(req, res));


module.exports = router;