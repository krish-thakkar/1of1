import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  ClipboardList, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Plus,
  FileSpreadsheet
} from 'lucide-react';

const CompanyDashboard = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskDistribution, setTaskDistribution] = useState([]);
  const [employeeTaskData, setEmployeeTaskData] = useState([]);
  const [loading, setLoading] = useState(true);

  const processTaskData = (tasks, employees) => {
    // Task status distribution
    const statusCounts = tasks.reduce((acc, task) => {
      const status = task.status || 'pending'; // Default to pending if status is not set
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const distribution = [
      { name: 'Completed', value: statusCounts.completed || 0, color: '#6B46C1' },
      { name: 'Pending', value: statusCounts.pending || 0, color: '#ED8936' },
      { name: 'In Progress', value: statusCounts['in-progress'] || 0, color: '#4299E1' }
    ].filter(item => item.value > 0);

    setTaskDistribution(distribution);

    // Employee task distribution
    const employeeData = employees.map(emp => {
      const employeeTasks = tasks.filter(task => task.assignedTo?._id === emp._id);
      return {
        name: `${emp.firstName} ${emp.lastName}`,
        completed: employeeTasks.filter(t => t.status === 'completed').length,
        pending: employeeTasks.filter(t => t.status === 'pending' || !t.status).length,
        inProgress: employeeTasks.filter(t => t.status === 'in-progress').length,
        total: employeeTasks.length
      };
    });

    setEmployeeTaskData(employeeData);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [employeesRes, tasksRes] = await Promise.all([
          axios.get('http://localhost:5000/api/employees/company-employees', {
            headers: { Authorization: `Bearer ${user.token}` }
          }),
          axios.get('http://localhost:5000/api/tasks/company-tasks', {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        ]);
        
        const fetchedEmployees = employeesRes.data;
        const fetchedTasks = tasksRes.data;
        
        setEmployees(fetchedEmployees);
        setTasks(fetchedTasks);
        
        processTaskData(fetchedTasks, fetchedEmployees);
        toast.success('Dashboard data loaded successfully');
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.token]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">Count: {data.value}</p>
          <p className="text-sm">
            {tasks.length ? ((data.value / tasks.length) * 100).toFixed(1) : 0}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-800">Company Dashboard</h2>
          <div className="space-x-4">
            <Link
              to="/company/add-employee"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Link>
            <Link
              to="/company/assign-task"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Assign Task
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-800">{employees.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ClipboardList className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-800">
                  {tasks.length ? 
                    ((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100).toFixed(1) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Status Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Task Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskDistribution}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {taskDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Employee Task Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Employee Task Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={employeeTaskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" fill="#6B46C1" stackId="a" />
                  <Bar dataKey="pending" name="Pending" fill="#ED8936" stackId="a" />
                  <Bar dataKey="inProgress" name="In Progress" fill="#4299E1" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Lists Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employees List */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <Users className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-xl font-semibold">Employees ({employees.length})</h3>
            </div>
            <div className="space-y-4">
              {employees.map(employee => (
                <div key={employee._id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{employee.firstName} {employee.lastName}</p>
                    <p className="text-sm text-gray-600">{employee.position}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {tasks.filter(task => task.assignedTo?._id === employee._id).length} tasks
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <ClipboardList className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-xl font-semibold">Recent Tasks</h3>
            </div>
            <div className="space-y-4">
              {tasks.slice(0, 5).map(task => (
                <div key={task._id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{task.title}</p>
                    <div className="flex items-center">
                      {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500 mr-1" />}
                      {task.status === 'in-progress' && <Clock className="w-4 h-4 text-blue-500 mr-1" />}
                      {(!task.status || task.status === 'pending') && <AlertCircle className="w-4 h-4 text-orange-500 mr-1" />}
                      <span className="text-sm text-gray-600">
                        Status: {task.status || 'pending'}
                      </span>
                    </div>
                    {task.assignedTo && (
                      <p className="text-sm text-gray-500">
                        Assigned to: {task.assignedTo.firstName} {task.assignedTo.lastName}
                      </p>
                    )}
                  </div>
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