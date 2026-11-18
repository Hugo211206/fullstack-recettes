const express = require('express');
const authController = require('../controllers/auth.controller');
const { validateLoginBody, validateRegisterBody } = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', validateRegisterBody, authController.register);
router.post('/login', validateLoginBody, authController.login);

module.exports = router;