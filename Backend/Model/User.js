const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  learningPreferences: {
    preferredDifficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    dailyStudyTime: { type: Number },
    preferredLearningStyle: {
      type: String,
      enum: ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'],
      default: 'Visual',
    },
    age: { type: Number },
  },
  progressMetrics: {
    totalCourses: { type: Number, default: 0 },
    completedCourses: { type: Number, default: 0 },
    totalStudyTime: { type: Number, default: 0 },
  },
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);