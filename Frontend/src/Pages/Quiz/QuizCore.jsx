import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Send, ChevronRight, ChevronLeft, List, CheckCircle, Circle, Link } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function QuizCore({
  quiz,
  responses,
  setResponses,
  result,
  setResult,
  loading,
  setLoading,
  error,
  setError,
  currentQuestionIndex,
  setCurrentQuestionIndex,
  showQuestionSelector,
  setShowQuestionSelector,
  submitQuiz,
  goToNextQuestion,
  goToPrevQuestion,
  resetQuiz
}) {
  const handleOptionChange = (index, value) => {
    const updatedResponses = [...responses];
    updatedResponses[index] = value;
    setResponses(updatedResponses);
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < quiz.questions.length) {
      setCurrentQuestionIndex(index);
      setShowQuestionSelector(false);
    }
  };

  const toggleQuestionSelector = () => {
    setShowQuestionSelector(!showQuestionSelector);
  };

  const renderQuestion = (question, index) => {
    return (
      <motion.div 
        key={index}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="border border-green-900/30 bg-[#0d1f0d]/30 p-6 rounded-lg shadow-sm"
      >
        <p className="font-medium mb-6 text-green-300 text-lg">
          {index + 1}. {question.question}
        </p>
        <div className="space-y-3 pl-4">
          {question.options && question.options.length === 4 ? (
            question.options.map((option, idx) => (
              <label key={idx} className="block flex items-center p-3 rounded-lg hover:bg-green-900/20 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name={`question-${index}`}
                  value={option}
                  checked={responses[index] === option}
                  onChange={() => handleOptionChange(index, option)}
                  className="mr-3 h-5 w-5 text-green-600 focus:ring-green-500 border-green-400/50 bg-[#0a1a0a]"
                  disabled={loading}
                />
                <span className="text-gray-300">{option}</span>
              </label>
            ))
          ) : (
            <p className="text-red-400">Invalid question format.</p>
          )}
        </div>
      </motion.div>
    );
  };

  const renderQuestionSelector = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="absolute z-20 top-20 right-0 w-48 bg-[#0a1a0a] border border-green-900/30 rounded-lg shadow-lg overflow-hidden"
      >
        <div className="p-2 bg-[#0d1f0d]/30 border-b border-green-900/30">
          <h4 className="text-green-400 font-medium text-sm">Questions</h4>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {quiz.questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToQuestion(idx)}
              className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-green-900/20 transition-colors ${
                currentQuestionIndex === idx ? 'bg-green-900/30' : ''
              }`}
            >
              {responses[idx] !== null ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-gray-500" />
              )}
              <span className="text-sm">Question {idx + 1}</span>
            </button>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderQuizProgress = () => {
    const totalQuestions = quiz?.questions?.length || 0;
    const answeredQuestions = responses.filter(r => r !== null).length;
    
    return (
      <div className="flex items-center justify-between mb-6">
        <div className="text-gray-400 text-sm">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-green-400 text-sm">
            {answeredQuestions}/{totalQuestions} Answered
          </div>
          <div className="w-32 bg-[#0d1f0d]/50 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-600 to-emerald-500 h-full rounded-full" 
              style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  let recommendedResources = [];
  try {
    recommendedResources = result?.quiz?.reccommendedResources ? JSON.parse(result.quiz.reccommendedResources) : [];
  } catch (error) {
    console.error('Failed to parse recommended resources:', error);
  }

  return (
    <>
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-900/30 border border-red-500/30 text-red-300 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {quiz && !result && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6 relative"
        >
          {renderQuizProgress()}
          
          <div className="relative min-h-64">
            <AnimatePresence mode="wait">
              {renderQuestion(quiz.questions[currentQuestionIndex], currentQuestionIndex)}
            </AnimatePresence>
            
            <div className="absolute top-0 right-0">
              <button 
                onClick={toggleQuestionSelector}
                className="p-2 rounded-lg bg-[#0d1f0d]/50 hover:bg-[#0d1f0d] transition-colors border border-green-900/30"
              >
                <List className="h-5 w-5 text-green-400" />
              </button>
            </div>
            
            <AnimatePresence>
              {showQuestionSelector && renderQuestionSelector()}
            </AnimatePresence>
          </div>

          <div className="flex justify-between mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToPrevQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded-lg flex items-center gap-1 border border-green-900/30 ${
                currentQuestionIndex === 0 
                  ? 'opacity-50 cursor-not-allowed bg-[#0d1f0d]/20' 
                  : 'bg-[#0d1f0d]/50 hover:bg-[#0d1f0d]/80'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </motion.button>
            
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={submitQuiz}
                disabled={loading}
                className={`px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-medium flex items-center gap-1 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Send className="h-5 w-5" />
                {loading ? 'Submitting...' : 'Submit Quiz'}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextQuestion}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-medium flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {result && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          <div className="p-6 bg-[#0d1f0d]/30 border border-green-900/30 rounded-lg shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-r from-green-600/30 to-emerald-600/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-green-400">
                  {result.quiz?.quizScore || 0}
                </span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-2 text-center text-green-300">
              Result: {result.quiz?.quizResult || 'N/A'}
            </h2>
            
            <div className="mt-8 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
                  <Award className="h-5 w-5" />
                  Feedback:
                </h3>
                <ul className="space-y-3">
                  {result.quiz?.responses?.map((resp, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className={`p-3 rounded-lg ${resp.isCorrect ? 'bg-green-900/20 border border-green-600/30' : 'bg-red-900/20 border border-red-600/30'}`}
                    >
                      <strong className={resp.isCorrect ? 'text-green-400' : 'text-red-400'}>
                        Question {index + 1}:
                      </strong>{' '}
                      <span className="text-gray-300">{resp.feedback || 'No feedback available.'}</span>
                    </motion.li>
                  )) || (
                    <li className="text-gray-400">No feedback available.</li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
                  <Award className="h-5 w-5" />
                  Strengths:
                </h3>
                <p className="text-gray-300">{result.quiz?.strengths || 'No specific strengths identified.'}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
                  <Award className="h-5 w-5" />
                  Weaknesses:
                </h3>
                <p className="text-gray-300">{result.quiz?.weaknesses || 'No specific weaknesses identified.'}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
                  <Link className="h-5 w-5" />
                  Recommended Resources:
                </h3>
                {recommendedResources.length > 0 ? (
                  <ul className="space-y-3">
                    {recommendedResources.map((resource, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                        className="p-3 rounded-lg bg-[#0d1f0d]/50 border border-green-600/30"
                      >
                        <a
                          href={resource?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:underline flex items-center gap-2"
                        >
                          <Link className="h-4 w-4" />
                          {resource?.title}
                        </a>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No recommended resources available.</p>
                )}
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-semibold transition-all duration-300 transform hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
            onClick={resetQuiz}
          >
            <Award className="h-5 w-5" />
            Continue Learning
          </motion.button>
        </motion.div>
      )}

      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
}