import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import BroKodChat from './pages/BroKodChat';

const API = '/api';

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Optional: verify token on load
    fetch(`${API}/bank/balance`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser({ fullName: data.fullName }))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  const onLogin = (userData) => setUser(userData);
  const onLogout = () => setUser(null);

  if (checking) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p className="subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={onLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard user={user} onLogout={onLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/history"
          element={
            user ? (
              <History user={user} onLogout={onLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/brokod-chat"
          element={
            user ? (
              <BroKodChat />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
