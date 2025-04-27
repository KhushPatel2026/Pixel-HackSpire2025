const LearningPath = require('../Model/LearningPath');
const jwt = require('jsonwebtoken');
const coursesConfig = require('../Utils/CbseConfig');
const User = require('../Model/User');

class CbseCourseController {
    async verifyToken(token, res) {
        if (!token) {
            res.status(401).json({ status: 'error', error: 'No token provided' });
            return null;
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findOne({ email: decoded.email }).select('-password');
            if (!user) {
                res.status(404).json({ status: 'error', error: 'User not found' });
                return null;
            }
            return user;
        } catch (error) {
            res.status(401).json({ status: 'error', error: 'Invalid token' });
            return null;
        }
    }

    // Generate Mermaid.js flowchart syntax based on topics
    generateFlowchart(topics) {
        let mermaidSyntax = 'graph TD;\n';
        topics.sort((a, b) => a.order - b.order).forEach((topic, index) => {
            const nodeStyle = topic.completionStatus ? '[Completed]' : '[Pending]';
            mermaidSyntax += `    T${index}["${topic.topicName} ${nodeStyle}"];\n`;
            if (index > 0) {
                mermaidSyntax += `    T${index - 1} --> T${index};\n`;
            }
        });
        return mermaidSyntax;
    }

    async generateCbseCourse(req, res) {
        try {
            const token = req.headers['x-access-token'];
            const user = await this.verifyToken(token, res);
            if (!user || res.headersSent) return;

            const { courseId } = req.body;
            if (!courseId) {
                return res.status(400).json({
                    status: 'error',
                    error: 'Course ID is required',
                });
            }

            if (!coursesConfig[courseId]) {
                return res.status(400).json({
                    status: 'error',
                    error: 'Invalid course ID',
                });
            }

            const course = coursesConfig[courseId];
            const learningPaths = [];

            for (const subject of course.subjects) {
                const courseName = `${course.name} - ${subject.name}`;

                const existingPath = await LearningPath.findOne({ userId: user._id, courseName });
                if (existingPath) {
                    learningPaths.push({
                        id: existingPath._id,
                        courseName: existingPath.courseName,
                        progress: existingPath.courseCompletionStatus || 0,
                        points: existingPath.gamification?.points || 0,
                        quizPending: existingPath.quizzes?.some((q) => !q.completed) || false,
                        firstIncompleteSubtopicIndex:
                            existingPath.topics.findIndex((t) => !t.completionStatus) || 0,
                        flowchart: existingPath.flowchart
                    });
                    continue;
                }

                const topics = subject.chapters.map((chapter, index) => ({
                    topicName: chapter.name,
                    topicDescription: chapter.description,
                    topicResourceLink: chapter.resources
                        .filter((r) => r.title === 'NCERT Book' || r.title === 'Notes')
                        .map((r) => ({
                            title: r.title,
                            url: r.url,
                        })),
                    timeSpent: 0,
                    order: index + 1,
                    completionStatus: false,
                    completionDate: null
                }));

                const flowchart = this.generateFlowchart(topics);

                const learningPath = new LearningPath({
                    userId: user._id,
                    courseName,
                    topics,
                    difficultyLevel: 'Medium',
                    courseStrength: '',
                    courseWeakness: '',
                    courseDuration: topics.length * 2,
                    courseResult: 'In Progress',
                    courseCompletionStatus: 0,
                    gamification: { badges: [], streak: 0, points: 0 },
                    flowchart
                });

                await learningPath.save();
                await User.findByIdAndUpdate(user._id, {
                    $inc: { 'progressMetrics.totalCourses': 1 }
                });

                learningPaths.push({
                    id: learningPath._id,
                    courseName: learningPath.courseName,
                    progress: learningPath.courseCompletionStatus,
                    points: learningPath.gamification.points,
                    quizPending: false,
                    firstIncompleteSubtopicIndex: 0,
                    flowchart: learningPath.flowchart
                });
            }

            return res.status(201).json({
                status: 'ok',
                data: learningPaths
            });
        } catch (error) {
            console.error('Error generating CBSE course:', error);
            return res.status(500).json({
                status: 'error',
                error: error.message || 'Failed to generate CBSE course'
            });
        }
    }
}

module.exports = new CbseCourseController();