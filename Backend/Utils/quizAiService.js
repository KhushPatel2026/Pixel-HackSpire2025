const { GoogleGenerativeAI } = require('@google/generative-ai');
const fetch = require('node-fetch'); // Added for URL validation

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
        return JSON.parse(text);
    } catch (error) {
        console.error(errorMessage, error);
        return fallback;
    }
};

const isValidUrl = async (url) => {
    try {
        const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
        return response.ok && (url.startsWith('https://') || url.startsWith('http://'));
    } catch {
        return false;
    }
};

const generateAdaptivePath = async (userId, courseName, difficultyLevel, preferences) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `
Generate a personalized learning path for user ${userId} for the course "${courseName}" at ${difficultyLevel} difficulty. Focus strictly on the core concepts of "${courseName}", avoiding loosely related or tangential topics. Break it into 6-8 subtopics, each designed to teach the user from 0 to 100 in that subtopic. For each subtopic, provide:
- name: Subtopic name
- description: Brief description (1-2 sentences) of the core subtopic
- resourceLinks: Array of 2-3 highly relevant, existent resources (e.g., YouTube videos, official documentation) with title and URL, strictly related to the subtopic and verified to exist
Consider preferences: ${JSON.stringify(preferences)}. Ensure all resource URLs are valid, accessible, and directly address the subtopic. Return a JSON object with topics, strength, weakness, and duration (in hours). Example:
{
  "topics": [
    {
      "name": "Subtopic Name",
      "description": "Description",
      "resourceLinks": [
        { "title": "Resource Title", "url": "https://example.com" }
      ]
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
            topics: [
                {
                    name: `${courseName} Basics`,
                    description: `Introduction to core concepts of ${courseName}.`,
                    resourceLinks: []
                }
            ],
            strength: 'Unknown',
            weakness: 'Unknown',
            duration: 10
        };
        const parsed = parseJsonSafely(cleanedText, fallback, 'Failed to parse adaptive path JSON');

        if (!Array.isArray(parsed.topics) || typeof parsed.strength !== 'string' || typeof parsed.weakness !== 'string' || typeof parsed.duration !== 'number') {
            return fallback;
        }

        // Validate and filter resources
        const fallbackResources = {
            'Mathematics': [
                { title: 'Khan Academy Algebra', url: 'https://www.khanacademy.org/math/algebra' },
                { title: '3Blue1Brown Linear Algebra', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' }
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

        parsed.topics = await Promise.all(parsed.topics.map(async (topic, index) => {
            let resourceLinks = Array.isArray(topic.resourceLinks)
                ? await Promise.all(topic.resourceLinks.map(async (r) => (await isValidUrl(r.url) ? r : null)).filter(Boolean))
                : [];
            
            if (resourceLinks.length < 2 && fallbackResources[courseName]) {
                resourceLinks = fallbackResources[courseName].slice(0, 3 - resourceLinks.length);
            }

            return {
                name: topic.name || `Subtopic ${index + 1}`,
                description: topic.description || `Learn core aspects of ${topic.name || 'this topic'}.`,
                resourceLinks,
                order: index + 1
            };
        }));

        return parsed;
    } catch (error) {
        console.error('generateAdaptivePath error:', error.message);
        return {
            topics: [
                {
                    name: `${courseName} Basics`,
                    description: `Introduction to core concepts of ${courseName}.`,
                    resourceLinks: [],
                    order: 1
                }
            ],
            strength: 'Unknown',
            weakness: 'Unknown',
            duration: 10
        };
    }
};

const generateSmartQuiz = async (topicName, difficultyLevel, numQuestions, quizType) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `
Generate a ${quizType} quiz for the topic "${topicName}" with ${numQuestions} MCQ questions at ${difficultyLevel} difficulty. Focus strictly on the core concepts of "${topicName}", avoiding loosely related or tangential topics. Each question must include:
- question: Question text directly related to the core topic
- options: Exactly 4 options
- correctAnswer: One of the options
- questionType: "MCQ"
- marks: 1 for Easy, 2 for Medium, 3 for Hard
- aiGeneratedExplanation: Explanation for the correct answer, focusing on the core concept
- subtopic: The specific subtopic within "${topicName}" (e.g., for Programming: "Variables", "Functions")
Include duration (1 minute per question). Return a JSON object with questions and duration. Example:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option 1",
      "questionType": "MCQ",
      "marks": 2,
      "aiGeneratedExplanation": "Explanation text",
      "subtopic": "Subtopic Name"
    }
  ],
  "duration": 5
}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        const cleanedText = cleanJsonResponse(rawText);
        const fallback = {
            questions: [
                {
                    question: `What is a core concept in ${topicName}?`,
                    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                    correctAnswer: 'Option 1',
                    questionType: 'MCQ',
                    marks: difficultyLevel === 'Easy' ? 1 : difficultyLevel === 'Medium' ? 2 : 3,
                    aiGeneratedExplanation: `This is a core concept in ${topicName}.`,
                    subtopic: `${topicName} Basics`
                }
            ],
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
                typeof question.aiGeneratedExplanation !== 'string' ||
                typeof question.subtopic !== 'string'
            ) {
                return false;
            }
            return true;
        });

        if (parsed.questions.length === 0) {
            return fallback;
        }

        return parsed;
    } catch (error) {
        console.error('generateSmartQuiz error:', error.message);
        return {
            questions: [
                {
                    question: `What is a core concept in ${topicName}?`,
                    options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
                    correctAnswer: 'Option 1',
                    questionType: 'MCQ',
                    marks: difficultyLevel === 'Easy' ? 1 : difficultyLevel === 'Medium' ? 2 : 3,
                    aiGeneratedExplanation: `This is a core concept in ${topicName}.`,
                    subtopic: `${topicName} Basics`
                }
            ],
            duration: numQuestions
        };
    }
};

const analyzeQuizPerformance = async (topicName, difficultyLevel, responses, questions) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `
Analyze the quiz performance for the topic "${topicName}" at ${difficultyLevel} difficulty. Focus strictly on the core concepts of "${topicName}", avoiding loosely related or tangential topics. Below are the responses and questions:

Responses: ${JSON.stringify(responses)}
Questions: ${JSON.stringify(questions)}

Generate:
- strengths: A string describing areas where the user performed well (e.g., based on correct answers in core subtopics, especially high-mark questions).
- weaknesses: A string describing areas where the user struggled (e.g., based on incorrect answers in core subtopics, patterns in mistakes).
- resources: An array of 2-4 highly relevant, existent resources (e.g., YouTube videos, official documentation) with title and URL, strictly tailored to the weak subtopics and verified to exist.

Example:
{
  "strengths": "You excelled in [specific core subtopic] by correctly answering high-difficulty questions.",
  "weaknesses": "You struggled with [specific core subtopic], particularly in [aspect].",
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

        // Validate resources
        parsed.resources = await Promise.all(
            parsed.resources
                .filter(r => r.title && r.url)
                .map(async (r) => (await isValidUrl(r.url) ? r : null))
                .filter(Boolean)
        ).then(res => res.slice(0, 4));

        // Fallback resources for common topics
        const fallbackResources = {
            'Mathematics': [
                { title: 'Khan Academy Algebra', url: 'https://www.khanacademy.org/math/algebra' },
                { title: '3Blue1Brown Linear Algebra', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' }
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
            parsed.resources = fallbackResources[topicName].slice(0, 4);
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