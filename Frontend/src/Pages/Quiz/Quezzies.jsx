import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, BarChart, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Mock stars data for background (same as Dashboard.js)
const stars = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  opacity: Math.random() * 0.5 + 0.5,
  blinking: Math.random() > 0.7,
}));

const QuizzesPage = () => {
  const [loading, setLoading] = useState(true);
  const [quizHistory, setQuizHistory] = useState([]);
  const navigate = useNavigate();

  // Fetch quiz history
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found");
      navigate("/login");
      return;
    }

    const fetchQuizzes = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/all-quizzes", {
          headers: { "x-access-token": token },
        });
        const result = await response.json();

        if (result.status === "ok") {
          setQuizHistory(result.data.quizHistory);
        } else {
          throw new Error(result.error || "Failed to fetch quizzes");
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching quizzes:", error);
        toast.error(error.message);
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchQuizzes();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-xl"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white overflow-hidden">
      {/* Stars background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className={`absolute rounded-full bg-green-200 ${
              star.blinking ? "animate-pulse" : ""
            }`}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>

      {/* Mesh gradient overlays */}
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#0d400d80] via-transparent to-transparent opacity-50" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#1e8f1e80] via-transparent to-transparent opacity-50 translate-x-1/2" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#00510080] via-transparent to-transparent opacity-40 translate-y-1/4" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="ml-100 mr-25 w-full mx-auto bg-[#0a1a0a]/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-green-500/20 p-6 relative z-10"
      >
        <div className="bg-[#0a1a0a]/90 backdrop-blur-lg p-6 rounded-2xl border border-green-500/20 relative overflow-hidden flex flex-col h-full">
          {/* Decorative elements */}
          <div className="absolute -right-20 top-0 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-0" />
          <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-0" />

          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-between items-center mb-6"
          >
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
              Your Quizzes
            </h1>
          </motion.div>

          {/* Quizzes Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-[#0d1f0d]/50 backdrop-blur-sm rounded-xl p-6 border border-green-900/50"
          >
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart size={24} className="text-green-400" />
              Quiz History
            </h2>
            {quizHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizHistory.map((quiz) => (
                  <div
                    key={quiz._id}
                    className="bg-[#0d1f0d]/70 p-4 rounded-lg border border-green-900/30"
                  >
                    <h3 className="text-lg font-medium text-white mb-2">
                      {quiz.topicName}
                    </h3>
                    <p className="text-gray-400 text-sm mb-1">
                      Difficulty: {quiz.difficultyLevel}
                    </p>
                    <p className="text-gray-400 text-sm mb-1">
                      Status: {quiz.quizResult}
                    </p>
                    <p className="text-gray-400 text-sm mb-1">
                      Score: {quiz.quizScore}/{quiz.questions.reduce((sum, q) => sum + q.marks, 0)}
                    </p>
                    <p className="text-gray-400 text-sm mb-2">
                      Completed: {quiz.completedTime ? new Date(quiz.completedTime).toLocaleDateString() : "Not Completed"}
                    </p>
                    <div className="flex items-center gap-2">
                      {quiz.quizResult === "Pass" ? (
                        <CheckCircle size={16} className="text-green-400" />
                      ) : quiz.quizResult === "Fail" ? (
                        <XCircle size={16} className="text-red-400" />
                      ) : (
                        <BookOpen size={16} className="text-yellow-400" />
                      )}
                      <span className="text-gray-400 text-sm">
                        {quiz.quizResult === "Pass" ? "Passed" : quiz.quizResult === "Fail" ? "Failed" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">
                No quizzes available. Complete a quiz in a learning path to see your history!
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
};

export default QuizzesPage;