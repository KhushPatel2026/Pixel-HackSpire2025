const express = require('express');
const router = express.Router();
const LearningController = require('../controller/learningController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/simplify-content', LearningController.simplifyContent.bind(LearningController));
router.post('/generate-learning-path', LearningController.generateLearningPath.bind(LearningController));
router.post('/chat', upload.single('audio'), LearningController.handleChat.bind(LearningController));
router.get('/progress', LearningController.getProgress.bind(LearningController));
router.get('/dashboard', LearningController.getDashboardData.bind(LearningController));

module.exports = router;