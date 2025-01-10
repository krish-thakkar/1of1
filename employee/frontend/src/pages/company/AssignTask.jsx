import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiUserPlus } from 'react-icons/fi';
import { MdOutlineTaskAlt } from 'react-icons/md';

const AssignTask = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    assignedTo: '',
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/employees/company-employees',
          {
            headers: { Authorization: `Bearer ${user.token}` },
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
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      toast.success('Task assigned successfully!');
      navigate('/company');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign task');
      toast.error('Failed to assign task!');
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md border border-gray-200 mt-10">
        <h2 className="text-3xl font-extrabold text-purple-600 flex items-center gap-2 mb-6">
          <MdOutlineTaskAlt />
          Assign New Task
        </h2>
        {error && (
          <div className="bg-red-100 text-red-600 p-4 mb-4 rounded-lg border border-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-purple-600 font-medium mb-2">
              Select Employee
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.assignedTo}
              onChange={(e) =>
                setFormData({ ...formData, assignedTo: e.target.value })
              }
            >
              <option value="">Choose an employee</option>
              {employees.map((employee) => (
                <option key={employee._id} value={employee._id}>
                  {employee.firstName} {employee.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-purple-600 font-medium mb-2">
              Task Title
            </label>
            <input
              type="text"
              placeholder="Enter task title"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-purple-600 font-medium mb-2">
              Task Description
            </label>
            <textarea
              placeholder="Enter task description"
              className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-purple-500"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-purple-600 font-medium mb-2">
              Due Date
            </label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-purple-600 font-medium mb-2">
              Priority
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-300 flex items-center justify-center gap-2"
          >
            <FiUserPlus />
            Assign Task
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default AssignTask;
