const Chatbot = require('../model/Chatbot');
const LearningPath = require('../model/LearningPath');
const Quiz = require('../model/Quiz');
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const aiService = require('../utils/aiService');
const path = require('path');

class LearningController {
    async verifyToken(token, res) {
        if (!token) return res.status(401).json({ status: 'error', error: 'No token provided' });
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findOne({ email: decoded.email }).select('-password').lean();
            if (!user) return res.status(404).json({ status: 'error', error: 'User not found' });
            return user;
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({ status: 'error', error: 'Invalid token' });
        }
    }

    async simplifyContent(req, res) {
        try {
            const user = await this.verifyToken(req.headers['x-access-token'], res);
            if (res.headersSent) return;

            const { content, contentType } = req.body;
            if (!content || !contentType) return res.status(400).json({ status: 'error', error: 'Content and contentType are required' });

            const simplifiedContent = await aiService.generateSimplifiedContent(content, contentType);
            res.json({ status: 'ok', data: simplifiedContent });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to simplify content' });
        }
    }

    async generateLearningPath(req, res) {
        try {
            const user = await this.verifyToken(req.headers['x-access-token'], res);
            if (res.headersSent) return;

            const { courseName, difficultyLevel } = req.body;
            if (!courseName || !difficultyLevel) return res.status(400).json({ status: 'error', error: 'courseName and difficultyLevel are required' });

            const learningPathData = await aiService.generateAdaptivePath(user._id, courseName, difficultyLevel, user.learningPreferences || {});
            const learningPath = new LearningPath({
                userId: user._id,
                courseName,
                topics: learningPathData.topics.map(topic => ({
                    topicName: topic.name,
                    topicDescription: topic.description,
                    topicResourceLink: topic.resourceLinks || [],
                    timeSpent: 0
                })),
                difficultyLevel,
                courseStrength: learningPathData.strength,
                courseWeakness: learningPathData.weakness,
                courseDuration: learningPathData.duration || 'N/A',
                courseResult: 'In Progress',
                gamification: { badges: [], streak: 0, points: 0 }
            });

            await learningPath.save();
            await User.findByIdAndUpdate(user._id, { $inc: { 'progressMetrics.totalCourses': 1 } }, { new: true, lean: true });
            res.json({ status: 'ok', data: learningPath.toJSON() });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to generate learning path' });
        }
    }

    async handleChat(req, res) {
        try {
            const user = await this.verifyToken(req.headers['x-access-token'], res);
            if (res.headersSent) return;

            const { question, type = 'text' } = req.body;
            if (!question) return res.status(400).json({ status: 'error', error: 'Question is required' });
            if (!['text', 'voice'].includes(type)) return res.status(400).json({ status: 'error', error: 'Type must be text or voice' });

            const answer = await aiService.generateAIResponse(question);
            let audioUrl = null;

            if (type === 'voice') {
                const outputFile = path.join('public/audio', `output-${Date.now()}.mp3`);
                await aiService.synthesizeSpeech(answer, outputFile);
                audioUrl = `/audio/${path.basename(outputFile)}`; // Relative path
                answer = `Voice reply generated. Access it at: ${audioUrl}`;
            }

            const chatbot = await Chatbot.findOneAndUpdate(
                { userId: user._id },
                { $push: { chatHistory: { question, answer, date: new Date(), source: type, audioUrl } } },
                { new: true, upsert: true, lean: true }
            );

            res.json({ status: 'ok', data: { answer, audioUrl, chatHistory: chatbot.chatHistory || [] } });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to process chat' });
        }
    }

    async generateQuiz(req, res) {
        try {
            const user = await this.verifyToken(req.headers['x-access-token'], res);
            if (res.headersSent) return;

            const { topicName, difficultyLevel, numQuestions = 5 } = req.body;
            if (!topicName || !difficultyLevel) return res.status(400).json({ status: 'error', error: 'topicName and difficultyLevel are required' });

            const quizData = await aiService.generateSmartQuiz(topicName, difficultyLevel, numQuestions);
            const quiz = new Quiz({
                userId: user._id,
                topicName,
                difficultyLevel,
                questions: quizData.questions || [],
                quizTime: quizData.duration || 10,
                quizDate: new Date(),
                quizResult: 'Pending',
                quizScore: 0
            });

            await quiz.save();
            res.json({ status: 'ok', data: quiz.toJSON() });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to generate quiz' });
        }
    }

    async submitQuiz(req, res) {
        try {
            const user = await this.verifyToken(req.headers['x-access-token'], res);
            if (res.headersSent) return;

            const { quizId, responses } = req.body;
            if (!quizId || !responses || !Array.isArray(responses)) return res.status(400).json({ status: 'error', error: 'quizId and responses array are required' });

            const quiz = await Quiz.findById(quizId).lean();
            if (!quiz) return res.status(404).json({ status: 'error', error: 'Quiz not found' });

            let totalMarks = 0;
            const processedResponses = responses.map((response, index) => {
                const question = quiz.questions[index];
                if (!question) throw new Error(`Invalid question index: ${index}`);
                const isCorrect = response.selectedOption === question.correctAnswer;
                const marksObtained = isCorrect ? question.marks : 0;
                totalMarks += marksObtained;
                return {
                    ...response,
                    isCorrect,
                    marksObtained,
                    feedback: isCorrect ? 'Correct!' : `Incorrect. ${question.aiGeneratedExplanation || 'Please review the topic.'}`
                };
            });

            await Quiz.findByIdAndUpdate(quizId, {
                responses: processedResponses,
                quizScore: totalMarks,
                quizResult: totalMarks >= (quiz.questions.length * 0.7 * (quiz.questions[0]?.marks || 1)) ? 'Pass' : 'Fail',
                completedTime: new Date()
            }, { new: true });

            res.json({ status: 'ok', data: { quizId, message: 'Quiz submitted successfully' } });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to submit quiz' });
        }
    }

    async getProgress(req, res) {
        try {
            const user = await this.verifyToken(req.headers['x-access-token'], res);
            if (res.headersSent) return;

            const [learningPaths, quizzes] = await Promise.all([
                LearningPath.find({ userId: user._id }).lean(),
                Quiz.find({ userId: user._id }).lean()
            ]);

            const progressReport = await aiService.generateProgressReport(user._id, learningPaths, quizzes);

            const progressData = {
                completedCourses: user.progressMetrics?.completedCourses || 0,
                activeCourses: (user.progressMetrics?.totalCourses || 0) - (user.progressMetrics?.completedCourses || 0),
                averageScore: quizzes.length ? quizzes.reduce((sum, q) => sum + (q.quizScore || 0), 0) / quizzes.length : 0,
                totalStudyTime: user.progressMetrics?.totalStudyTime || 0,
                recentActivity: (await Chatbot.findOne({ userId: user._id }).select('chatHistory').lean())?.chatHistory || [],
                progressReport
            };

            res.json({ status: 'ok', data: progressData });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to fetch progress' });
        }
    }

    async getDashboardData(req, res) {
        try {
            const user = await this.verifyToken(req.headers['x-access-token'], res);
            if (res.headersSent) return;

            const [learningPaths, quizzes] = await Promise.all([
                LearningPath.find({ userId: user._id }).lean(),
                Quiz.find({ userId: user._id }).lean()
            ]);

            const dashboardData = {
                learningPaths: learningPaths.map(path => ({
                    courseName: path.courseName,
                    progress: path.courseCompletionStatus || 0,
                    strength: path.courseStrength || 'N/A',
                    weakness: path.courseWeakness || 'N/A',
                    points: path.gamification?.points || 0
                })),
                quizStats: {
                    totalQuizzes: quizzes.length,
                    averageScore: quizzes.length ? quizzes.reduce((sum, q) => sum + (q.quizScore || 0), 0) / quizzes.length : 0,
                    passRate: quizzes.length ? (quizzes.filter(q => q.quizResult === 'Pass').length / quizzes.length * 100) : 0
                },
                recentActivities: (await Chatbot.findOne({ userId: user._id }).select('chatHistory').lean())?.chatHistory.slice(-5) || [],
                gamification: {
                    totalPoints: learningPaths.reduce((sum, path) => sum + (path.gamification?.points || 0), 0),
                    activeStreaks: learningPaths.map(p => p.gamification?.streak || 0).filter(s => s > 0)
                }
            };

            res.json({ status: 'ok', data: dashboardData });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to fetch dashboard data' });
        }
    }
}

module.exports = new LearningController();