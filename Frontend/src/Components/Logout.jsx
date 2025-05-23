import React from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token'); 
        navigate('/'); 
    };

    if(localStorage.getItem('token')!==null){
        return (
            <button onClick={handleLogout}>Logout</button>
        );
    }

};

export default Logout;
