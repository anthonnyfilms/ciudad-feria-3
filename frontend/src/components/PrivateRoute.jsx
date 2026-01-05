import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('admin_token');
  
  if (!token) {
    return <Navigate to="/admin-ciudadferia" replace />;
  }
  
  return children;
};

export default PrivateRoute;