const express = require('express');
const router = express.Router();
const LearningController = require('../controller/learningController');

router.post('/simplify-content', LearningController.simplifyContent.bind(LearningController));
router.post('/generate-learning-path', LearningController.generateLearningPath.bind(LearningController));
router.post('/chat', LearningController.handleChat.bind(LearningController));
router.post('/generate-quiz', LearningController.generateQuiz.bind(LearningController));
router.post('/submit-quiz', LearningController.submitQuiz.bind(LearningController));
router.get('/progress', LearningController.getProgress.bind(LearningController));
router.get('/dashboard', LearningController.getDashboardData.bind(LearningController));

module.exports = router;