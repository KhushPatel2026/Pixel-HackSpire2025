import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  // Handle URL token
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      navigate('/profile', { replace: true });
    }
  }, [location, navigate]);

  // Verify token and fetch profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No authentication token found');
      navigate('/login');
      return;
    }

    const verifyToken = async (retryCount = 0) => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/verify-token', {
          headers: { 'x-access-token': token },
        });

        if (!response.ok) throw new Error('Token verification failed');

        const data = await response.json();
        if (data.status !== 'ok') {
          if (retryCount < 3) {
            setTimeout(() => verifyToken(retryCount + 1), 5000);
            return;
          }
          throw new Error(data.error || 'Invalid token');
        }

        const profileResponse = await fetch('http://localhost:3000/api/profile', {
          headers: { 'x-access-token': token },
        });

        if (!profileResponse.ok) throw new Error('Failed to fetch profile');

        const profileData = await profileResponse.json();
        if (profileData.status === 'ok') {
          setProfile(profileData.profile);
        } else {
          throw new Error(profileData.error || 'Profile fetch failed');
        }
        setLoading(false);
      } catch (error) {
        if (retryCount < 3) {
          setTimeout(() => verifyToken(retryCount + 1), 5000);
        } else {
          toast.error(error.message);
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    verifyToken();
  }, [navigate]);

  // Edit profile handler
  const handleEditProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const form = e.target;

    try {
      const response = await fetch('http://localhost:3000/api/profile/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({
          name: form.name.value.trim(),
          email: form.email.value.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      const data = await response.json();
      if (data.status === 'ok') {
        toast.success('Profile updated successfully');
        setProfile(data.profile);
      } else {
        throw new Error(data.error || 'Profile update failed');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred while updating your profile');
      console.error('Profile update error:', error);
    }
  };

  // Password validation
  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Password change handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!validatePassword()) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!response.ok) throw new Error('Failed to change password');

      const data = await response.json();
      if (data.status === 'ok') {
        toast.success('Password changed successfully');
        setIsPasswordModalOpen(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setErrors({});
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred while changing password');
      console.error('Password change error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
        <h1 className="text-3xl font-bold text-white text-center mb-8 bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
          User Profile
        </h1>

        {profile && (
          <div className="space-y-4 text-gray-300 mb-6">
            <p><span className="font-semibold text-white">Name:</span> {profile.name}</p>
            <p><span className="font-semibold text-white">Email:</span> {profile.email}</p>
          </div>
        )}

        <form onSubmit={handleEditProfile} className="space-y-6">
          <input
            type="text"
            name="name"
            placeholder="Name"
            defaultValue={profile?.name}
            required
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            defaultValue={profile?.email}
            required
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
          />
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
          >
            Save Changes
          </button>
        </form>

        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="w-full mt-4 py-3 bg-white/5 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-300"
        >
          Change Password
        </button>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder="Current Password"
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
                />
                {errors.currentPassword && <p className="text-red-400 text-sm mt-1">{errors.currentPassword}</p>}
              </div>
              <div>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="New Password"
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
                />
                {errors.newPassword && <p className="text-red-400 text-sm mt-1">{errors.newPassword}</p>}
              </div>
              <div>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Confirm New Password"
                  required
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-300"
                />
                {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-600 hover:to-gray-800 transition-all duration-300"
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setErrors({});
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="flex-1 py-3 bg-white/5 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default Profile;