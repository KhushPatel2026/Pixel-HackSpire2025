const mongoose = require('mongoose');

const LearningPath = new mongoose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    courseName: { type: String, required: true },
    topics: [{
        topicName: { type: String, required: true },
        topicDescription: { type: String, required: true },
        topicResourceLink: [{ type: String, required: true }],
        completionStatus: { type: Boolean, default: false },
        timeSpent: { type: String, required: true },
        completionDate: { type: Date, default: null },
    }],
    courseCompletionStatus: { type: Number, default: 0 },
    currentStep: { type: Number, default: 0 },
    courseCompletionDate: { type: Date, default: null },
    courseStrength: { type: String, required: true },
    courseWeakness: { type: String, required: true },
    courseScore: { type: Number, required: true, default: 0 },
    courseResult: { type: String, required: true },
    courseDuration: { type: String, required: true },
    quizzes: [{
        quizId: { type: String, required: true, ref: 'Quiz' },
    }],
    difficultyLevel: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
});

const model = mongoose.model('LearningPath', LearningPath);
module.exports = model;
