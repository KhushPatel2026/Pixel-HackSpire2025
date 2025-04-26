import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  BarChart,
  PlusCircle,
  PlayCircle,
  X,
  Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import jsPDF from "jspdf";

// Mock stars data for background
const stars = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  opacity: Math.random() * 0.5 + 0.5,
  blinking: Math.random() > 0.7,
}));

const COLORS = ["#10b981", "#ef4444"];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [isCreatingPath, setIsCreatingPath] = useState(false);
    const [pastScores, setPastScores] = useState([]);
  const navigate = useNavigate();

  // Mock past quiz scores if not provided by backend


  // Fetch user profile and dashboard data
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("No authentication token found");
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch profile
        const profileResponse = await fetch(
          "http://localhost:3000/api/profile/profile",
          {
            headers: { "x-access-token": token },
          }
        );
        const profileData = await profileResponse.json();

        if (profileData.status === "ok") {
          setUser(profileData.profile);
        } else {
          throw new Error(profileData.error || "Failed to fetch profile");
        }

        // Fetch dashboard data (including learning paths and quiz stats)
        const dashboardResponse = await fetch(
          "http://localhost:3000/api/learning/dashboard",
          {
            headers: { "x-access-token": token },
          }
        );
          const dashboardResult = await dashboardResponse.json();

        if (dashboardResult.status === "ok") {
          setDashboardData(dashboardResult.data);
        } else {
          throw new Error(dashboardResult.error || "Failed to fetch dashboard data");
        }
          
          const pastScoresResponse = await fetch(
              "http://localhost:3000/api/past-score",
              {
                  headers: { "x-access-token": token },
              }
          );
          const scores = await pastScoresResponse.json();


          if (scores.status === "ok") { 
              setPastScores(scores.data.pastScores);
          } else {
              throw new Error(scores.error || "Failed to fetch past scores");
            }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(error.message);
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    fetchData();
  }, [navigate]);

  // Handle report download
  const handleDownloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Learning Progress Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`User: ${user?.name || "User"}`, 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);

    // Learning Paths Summary
    doc.text("Learning Paths:", 20, 50);
    dashboardData?.learningPaths?.forEach((path, index) => {
      doc.text(
        `${index + 1}. ${path.courseName} - Progress: ${path.progress}%`,
        30,
        60 + index * 10
      );
      doc.text(`   Points: ${path.points}`, 30, 65 + index * 10);
    });

    // Quiz Stats Summary
    doc.text("Quiz Performance:", 20, 60 + (dashboardData?.learningPaths?.length || 0) * 15);
    doc.text(
      `Total Quizzes: ${dashboardData?.quizStats?.totalQuizzes || 0}`,
      30,
      70 + (dashboardData?.learningPaths?.length || 0) * 15
    );
    doc.text(
      `Average Score: ${Math.round(dashboardData?.quizStats?.averageScore || 0)}%`,
      30,
      80 + (dashboardData?.learningPaths?.length || 0) * 15
    );
    doc.text(
      `Pass Rate: ${Math.round(dashboardData?.quizStats?.passRate || 0)}%`,
      30,
      90 + (dashboardData?.learningPaths?.length || 0) * 15
    );

    doc.save("learning_progress_report.pdf");
    toast.success("Report downloaded successfully!");
  };

  // Handle starting or continuing a learning path
  const handleStartContinueCourse = (learningPath) => {
    const firstIncompleteIndex = learningPath.firstIncompleteSubtopicIndex;
    if (firstIncompleteIndex < learningPath.topics?.length) {
      toast.info(`Continuing ${learningPath.courseName} at subtopic ${firstIncompleteIndex + 1}`);
    } else {
      toast.success(`${learningPath.courseName} is already completed!`);
    }
    navigate(`/learnflow/${learningPath.id}`);
  };

  // Handle adding a new learning path
  const handleAddLearningPath = async () => {
    if (!courseName || !difficultyLevel || !["Easy", "Medium", "Hard"].includes(difficultyLevel)) {
      toast.error("Please provide a valid course name and difficulty level (Easy/Medium/Hard).");
      return;
    }

    setIsCreatingPath(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:3000/api/learning/generate-learning-path", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({ courseName, difficultyLevel }),
      });

      const result = await response.json();
      if (result.status === "ok") {
        toast.success(`Learning path "${courseName}" created successfully!`);
        // Refresh dashboard data
        const dashboardResponse = await fetch(
          "http://localhost:3000/api/learning/dashboard",
          {
            headers: { "x-access-token": token },
          }
        );
        const dashboardResult = await dashboardResponse.json();
        if (dashboardResult.status === "ok") {
          setDashboardData(dashboardResult.data);
        }
        setIsModalOpen(false);
        setCourseName("");
        setDifficultyLevel("");
      } else {
        throw new Error(result.error || "Failed to create learning path");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while adding the learning path");
    } finally {
      setIsCreatingPath(false);
    }
  };

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
              Welcome, {user?.name || "User"}
            </h1>
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-4 py-2 rounded-lg transition duration-300"
            >
              <Download size={16} />
              Download Report
            </button>
          </motion.div>

          {/* Dashboard Sections */}
          {dashboardData ? (
            <div className="space-y-6">
              {/* Learning Paths Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-[#0d1f0d]/50 backdrop-blur-sm rounded-xl p-6 border border-green-900/50"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                    <BookOpen size={24} className="text-green-400" />
                    Your Learning Paths
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 py-2 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition-all duration-300 transform hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                  >
                    <PlusCircle size={16} />
                    Add Learning Path
                  </motion.button>
                </div>
                {dashboardData.learningPaths?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dashboardData.learningPaths.map((path) => (
                      <div
                        key={path.id}
                        className="bg-[#0d1f0d]/70 p-4 rounded-lg border border-green-900/30"
                      >
                        <h3 className="text-lg font-medium text-white mb-2">
                          {path.courseName}
                        </h3>
                        <p className="text-gray-400 text-sm mb-2">
                          Progress: {path.progress}%
                        </p>
                        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                          <div
                            className="bg-green-600 h-2.5 rounded-full"
                            style={{ width: `${path.progress}%` }}
                          />
                        </div>
                        {path.quizPending && (
                          <p className="text-yellow-400 text-sm mb-3">
                            Quiz Pending!
                          </p>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleStartContinueCourse(path)}
                          className="flex items-center gap-2 w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition-all duration-300 transform hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] p-1.5"
                        >
                          <PlayCircle size={16} />
                          {path.progress === 100 ? "Review" : "Continue"}
                        </motion.button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">
                    No learning paths available. Add a new course to begin!
                  </p>
                )}
              </motion.div>

              {/* Quiz Performance Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-[#0d1f0d]/50 backdrop-blur-sm rounded-xl p-6 border border-green-900/50"
              >
                <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart size={24} className="text-green-400" />
                  Quiz Performance
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quiz Stats */}
                  <div className="bg-[#0d1f0d]/70 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Quiz Stats
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-400">
                        Total Quizzes: {dashboardData.quizStats?.totalQuizzes || 0}
                      </p>
                      <p className="text-gray-400">
                        Average Score: {Math.round(dashboardData.quizStats?.averageScore || 0)}
                      </p>
                      <p className="text-gray-400">
                        Pass Rate: {Math.round(dashboardData.quizStats?.passRate || 0)}%
                      </p>
                    </div>
                  </div>

                  {/* Accuracy Rate */}
                  <div className="bg-[#0d1f0d]/70 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Accuracy Rate
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Pass",
                              value: dashboardData.quizStats?.passRate || 0,
                            },
                            {
                              name: "Fail",
                              value: 100 - (dashboardData.quizStats?.passRate || 0),
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",   // solid white
                            color: "#000000",              // solid black text
                            border: "1px solid #2d4d2d", 
                            borderRadius: "0.5rem",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Past Quiz Scores */}
                  <div className="bg-[#0d1f0d]/70 p-4 rounded-lg md:col-span-2">
                    <h3 className="text-lg font-medium text-white mb-2">
                      Past Quiz Scores
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={pastScores}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d4d2d" />
                        <XAxis dataKey="date" stroke="#ffffff" />
                        <YAxis domain={[0, 20]} stroke="#ffffff" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#0d1f0d",
                            border: "1px solid #2d4d2d",
                            borderRadius: "0.5rem",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#10b981"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="flex justify-center items-center p-10">
              <p className="text-gray-400">
                No dashboard data available. Please start a course to see your progress.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal for Adding Learning Path */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-[#0d1f0d] p-6 rounded-xl border border-green-900/50 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-white">
                Create New Learning Path
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">Course Name</label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full p-2 bg-[#0a1a0a] border border-green-900/50 rounded-lg text-white focus:outline-none focus:border-green-500"
                  placeholder="Enter course name"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Difficulty Level</label>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                  className="w-full p-2 bg-[#0a1a0a] border border-green-900/50 rounded-lg text-white focus:outline-none focus:border-green-500"
                >
                  <option value="">Select difficulty</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddLearningPath}
                disabled={isCreatingPath}
                className={`w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-500 hover:to-emerald-500 transition-all duration-300 transform hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] ${
                  isCreatingPath ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isCreatingPath ? "Creating..." : "Create Learning Path"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

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

export default Dashboard;