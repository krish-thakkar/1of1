const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.post('/create', auth, taskController.createTask);
router.get('/company-tasks', auth, taskController.getCompanyTasks);
router.get('/employee-tasks', auth, taskController.getEmployeeTasks);
router.patch('/:id/status', auth, taskController.updateTaskStatus);

module.exports = router;