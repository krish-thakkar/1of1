const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const auth = require('../middleware/auth');

router.post('/register', companyController.register);
router.post('/login', companyController.login);
router.get('/profile', auth, companyController.getCompanyProfile);

module.exports=router