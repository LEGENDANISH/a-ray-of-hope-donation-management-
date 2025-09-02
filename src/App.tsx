  import React from 'react';
  import { useState, useEffect } from 'react';
  import { AuthGate } from './components/AuthGate';
  import { Dashboard } from './components/Dashboard';
  import { api } from './lib/api';

  function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Check if user is already authenticated
      const token = localStorage.getItem('auth_token');
      const savedUsername = localStorage.getItem('username');
      
      if (token && savedUsername) {
        setIsAuthenticated(true);
        setUsername(savedUsername);
      }
      setLoading(false);
    }, []);

    const handleAuthenticated = (user: string) => {
      setIsAuthenticated(true);
      setUsername(user);
      localStorage.setItem('username', user);
    };

    const handleLogout = () => {
      setIsAuthenticated(false);
      setUsername('');
      localStorage.removeItem('username');
      api.clearToken();
    };

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <AuthGate onAuthenticated={handleAuthenticated} />;
    }

    return (
      <Dashboard username={username} onLogout={handleLogout} />
    );
  }

  export default App;
