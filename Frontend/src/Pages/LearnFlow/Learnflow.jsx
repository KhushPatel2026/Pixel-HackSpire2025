import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import QuizCore from './QuizCore';
import { Book, Link, CheckCircle } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function LearnFlow() {
  const { learningPathId } = useParams();
  const { state } = useLocation();
  const [learningPath, setLearningPath] = useState(null);
  const [currentSubtopicIndex, setCurrentSubtopicIndex] = useState(0);
  const [quiz, setQuiz] = useState(null);
  const [responses, setResponses] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);

  const token = localStorage.getItem('token');

  const notifyError = (message) => {
    setTimeout(() => {
      toast.error(message, { toastId: message });
    }, 100);
  };

  useEffect(() => {
    if (learningPathId) {
      fetchLearningPath();
    }
  }, [learningPathId]);

  useEffect(() => {
    if (state?.startSubtopicIndex >= 0 && learningPath) {
      setCurrentSubtopicIndex(state.startSubtopicIndex);
    }
  }, [state, learningPath]);

  const fetchLearningPath = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:3000/api/learning/learning-path/${learningPathId}`,
        { headers: { 'x-access-token': token } }
      );
      setLearningPath(res.data.data);
      setResponses(new Array(res.data.data.topics.length).fill(null));
      setError('');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch learning path';
      setError(errorMessage);
      notifyError(errorMessage);
    }
    setLoading(false);
  };

  const markSubtopicComplete = async () => {
    if (!learningPath) return;
    setLoading(true);
    try {
      const updatedTopics = [...learningPath.topics];
      updatedTopics[currentSubtopicIndex] = {
        ...updatedTopics[currentSubtopicIndex],
        completionStatus: true,
        completionDate: new Date()
      };
      const res = await axios.put(
        `http://localhost:3000/api/learning/learning-path/${learningPath._id}`,
        { topics: updatedTopics },
        { headers: { 'x-access-token': token } }
      );
      setLearningPath(res.data.data);

      const completedTopics = res.data.data.topics.filter(t => t.completionStatus).length;
      if (completedTopics % 3 === 0 || completedTopics === res.data.data.topics.length) {
        const subtopicsForQuiz = res.data.data.topics
          .filter(t => t.completionStatus)
          .slice(-3)
          .map(t => t.topicName);
        await triggerQuiz(subtopicsForQuiz);
      } else {
        const nextIndex = res.data.data.topics.findIndex(
          (t, i) => i > currentSubtopicIndex && !t.completionStatus
        );
        setCurrentSubtopicIndex(nextIndex >= 0 ? nextIndex : currentSubtopicIndex + 1);
      }
      toast.success('Subtopic marked as complete!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to mark subtopic complete';
      setError(errorMessage);
      notifyError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const triggerQuiz = async (subtopicNames) => {
    setIsQuizLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:3000/api/learning/trigger-quiz',
        { learningPathId: learningPath._id, subtopicNames },
        { headers: { 'x-access-token': token } }
      );
      setQuiz(res.data.data);
      setResponses(new Array(res.data.data.questions.length).fill(null));
      setResult(null);
      setError('');
      toast.success('Quiz triggered successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to trigger quiz';
      setError(errorMessage);
      notifyError(errorMessage);
    } finally {
      setIsQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:3000/api/learning/submit-quiz',
        {
          quizId: quiz._id,
          responses: responses.map((selectedOption, index) => ({
            selectedOption,
            responseTime: 30
          }))
        },
        { headers: { 'x-access-token': token } }
      );
      setResult(res.data.data);
      setQuiz(null);
      setResponses([]);

      const updatedPathRes = await axios.get(
        `http://localhost:3000/api/learning/learning-path/${learningPath._id}`,
        { headers: { 'x-access-token': token } }
      );
      const updatedPath = updatedPathRes.data.data;
      setLearningPath(updatedPath);

      const nextIndex = updatedPath.topics.findIndex(
        (t, i) => i > currentSubtopicIndex && !t.completionStatus
      );
      if (nextIndex >= 0) {
        setCurrentSubtopicIndex(nextIndex);
      } else if (currentSubtopicIndex + 1 < updatedPath.topics.length) {
        setCurrentSubtopicIndex(currentSubtopicIndex + 1);
      } else {
        toast.info('Course completed or no more subtopics available!');
      }
      toast.success('Quiz submitted successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to submit quiz';
      setError(errorMessage);
      notifyError(errorMessage);
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
    setCurrentQuestionIndex(0);
    setError('');
  };

  const simplifyContent = async (content, contentType) => {
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:3000/api/learning/simplify-content',
        {
          content,
          contentType,
          learningPathId: learningPath._id,
          subtopicName: learningPath.topics[currentSubtopicIndex].topicName
        },
        { headers: { 'x-access-token': token } }
      );
      const updatedPath = { ...learningPath };
      updatedPath.topics[currentSubtopicIndex].topicResourceLink.push(res.data.data.simplified);
      setLearningPath(updatedPath);
      await axios.put(
        `http://localhost:3000/api/learning/learning-path/${learningPath._id}`,
        { topics: updatedPath.topics },
        { headers: { 'x-access-token': token } }
      );
      toast.success('Content simplified and added to resources!');
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to simplify content';
      setError(errorMessage);
      notifyError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !learningPath) return <p className="text-gray-300 text-center">Loading...</p>;
  if (error && !learningPath) return <p className="text-red-400 text-center">{error}</p>;

  return (
    <div className="min-h-screen bg-[#0a1a0a] text-gray-300 p-8">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      {learningPath ? (
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-green-400 mb-6">{learningPath.courseName} Learning Path</h2>
          {!quiz ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="p-6 bg-[#0d1f0d]/30 border border-green-900/30 rounded-lg">
                <h3 className="text-xl font-semibold text-green-300 mb-4">
                  Subtopic {currentSubtopicIndex + 1}: {learningPath.topics[currentSubtopicIndex].topicName}
                </h3>
                <p className="text-gray-300 mb-4">{learningPath.topics[currentSubtopicIndex].topicDescription}</p>
                <h4 className="text-lg font-medium text-green-400 mb-2">Resources:</h4>
                <ul className="space-y-2">
                  {learningPath.topics[currentSubtopicIndex].topicResourceLink.map((resource, idx) => (
                    <li key={idx}>
                      <a
                        href={typeof resource === 'string' ? resource : resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:underline flex items-center gap-2"
                      >
                        <Link className="h-4 w-4" />
                        {typeof resource === 'string' ? `Resource ${idx + 1}` : resource.title}
                      </a>
                    </li>
                  ))}
                </ul>
                <textarea
                  placeholder="Paste text or YouTube URL to simplify"
                  onBlur={(e) => e.target.value && simplifyContent(e.target.value, 'text')}
                  className="w-full p-3 mt-4 bg-[#0d1f0d] border border-green-900/30 rounded-lg text-gray-300"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={markSubtopicComplete}
                  disabled={loading || isQuizLoading}
                  className={`mt-4 px-4 py-2 rounded-lg flex items-center gap-2 ${
                    loading || isQuizLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
                  }`}
                >
                  {isQuizLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 mr-2 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Loading Quiz...
                    </>
                  ) : loading ? (
                    'Updating...'
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Mark as Complete
                    </>
                  )}
                </motion.button>
              </div>
              <div className="p-6 bg-[#0d1f0d]/30 border border-green-900/30 rounded-lg">
                <h3 className="text-lg font-semibold text-green-400 mb-4">Progress</h3>
                <div className="w-full bg-[#0d1f0d]/50 rounded-full h-4">
                  <div
                    className="bg-gradient-to-r from-green-600 to-emerald-500 h-full rounded-full"
                    style={{ width: `${learningPath.courseCompletionStatus}%` }}
                  />
                </div>
                <p className="text-gray-300 mt-2">
                  {learningPath.topics.filter(t => t.completionStatus).length} / {learningPath.topics.length} subtopics completed
                </p>
              </div>
            </motion.div>
          ) : (
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
          )}
        </div>
      ) : (
        <p className="text-gray-300 text-center">No learning path selected. Please select a learning path from the dashboard.</p>
      )}
    </div>
  );
}