import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { School, Hexagon } from 'lucide-react';
import { toast } from 'react-toastify';
import QuizCore from './QuizCore';

export default function CustomQuizPage() {
  const [topicName, setTopicName] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('Easy');
  const [numQuestions, setNumQuestions] = useState(5);
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

  // Check token
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

    if (!topicName.trim() || !difficultyLevel || !numQuestions) {
      toast.error('Topic name, difficulty level, and number of questions are required.');
      setError('Topic name, difficulty level, and number of questions are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await axios.post(
        'http://localhost:3000/api/quiz/custom-quiz',
        { topicName: topicName.trim(), difficultyLevel, numQuestions },
        { headers: { 'x-access-token': token } }
      );

      const quizData = res.data.data;
      if (!quizData.questions || quizData.questions.length === 0) {
        throw new Error('No questions generated for the quiz.');
      }

      if (quizData.questions.some(q => q.questionType !== 'MCQ')) {
        throw new Error('All questions must be MCQ.');
      }

      setQuiz({ ...quizData, quizModel: 'CustomQuiz' });
      setResponses(new Array(quizData.questions.length).fill(null));
      setResult(null);
      setCurrentQuestionIndex(0);
      toast.success('Quiz generated successfully!');
    } catch (err) {
      console.error('Generate Quiz Error:', err);
      toast.error(err.response?.data?.error || 'Failed to generate quiz.');
      setError(err.response?.data?.error || 'Failed to generate quiz.');
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
        quizModel: quiz.quizModel,
        responses: responses.map((selectedOption, index) => ({
          question: quiz.questions[index].question,
          selectedOption,
          responseTime: 0,
        })),
      };
      const res = await axios.post(
        'http://localhost:3000/api/quiz/submit-quiz',
        payload,
        { headers: { 'x-access-token': token } }
      );

      setResult(res.data.data);
      setQuiz(null);
      setResponses([]);
      toast.success('Quiz submitted successfully!');
    } catch (err) {
      console.error('Submit Quiz Error:', err);
      toast.error(err.response?.data?.error || 'Failed to submit quiz.');
      setError(err.response?.data?.error || 'Failed to submit quiz.');
    } finally {
      setLoading(false);
    }
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

  const resetQuiz = () => {
    setQuiz(null);
    setResponses([]);
    setResult(null);
    setTopicName('');
    setDifficultyLevel('Easy');
    setNumQuestions(5);
    setError(null);
    setCurrentQuestionIndex(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white overflow-hidden">
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

          <div className="flex justify-center mb-6">
            <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block">
              <School className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400"
          >
            {result ? 'Quiz Results' : quiz ? `${quiz.topicName} Quiz` : 'Custom Quiz Generator'}
          </motion.h1>

          {quiz && !result && (
            <div className="text-center mb-4">
              <span className="text-green-400 text-lg font-medium">{quiz.difficultyLevel}</span>
              <span className="text-gray-400 text-sm ml-2">Difficulty</span>
            </div>
          )}

          <div className="relative z-10">
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

                <div className="relative">
                  <input
                    type="number"
                    className="w-full px-12 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                    placeholder="Number of Questions (e.g., 5)"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    min="1"
                    disabled={loading}
                  />
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

            <QuizCore
              quiz={quiz}
              responses={responses}
              setResponses={setResponses}
              result={result}
              setResult={setResult}
              loading={loading}
              setLoading={setLoading}
              error={error}
              setError={setError}
              currentQuestionIndex={currentQuestionIndex}
              setCurrentQuestionIndex={setCurrentQuestionIndex}
              showQuestionSelector={showQuestionSelector}
              setShowQuestionSelector={setShowQuestionSelector}
              submitQuiz={submitQuiz}
              goToNextQuestion={goToNextQuestion}
              goToPrevQuestion={goToPrevQuestion}
              resetQuiz={resetQuiz}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}