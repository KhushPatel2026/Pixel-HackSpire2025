const express = require('express');
const router = express.Router();
const QuizController = require('../Controller/quizController');

router.post('/learning-path-quiz', QuizController.generateLearningPathQuiz.bind(QuizController));
router.post('/custom-quiz', QuizController.generateCustomQuiz.bind(QuizController));
router.get('/daily-quiz', QuizController.getDailyQuiz.bind(QuizController));
router.post('/submit-quiz', QuizController.submitQuiz.bind(QuizController));
router.get('/leaderboard', QuizController.getLeaderboard.bind(QuizController));

module.exports = router;