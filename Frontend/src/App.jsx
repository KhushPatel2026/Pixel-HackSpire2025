import React from 'react'
import { useEffect } from 'react'
import { useNavigate,useLocation } from 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import Login from './Pages/Authentication/Login/Login'
import Profile from './Pages/Profile/Profile'
import Logout from './Components/Logout'

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
  }, [location,navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
    }else{
      navigate('/profile', { replace: true });
    }
  }, [navigate]);

  return (
    <div>
      <Logout/>
      <Routes>
        <Route path="/login" element={<Login/>} />
				<Route path="/profile" element={<Profile/>} />
			</Routes>
    </div>
  )
}

export default App
