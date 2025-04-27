import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Award, Trophy } from 'lucide-react';
import { toast } from 'react-toastify';
import QuizCore from './QuizCore';

export default function DailyQuizPage() {
  const [quiz, setQuiz] = useState(null);
  const [responses, setResponses] = useState([]);
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stars, setStars] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);

  const token = localStorage.getItem('token');
  const baseurl = import.meta.env.VITE_BASE_URL;

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

  // Fetch daily quiz and leaderboard
  useEffect(() => {
    if (!token) {
      setError('Please log in to access the daily quiz.');
      return;
    }

    const fetchDailyQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(`${baseurl}/api/quiz/daily-quiz`, {
          headers: { 'x-access-token': token },
        });

        const quizData = res.data.data;
        if (!quizData.questions || quizData.questions.length === 0) {
          throw new Error('No questions generated for the quiz.');
        }

        if (quizData.questions.some(q => q.questionType !== 'MCQ')) {
          throw new Error('All questions must be MCQ.');
        }

        setQuiz({ ...quizData, quizModel: 'DailyQuiz' });
        setResponses(new Array(quizData.questions.length).fill(null));
        setResult(null);
        setCurrentQuestionIndex(0);
        if (res.data.message) {
          toast.info(res.data.message);
        } else {
          toast.success('Daily quiz loaded successfully!');
        }
      } catch (err) {
        console.error('Fetch Daily Quiz Error:', err);
        toast.error(err.response?.data?.error || 'Failed to load daily quiz.');
        setError(err.response?.data?.error || 'Failed to load daily quiz.');
      } finally {
        setLoading(false);
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(`${baseurl}/api/quiz/leaderboard`, {
          headers: { 'x-access-token': token },
        });
        setLeaderboard(res.data.data);
      } catch (err) {
        console.error('Fetch Leaderboard Error:', err);
        toast.error('Failed to load leaderboard.');
      }
    };

    fetchDailyQuiz();
    fetchLeaderboard();
  }, [token]);

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
        `${baseurl}/api/quiz/submit-quiz`,
        payload,
        { headers: { 'x-access-token': token } }
      );

      setResult(res.data.data);
      setQuiz(null);
      setResponses([]);

      // Refresh leaderboard after submission
      const leaderboardRes = await axios.get(`${baseurl}/api/quiz/leaderboard`, {
        headers: { 'x-access-token': token },
      });
      setLeaderboard(leaderboardRes.data.data);

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
    setError(null);
    setCurrentQuestionIndex(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white overflow-hidden">
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

      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-3xl p-1 bg-gradient-to-tr from-[#0d1f0d] to-[#153515] rounded-2xl shadow-2xl relative z-10 mb-8 mx-auto"
        >
          <div className="bg-[#0a1a0a]/90 backdrop-blur-lg p-8 rounded-2xl border border-green-500/20 relative overflow-hidden">
            <div className="absolute -right-20 top-0 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-0" />
            <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-0" />

            <div className="flex justify-center mb-6">
              <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block">
                <Award className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-3xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400"
            >
              {result ? 'Quiz Results' : quiz ? `${quiz.topicName} Daily Quiz` : 'Daily Quiz'}
            </motion.h1>

            {quiz && !result && (
              <div className="text-center mb-4">
                <span className="text-green-400 text-lg font-medium">{quiz.difficultyLevel}</span>
                <span className="text-gray-400 text-sm ml-2">Difficulty</span>
              </div>
            )}

            <div className="relative z-10">
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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-3xl p-1 bg-gradient-to-tr from-[#0d1f0d] to-[#153515] rounded-2xl shadow-2xl relative z-10 mx-auto"
        >
          <div className="bg-[#0a1a0a]/90 backdrop-blur-lg p-8 rounded-2xl border border-green-500/20 relative overflow-hidden">
            <div className="absolute -right-20 top-0 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-0" />
            <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-0" />

            <div className="flex justify-center mb-6">
              <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block">
                <Trophy className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400"
            >
              Leaderboard
            </motion.h2>

            {leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-300">
                  <thead>
                    <tr className="border-b border-green-900/30">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Leaderboard Score</th>
                      <th className="py-3 px-4">Quiz Score</th>
                      <th className="py-3 px-4">Completed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <motion.tr
                        key={entry.rank}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 * entry.rank }}
                        className="border-b border-green-900/20 hover:bg-green-900/10"
                      >
                        <td className="py-3 px-4">{entry.rank}</td>
                        <td className="py-3 px-4">{entry.username}</td>
                        <td className="py-3 px-4">{entry.leaderboardScore}</td>
                        <td className="py-3 px-4">{entry.quizScore}</td>
                        <td className="py-3 px-4">{new Date(entry.completedTime).toLocaleString()}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-center">No leaderboard data available.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}