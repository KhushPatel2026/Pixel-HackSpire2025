const User = require('../Model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

const getProfile = async (req, res) => {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ status: 'error', error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email }).select('-password');
    if (!user) {
      return res.status(404).json({ status: 'error', error: 'User not found' });
    }
    return res.json({ status: 'ok', profile: user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'error', error: 'Invalid token' });
    }
    return res.status(500).json({ status: 'error', error: 'Server error' });
  }
};

const editProfile = async (req, res) => {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ status: 'error', error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const { name, email: newEmail, preferredDifficulty, preferredLearningStyle, dailyStudyTime } = req.body;

    // Validate required fields
    if (!name || !newEmail) {
      return res.status(400).json({ status: 'error', error: 'Name and email are required' });
    }

    // Validate email uniqueness
    if (newEmail !== email) {
      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser) {
        return res.status(400).json({ status: 'error', error: 'Email already in use' });
      }
    }

    // Validate preferences if provided
    const updates = { name, email: newEmail };
    if (preferredDifficulty || preferredLearningStyle || dailyStudyTime) {
      if (preferredDifficulty && !['Easy', 'Medium', 'Hard'].includes(preferredDifficulty)) {
        return res.status(400).json({ status: 'error', error: 'Invalid difficulty level' });
      }
      if (preferredLearningStyle && !['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'].includes(preferredLearningStyle)) {
        return res.status(400).json({ status: 'error', error: 'Invalid learning style' });
      }
      if (dailyStudyTime && (isNaN(dailyStudyTime) || dailyStudyTime <= 0)) {
        return res.status(400).json({ status: 'error', error: 'Invalid daily study time' });
      }

      updates.learningPreferences = {};
      if (preferredDifficulty) updates.learningPreferences.preferredDifficulty = preferredDifficulty;
      if (preferredLearningStyle) updates.learningPreferences.preferredLearningStyle = preferredLearningStyle;
      if (dailyStudyTime) updates.learningPreferences.dailyStudyTime = parseInt(dailyStudyTime);
    }

    const user = await User.findOneAndUpdate({ email }, { $set: updates }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ status: 'error', error: 'User not found' });
    }

    return res.json({ status: 'ok', profile: user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'error', error: 'Invalid token' });
    }
    return res.status(500).json({ status: 'error', error: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ status: 'error', error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ status: 'error', error: 'Both passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ status: 'error', error: 'New password must be at least 8 characters' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'error', error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });

    return res.json({ status: 'ok' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'error', error: 'Invalid token' });
    }
    return res.status(500).json({ status: 'error', error: 'Server error' });
  }
};

const savePreferences = async (req, res) => {
  const token = req.headers['x-access-token'];
  if (!token) {
    return res.status(401).json({ status: 'error', error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const { difficultyLevel, learningStyle, studyTime } = req.body;

    if (!difficultyLevel || !learningStyle || !studyTime) {
      return res.status(400).json({ status: 'error', error: 'All fields are required' });
    }

    if (!['Easy', 'Medium', 'Hard'].includes(difficultyLevel)) {
      return res.status(400).json({ status: 'error', error: 'Invalid difficulty level' });
    }

    if (!['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'].includes(learningStyle)) {
      return res.status(400).json({ status: 'error', error: 'Invalid learning style' });
    }

    const timeMatch = studyTime.match(/(\d+)/);
    if (!timeMatch) {
      return res.status(400).json({ status: 'error', error: 'Invalid study time format' });
    }
    const dailyStudyTime = parseInt(timeMatch[1]);

    const user = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          'learningPreferences.preferredDifficulty': difficultyLevel,
          'learningPreferences.preferredLearningStyle': learningStyle,
          'learningPreferences.dailyStudyTime': dailyStudyTime,
        },
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ status: 'error', error: 'User not found' });
    }

    return res.json({ status: 'ok', profile: user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'error', error: 'Invalid token' });
    }
    return res.status(500).json({ status: 'error', error: 'Server error' });
  }
};

module.exports = { getProfile, editProfile, changePassword, savePreferences };