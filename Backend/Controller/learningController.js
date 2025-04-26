const LearningPath = require('../model/LearningPath');
const LearningPathQuiz = require('../model/LearningPathQuiz');
const Chatbot = require('../model/Chatbot');
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
            const user = await User.findOne({ email: decoded.email }).select('-password');
            if (!user) {
                return res.status(404).json({ status: 'error', error: 'User not found' });
            }
            return user;
        } catch (error) {
            return res.status(401).json({ status: 'error', error: 'Invalid token' });
        }
    }

    async getLearningPath(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ status: 'error', error: 'Learning path ID is required' });
            }

            const learningPath = await LearningPath.findById(id).sort({ 'topics.order': 1 });
            if (!learningPath || learningPath.userId.toString() !== user._id.toString()) {
                return res.status(404).json({ status: 'error', error: 'Learning path not found or unauthorized' });
            }

            res.json({ status: 'ok', data: learningPath });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to fetch learning path' });
        }
    }

    async getAllLearningPaths(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const learningPaths = await LearningPath.find({ userId: user._id }).sort({ 'topics.order': 1 }).lean();
            const enrichedPaths = learningPaths.map(path => {
                const firstIncompleteIndex = path.topics.findIndex(t => !t.completionStatus);
                return {
                    id: path._id,
                    courseName: path.courseName,
                    progress: path.courseCompletionStatus,
                    firstIncompleteSubtopicIndex: firstIncompleteIndex >= 0 ? firstIncompleteIndex : path.topics.length,
                    points: path.gamification.points,
                    strength: path.courseStrength,
                    weakness: path.courseWeakness
                };
            });

            res.json({ status: 'ok', data: enrichedPaths });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to fetch learning paths' });
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
                    timeSpent: 0,
                    order: topic.order,
                    completionStatus: false,
                    completionDate: null
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
            res.json({ status: 'ok', data: { id: learningPath._id, ...learningPath.toObject() } });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to generate learning path' });
        }
    }

    async updateLearningPath(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { id } = req.params;
            const { topics } = req.body;

            if (!id || !topics || !Array.isArray(topics)) {
                return res.status(400).json({ status: 'error', error: 'Learning path ID and topics array are required' });
            }

            const learningPath = await LearningPath.findById(id);
            if (!learningPath || learningPath.userId.toString() !== user._id.toString()) {
                return res.status(404).json({ status: 'error', error: 'Learning path not found or unauthorized' });
            }

            learningPath.topics = topics.map(topic => ({
                topicName: topic.topicName,
                topicDescription: topic.topicDescription,
                topicResourceLink: topic.topicResourceLink,
                timeSpent: topic.timeSpent || 0,
                order: topic.order,
                completionStatus: topic.completionStatus || false,
                completionDate: topic.completionDate || null
            }));

            const completedTopics = learningPath.topics.filter(t => t.completionStatus).length;
            learningPath.courseCompletionStatus = Math.round((completedTopics / learningPath.topics.length) * 100);
            if (learningPath.courseCompletionStatus === 100 && !learningPath.courseCompletionDate) {
                learningPath.courseCompletionDate = new Date();
                await User.findByIdAndUpdate(user._id, { $inc: { 'progressMetrics.completedCourses': 1 } });
            }

            await learningPath.save();
            res.json({ status: 'ok', data: learningPath });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to update learning path' });
        }
    }

    async simplifyContent(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { content, contentType, learningPathId, subtopicName } = req.body;
            if (!content || !contentType || !learningPathId || !subtopicName) {
                return res.status(400).json({ status: 'error', error: 'Content, contentType, learningPathId, and subtopicName are required' });
            }

            const learningPath = await LearningPath.findById(learningPathId);
            if (!learningPath || learningPath.userId.toString() !== user._id.toString()) {
                return res.status(404).json({ status: 'error', error: 'Learning path not found' });
            }

            const simplifiedContent = await aiService.generateSimplifiedContent(content, contentType);
            await LearningPath.updateOne(
                { _id: learningPathId, 'topics.topicName': subtopicName },
                { $push: { 'topics.$.topicResourceLink': simplifiedContent } }
            );

            res.json({ status: 'ok', data: { simplified: simplifiedContent } });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to simplify content' });
        }
    }

    async triggerQuiz(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { learningPathId, subtopicNames } = req.body;
            if (!learningPathId || !subtopicNames || !Array.isArray(subtopicNames)) {
                return res.status(400).json({ status: 'error', error: 'learningPathId and subtopicNames array are required' });
            }

            const learningPath = await LearningPath.findById(learningPathId);
            if (!learningPath || learningPath.userId.toString() !== user._id.toString()) {
                return res.status(404).json({ status: 'error', error: 'Learning path not found' });
            }

            const quizData = await aiService.generateSmartQuiz(
                subtopicNames.join(', '),
                learningPath.difficultyLevel,
                5,
                'learning-path'
            );

            const quiz = new LearningPathQuiz({
                userId: user._id,
                learningPathId,
                topicName: subtopicNames.join(', '),
                difficultyLevel: learningPath.difficultyLevel,
                quizTime: quizData.duration,
                questions: quizData.questions
            });

            await quiz.save();
            await LearningPath.findByIdAndUpdate(learningPathId, {
                $push: { quizzes: { quizId: quiz._id, completed: false, subtopicsCovered: subtopicNames } }
            });

            res.json({ status: 'ok', data: quiz });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to trigger quiz' });
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

            const quiz = await LearningPathQuiz.findById(quizId);
            if (!quiz || quiz.userId.toString() !== user._id.toString()) {
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
                    feedback: isCorrect ? 'Correct!' : `Incorrect. ${question.aiGeneratedExplanation || 'Please review the topic.'}`,
                    resources: []
                };
            });

            quiz.responses = processedResponses;
            quiz.quizScore = totalMarks;
            quiz.quizResult = totalMarks >= totalPossibleMarks * 0.7 ? 'Pass' : 'Fail';
            quiz.completedTime = new Date();

            const performanceAnalysis = await aiService.analyzeQuizPerformance(
                quiz.topicName,
                quiz.difficultyLevel,
                processedResponses,
                quiz.questions,
                'learning-path'
            );

            // Attach resources to incorrect responses
            quiz.responses = quiz.responses.map((response, index) => {
                if (!response.isCorrect) {
                    const feedback = performanceAnalysis.incorrectFeedback.find(f => f.question === response.question);
                    if (feedback) {
                        response.feedback = feedback.feedback;
                        response.resources = feedback.resources;
                    }
                }
                return response;
            });

            quiz.strengths = performanceAnalysis.strengths;
            quiz.weaknesses = performanceAnalysis.weaknesses;

            await quiz.save();

            const learningPath = await LearningPath.findOne({ 'quizzes.quizId': quizId });
            if (learningPath) {
                await LearningPath.updateOne(
                    { _id: learningPath._id, 'quizzes.quizId': quizId },
                    {
                        $set: { 'quizzes.$.completed': true },
                        $inc: { courseScore: totalMarks, 'gamification.points': totalMarks * 10 }
                    }
                );

                // Update learning path with remedial subtopics only for incorrect answers
                const incorrectSubtopics = [...new Set(
                    quiz.responses
                        .filter(r => !r.isCorrect)
                        .map((_, i) => quiz.questions[i].subtopic)
                )];
                const remedialSubtopics = performanceAnalysis.remedialSubtopics
                    .filter(st => incorrectSubtopics.includes(st.name));

                if (remedialSubtopics.length > 0) {
                    const maxOrder = Math.max(...learningPath.topics.map(t => t.order), 0);
                    await LearningPath.updateOne(
                        { _id: learningPath._id },
                        {
                            $push: {
                                topics: {
                                    $each: remedialSubtopics.map((st, i) => ({
                                        topicName: st.name,
                                        topicDescription: st.description,
                                        topicResourceLink: st.resourceLinks,
                                        timeSpent: 0,
                                        order: maxOrder + i + 1,
                                        completionStatus: false,
                                        completionDate: null
                                    }))
                                }
                            }
                        }
                    );
                }

                const completedTopics = learningPath.topics.filter(t => t.completionStatus).length;
                learningPath.courseCompletionStatus = Math.round((completedTopics / learningPath.topics.length) * 100);
                if (learningPath.courseCompletionStatus === 100 && !learningPath.courseCompletionDate) {
                    learningPath.courseCompletionDate = new Date();
                    await User.findByIdAndUpdate(user._id, { $inc: { 'progressMetrics.completedCourses': 1 } });
                }
                await learningPath.save();
            }

            res.json({ status: 'ok', data: { quiz, message: 'Quiz submitted successfully' } });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to submit quiz' });
        }
    }

    async handleChat(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const { type = 'text' } = req.body;
            if (!['text', 'voice'].includes(type)) {
                return res.status(400).json({ status: 'error', error: 'Type must be text or voice' });
            }

            let question;
            let transcription = '';

            if (type === 'voice') {
                if (!req.file) {
                    return res.status(400).json({ status: 'error', error: 'Audio file is required for voice input' });
                }
                try {
                    transcription = await aiService.transcribeAudio(req.file.buffer, req.file.mimetype);
                    question = transcription;
                } catch (error) {
                    return res.status(400).json({ status: 'error', error: `Transcription failed: ${error.message}` });
                }
            } else {
                question = req.body.question;
                if (!question) {
                    return res.status(400).json({ status: 'error', error: 'Question is required for text input' });
                }
            }

            const chatbot = await Chatbot.findOne({ userId: user._id }).lean();
            const chatHistory = chatbot?.chatHistory || [];

            const { answer, followUp } = await aiService.generateAIResponse(question, chatHistory);

            const outputFile = path.join('public/audio', `output-${Date.now()}.mp3`);
            await aiService.synthesizeSpeech(answer, outputFile);
            const audioUrl = `http://localhost:3000/audio/${path.basename(outputFile)}`;

            const updatedChatbot = await Chatbot.findOneAndUpdate(
                { userId: user._id },
                {
                    $push: {
                        chatHistory: {
                            question,
                            answer,
                            date: new Date(),
                            source: type,
                            audioUrl,
                            followUp
                        }
                    }
                },
                { new: true, upsert: true }
            );

            res.json({ 
                status: 'ok', 
                data: { 
                    transcription,
                    answer, 
                    audioUrl, 
                    followUp, 
                    chatHistory: updatedChatbot.chatHistory 
                } 
            });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.message || 'Failed to process chat' });
        }
    }

    async getProgress(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (res.headersSent) return;

            const learningPaths = await LearningPath.find({ userId: user._id });
            const quizzes = await LearningPathQuiz.find({ userId: user._id });

            const progressData = {
                completedCourses: user.progressMetrics.completedCourses,
                activeCourses: user.progressMetrics.totalCourses - user.progressMetrics.completedCourses,
                averageScore: quizzes.length ? 
                    quizzes.reduce((sum, quiz) => sum + quiz.quizScore, 0) / quizzes.length : 0,
                totalStudyTime: user.progressMetrics.totalStudyTime,
                recentActivity: await Chatbot.findOne({ userId: user._id }).select('chatHistory').lean() || { chatHistory: [] }
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

            const learningPaths = await LearningPath.find({ userId: user._id }).sort({ 'topics.order': 1 }).lean();
            const quizzes = await LearningPathQuiz.find({ userId: user._id }).lean();

            const dashboardData = {
                learningPaths: learningPaths.map(path => {
                    const firstIncompleteIndex = path.topics.findIndex(t => !t.completionStatus);
                    const completedTopics = path.topics.filter(t => t.completionStatus).length;
                    const quizPending = completedTopics >= 3 && !path.quizzes.some(
                        q => !q.completed && q.subtopicsCovered.some(s => path.topics.some(t => t.topicName === s))
                    );
                    return {
                        id: path._id,
                        courseName: path.courseName,
                        progress: path.courseCompletionStatus,
                        strength: path.courseStrength,
                        weakness: path.courseWeakness,
                        points: path.gamification.points,
                        firstIncompleteSubtopicIndex: firstIncompleteIndex >= 0 ? firstIncompleteIndex : path.topics.length,
                        quizPending
                    };
                }),
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