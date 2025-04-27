import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { User, Lock, Flame, Award } from 'lucide-react';

// Mock stars data for background
const stars = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  opacity: Math.random() * 0.5 + 0.5,
  blinking: Math.random() > 0.7,
}));

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const baseurl = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

  // Handle URL token
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      navigate('/profile', { replace: true });
    }
  }, [location, navigate]);

  // Fetch profile
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('No authentication token found');
      navigate('/login');
      return;
    }

    const fetchProfile = async (retryCount = 0) => {
      try {
        const response = await fetch(`${baseurl}/api/profile/profile`, {
          headers: { 'x-access-token': token },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        if (data.status === 'ok') {
          setProfile(data.profile);
          setLoading(false);
        } else {
          throw new Error(data.error || 'Profile fetch failed');
        }
      } catch (error) {
        if (retryCount < 3) {
          setTimeout(() => fetchProfile(retryCount + 1), 5000);
        } else {
          toast.error(error.message || 'Failed to load profile');
          localStorage.removeItem('token');
          navigate('/login');
        }
      }
    };

    fetchProfile();
  }, [navigate]);

  // Edit profile handler
  const handleEditProfile = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const form = e.target;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const preferredDifficulty = form.preferredDifficulty.value;
    const preferredLearningStyle = "Visual";
    const dailyStudyTime = form.dailyStudyTime.value.trim();

    // Validate inputs
    const newErrors = {};
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    if (dailyStudyTime && (isNaN(dailyStudyTime) || dailyStudyTime <= 0)) {
      newErrors.dailyStudyTime = 'Study time must be a positive number';
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      const response = await fetch(`${baseurl}/api/profile/profile/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({
          name,
          email,
          preferredDifficulty: preferredDifficulty || undefined,
          preferredLearningStyle: preferredLearningStyle || undefined,
          dailyStudyTime: dailyStudyTime ? parseInt(dailyStudyTime) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      if (data.status === 'ok') {
        toast.success('Profile updated successfully');
        setProfile(data.profile);
        setErrors({});
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
      const response = await fetch(`${baseurl}/api/profile/profile/change-password`, {
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

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

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

  // Fetch streak and badges
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !profile) return;

    const fetchStreakAndBadges = async () => {
      try {
        const response = await fetch(`${baseurl}/api/profile/streak-badges`, {
          headers: { 'x-access-token': token },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch streak and badges');
        }

        const data = await response.json();
        if (data.status === 'ok') {
          setProfile(prevProfile => ({
            ...prevProfile,
            streak: data.streak,
            badges: data.badges
          }));
        } else {
          throw new Error(data.error || 'Streak and badges fetch failed');
        }
      } catch (error) {
        console.error('Streak and badges fetch error:', error);
        // Don't show error toast for this - it's not critical
      }
    };

    fetchStreakAndBadges();
  }, [profile?.id]);

  // Badge Info component
  const BadgeInfo = ({ badge }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    
    return (
      <div 
        className="relative" 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${badge.unlocked ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gray-700'}`}>
          {badge.icon === 'flame' && <Flame className={`h-6 w-6 ${badge.unlocked ? 'text-white' : 'text-gray-500'}`} />}
          {badge.icon === 'award' && <Award className={`h-6 w-6 ${badge.unlocked ? 'text-white' : 'text-gray-500'}`} />}
        </div>
        {showTooltip && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-40 bg-black/80 text-white text-xs p-2 rounded z-20">
            <p className="font-bold">{badge.name}</p>
            <p>{badge.description}</p>
            {!badge.unlocked && <p className="text-gray-400 mt-1">Not unlocked yet</p>}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-xl"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  // Default badges if none present in profile
  const defaultBadges = [
    { id: 1, name: "First Login", description: "Logged in for the first time", icon: "award", unlocked: true },
    { id: 2, name: "Week Warrior", description: "Maintained a 7-day streak", icon: "flame", unlocked: false },
    { id: 3, name: "Study Master", description: "Completed 10 study sessions", icon: "award", unlocked: false },
    { id: 4, name: "Month Champion", description: "Maintained a 30-day streak", icon: "flame", unlocked: false }
  ];

  const badges = profile?.badges || defaultBadges;
  const streak = profile?.streak || { current: 0, longest: 0, lastActivity: null };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white p-4 overflow-hidden">
      {/* Stars background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className={`absolute rounded-full bg-green-200 ${star.blinking ? 'animate-pulse' : ''}`}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Mesh gradient overlays */}
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#0d400d80] via-transparent to-transparent opacity-50" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#1e8f1e80] via-transparent to-transparent opacity-50 translate-x-1/2" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#00510080] via-transparent to-transparent opacity-40 translate-y-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-5xl w-full mx-auto bg-[#0a1a0a]/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-green-500/20 p-6 relative z-10"
      >
        {/* Decorative elements */}
        <div className="absolute -right-20 top-0 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-0" />
        <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-0" />

        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row items-center justify-between">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl font-bold text-center mb-4 md:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400"
          >
            Welcome, {profile?.name}
          </motion.h1>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="py-2 px-4 bg-[#0d1f0d]/50 border border-green-900/50 text-white rounded-lg font-semibold hover:bg-[#0d1f0d]/70 transition-all duration-300"
          >
            Back to Home
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3 flex flex-col items-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-4xl mb-4">
                {profile?.name.charAt(0).toUpperCase()}
              </div>
              
              {/* Streak Section */}
              <div className="w-full bg-[#0d1f0d]/50 border border-green-900/50 rounded-xl p-4 mt-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Flame className="h-6 w-6 text-orange-500 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Daily Streak</h3>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{streak.current}</div>
                <div className="text-sm text-gray-400">Longest streak: {streak.longest} days</div>
                <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500" 
                    style={{ width: `${Math.min(streak.current / 10 * 100, 100)}%` }} 
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {streak.lastActivity ? `Last activity: ${new Date(streak.lastActivity).toLocaleDateString()}` : 'Start your streak today!'}
                </div>
              </div>
              
              {/* Badges Section */}
              <div className="w-full bg-[#0d1f0d]/50 border border-green-900/50 rounded-xl p-4 mt-4">
                <div className="flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-white">Badges</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center">
                  {badges.map(badge => (
                    <BadgeInfo key={badge.id} badge={badge} />
                  ))}
                </div>
              </div>
            </div>

            <div className="md:w-2/3">
              {profile && (
                <div className="space-y-4 text-gray-300 mb-6">
                  <p><span className="font-semibold text-white">Name:</span> {profile.name}</p>
                  <p><span className="font-semibold text-white">Email:</span> {profile.email}</p>
                  <p><span className="font-semibold text-white">Difficulty Level:</span> {profile.learningPreferences?.preferredDifficulty || 'Not set'}</p>
                  <p><span className="font-semibold text-white">Learning Style:</span> {profile.learningPreferences?.preferredLearningStyle || 'Not set'}</p>
                  <p><span className="font-semibold text-white">Daily Study Time:</span> {profile.learningPreferences?.dailyStudyTime ? `${profile.learningPreferences.dailyStudyTime} mins` : 'Not set'}</p>
                </div>
              )}

              <form onSubmit={handleEditProfile} className="space-y-6">
                <div>
                  <label className="block text-gray-400 mb-1 text-sm">Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-green-500" />
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      defaultValue={profile?.name}
                      required
                      aria-label="Name"
                      className="w-full px-12 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-sm">Email</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-green-500" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      defaultValue={profile?.email}
                      required
                      aria-label="Email"
                      className="w-full px-12 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 text-sm">Preferred Difficulty</label>
                  <select
                    name="preferredDifficulty"
                    defaultValue={profile?.learningPreferences?.preferredDifficulty || ''}
                    aria-label="Preferred Difficulty"
                    className="w-full px-4 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                  >
                    <option value="">Select Difficulty</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                {/* <div>
                  <label className="block text-gray-400 mb-1 text-sm">Preferred Learning Style</label>
                  <select
                    name="preferredLearningStyle"
                    defaultValue={profile?.learningPreferences?.preferredLearningStyle || ''}
                    aria-label="Preferred Learning Style"
                    className="w-full px-4 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                  >
                    <option value="">Select Learning Style</option>
                    <option value="Visual">Visual</option>
                    <option value="Auditory">Auditory</option>
                    <option value="Reading/Writing">Reading/Writing</option>
                    <option value="Kinesthetic">Kinesthetic</option>
                  </select>
                </div> */}
                <div>
                  <label className="block text-gray-400 mb-1 text-sm">Daily Study Time (minutes)</label>
                  <input
                    type="number"
                    name="dailyStudyTime"
                    placeholder="Daily Study Time (minutes)"
                    defaultValue={profile?.learningPreferences?.dailyStudyTime || ''}
                    aria-label="Daily Study Time"
                    className="w-full px-4 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                  />
                  {errors.dailyStudyTime && <p className="text-red-400 text-sm mt-1">{errors.dailyStudyTime}</p>}
                </div>
                <div className="flex gap-4">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Save Profile Changes"
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition-all duration-300 transform hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  >
                    Save Changes
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsPasswordModalOpen(true)}
                    aria-label="Change Password"
                    className="flex-1 py-3 bg-[#0d1f0d]/50 border border-green-900/50 text-white rounded-lg font-semibold hover:bg-[#0d1f0d]/70 transition-all duration-300"
                  >
                    Change Password
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md p-1 bg-gradient-to-tr from-[#0d1f0d] to-[#153515] rounded-2xl shadow-2xl relative z-10"
          >
            <div className="bg-[#0a1a0a]/90 backdrop-blur-lg p-8 rounded-2xl border border-green-500/20 relative overflow-hidden">
              <div className="absolute -right-20 top-0 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-0" />
              <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-0" />

              <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
              <form onSubmit={handlePasswordChange} className="space-y-6">
                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-green-500" />
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Current Password"
                      required
                      aria-label="Current Password"
                      className="w-full px-12 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  {errors.currentPassword && <p className="text-red-400 text-sm mt-1">{errors.currentPassword}</p>}
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-green-500" />
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="New Password"
                      required
                      aria-label="New Password"
                      className="w-full px-12 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  {errors.newPassword && <p className="text-red-400 text-sm mt-1">{errors.newPassword}</p>}
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-green-500" />
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Confirm New Password"
                      required
                      aria-label="Confirm New Password"
                      className="w-full px-12 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
                <div className="flex gap-4">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Update Password"
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition-all duration-300 transform hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  >
                    Update Password
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsPasswordModalOpen(false);
                      setErrors({});
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    aria-label="Cancel"
                    className="flex-1 py-3 bg-[#0d1f0d]/50 border border-green-900/50 text-white rounded-lg font-semibold hover:bg-[#0d1f0d]/70 transition-all duration-300"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
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

export default Profile