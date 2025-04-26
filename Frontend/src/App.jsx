import React from 'react';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Login from './Pages/Authentication/Login/Login';
import Profile from './Pages/Profile/Profile';
import Chatbot from './Pages/Chatbot/Chatbot';
import Logout from './Components/Logout';
import Landing from './Pages/Landing/Landing';
import QuizPage from './Pages/Quiz/QuizPage';
import CustomQuizPage from './Pages/Quiz/CustomQuizPage';
import DailyQuizPage from './Pages/Quiz/DailyQuizPage';
import Sidebar from './Components/Sidebar';
import OnbordingProcess from './Pages/Onboarding/OnboardingProcess';
import Recognition from './Pages/Recognition/Recognition';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenFromUrl = urlParams.get('token');
    const tokenFromStorage = localStorage.getItem('token');

    // List of public routes that don't require a token
    const publicRoutes = ['/', '/login','/recognition'];

    if (tokenFromUrl) {
      // If token is provided in URL, store it and redirect to profile
      localStorage.setItem('token', tokenFromUrl);
      navigate('/profile', { replace: true });
    } else if (!tokenFromStorage && !publicRoutes.includes(location.pathname)) {
      // If no token and trying to access a protected route, redirect to login
      navigate('/login', { replace: true });
    }
  }, [location, navigate]);

  // Hide sidebar for Landing and Login pages
  const showSidebar = !['/', '/login','/onboarding'].includes(location.pathname);

  return (
    <div className="flex min-h-screen">
      {showSidebar && <Sidebar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/quiz/custom" element={<CustomQuizPage />} />
          <Route path="/quiz/daily" element={<DailyQuizPage />} />
          <Route path="/onboarding" element={<OnbordingProcess />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/recognition" element={<Recognition />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;