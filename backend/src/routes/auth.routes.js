const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateAuthBody } = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validateAuthBody, authController.register);
router.post('/login', validateAuthBody, authController.login);

module.exports = router;