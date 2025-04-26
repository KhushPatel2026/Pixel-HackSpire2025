// src/App.jsx
import React from 'react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './Pages/Authentication/Login/Login';
import Profile from './Pages/Profile/Profile';
import Landing from './Pages/Landing/Landing'; // Import the Landing component
import Logout from './Components/Logout';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');

    if (token) {
      localStorage.setItem('token', token);
      navigate('/profile', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token && location.pathname !== '/login') {
      navigate('/', { replace: true }); // Redirect to landing page if no token
    } else if (token && location.pathname === '/') {
      navigate('/profile', { replace: true }); // Redirect to profile if token exists
    }
  }, [navigate, location.pathname]);

  return (
    <div>
      <Logout />
      <Routes>
        <Route path="/" element={<Landing />} /> {/* Landing page route */}
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default App;