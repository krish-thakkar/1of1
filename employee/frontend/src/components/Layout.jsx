import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Menu, LogOut, Building2, ChevronDown } from 'lucide-react';
import Roadmap from '../pages/employee/Roadmap';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(`/${user.type}/login`);
  };

  // Debug user info - you can remove this after confirming data structure
  console.log('Current user:', user);

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    // Return the first available identifier in order of preference
    return user.username || user.name || user.email || 'User';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-purple-100 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Left side - Brand and Navigation */}
            <div className="flex items-center space-x-8">
              <Link to={`/${user?.type}`} className="flex items-center space-x-2">
                <Building2 className="h-6 w-6 text-purple-600" />
                <span className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  1of1
                </span>
              </Link>
              
              {/* Navigation Links */}
              <div className="hidden md:flex space-x-6">
                {user?.type === 'company' && (
                  <>
                    <Link to="/company/add-employee" 
                      className="text-gray-600 hover:text-purple-600 transition-colors">
                      Manage Employees
                    </Link>
                    <Link to="/company/assign-task"
                      className="text-gray-600 hover:text-purple-600 transition-colors">
                      Assign Tasks
                    </Link>
                  </>
                )}
                {user?.type === 'employee' && (
                  <Link to="/employee"
                    className="text-gray-600 hover:text-purple-600 transition-colors">
                    My Tasks
                  </Link>
                )}
                {user?.type === 'employee' && (
                  <Link to="/employee/roadmap"
                    className="text-gray-600 hover:text-purple-600 transition-colors">
                    Roadmap
                  </Link>
                )}
                {user?.type === 'employee' && (
                  <Link to="/employee/picprompt"
                    className="text-gray-600 hover:text-purple-600 transition-colors">
                    PicPrompt
                  </Link>
                )}
              </div>
            </div>

            {/* Right side - User Profile & Actions */}
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center bg-purple-50 rounded-full px-4 py-2">
                  <User className="h-5 w-5 text-purple-600 mr-2" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-purple-700">
                      {getUserDisplayName()}
                    </span>
                    <span className="text-xs text-purple-500">
                      {user.type?.charAt(0).toUpperCase() + user.type?.slice(1)}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-purple-400 ml-2" />
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 rounded-full bg-white text-purple-600 border border-purple-200 hover:bg-purple-50 transition-colors duration-200"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Button - Only shows on small screens */}
      <div className="md:hidden fixed bottom-4 right-4">
        <button className="p-3 bg-purple-600 rounded-full shadow-lg text-white">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
};

export default Layout;