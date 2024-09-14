const express = require('express');
const router = express.Router();//change handler to this router
const authentication = require('../services/security/authentication')
const authorisation = require('../services/security/authorisation')
const multer = require('multer');

//DB Files
const authController = require('../controllers/authController')

//Route
router.post('/login', (req, res) => authController.login(req, res))
router.post('/logout', (req, res) => authController.logout(req, res))
router.post('/register', (req, res) => authController.register(req, res))
router.post("/authorisation", authentication, (req, res) => authController.authorisation(req, res))

module.exports = router;