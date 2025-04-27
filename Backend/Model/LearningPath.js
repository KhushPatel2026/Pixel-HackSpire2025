const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    courseName: { type: String, required: true },
    topics: [{
        topicName: { type: String, required: true },
        topicDescription: { type: String, required: true },
        topicResourceLink: [{ title: String, url: String }],
        completionStatus: { type: Boolean, default: false },
        timeSpent: { type: Number, default: 0 },
        completionDate: { type: Date },
        aiGeneratedSummary: { type: String },
        order: { type: Number, required: true } // Added for subtopic sequencing
    }],
    courseCompletionStatus: { type: Number, default: 0 },
    currentStep: { type: Number, default: 0 },
    courseCompletionDate: { type: Date },
    courseStrength: { type: String },
    courseWeakness: { type: String },
    courseScore: { type: Number, default: 0 },
    courseResult: { type: String, default: 'In Progress' },
    courseDuration: { type: Number },
    quizzes: [{
        quizId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'LearningPathQuiz' },
        completed: { type: Boolean, default: false },
        subtopicsCovered: [String] // Added to track subtopics tested
    }],
    difficultyLevel: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
    gamification: {
        badges: [{ type: String }],
        streak: { type: Number, default: 0 },
        points: { type: Number, default: 0 }
    },
    flowchart: { type: String },
});

module.exports = mongoose.model('LearningPath', learningPathSchema);