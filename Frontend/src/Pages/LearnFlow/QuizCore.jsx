import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Send, ChevronRight, ChevronLeft, List, CheckCircle, Circle, Link } from 'lucide-react';

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
    if (index < 0 || index >= (quiz?.questions?.length || 0)) {
      console.error(`Invalid question index: ${index}`);
      return;
    }
    const updatedResponses = [...responses];
    updatedResponses[index] = value;
    setResponses(updatedResponses);
  };

  const goToQuestion = (index) => {
    if (index >= 0 && index < (quiz?.questions?.length || 0)) {
      setCurrentQuestionIndex(index);
      setShowQuestionSelector(false);
    }
  };

  const toggleQuestionSelector = () => {
    setShowQuestionSelector(!showQuestionSelector);
  };

  const renderQuestion = (question, index) => {
    if (!question) return null;
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
    if (!quiz?.questions) return null;
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
              style={{ width: totalQuestions > 0 ? `${(answeredQuestions / totalQuestions) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-red-900/30 border border-red-500/30 text-red-300 rounded-lg"
        >
          {error}
          <button
            onClick={() => setError('')}
            className="ml-4 text-sm text-green-400 hover:underline"
          >
            Clear
          </button>
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
              {quiz.questions && renderQuestion(quiz.questions[currentQuestionIndex], currentQuestionIndex)}
            </AnimatePresence>
            
            <div className="absolute top-0 right-0">
              <button 
                onClick={toggleQuestionSelector}
                className="p-2 rounded-lg bg-[#0d1f0d]/50 hover:bg-[#0d1f0d] transition-colors border border-green-900/30"
                disabled={loading}
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
              disabled={currentQuestionIndex === 0 || loading}
              className={`px-4 py-2 rounded-lg flex items-center gap-1 border border-green-900/30 ${
                currentQuestionIndex === 0 || loading
                  ? 'opacity-50 cursor-not-allowed bg-[#0d1f0d]/20' 
                  : 'bg-[#0d1f0d]/50 hover:bg-[#0d1f0d]/80'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </motion.button>
            
            {currentQuestionIndex === (quiz?.questions?.length - 1 || 0) ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={submitQuiz}
                disabled={loading}
                className={`px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-medium flex items-center gap-1 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <Send className="h-5 w-5" />
                )}
                {loading ? 'Submitting...' : 'Submit Quiz'}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextQuestion}
                disabled={loading}
                className={`px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-medium flex items-center gap-1 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
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
          {console.log('Result object:', JSON.stringify(result, null, 2))}
          <div className="p-6 bg-[#0d1f0d]/30 border border-green-900/30 rounded-lg shadow-lg">
            {!result.quiz ? (
              <p className="text-red-400 text-center">Error: Quiz result data is missing.</p>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-green-600/30 to-emerald-600/30 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-400">
                      {result.quiz.quizScore !== undefined ? result.quiz.quizScore : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold mb-2 text-center text-green-300">
                  Result: {result.quiz.quizResult || 'N/A'}
                </h2>
                
                <div className="mt-8 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
                      <Award className="h-5 w-5" />
                      Strengths
                    </h3>
                    <p className="text-gray-300">
                      {result.quiz.strengths || 'No specific strengths identified.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
                      <Award className="h-5 w-5" />
                      Weaknesses
                    </h3>
                    <p className="text-gray-300">
                      {result.quiz.weaknesses || 'No specific weaknesses identified.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
                      <Award className="h-5 w-5" />
                      Recommended Resources
                    </h3>
                    {result.quiz.resources && result.quiz.resources.length > 0 ? (
                      <ul className="space-y-2">
                        {result.quiz.resources.map((resource, idx) => (
                          <li key={idx}>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-400 hover:underline flex items-center gap-2"
                            >
                              <Link className="h-4 w-4" />
                              {resource.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-300">No resources available.</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetQuiz}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-medium text-center"
          >
            Return to Learning Path
          </motion.button>
        </motion.div>
      )}
    </>
  );
}