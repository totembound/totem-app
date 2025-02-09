import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, isSignedUp } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isConnected || !isSignedUp) {
      // Store the attempted path
      navigate('/', { state: { from: location } });
    }
  }, [isConnected, isSignedUp, navigate, location]);

  if (!isConnected || !isSignedUp) {
    return null;
  }

  return <>{children}</>;
};