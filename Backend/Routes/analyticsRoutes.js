const express = require("express");
const router = express.Router();
const { getAnalytics, getPastScore } = require("../Controller/analyticsController");

router.get("/analytics", getAnalytics);
router.get("/past-score", getPastScore)

module.exports = router;
