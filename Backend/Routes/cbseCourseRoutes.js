const express = require('express');
const router = express.Router();
const CbseCourseController = require('../controller/cbseCourseController');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// CBSE course generation route
router.post('/generate-cbse-course', CbseCourseController.generateCbseCourse.bind(CbseCourseController));

module.exports = router;