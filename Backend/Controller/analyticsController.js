const User = require("../Model/User");
const LearningPathQuiz = require("../Model/LearningPathQuiz");
const jwt = require("jsonwebtoken");

const getAnalytics = async (req, res) => {
  const token = req.headers["x-access-token"];
  if (!token) {
    return res
      .status(401)
      .json({ status: "error", error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: "error", error: "User not found" });
    }

    // Get user's quiz history
    const quizHistory = await Quiz.find({ userId: user._id });

    // Calculate quiz analytics
    let quizAnalytics = {
      bestQuiz: { name: "N/A", score: 0 },
      worstQuiz: { name: "N/A", score: 100 },
      accuracy: { correct: 0, incorrect: 0 },
    };

    if (quizHistory.length > 0) {
      quizHistory.forEach((quiz) => {
        // Update best/worst quiz
        if (quiz.score > quizAnalytics.bestQuiz.score) {
          quizAnalytics.bestQuiz = { name: quiz.title, score: quiz.score };
        }
        if (quiz.score < quizAnalytics.worstQuiz.score) {
          quizAnalytics.worstQuiz = { name: quiz.title, score: quiz.score };
        }

        // Update accuracy
        quizAnalytics.accuracy.correct += quiz.correctAnswers;
        quizAnalytics.accuracy.incorrect +=
          quiz.totalQuestions - quiz.correctAnswers;
      });
    } else {
      // Provide default data if no quiz history
      quizAnalytics = {
        bestQuiz: { name: "Sample Quiz 1", score: 85 },
        worstQuiz: { name: "Sample Quiz 2", score: 65 },
        accuracy: { correct: 75, incorrect: 25 },
      };
    }

    // Get study streak
    const learningBehavior = {
      streak: user.studyStreak || 0,
    };

    console.log("Sending analytics data:", { quizAnalytics, learningBehavior }); // Debug log

    return res.json({
      status: "ok",
      data: {
        quizAnalytics,
        learningBehavior,
      },
    });
  } catch (error) {
    console.error("Analytics error:", error); // Debug log
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ status: "error", error: "Invalid token" });
    }
    return res.status(500).json({ status: "error", error: "Server error" });
  }
};

const getPastScore = async (req, res) => { 
  const token = req.headers["x-access-token"];
  if (!token) {
    return res
      .status(401)
      .json({ status: "error", error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: "error", error: "User not found" });
    }

    // Get user's quiz history
    const quizHistory = await LearningPathQuiz.find({ userId: user._id });

    let pastScores = [];
    quizHistory.forEach((quiz) => {
      pastScores.push({
        title: quiz.topicname,
        score: quiz.quizScore,
        date: quiz.quizDate,
      });
    });

    return res.json({
      status: "ok",
      data: {
        pastScores,
      },
    });
  } catch (error) {
    console.error("Past score error:", error); // Debug log
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ status: "error", error: "Invalid token" });
    }
    return res.status(500).json({ status: "error", error: "Server error" });
  }
}

const getAllQuizzes = async(req, res) => {
  const token = req.headers["x-access-token"];
  if (!token) {
    return res
      .status(401)
      .json({ status: "error", error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ status: "error", error: "User not found" });
    }

    // Get user's quiz history
    const quizHistory = await LearningPathQuiz.find({ userId: user._id });

    return res.json({
      status: "ok",
      data: {
        quizHistory,
      },
    });
  } catch (error) {
    console.error("All quizzes error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ status: "error", error: "Invalid token" });
    }
    return res.status(500).json({ status: "error", error: "Server error" });
  }
}

module.exports = { getAnalytics, getPastScore, getAllQuizzes };
