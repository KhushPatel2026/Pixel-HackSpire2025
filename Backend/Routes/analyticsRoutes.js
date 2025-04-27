const express = require("express");
const router = express.Router();
const { getAnalytics, getPastScore, getAllQuizzes } = require("../Controller/analyticsController");

router.get("/analytics", getAnalytics);
router.get("/past-score", getPastScore);
router.get("/all-quizzes", getAllQuizzes);

module.exports = router;
