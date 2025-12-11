import React, { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';

function App() {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulating auth check
  useEffect(() => {
    // Check localStorage or Firebase Auth state here
    const savedUser = localStorage.getItem('gemini_app_user');
    const savedToken = localStorage.getItem('gemini_app_token');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      if (savedToken) setAuthToken(savedToken);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    if (token) {
      setAuthToken(token);
      localStorage.setItem('gemini_app_token', token);
    }
    localStorage.setItem('gemini_app_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem('gemini_app_user');
    localStorage.removeItem('gemini_app_token');
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">Loading...</div>;

  return (
    <>
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard user={user} authToken={authToken} onLogout={handleLogout} />
      )}
    </>
  );
}

export default App;
