import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import axios from 'axios';

const AssignTask = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    assignedTo: '',
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/employees/company-employees',
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
        setEmployees(response.data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };
    fetchEmployees();
  }, [user.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:5000/api/tasks/create',
        formData,
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );
      navigate('/company');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign task');
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Assign New Task</h2>
        {error && <div className="bg-red-100 text-red-600 p-3 mb-4 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            className="w-full p-2 border rounded"
            value={formData.assignedTo}
            onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
            >
              <option value="">Select Employee</option>
              {employees.map(employee => (
                <option key={employee._id} value={employee._id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Task Title"
              className="w-full p-2 border rounded"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            <textarea
              placeholder="Task Description"
              className="w-full p-2 border rounded h-32"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <input
              type="date"
              className="w-full p-2 border rounded"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
            />
            <select
              className="w-full p-2 border rounded"
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Assign Task
            </button>
          </form>
        </div>
      </Layout>
    );
  };
  
  export default AssignTask;
  