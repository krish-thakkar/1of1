import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout';
import axios from 'axios';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [user.token]);

  const updateTaskStatus = async (taskId, newStatus) => {
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
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">My Tasks</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['pending', 'in-progress', 'completed'].map(status => (
            <div key={status} className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 capitalize">
                {status.replace('-', ' ')}
              </h3>
              <div className="space-y-4">
                {tasks
                  .filter(task => task.status === status)
                  .map(task => (
                    <div 
                      key={task._id} 
                      className="border p-4 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                      <div className="mt-3 flex gap-2">
                        {status !== 'pending' && (
                          <button
                            onClick={() => updateTaskStatus(task._id, 'pending')}
                            className="text-sm px-2 py-1 bg-gray-100 rounded"
                          >
                            Move to Pending
                          </button>
                        )}
                        {status !== 'in-progress' && (
                          <button
                            onClick={() => updateTaskStatus(task._id, 'in-progress')}
                            className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded"
                          >
                            Move to In Progress
                          </button>
                        )}
                        {status !== 'completed' && (
                          <button
                            onClick={() => updateTaskStatus(task._id, 'completed')}
                            className="text-sm px-2 py-1 bg-green-100 text-green-700 rounded"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                {tasks.filter(task => task.status === status).length === 0 && (
                  <p className="text-gray-500 text-sm">No tasks in this status</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;