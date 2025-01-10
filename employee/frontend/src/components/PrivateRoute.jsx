// src/components/PrivateRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, userType }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={`/${userType}/login`} />;
  }

  if (user.type !== userType) {
    return <Navigate to={`/${user.type}/login`} />;
  }

  return children;
};

export default PrivateRoute;