import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/auth/me`,
          {
            credentials: 'include'
          }
        );

        setAuthenticated(response.ok);

      } catch (error) {
        console.error('Authentication check failed:', error);
        setAuthenticated(false);
      }
    };

    checkAuthentication();
  }, []);

  if (authenticated === null) {
    return null;
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;