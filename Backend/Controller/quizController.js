const { GoogleGenerativeAI } = require('@google/generative-ai');
const LearningPathQuiz = require('../model/LearningPathQuiz');
const CustomQuiz = require('../model/CustomQuiz');
const DailyQuiz = require('../model/DailyQuiz');
const LearningPath = require('../model/LearningPath');
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const aiService = require('../utils/quizAiService');

class QuizController {
    async verifyToken(token, res) {
        if (!token) {
            return res.status(401).json({ status: 'error', error: 'No token provided' });
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findOne({ email: decoded.email }).select('-password');
            if (!user) {
                return res.status(404).json({ status: 'error', error: 'User not found' });
            }
            return user;
        } catch (error) {
            return res.status(401).json({ status: 'error', error: 'Invalid token' });
        }
    }

    async generateLearningPathQuiz(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { learningPathId, topicName } = req.body;
            if (!learningPathId || !topicName) {
                return res.status(400).json({ status: 'error', error: 'learningPathId and topicName are required' });
            }

            const learningPath = await LearningPath.findById(learningPathId);
            if (!learningPath || learningPath.userId.toString() !== user._id.toString()) {
                return res.status(404).json({ status: 'error', error: 'Learning path not found' });
            }

            const quizData = await aiService.generateSmartQuiz(topicName, learningPath.difficultyLevel, 5, 'learning-path');

            const quiz = new LearningPathQuiz({
                userId: user._id,
                learningPathId,
                topicName,
                difficultyLevel: learningPath.difficultyLevel,
                quizTime: quizData.duration,
                questions: quizData.questions
            });

            await quiz.save();
            await LearningPath.findByIdAndUpdate(learningPathId, {
                $push: { quizzes: { quizId: quiz._id, completed: false } }
            });

            res.json({ status: 'ok', data: quiz });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to generate learning path quiz' });
        }
    }

    async generateCustomQuiz(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { topicName, difficultyLevel, numQuestions = 5 } = req.body;
            if (!topicName || !difficultyLevel || !numQuestions) {
                return res.status(400).json({ status: 'error', error: 'topicName, difficultyLevel, and numQuestions are required' });
            }

            const quizData = await aiService.generateSmartQuiz(topicName, difficultyLevel, numQuestions, 'custom');

            const quiz = new CustomQuiz({
                userId: user._id,
                topicName,
                difficultyLevel,
                numQuestions,
                quizTime: quizData.duration,
                questions: quizData.questions
            });

            await quiz.save();
            res.json({ status: 'ok', data: quiz });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to generate custom quiz' });
        }
    }

    async getDailyQuiz(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let dailyQuiz = await DailyQuiz.findOne({
                userId: null,
                quizDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
            });

            if (!dailyQuiz) {
                const topics = ['Mathematics', 'Science', 'History', 'Literature', 'Programming'];
                const randomTopic = topics[Math.floor(Math.random() * topics.length)];
                const quizData = await aiService.generateSmartQuiz(randomTopic, 'Medium', 10, 'daily');

                dailyQuiz = new DailyQuiz({
                    topicName: randomTopic,
                    difficultyLevel: 'Medium',
                    quizTime: quizData.duration,
                    questions: quizData.questions
                });
                await dailyQuiz.save();
            }

            const userSubmission = await DailyQuiz.findOne({
                userId: user._id,
                parentQuizId: dailyQuiz._id,
                quizDate: { $gte: today }
            });

            if (userSubmission) {
                return res.json({ status: 'ok', data: userSubmission, message: 'Quiz already submitted today' });
            }

            const userDailyQuiz = new DailyQuiz({
                userId: user._id,
                topicName: dailyQuiz.topicName,
                difficultyLevel: dailyQuiz.difficultyLevel,
                quizTime: dailyQuiz.quizTime,
                questions: dailyQuiz.questions,
                parentQuizId: dailyQuiz._id
            });

            await userDailyQuiz.save();
            res.json({ status: 'ok', data: userDailyQuiz });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to get daily quiz' });
        }
    }

    async submitQuiz(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { quizId, quizModel, responses } = req.body;
            if (!quizId || !quizModel || !responses || !Array.isArray(responses)) {
                return res.status(400).json({ status: 'error', error: 'quizId, quizModel, and responses array are required' });
            }

            const quizModels = { LearningPathQuiz, CustomQuiz, DailyQuiz };
            const QuizModel = quizModels[quizModel];
            if (!QuizModel) {
                return res.status(400).json({ status: 'error', error: 'Invalid quizModel' });
            }

            const quiz = await QuizModel.findById(quizId);
            if (!quiz || quiz.userId?.toString() !== user._id.toString()) {
                return res.status(404).json({ status: 'error', error: 'Quiz not found or unauthorized' });
            }

            let totalMarks = 0;
            const totalPossibleMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);
            const processedResponses = responses.map((response, index) => {
                const question = quiz.questions[index];
                if (!question) {
                    throw new Error(`Invalid question index: ${index}`);
                }
                const isCorrect = response.selectedOption === question.correctAnswer;
                const marksObtained = isCorrect ? question.marks : 0;
                totalMarks += marksObtained;

                return {
                    question: question.question,
                    selectedOption: response.selectedOption,
                    isCorrect,
                    marksObtained,
                    responseTime: response.responseTime,
                    feedback: isCorrect ? 'Correct!' : `Incorrect. ${question.aiGeneratedExplanation || 'Please review the topic.'}`
                };
            });

            quiz.responses = processedResponses;
            quiz.quizScore = totalMarks;
            quiz.quizResult = totalMarks >= totalPossibleMarks * 0.7 ? 'Pass' : 'Fail';
            quiz.completedTime = new Date();

            // Generate strengths, weaknesses, and recommended resources
            const performanceAnalysis = await aiService.analyzeQuizPerformance(
                quiz.topicName,
                quiz.difficultyLevel,
                processedResponses,
                quiz.questions
            );

            quiz.strengths = performanceAnalysis.strengths || 'No specific strengths identified.';
            quiz.weaknesses = performanceAnalysis.weaknesses || 'No specific weaknesses identified.';
            quiz.reccommendedResources = JSON.stringify(performanceAnalysis.resources || []);

            if (quizModel === 'DailyQuiz' && quiz.parentQuizId) {
                const timeTaken = (quiz.completedTime - quiz.quizDate) / 1000 / 60;
                const quizTime = quiz.quizTime;

                const accuracyScore = (totalMarks / totalPossibleMarks) * 60;
                const fastestSubmission = await DailyQuiz.findOne({
                    parentQuizId: quiz.parentQuizId,
                    quizResult: { $ne: 'Pending' }
                }).sort({ completedTime: 1 });
                const fastestTime = fastestSubmission ? (fastestSubmission.completedTime - fastestSubmission.quizDate) / 1000 / 60 : quizTime * 0.1;
                const speedScore = Math.min(30, ((quizTime - timeTaken) / (quizTime - fastestTime)) * 30);

                const hoursSinceCreation = (quiz.completedTime - quiz.quizDate) / 1000 / 60 / 60;
                const bonus = hoursSinceCreation <= 6 ? 10 : Math.max(0, 10 - (hoursSinceCreation - 6) * 10 / 6);

                quiz.leaderboardScore = Math.round((accuracyScore + speedScore + bonus) * 100) / 100;
            }

            await quiz.save();

            if (quizModel === 'LearningPathQuiz') {
                const learningPath = await LearningPath.findOne({
                    userId: user._id,
                    quizzes: { $elemMatch: { quizId } }
                });
                if (learningPath) {
                    await LearningPath.findOneAndUpdate(
                        { _id: learningPath._id, 'quizzes.quizId': quizId },
                        {
                            $set: { 'quizzes.$.completed': true },
                            $inc: {
                                courseScore: totalMarks,
                                'gamification.points': totalMarks * 10
                            }
                        }
                    );

                    const completedTopics = learningPath.topics.filter(t => t.completionStatus).length;
                    learningPath.courseCompletionStatus = Math.round((completedTopics / learningPath.topics.length) * 100);
                    if (learningPath.courseCompletionStatus === 100) {
                        learningPath.courseCompletionDate = new Date();
                        await User.findByIdAndUpdate(user._id, { $inc: { 'progressMetrics.completedCourses': 1 } });
                    }
                    await learningPath.save();
                }
            }

            if (quizModel === 'CustomQuiz' || quizModel === 'DailyQuiz') {
                await User.findByIdAndUpdate(user._id, {
                    $inc: { 'progressMetrics.totalPoints': totalMarks * 10 }
                });
            }

            res.json({ status: 'ok', data: { quiz, message: 'Quiz submitted successfully' } });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to submit quiz' });
        }
    }

    async getLeaderboard(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const dailyQuiz = await DailyQuiz.findOne({
                userId: null,
                quizDate: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
            });

            if (!dailyQuiz) {
                return res.status(404).json({ status: 'error', error: 'No daily quiz available' });
            }

            const submissions = await DailyQuiz.find({
                parentQuizId: dailyQuiz._id,
                quizResult: { $ne: 'Pending' }
            })
                .populate('userId', 'username')
                .sort({ leaderboardScore: -1, completedTime: 1 })
                .limit(10);

            const leaderboard = submissions.map((submission, index) => ({
                rank: index + 1,
                username: submission.userId?.username || 'Anonymous',
                leaderboardScore: submission.leaderboardScore,
                quizScore: submission.quizScore,
                completedTime: submission.completedTime
            }));

            res.json({ status: 'ok', data: leaderboard });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to fetch leaderboard' });
        }
    }
}

module.exports = new QuizController();