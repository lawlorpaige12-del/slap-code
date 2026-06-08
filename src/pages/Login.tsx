import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { user, signIn, signOut, loading } = useAuth();
  const [email, setEmail] = useState('jordan@slapstudy.com');
  const [password, setPassword] = useState('study123');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      await signIn(email, password);
      navigate('/');
    } catch (caught) {
      setError('Unable to sign in. Please try again.');
    }
  };

  return (
    <section className="section-grid" aria-label="Login page">
      <div className="card">
        <h1 className="page-title">Login to slAP</h1>
        {user ? (
          <>
            <p>Signed in as {user.name} ({user.email}).</p>
            <button className="submit-button" type="button" onClick={signOut} disabled={loading}>
              Sign out
            </button>
          </>
        ) : (
          <form className="feedback-box" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <button className="submit-button" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default Login;
