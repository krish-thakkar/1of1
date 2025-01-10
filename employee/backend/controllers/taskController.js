const Task = require('../models/Task');

const taskController = {
  createTask: async (req, res) => {
    try {
      const { assignedTo, title, description, dueDate, priority } = req.body;

      const task = new Task({
        companyId: req.user.id,
        assignedTo,
        title,
        description,
        dueDate,
        priority
      });

      await task.save();
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getCompanyTasks: async (req, res) => {
    try {
      const tasks = await Task.find({ companyId: req.user.id })
        .populate('assignedTo', 'firstName lastName email');
      res.json(tasks);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getEmployeeTasks: async (req, res) => {
    try {
      const tasks = await Task.find({ assignedTo: req.user.id });
      res.json(tasks);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  updateTaskStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const task = await Task.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = taskController;