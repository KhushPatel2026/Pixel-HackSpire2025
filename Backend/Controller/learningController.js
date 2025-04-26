const Chatbot = require('../model/Chatbot');
const LearningPath = require('../model/LearningPath');
const Quiz = require('../model/Quiz');
const User = require('../model/User');
const jwt = require('jsonwebtoken');
const aiService = require('../utils/aiService');
const path = require('path');

class LearningController {
    async verifyToken(token, res) {
        if (!token) {
            return res.status(401).json({ status: 'error', error: 'No token provided' });
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const email = decoded.email;
            const user = await User.findOne({ email }).select('-password');
            if (!user) {
                return res.status(404).json({ status: 'error', error: 'User not found' });
            }
            return user;
        } catch (error) {
            return res.status(401).json({ status: 'error', error: 'invalid token' });
        }
    }

    async simplifyContent(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { content, contentType } = req.body;
            if (!content || !contentType) {
                return res.status(400).json({ status: 'error', error: 'Content and contentType are required' });
            }

            const simplifiedContent = await aiService.generateSimplifiedContent(content, contentType);
            res.json({ status: 'ok', data: simplifiedContent });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to simplify content' });
        }
    }

    async generateLearningPath(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { courseName, difficultyLevel } = req.body;
            if (!courseName || !difficultyLevel) {
                return res.status(400).json({ status: 'error', error: 'courseName and difficultyLevel are required' });
            }

            const learningPathData = await aiService.generateAdaptivePath(
                user._id,
                courseName,
                difficultyLevel,
                user.learningPreferences
            );

            const learningPath = new LearningPath({
                userId: user._id,
                courseName,
                topics: learningPathData.topics.map(topic => ({
                    topicName: topic.name,
                    topicDescription: topic.description,
                    topicResourceLink: topic.resourceLinks,
                    timeSpent: 0
                })),
                difficultyLevel,
                courseStrength: learningPathData.strength,
                courseWeakness: learningPathData.weakness,
                courseDuration: learningPathData.duration,
                courseResult: 'In Progress',
                gamification: { badges: [], streak: 0, points: 0 }
            });

            await learningPath.save();
            await User.findByIdAndUpdate(user._id, { $inc: { 'progressMetrics.totalCourses': 1 } });
            res.json({ status: 'ok', data: learningPath });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to generate learning path' });
        }
    }

    async handleChat(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { question, type = 'text' } = req.body;
            if (!question) {
                return res.status(400).json({ status: 'error', error: 'Question is required' });
            }
            if (!['text', 'voice'].includes(type)) {
                return res.status(400).json({ status: 'error', error: 'Type must be text or voice' });
            }

            // Generate response using Gemini AI
            const answer = await aiService.generateAIResponse(question);
            let audioUrl = null;
            let source = type;

            if (type === 'voice') {
                // Generate voice reply
                const outputFile = path.join('public/audio', `output-${Date.now()}.mp3`);
                await aiService.synthesizeSpeech(answer, outputFile);
                audioUrl = `http://localhost:3000/audio/${path.basename(outputFile)}`;
                // Update answer to include audio URL
                answer = `Voice reply generated. Access it at: ${audioUrl}`;
            }

            const chatbot = await Chatbot.findOneAndUpdate(
                { userId: user._id },
                {
                    $push: {
                        chatHistory: {
                            question,
                            answer,
                            date: new Date(),
                            source,
                            audioUrl: type === 'voice' ? audioUrl : null
                        }
                    }
                },
                { new: true, upsert: true }
            );

            res.json({ status: 'ok', data: { answer, audioUrl, chatHistory: chatbot.chatHistory } });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to process chat' });
        }
    }

    async generateQuiz(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { topicName, difficultyLevel, numQuestions = 5 } = req.body;
            if (!topicName || !difficultyLevel) {
                return res.status(400).json({ status: 'error', error: 'topicName and difficultyLevel are required' });
            }

            const quizData = await aiService.generateSmartQuiz(topicName, difficultyLevel, numQuestions);

            const quiz = new Quiz({
                userId: user._id,
                topicName,
                difficultyLevel,
                questions: quizData.questions,
                quizTime: quizData.duration,
                quizDate: new Date(),
                quizResult: 'Pending',
                quizScore: 0
            });

            await quiz.save();

            const learningPath = await LearningPath.findOneAndUpdate(
                { userId: user._id, courseName: topicName },
                { $push: { quizzes: { quizId: quiz._id } } },
                { new: true }
            );

            if (!learningPath) {
                return res.status(404).json({ status: 'error', error: 'Learning path not found for this topic' });
            }

            res.json({ status: 'ok', data: quiz });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to generate quiz' });
        }
    }

    async submitQuiz(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { quizId, responses } = req.body;
            if (!quizId || !responses || !Array.isArray(responses)) {
                return res.status(400).json({ status: 'error', error: 'quizId and responses array are required' });
            }

            const quiz = await Quiz.findById(quizId);
            if (!quiz) {
                return res.status(404).json({ status: 'error', error: 'Quiz not found' });
            }

            let totalMarks = 0;
            const processedResponses = responses.map((response, index) => {
                const question = quiz.questions[index];
                if (!question) {
                    throw new Error(`Invalid question index: ${index}`);
                }
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

            quiz.responses = processedResponses;
            quiz.quizScore = totalMarks;
            quiz.quizResult = totalMarks >= quiz.questions.length * 0.7 ? 'Pass' : 'Fail';
            quiz.completedTime = new Date();

            await quiz.save();

            const learningPath = await LearningPath.findOneAndUpdate(
                { userId: user._id, 'quizzes.quizId': quizId },
                {
                    $set: { 'quizzes.$.completed': true },
                    $inc: { courseScore: totalMarks, 'gamification.points': totalMarks * 10 }
                },
                { new: true }
            );

            if (!learningPath) {
                return res.status(404).json({ status: 'error', error: 'Learning path not found for this quiz' });
            }

            const completedTopics = learningPath.topics.filter(t => t.completionStatus).length;
            learningPath.courseCompletionStatus = Math.round((completedTopics / learningPath.topics.length) * 100);
            if (learningPath.courseCompletionStatus === 100) {
                learningPath.courseCompletionDate = new Date();
                await User.findByIdAndUpdate(user._id, { $inc: { 'progressMetrics.completedCourses': 1 } });
            }
            await learningPath.save();

            res.json({ status: 'ok', data: { quiz, message: 'Quiz submitted successfully' } });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to submit quiz' });
        }
    }

    async getProgress(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const learningPaths = await LearningPath.find({ userId: user._id });
            const quizzes = await Quiz.find({ userId: user._id });

            const progressReport = await aiService.generateProgressReport(user._id, learningPaths, quizzes);

            const progressData = {
                completedCourses: user.progressMetrics.completedCourses,
                activeCourses: user.progressMetrics.totalCourses - user.progressMetrics.completedCourses,
                averageScore: quizzes.length ? 
                    quizzes.reduce((sum, quiz) => sum + quiz.quizScore, 0) / quizzes.length : 0,
                totalStudyTime: user.progressMetrics.totalStudyTime,
                recentActivity: await Chatbot.findOne({ userId: user._id }).select('chatHistory').lean() || { chatHistory: [] },
                progressReport
            };

            res.json({ status: 'ok', data: progressData });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to fetch progress' });
        }
    }

    async getDashboardData(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const learningPaths = await LearningPath.find({ userId: user._id }).lean();
            const quizzes = await Quiz.find({ userId: user._id }).lean();

            const dashboardData = {
                learningPaths: learningPaths.map(path => ({
                    courseName: path.courseName,
                    progress: path.courseCompletionStatus,
                    strength: path.courseStrength,
                    weakness: path.courseWeakness,
                    points: path.gamification.points
                })),
                quizStats: {
                    totalQuizzes: quizzes.length,
                    averageScore: quizzes.length ? 
                        quizzes.reduce((sum, quiz) => sum + quiz.quizScore, 0) / quizzes.length : 0,
                    passRate: quizzes.length ? 
                        (quizzes.filter(q => q.quizResult === 'Pass').length / quizzes.length * 100) : 0
                },
                recentActivities: await Chatbot.findOne({ userId: user._id })
                    .select('chatHistory')
                    .lean()
                    .then(data => data?.chatHistory.slice(-5) || []),
                gamification: {
                    totalPoints: learningPaths.reduce((sum, path) => sum + path.gamification.points, 0),
                    activeStreaks: learningPaths.map(p => p.gamification.streak).filter(s => s > 0)
                }
            };

            res.json({ status: 'ok', data: dashboardData });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to fetch dashboard data' });
        }
    }
}

module.exports = new LearningController();