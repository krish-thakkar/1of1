// AddEmployee.js
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import axios from 'axios';
import { UserPlus, Mail, Lock, Briefcase, Users } from 'lucide-react';
import toast from 'react-hot-toast';

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
      toast.success('Employee added successfully!');
      navigate('/company');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add employee');
    }
  };

  const inputClasses = "w-full p-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200";
  const iconClasses = "text-purple-500 absolute left-3 top-1/2 transform -translate-y-1/2";

  return (
    <Layout>
      <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <div className="flex items-center gap-3 mb-8">
          <UserPlus className="text-purple-600 w-8 h-8" />
          <h2 className="text-3xl font-bold text-purple-600">Add New Employee</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="First Name"
                className={inputClasses}
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Last Name"
                className={inputClasses}
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>

          <div className="relative">
            <Mail className={iconClasses} />
            <input
              type="email"
              placeholder="Email"
              className={`${inputClasses} pl-12`}
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="relative">
            <Lock className={iconClasses} />
            <input
              type="password"
              placeholder="Password"
              className={`${inputClasses} pl-12`}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
          </div>

          <div className="relative">
            <Briefcase className={iconClasses} />
            <input
              type="text"
              placeholder="Position"
              className={`${inputClasses} pl-12`}
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
            />
          </div>

          <div className="relative">
            <Users className={iconClasses} />
            <input
              type="text"
              placeholder="Department"
              className={`${inputClasses} pl-12`}
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transform hover:scale-[1.02] transition-all duration-200"
          >
            Add Employee
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default AddEmployee;