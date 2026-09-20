const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware')
const createAccountController = require('../controllers/account.controller');


const router = express.Router();



/**
 * - POST/api/accounts/
 * - Create a new account
 * - Protected route, requires authentication
 */

router.post('/', authMiddleware.authMiddleware, createAccountController.createAccountController);


module.exports = router;