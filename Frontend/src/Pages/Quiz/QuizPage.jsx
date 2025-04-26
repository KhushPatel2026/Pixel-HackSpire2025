import { motion } from 'framer-motion';
import { School, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuizPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white overflow-hidden">
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#0d400d80] via-transparent to-transparent opacity-50" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#1e8f1e80] via-transparent to-transparent opacity-50 translate-x-1/2" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#00510080] via-transparent to-transparent opacity-40 translate-y-1/4" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl p-1 bg-gradient-to-tr from-[#0d1f0d] to-[#153515] rounded-2xl shadow-2xl relative z-10 my-8 mx-4"
      >
        <div className="bg-[#0a1a0a]/90 backdrop-blur-lg p-8 rounded-2xl border border-green-500/20 relative overflow-hidden">
          <div className="absolute -right-20 top-0 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-0" />
          <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-0" />

          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400"
          >
            Choose Your Quiz
          </motion.h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/quiz/daily')}
              className="p-6 border border-green-900/30 bg-[#0d1f0d]/30 rounded-lg shadow-sm transition-all duration-300 hover:bg-[#0d1f0d]/50"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl">
                  <Award className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-green-300 text-center mb-2">Daily Quiz</h2>
              <p className="text-gray-400 text-sm text-center">Join the daily challenge and compete on the leaderboard.</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/quiz/custom')}
              className="p-6 border border-green-900/30 bg-[#0d1f0d]/30 rounded-lg shadow-sm transition-all duration-300 hover:bg-[#0d1f0d]/50"
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl">
                  <School className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-green-300 text-center mb-2">Custom Quiz</h2>
              <p className="text-gray-400 text-sm text-center">Create a quiz on any topic and difficulty level.</p>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}