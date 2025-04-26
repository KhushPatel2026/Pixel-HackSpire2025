const LearningPath = require('../model/LearningPath');
const jwt = require('jsonwebtoken');
const coursesConfig = require('../Utils/CbseConfig');
const User = require('../model/User');

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

      // Generate a learning path for each subject
      for (const subject of course.subjects) {
        const courseName = `${course.name} - ${subject.name}`;

        // Check for existing learning path to prevent duplicates
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
          });
          continue;
        }

        // Generate topics (chapters) with only NCERT Book and Notes resources
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
          completionDate: null,
        }));

        // Create and save new learning path
        const learningPath = new LearningPath({
          userId: user._id,
          courseName,
          topics,
          difficultyLevel: 'Medium', // Default for CBSE courses
          courseStrength: '',
          courseWeakness: '',
          courseDuration: topics.length * 2, // Estimate: 2 hours per chapter
          courseResult: 'In Progress',
          courseCompletionStatus: 0,
          gamification: { badges: [], streak: 0, points: 0 },
        });

        await learningPath.save();
        await User.findByIdAndUpdate(user._id, {
          $inc: { 'progressMetrics.totalCourses': 1 },
        });

        learningPaths.push({
          id: learningPath._id,
          courseName: learningPath.courseName,
          progress: learningPath.courseCompletionStatus,
          points: learningPath.gamification.points,
          quizPending: false,
          firstIncompleteSubtopicIndex: 0,
        });
      }

      return res.status(201).json({
        status: 'ok',
        data: learningPaths,
      });
    } catch (error) {
      console.error('Error generating CBSE course:', error);
      return res.status(500).json({
        status: 'error',
        error: error.message || 'Failed to generate CBSE course',
      });
    }
  }
}

module.exports = new CbseCourseController();