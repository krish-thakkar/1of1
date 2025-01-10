import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { Building2, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const CompanyLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/companies/login', formData);
      login({ ...response.data, type: 'company' });
      toast.success('Login successful!');
      navigate('/company');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  const inputClasses = "w-full p-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all duration-200";
  const iconClasses = "text-purple-500 absolute left-3 top-1/2 transform -translate-y-1/2";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Building2 className="text-purple-600 w-12 h-12" />
          <h2 className="text-3xl font-bold text-purple-600">Company Login</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transform hover:scale-[1.02] transition-all duration-200"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompanyLogin;