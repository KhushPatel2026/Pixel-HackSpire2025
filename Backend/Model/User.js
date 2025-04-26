const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    studyStreak: { type: Number, default: 0 },
    learningPaths: [
      {
        id: String,
        courseName: String,
        difficultyLevel: String,
        progress: Number,
        topics: [
          {
            title: String,
            content: String,
            completed: Boolean,
          },
        ],
        strength: String,
        weakness: String,
        points: Number,
        quizPending: Boolean,
      },
    ],
    recentActivities: [
      {
        date: { type: Date, default: Date.now },
        question: String,
        answer: String,
      },
    ],
    totalPoints: { type: Number, default: 0 },
    activeStreaks: [Number],
    averageStudyTime: { type: Number, default: 0 },
    textInteractions: { type: Number, default: 0 },
    voiceInteractions: { type: Number, default: 0 },
    videoInteractions: { type: Number, default: 0 },
    interactionHistory: [
      {
        date: { type: Date, default: Date.now },
        chatbot: { type: Number, default: 0 },
        quizzes: { type: Number, default: 0 },
      },
    ],
    totalTopics: { type: Number, default: 0 },
    completedTopics: { type: Number, default: 0 },
    averageTopicsPerDay: { type: Number, default: 0 },
    focusAreas: [
      {
        topic: String,
        suggestion: String,
      },
    ],
    skillImprovementHistory: [
      {
        month: String,
        score: Number,
        accuracy: Number,
      },
    ],
    learningPreferences: {
      preferredDifficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
      preferredLearningStyle: {
        type: String,
        enum: ["Visual", "Auditory", "Reading/Writing", "Kinesthetic"],
      },
      dailyStudyTime: { type: Number, default: 30 },
    },
    progressMetrics: {
      totalCourses: { type: Number, default: 0 },
      completedCourses: { type: Number, default: 0 },
      totalStudyTime: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
