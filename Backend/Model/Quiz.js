const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    score: { type: Number, required: true },
    timeTaken: { type: Number, required: true }, // in minutes
    timeAllotted: { type: Number, required: true }, // in minutes
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: String,
        userAnswer: String,
      },
    ],
    topic: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);
