const mongoose = require("mongoose");

const learningPathQuizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  learningPathId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "LearningPath",
  },
  topicName: { type: String, required: true },
  difficultyLevel: {
    type: String,
    required: true,
    enum: ["Easy", "Medium", "Hard"],
  },
  quizTime: { type: Number, required: true },
  quizDate: { type: Date, default: Date.now },
  completedTime: { type: Date },
  questions: [
    {
      question: { type: String, required: true },
      options: {
        type: [String],
        required: true,
        validate: {
          validator: (v) => v.length === 4,
          message: "Exactly 4 options required",
        },
      },
      correctAnswer: { type: String, required: true },
      questionType: { type: String, default: "MCQ", enum: ["MCQ"] },
      marks: { type: Number, required: true, min: 1 },
      aiGeneratedExplanation: { type: String },
    },
  ],
  responses: [
    {
      question: { type: String, required: true },
      selectedOption: { type: String },
      isCorrect: { type: Boolean },
      marksObtained: { type: Number },
      responseTime: { type: Number, min: 0 },
      feedback: { type: String },
    },
  ],
  quizResult: {
    type: String,
    default: "Pending",
    enum: ["Pending", "Pass", "Fail"],
  },
  quizScore: { type: Number, default: 0, min: 0 },
  strengths: { type: String },
  weaknesses: { type: String },
  reccommendedResources: { type: String },
});

// Check if the model is already compiled
module.exports =
  mongoose.models.LearningPathQuiz ||
  mongoose.model("LearningPathQuiz", learningPathQuizSchema);
