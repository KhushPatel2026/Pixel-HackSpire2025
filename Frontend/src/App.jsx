import React from 'react'
import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import Login from './Pages/Authentication/Login/Login'
import Profile from './Pages/Profile/Profile'
import Chatbot from './Pages/Chatbot/Chatbot'
import Logout from './Components/Logout'
import Landing from './Pages/Landing/Landing'
import QuizPage from './Pages/Quiz/Quiz'

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get('token');
    const tokenFromStorage = localStorage.getItem('token');

    if (tokenFromUrl) {
      localStorage.setItem('token', tokenFromUrl);
      navigate('/profile', { replace: true });
    } else if (!tokenFromStorage) {
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div>
      <Logout />
      <Logout />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chatbot" element={<Chatbot />} />
      </Routes>
    </div>
  );
}

export default App;
