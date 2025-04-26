const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    learningPreferences: {
        preferredDifficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
        learningStyle: { type: String, enum: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing'] },
        dailyStudyTime: { type: Number } // In minutes
    },
    progressMetrics: {
        totalCourses: { type: Number, default: 0 },
        completedCourses: { type: Number, default: 0 },
        totalStudyTime: { type: Number, default: 0 } // In hours
    }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);