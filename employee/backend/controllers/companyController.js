const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const companyController = {
  register: async (req, res) => {
    try {
      const { companyName, email, password, address, phoneNumber } = req.body;
      
      const existingCompany = await Company.findOne({ 
        $or: [{ email }, { companyName }] 
      });
      
      if (existingCompany) {
        return res.status(400).json({ 
          error: 'Company with this email or name already exists' 
        });
      }

      const company = new Company({
        companyName,
        email,
        password,
        address,
        phoneNumber
      });

      await company.save();

      const token = jwt.sign(
        { id: company._id, type: 'company' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({ company, token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const company = await Company.findOne({ email });

      if (!company) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, company.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: company._id, type: 'company' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ company, token });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  getCompanyProfile: async (req, res) => {
    try {
      const company = await Company.findById(req.user.id).select('-password');
      res.json(company);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = companyController;