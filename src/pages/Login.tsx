import React from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  React.useEffect(() => {
    // This route is no longer used. Redirect to home.
    navigate('/');
  }, [navigate]);

  return null;
}

export default Login;
