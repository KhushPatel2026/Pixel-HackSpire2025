const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    topicName: { type: String, required: true },
    quizTime: { type: Number, required: true }, // Duration in minutes
    completedTime: { type: Date },
    quizDate: { type: Date, default: Date.now },
    questions: [{
        question: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: String, required: true },
        questionType: { type: String, required: true, enum: ['MCQ', 'True/False', 'Short Answer'] },
        marks: { type: Number, required: true },
    }],
    responses: [{
        question: { type: String, required: true },
        selectedOption: { type: String },
        isCorrect: { type: Boolean },
        marksObtained: { type: Number },
        questionType: { type: String, required: true, enum: ['MCQ', 'True/False', 'Short Answer'] },
        responseTime: { type: Number }, // Time in seconds
        feedback: { type: String }
    }],
    quizResult: { type: String, default: 'Pending' },
    quizScore: { type: Number, default: 0 },
    strength: { type: String },
    weakness: { type: String },
    difficultyLevel: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] }
});

module.exports = mongoose.model('Quiz', quizSchema);