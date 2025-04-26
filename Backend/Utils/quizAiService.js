const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const cleanJsonResponse = (rawText) => {
    return rawText
        .replace(/```json\s*\n?/, '')
        .replace(/```\s*$/, '')
        .replace(/^\s+|\s+$/g, '')
        .replace(/\n/g, '');
};

const parseJsonSafely = (text, fallback, errorMessage) => {
    try {
        const parsed = JSON.parse(text);
        return parsed;
    } catch (error) {
        console.error(errorMessage, error);
        return fallback;
    }
};

const generateAdaptivePath = async (userId, courseName, difficultyLevel, preferences) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `Generate a personalized learning path for user ${userId} for the course "${courseName}" with difficulty "${difficultyLevel}". Consider preferences: ${JSON.stringify(preferences)}. Return a JSON object with topics (array of objects with name, description, resourceLinks), strength (string), weakness (string), and duration (number in hours). Example format:
{
  "topics": [
    {
      "name": "Topic Name",
      "description": "Topic Description",
      "resourceLinks": ["url1", "url2"]
    }
  ],
  "strength": "Strength description",
  "weakness": "Weakness description",
  "duration": 10
}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        const cleanedText = cleanJsonResponse(rawText);
        const fallback = {
            topics: [],
            strength: 'Unknown',
            weakness: 'Unknown',
            duration: 10
        };

        const parsed = parseJsonSafely(cleanedText, fallback, 'Failed to parse adaptive path JSON');
        
        if (!Array.isArray(parsed.topics) || typeof parsed.strength !== 'string' || typeof parsed.weakness !== 'string' || typeof parsed.duration !== 'number') {
            return fallback;
        }

        return parsed;
    } catch (error) {
        throw new Error(`Failed to generate adaptive path: ${error.message}`);
    }
};

const generateSmartQuiz = async (topicName, difficultyLevel, numQuestions, quizType) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `Generate a ${quizType} quiz for the topic "${topicName}" with ${numQuestions} MCQ questions at ${difficultyLevel} difficulty. Each question must have exactly 4 options, one correct answer (matching one of the options), questionType set to "MCQ", marks (1 for Easy, 2 for Medium, 3 for Hard), and an aiGeneratedExplanation. Include duration (1 minute per question). Return a JSON object with questions and duration. Example format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option 1",
      "questionType": "MCQ",
      "marks": 2,
      "aiGeneratedExplanation": "Explanation text"
    }
  ],
  "duration": 5
}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        const cleanedText = cleanJsonResponse(rawText);
        const fallback = {
            questions: [],
            duration: numQuestions
        };

        const parsed = parseJsonSafely(cleanedText, fallback, 'Failed to parse quiz JSON');

        if (!Array.isArray(parsed.questions) || typeof parsed.duration !== 'number') {
            return fallback;
        }

        parsed.questions = parsed.questions.filter(question => {
            if (
                typeof question.question !== 'string' ||
                !Array.isArray(question.options) ||
                question.options.length !== 4 ||
                typeof question.correctAnswer !== 'string' ||
                !question.options.includes(question.correctAnswer) ||
                question.questionType !== 'MCQ' ||
                typeof question.marks !== 'number' ||
                typeof question.aiGeneratedExplanation !== 'string'
            ) {
                return false;
            }
            return true;
        });

        return parsed;
    } catch (error) {
        throw new Error(`Failed to generate quiz: ${error.message}`);
    }
};

const analyzeQuizPerformance = async (topicName, difficultyLevel, responses, questions) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `
Analyze the quiz performance for the topic "${topicName}" at ${difficultyLevel} difficulty. Below are the responses and questions:

Responses: ${JSON.stringify(responses)}
Questions: ${JSON.stringify(questions)}

Generate strengths, weaknesses, and recommended resources. Return a JSON object with:
- strengths: A string describing areas where the user performed well (e.g., based on correct answers, especially high-mark questions).
- weaknesses: A string describing areas where the user struggled (e.g., based on incorrect answers, patterns in mistakes).
- resources: An array of objects with title and url for recommended learning resources (YouTube videos, documentation) tailored to the weaknesses and topic make sure there are highly accurate and according to the weaknesses only and the page must exist.

Example format:
{
  "strengths": "You excelled in [specific area] by correctly answering high-difficulty questions.",
  "weaknesses": "You struggled with [specific area], particularly in [subtopic].",
  "resources": [
    { "title": "Resource Title", "url": "https://example.com" },
    { "title": "YouTube Tutorial", "url": "https://youtube.com/watch?v=example" }
  ]
}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        const cleanedText = cleanJsonResponse(rawText);
        const fallback = {
            strengths: 'No specific strengths identified.',
            weaknesses: 'No specific weaknesses identified.',
            resources: []
        };

        const parsed = parseJsonSafely(cleanedText, fallback, 'Failed to parse performance analysis JSON');

        if (
            typeof parsed.strengths !== 'string' ||
            typeof parsed.weaknesses !== 'string' ||
            !Array.isArray(parsed.resources) ||
            !parsed.resources.every(r => typeof r.title === 'string' && typeof r.url === 'string')
        ) {
            return fallback;
        }

        // Fallback resources for common topics
        const fallbackResources = {
            'Mathematics': [
                { title: 'Khan Academy Algebra', url: 'https://www.khanacademy.org/math/algebra' },
                { title: 'Math Antics YouTube', url: 'https://www.youtube.com/@Mathantics' }
            ],
            'Science': [
                { title: 'Crash Course Physics', url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtN0ge7yDk_UA0ldZJdhwkoV' },
                { title: 'SciShow', url: 'https://www.youtube.com/@scishow' }
            ],
            'Programming': [
                { title: 'MDN Web Docs JavaScript', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
                { title: 'freeCodeCamp JavaScript Tutorial', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg' }
            ],
            'History': [
                { title: 'History.com', url: 'https://www.history.com' },
                { title: 'Crash Course World History', url: 'https://www.youtube.com/playlist?list=PLBDA2E52FB1EF80C9' }
            ],
            'Literature': [
                { title: 'SparkNotes', url: 'https://www.sparknotes.com' },
                { title: 'Thug Notes YouTube', url: 'https://www.youtube.com/@WisecrackEDU' }
            ]
        };

        if (parsed.resources.length === 0 && fallbackResources[topicName]) {
            parsed.resources = fallbackResources[topicName];
        }

        return parsed;
    } catch (error) {
        console.error(`Failed to analyze quiz performance: ${error.message}`);
        return {
            strengths: 'No specific strengths identified.',
            weaknesses: 'No specific weaknesses identified.',
            resources: []
        };
    }
};

module.exports = {
    generateAdaptivePath,
    generateSmartQuiz,
    analyzeQuizPerformance
};