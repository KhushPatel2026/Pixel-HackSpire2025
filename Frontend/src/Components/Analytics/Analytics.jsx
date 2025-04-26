import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#10b981", "#ef4444"];

const Analytics = ({ analyticsData }) => {
  const { quizAnalytics, learningBehavior } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Quiz Performance Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-[#0d1f0d]/50 backdrop-blur-sm rounded-xl p-6 border border-green-900/50"
      >
        <h2 className="text-2xl font-semibold text-white mb-4">
          Quiz Performance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Best/Worst Quiz Performance */}
          <div className="bg-[#0d1f0d]/70 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-white mb-2">Quiz Scores</h3>
            <div className="space-y-2">
              <p className="text-green-400">
                Best: {quizAnalytics.bestQuiz.name} (
                {quizAnalytics.bestQuiz.score}%)
              </p>
              <p className="text-red-400">
                Worst: {quizAnalytics.worstQuiz.name} (
                {quizAnalytics.worstQuiz.score}%)
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
                    { name: "Correct", value: quizAnalytics.accuracy.correct },
                    {
                      name: "Incorrect",
                      value: quizAnalytics.accuracy.incorrect,
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
                    backgroundColor: "#0d1f0d",
                    border: "1px solid #2d4d2d",
                    borderRadius: "0.5rem",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;
