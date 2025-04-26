// profileController.js
const User = require('../Model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res) => {
  const token = req.headers['x-access-token'];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(404).json({ status: 'error', error: 'User not found' });
    return res.json({ status: 'ok', profile: user });
  } catch (error) {
    res.json({ status: 'error', error: 'invalid token' });
  }
};

const editProfile = async (req, res) => {
  const token = req.headers['x-access-token'];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const updates = { name: req.body.name, email: req.body.email };
    const user = await User.findOneAndUpdate({ email }, updates, { new: true }).select('-password');
    return res.json({ status: 'ok', profile: user });
  } catch (error) {
    res.json({ status: 'error', error: 'invalid token' });
  }
};

const changePassword = async (req, res) => {
  const token = req.headers['x-access-token'];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ status: 'error', error: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ status: 'error', error: 'Current password is incorrect' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });

    return res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', error: 'Server error' });
  }
};

module.exports = { getProfile, editProfile, changePassword };