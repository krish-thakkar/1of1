import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Clock, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Loader2, 
  AlertTriangle,
  BarChart3,
  Calendar,
  Users,
  TrendingUp
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/tasks/employee-tasks',
          {
            headers: { Authorization: `Bearer ${user.token}` }
          }
        );
        setTasks(response.data);
        const tasksByDate = response.data.reduce((acc, task) => {
          const date = new Date(task.dueDate).toLocaleDateString();
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});
        
        const statsData = Object.entries(tasksByDate).map(([date, count]) => ({
          date,
          tasks: count
        }));
        setStats(statsData);
        toast.success('Tasks loaded successfully!', {
          icon: '📊',
          style: {
            borderRadius: '12px',
            background: '#1a1a1a',
            color: '#fff',
          },
        });
      } catch (error) {
        toast.error('Failed to fetch tasks', {
          icon: '❌',
          style: {
            borderRadius: '12px',
            background: '#1a1a1a',
            color: '#fff',
          },
        });
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user.token]);

  const updateTaskStatus = async (taskId, newStatus) => {
    const loadingToast = toast.loading('Updating task status...', {
      style: {
        borderRadius: '12px',
        background: '#1a1a1a',
        color: '#fff',
      },
    });
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/tasks/${taskId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );
      setTasks(tasks.map(task => 
        task._id === taskId ? response.data : task
      ));
      toast.success('Task updated! ✨', { id: loadingToast });
    } catch (error) {
      toast.error('Update failed!', { id: loadingToast });
      console.error('Error updating task status:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-purple-500" />;
      case 'in-progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen bg-gray-50">
          <div className="p-8 rounded-2xl bg-white shadow-2xl">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
            <p className="mt-4 text-purple-600 font-medium">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8 space-y-8">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
          <div className="space-y-2">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Task Dashboard
            </h2>
            <p className="text-gray-600">Welcome back, {user.name}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white p-4 rounded-2xl shadow-lg backdrop-blur-lg border border-purple-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Tasks</div>
                  <div className="text-2xl font-bold text-purple-600">{tasks.length}</div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white p-4 rounded-2xl shadow-lg backdrop-blur-lg border border-green-100"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Completed</div>
                  <div className="text-2xl font-bold text-green-600">
                    {tasks.filter(task => task.status === 'completed').length}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Chart Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-xl border border-purple-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-semibold text-gray-800">Task Distribution Timeline</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Task Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['pending', 'in-progress', 'completed'].map((status, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={status}
              className="bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status)}
                  <h3 className="text-lg font-semibold capitalize">
                    {status.replace('-', ' ')}
                  </h3>
                </div>
              </div>
              <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                {tasks
                  .filter(task => task.status === status)
                  .map(task => (
                    <motion.div
                      key={task._id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-gray-50 p-4 rounded-xl border border-purple-100 hover:shadow-lg transition-all duration-300"
                    >
                      <h4 className="font-medium text-gray-800">{task.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {status !== 'pending' && (
                          <button
                            onClick={() => updateTaskStatus(task._id, 'pending')}
                            className="text-sm px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2"
                          >
                            <AlertTriangle className="w-4 h-4" /> Pending
                          </button>
                        )}
                        {status !== 'in-progress' && (
                          <button
                            onClick={() => updateTaskStatus(task._id, 'in-progress')}
                            className="text-sm px-4 py-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-2"
                          >
                            <ArrowRight className="w-4 h-4" /> In Progress
                          </button>
                        )}
                        {status !== 'completed' && (
                          <button
                            onClick={() => updateTaskStatus(task._id, 'completed')}
                            className="text-sm px-4 py-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Complete
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                {tasks.filter(task => task.status === status).length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <Circle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No tasks in this status</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;