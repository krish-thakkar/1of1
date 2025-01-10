// src/pages/company/AddEmployee.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import axios from 'axios';

const AddEmployee = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    position: '',
    department: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/employees/add',
        formData,
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );
      navigate('/company');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add employee');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Add New Employee</h2>
        {error && <div className="bg-red-100 text-red-600 p-3 mb-4 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="First Name"
            className="w-full p-2 border rounded"
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          />
          <input
            type="text"
            placeholder="Last Name"
            className="w-full p-2 border rounded"
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-2 border rounded"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <input
            type="text"
            placeholder="Position"
            className="w-full p-2 border rounded"
            value={formData.position}
            onChange={(e) => setFormData({...formData, position: e.target.value})}
          />
          <input
            type="text"
            placeholder="Department"
            className="w-full p-2 border rounded"
            value={formData.department}
            onChange={(e) => setFormData({...formData, department: e.target.value})}
          />
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
          >
            Add Employee
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default AddEmployee;