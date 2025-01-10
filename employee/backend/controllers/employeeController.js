const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const employeeController = {
  addEmployee: async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        position,
        department
      } = req.body;

      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        return res.status(400).json({ 
          error: 'Employee with this email already exists' 
        });
      }

      const employee = new Employee({
        companyId: req.user.id,
        firstName,
        lastName,
        email,
        password,
        position,
        department
      });

      await employee.save();
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const employee = await Employee.findOne({ email });

      if (!employee) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, employee.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: employee._id, type: 'employee', companyId: employee.companyId },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ employee, token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getCompanyEmployees: async (req, res) => {
    try {
      const employees = await Employee.find({ 
        companyId: req.user.id 
      }).select('-password');
      res.json(employees);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = employeeController;