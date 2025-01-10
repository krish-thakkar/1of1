import { useState } from 'react';
import { 
  LoaderCircle, 
  Award, 
  CheckCircle, 
  BookOpen, 
  Star,
  Trophy,
  Medal,
  Crown,
  Lightbulb,
  Target,
  Brain,
  Rocket
} from 'lucide-react';

const RoadmapForm = ({ onSubmit, loading }) => (
  <div className="w-full max-w-2xl mx-auto p-12 bg-white rounded-xl shadow-lg border border-gray-100">
    <div className="flex items-center gap-3 mb-8">
      <BookOpen className="w-10 h-10 text-purple-600" />
      <h2 className="text-3xl font-bold text-purple-800">
        Create Your Learning Journey
      </h2>
    </div>
    <form onSubmit={onSubmit} className="space-y-8">
      <div>
        <label htmlFor="interest" className="block text-lg font-medium text-gray-700 mb-3">
          What would you like to learn?
        </label>
        <input
          type="text"
          id="interest"
          name="interest"
          required
          className="w-full px-6 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
          placeholder="e.g., Python Programming"
        />
      </div>
      <div>
        <label htmlFor="level" className="block text-lg font-medium text-gray-700 mb-3">
          Your Experience Level
        </label>
        <select
          id="level"
          name="level"
          required
          className="w-full px-6 py-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
        >
          <option value="">Select your level</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 px-8 rounded-xl text-lg font-semibold text-white transition-all
                 bg-purple-600 hover:bg-purple-700
                 disabled:bg-purple-400
                 transform hover:-translate-y-0.5 active:translate-y-0
                 shadow-lg hover:shadow-xl disabled:shadow-none
                 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <LoaderCircle className="animate-spin" size={24} />
            Crafting Your Roadmap...
          </>
        ) : (
          'Generate My Roadmap'
        )}
      </button>
    </form>
  </div>
);

const TaskList = ({ tasks, onToggleComplete }) => (
  <div className="space-y-4 flex-1">
    <h2 className="text-2xl font-bold text-purple-800 mb-6">Learning Tasks</h2>
    {tasks.map((task, index) => (
      <div key={index} 
           className={`bg-white rounded-xl shadow-md border border-gray-100 p-6 transition-all duration-300 
                    hover:shadow-lg ${task.completed ? 'bg-purple-50' : ''}`}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-4 flex-1">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-semibold shrink-0">
              {index + 1}
            </span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{task.name}</h3>
              <p className="text-gray-600 mb-4">{task.description}</p>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border 
                  ${task.difficulty === 'easy' ? 'bg-green-50 border-green-200 text-green-700' : 
                    task.difficulty === 'medium' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 
                    'bg-red-50 border-red-200 text-red-700'}`}>
                  {task.difficulty}
                </span>
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-purple-500" />
                  <span className="text-sm font-medium text-gray-600">{task.points} points</span>
                </div>
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={task.completed}
              onChange={() => onToggleComplete(index)}
            />
            <div className="w-6 h-6 border-2 border-gray-300 rounded-md peer-checked:bg-purple-600 peer-checked:border-purple-600 transition-all">
              {task.completed && <CheckCircle size={20} className="text-white absolute top-0.5 left-0.5" />}
            </div>
          </label>
        </div>
      </div>
    ))}
  </div>
);

const ProgressSection = ({ roadmap }) => {
  const totalPoints = roadmap.tasks.reduce((sum, task) => sum + task.points, 0);
  const earnedPoints = roadmap.tasks
    .filter(task => task.completed)
    .reduce((sum, task) => sum + task.points, 0);
  
  const percentage = (earnedPoints / totalPoints) * 100;
  const currentBadgeIndex = Math.floor(percentage / (100 / roadmap.theme.badges.length)-1);

  const BadgeIcons = [Trophy, Medal, Crown, Brain, Rocket, Target];

  return (
    <div className="w-80 shrink-0 space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
        <h2 className="text-xl font-bold text-purple-800 mb-4">Your Progress</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600">Total Points</span>
          <span className="text-2xl font-bold text-purple-600">{earnedPoints}/{totalPoints}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
        <h2 className="text-xl font-bold text-purple-800 mb-4">Achievement Badges</h2>
        <div className="space-y-4">
          {roadmap.theme.badges.map((badge, index) => {
            const BadgeIcon = BadgeIcons[index % BadgeIcons.length];
            const isEarned = index <= currentBadgeIndex;
            
            return (
              <div key={index} 
                   className={`p-4 rounded-lg border transition-all duration-300
                             ${isEarned ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isEarned ? 'bg-purple-100' : 'bg-gray-200'}`}>
                    <BadgeIcon size={24} className={isEarned ? 'text-purple-600' : 'text-gray-400'} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isEarned ? 'text-purple-700' : 'text-gray-500'}`}>
                      {badge}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {Math.round((index + 1) * (100 / roadmap.theme.badges.length))}% Progress Required
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const RoadmapDisplay = ({ roadmap, onToggleTask }) => (
  <div>
    <div className="bg-gradient-to-r from-purple-100 to-white rounded-xl shadow-lg p-8 mb-8">
      <h1 className="text-3xl font-bold text-purple-800 mb-3">
        {roadmap.theme.name}
      </h1>
      <p className="text-gray-700 text-lg">{roadmap.theme.description}</p>
    </div>
    
    <div className="flex gap-8">
      <TaskList tasks={roadmap.tasks} onToggleComplete={onToggleTask} />
      <ProgressSection roadmap={roadmap} />
    </div>
  </div>
);


const Roadmap = () => {
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = {
      interest: e.target.interest.value,
      level: e.target.level.value
    };

    try {
      const response = await fetch('http://localhost:5100/api/roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate roadmap');
      }

      data.data.tasks = data.data.tasks.map(task => ({
        ...task,
        completed: false
      }));

      setRoadmap(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (taskIndex) => {
    setRoadmap(prevRoadmap => ({
      ...prevRoadmap,
      tasks: prevRoadmap.tasks.map((task, index) => 
        index === taskIndex ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12">
      {error && (
        <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}
      
      {!roadmap ? (
        <RoadmapForm onSubmit={handleSubmit} loading={loading} />
      ) : (
        <div className="container mx-auto px-8">
          <button
            onClick={() => setRoadmap(null)}
            className="mb-8 px-6 py-2 text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2
                     hover:bg-purple-50 rounded-lg transition-all"
          >
            ← Create New Roadmap
          </button>
          <RoadmapDisplay roadmap={roadmap} onToggleTask={handleToggleTask} />
        </div>
      )}
    </div>
  );
};

export default Roadmap;