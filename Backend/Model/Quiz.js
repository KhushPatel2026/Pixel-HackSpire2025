const mongose = require('mongoose')

const quiz = new mongose.Schema({
    userId: { type: String, required: true, ref: 'User' },
    topicName: { type: String, required: true },
    quizTime: { type: String, required: true },
    completedTime: { type: String, required: true },
    quizDate: { type: String, required: true },
    questions: [{
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: String, required: true },
        questionType: { type: String, required: true, enum: ['MCQ', 'True/False', 'Short Answer'] },
        marks: { type: Number, required: true },
    }],
    responses: [{
        question: { type: String, required: true },
        selectedOption: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        marksObtained: { type: Number, required: true },
        questionType: { type: String, required: true, enum: ['MCQ', 'True/False', 'Short Answer'] },
        ResponseTime: { type: String, required: true },
        feedback: { type: String, required: true },
    }],
    quizResult: { type: String, required: true },
    quizScore: { type: String, required: true },
    strength: { type: String, required: true },
    weakness: { type: String, required: true },
    difficultyLevel: { type: String, required: true, enum: ['Easy', 'Medium', 'Hard'] },
});

const model = mongose.model('Quiz', quiz)
module.exports = model