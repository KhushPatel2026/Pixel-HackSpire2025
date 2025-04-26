const express = require('express');
const router = express.Router();
const LearningController = require('../controller/learningController');

router.post('/simplify-content', LearningController.simplifyContent);
router.post('/generate-learning-path', LearningController.generateLearningPath);
router.post('/chat', LearningController.handleChat);
router.post('/generate-quiz', LearningController.generateQuiz);
router.post('/submit-quiz', LearningController.submitQuiz);
router.get('/progress', LearningController.getProgress);
router.get('/dashboard', LearningController.getDashboardData);

module.exports = router;