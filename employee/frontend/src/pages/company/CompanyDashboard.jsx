import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import axios from 'axios';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [employeesRes, tasksRes] = await Promise.all([
          axios.get('http://localhost:5000/api/employees/company-employees', {
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          axios.get('http://localhost:5000/api/tasks/company-tasks', {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        ]);
        setEmployees(employeesRes.data);
        setTasks(tasksRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [user.token]);

  return (
    <Layout>
      <div className="grid gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="space-x-4">
            <Link
              to="/company/add-employee"
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Add Employee
            </Link>
            <Link
              to="/company/assign-task"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Assign Task
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Employees ({employees.length})</h3>
            <div className="space-y-4">
              {employees.map(employee => (
                <div key={employee._id} className="border-b pb-2">
                  <p className="font-medium">{employee.firstName} {employee.lastName}</p>
                  <p className="text-gray-600">{employee.position}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Recent Tasks</h3>
            <div className="space-y-4">
              {tasks.map(task => (
                <div key={task._id} className="border-b pb-2">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-gray-600">Status: {task.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CompanyDashboard;
