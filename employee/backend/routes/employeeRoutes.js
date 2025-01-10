const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/auth');

router.post('/add', auth, employeeController.addEmployee);
router.post('/login', employeeController.login);
router.get('/company-employees', auth, employeeController.getCompanyEmployees);
module.exports=router