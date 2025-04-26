import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Hexagon, Award, ArrowLeft, Send, School, 
  ChevronRight, ChevronLeft, List, CheckCircle, Circle
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function QuizPage() {
  const [topicName, setTopicName] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('Easy');
  const [quiz, setQuiz] = useState(null);
  const [responses, setResponses] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stars, setStars] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);

  const token = localStorage.getItem('token');

  // Generate stars for background
  useEffect(() => {
    const generateStars = () => {
      const newStars = [];
      for (let i = 0; i < 100; i++) {
        newStars.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          blinking: Math.random() > 0.7,
        });
      }
      setStars(newStars);
    };

    generateStars();
  }, []);

  useEffect(() => {
    if (!token) {
      setError('Please log in to generate a quiz.');
    }
  }, [token]);

  const generateQuiz = async () => {
    if (!token) {
      toast.error('Please log in to generate a quiz.');
      setError('Please log in to generate a quiz.');
      return;
    }
    if (!topicName.trim()) {
      toast.error('Topic name is required.');
      setError('Topic name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(
        'http://localhost:3000/api/learning/generate-quiz',
        {
          topicName: topicName.trim(),
          difficultyLevel,
          numQuestions: 5,
        },
        {
          headers: { 'x-access-token': token },
        }
      );

      const quizData = res.data.data;
      if (!quizData.questions || quizData.questions.length === 0) {
        throw new Error('No questions generated for the quiz.');
      }

      // Validate all question types
      const invalidTypes = quizData.questions.filter(q => !['MCQ', 'True/False', 'Short Answer'].includes(q.questionType));
      if (invalidTypes.length > 0) {
        throw new Error(`Invalid question types found: ${invalidTypes.map(q => q.questionType).join(', ')}`);
      }

      setQuiz(quizData);
      setResponses(new Array(quizData.questions.length).fill(null));
      setResult(null);
      setCurrentQuestionIndex(0);
      toast.success('Quiz generated successfully!');
    } catch (err) {
      console.error('Generate Quiz Error:', err);
      toast.error(err.response?.data?.error || 'Failed to generate quiz. Please try again.');
      setError(err.response?.data?.error || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (responses.includes(null)) {
      toast.warning('Please answer all questions before submitting.');
      setError('Please answer all questions before submitting.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        quizId: quiz._id,
        responses: responses.map((selectedOption, index) => ({
          question: quiz.questions[index].question,
          selectedOption,
          questionType: quiz.questions[index].questionType,
          responseTime: 0,
        })),
      };
      const res = await axios.post(
        'http://localhost:3000/api/learning/submit-quiz',
        payload,
        {
          headers: { 'x-access-token': token },
        }
      );

      const resultData = res.data.data;
      setResult(resultData);
      setQuiz(null);
      setResponses([]);
      toast.success('Quiz submitted successfully!');
    } catch (err) {
      console.error('Submit Quiz Error:', err);
      toast.error(err.response?.data?.error || 'Failed to submit quiz. Please try again.');
      setError(err.response?.data?.error || 'Failed to submit quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index, value) => {
    const updatedResponses = [...responses];
    updatedResponses[index] = value;
    setResponses(updatedResponses);
  };

  const resetQuiz = () => {
    setQuiz(null);
    setResponses([]);
    setResult(null);
    setTopicName('');
    setDifficultyLevel('Easy');
    setError(null);
    setCurrentQuestionIndex(0);
  };

  const goToNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const goToPrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
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
          {question.questionType === 'Short Answer' ? (
            <div className="relative">
              <input
                type="text"
                className="w-full px-4 py-3 bg-[#0a1a0a]/80 border border-green-900/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                value={responses[index] || ''}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                disabled={loading}
                placeholder="Enter your answer"
              />
            </div>
          ) : question.options && question.options.length > 0 ? (
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
          ) : null}
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white overflow-hidden">
      {/* Stars background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className={`absolute rounded-full bg-green-200 ${star.blinking ? 'animate-pulse' : ''}`}
            style={{
              left: star.x + '%',
              top: star.y + '%',
              width: star.size + 'px',
              height: star.size + 'px',
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
        className="w-full max-w-3xl p-1 bg-gradient-to-tr from-[#0d1f0d] to-[#153515] rounded-2xl shadow-2xl relative z-10 my-8 mx-4"
      >
        <div className="bg-[#0a1a0a]/90 backdrop-blur-lg p-8 rounded-2xl border border-green-500/20 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute -right-20 top-0 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-0" />
          <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-0" />
          
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block">
              {result ? <Award className="h-8 w-8 text-green-400" /> : 
               quiz ? <School className="h-8 w-8 text-green-400" /> : 
               <BookOpen className="h-8 w-8 text-green-400" />}
            </div>
          </div>

          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400"
          >
            {result ? 'Quiz Results' : quiz ? `${quiz.topicName} Quiz` : 'Quiz Generator'}
          </motion.h1>
          
          {quiz && !result && (
            <div className="text-center mb-4">
              <span className="text-green-400 text-lg font-medium">{difficultyLevel}</span>
              <span className="text-gray-400 text-sm ml-2">Difficulty</span>
            </div>
          )}
          
          <div className="relative z-10">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-900/30 border border-red-500/30 text-red-300 rounded-lg"
              >
                {error}
              </motion.div>
            )}

            {!quiz && !result && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="space-y-6"
              >
                <div className="relative">
                  <Hexagon className="absolute left-4 top-3.5 h-5 w-5 text-green-500" />
                  <input
                    type="text"
                    className="w-full px-12 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                    placeholder="Enter Topic Name (e.g., JavaScript Basics)"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className="relative">
                  <select
                    className="w-full px-12 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300 appearance-none"
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(e.target.value)}
                    disabled={loading}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  <School className="absolute left-4 top-3.5 h-5 w-5 text-green-500" />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-semibold transition-all duration-300 transform hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 ${
                    loading || !token ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={generateQuiz}
                  disabled={loading || !token}
                >
                  {loading ? 'Generating...' : 'Generate Quiz'}
                </motion.button>
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
                  
                  <div className="mt-8">
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
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-semibold transition-all duration-300 transform hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
                  onClick={resetQuiz}
                >
                  <ArrowLeft className="h-5 w-5" />
                  Generate New Quiz
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

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
    </div>
  );
}