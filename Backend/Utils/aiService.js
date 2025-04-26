const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@deepgram/sdk');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');
const fetch = require('node-fetch'); // Added for URL validation

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

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

const generateSimplifiedContent = async (content, contentType) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `
Simplify the following ${contentType} content for a student, focusing strictly on the core concepts of the provided content. Avoid including loosely related or tangential topics. Return a JSON object with:
- title: "Simplified Content"
- content: A clear, student-friendly explanation of the core ideas (string)
- keyPoints: Array of 3-5 key points directly related to the core content (strings)
Content: ${content}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        const cleanedText = cleanJsonResponse(rawText);
        const fallback = { title: 'Simplified Content', content: 'Unable to simplify content.', keyPoints: [] };
        const parsed = parseJsonSafely(cleanedText, fallback, 'Failed to parse simplified content JSON');

        if (
            typeof parsed.title !== 'string' ||
            typeof parsed.content !== 'string' ||
            !Array.isArray(parsed.keyPoints)
        ) {
            return fallback;
        }
        return parsed;
    } catch (error) {
        console.error('generateSimplifiedContent error:', error.message);
        return { title: 'Simplified Content', content: 'Unable to simplify content.', keyPoints: [] };
    }
};

const generateAIResponse = async (question, chatHistory = []) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const context = chatHistory
            .slice(-5)
            .map(chat => `User: ${chat.question}\nAssistant: ${chat.answer}`)
            .join('\n\n');
        
        const prompt = `
You are a friendly, engaging learning assistant for the LearnFlow platform, designed to feel like a real person. Use a conversational, natural tone, as if chatting with a friend. Incorporate light humor or empathy where appropriate, and vary your response style to keep it fresh. Answer the user's question by focusing strictly on the core topic of the question, avoiding loosely related or tangential subjects. Use the recent chat history for context to ensure relevance. Always aim to be helpful, clear, and concise. If relevant, ask a short follow-up question directly related to the core topic to keep the conversation flowing.

Recent Chat History:
${context}

Current Question:
${question}

Provide a response and a follow-up question (if appropriate). Format the response as a JSON object:
{
  "answer": "Your response text",
  "followUp": "Optional follow-up question"
}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        const cleanedText = cleanJsonResponse(rawText);
        const fallback = {
            answer: 'Sorry, I had trouble processing that. Could you rephrase your question?',
            followUp: 'What else can I help with?'
        };
        const parsed = parseJsonSafely(cleanedText, fallback, 'Failed to parse AI response JSON');

        if (!parsed.answer) {
            return fallback;
        }
        return parsed;
    } catch (error) {
        console.error('generateAIResponse error:', error.message);
        return {
            answer: 'Sorry, I had trouble processing that. Could you rephrase your question?',
            followUp: 'What else can I help with?'
        };
    }
};

const generateAdaptivePath = async (userId, courseName, difficultyLevel, preferences) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `
Generate a personalized learning path for user ${userId} for the topic "${courseName}" at ${difficultyLevel} difficulty. Focus strictly on the core concepts of "${courseName}", avoiding loosely related or tangential topics. Break it into 6-8 subtopics, each designed to teach the user from 0 to 100 in that subtopic. For each subtopic, provide:
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
            strength: 'Basic understanding',
            weakness: 'Needs deeper exploration',
            duration: 10
        };
        const parsed = parseJsonSafely(cleanedText, fallback, 'Failed to parse adaptive path JSON');

        if (!Array.isArray(parsed.topics) || parsed.topics.length < 1 || typeof parsed.strength !== 'string' || typeof parsed.weakness !== 'string' || typeof parsed.duration !== 'number') {
            return fallback;
        }

        // Add order and validate resources
        const fallbackResources = {
            'JavaScript': [
                { title: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' },
                { title: 'freeCodeCamp JavaScript', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg' }
            ],
            'Mathematics': [
                { title: 'Khan Academy Algebra', url: 'https://www.khanacademy.org/math/algebra' },
                { title: '3Blue1Brown Linear Algebra', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' }
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
            strength: 'Basic understanding',
            weakness: 'Needs deeper exploration',
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
- subtopic: The specific subtopic within "${topicName}" (e.g., for JavaScript: "Variables", "Functions")
Include duration (1 minute per question). Return a JSON object:
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

const analyzeQuizPerformance = async (topicName, difficultyLevel, responses, questions, quizType) => {
    try {
        const totalQuestions = questions.length;
        const correctAnswers = responses.filter(r => r.isCorrect).length;
        const incorrectAnswers = totalQuestions - correctAnswers;
        const scorePercentage = (correctAnswers / totalQuestions) * 100;

        const subtopicPerformance = {};
        questions.forEach((q, i) => {
            const subtopic = q.subtopic || 'General';
            if (!subtopicPerformance[subtopic]) {
                subtopicPerformance[subtopic] = { correct: 0, total: 0 };
            }
            subtopicPerformance[subtopic].total += 1;
            if (responses[i]?.isCorrect) {
                subtopicPerformance[subtopic].correct += 1;
            }
        });

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = `
Analyze the quiz performance for a ${quizType} quiz on the topic "${topicName}" at ${difficultyLevel} difficulty. Focus strictly on the core concepts of "${topicName}", avoiding loosely related or tangential topics. Below are the responses, questions, and performance metrics:

Responses: ${JSON.stringify(responses)}
Questions: ${JSON.stringify(questions)}
Performance Metrics:
- Total Questions: ${totalQuestions}
- Correct Answers: ${correctAnswers} (${scorePercentage.toFixed(1)}%)
- Incorrect Answers: ${incorrectAnswers}
- Subtopic Breakdown: ${JSON.stringify(subtopicPerformance)}

Generate:
- strengths: Highlight strong subtopics (e.g., high accuracy) within the core topic.
- weaknesses: Identify weak subtopics (e.g., low accuracy) within the core topic.
- resources: Provide 2-4 highly relevant, existent resources (e.g., YouTube videos, official documentation) with title and URL, strictly tailored to the weak subtopics and verified to exist.
- remedialSubtopics: If score < 70%, suggest 2-3 remedial subtopics within the core topic, each with name, description, and 1-2 highly relevant, existent resources.
Return a JSON object:
{
  "strengths": "Strength description",
  "weaknesses": "Weakness description",
  "resources": [
    { "title": "Resource Title", "url": "https://example.com" }
  ],
  "remedialSubtopics": [
    {
      "name": "Subtopic Name",
      "description": "Description",
      "resourceLinks": [
        { "title": "Resource Title", "url": "https://example.com" }
      ]
    }
  ]
}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        const cleanedText = cleanJsonResponse(rawText);
        const fallback = {
            strengths: correctAnswers > totalQuestions * 0.7
                ? `You performed well, correctly answering ${correctAnswers}/${totalQuestions} questions in ${topicName}.`
                : 'No specific strengths identified.',
            weaknesses: incorrectAnswers > 0
                ? `You struggled with ${incorrectAnswers} questions in ${topicName}. Review core concepts to improve.`
                : 'No specific weaknesses identified.',
            resources: [],
            remedialSubtopics: scorePercentage < 70
                ? [
                    {
                        name: `${topicName} Basics`,
                        description: `Review core concepts of ${topicName}.`,
                        resourceLinks: []
                    }
                ]
                : []
        };
        const parsed = parseJsonSafely(cleanedText, fallback, 'Failed to parse performance analysis JSON');

        if (
            typeof parsed.strengths !== 'string' ||
            typeof parsed.weaknesses !== 'string' ||
            !Array.isArray(parsed.resources) ||
            !Array.isArray(parsed.remedialSubtopics)
        ) {
            return fallback;
        }

        parsed.resources = await Promise.all(
            parsed.resources
                .filter(r => r.title && r.url)
                .map(async (r) => (await isValidUrl(r.url) ? r : null))
                .filter(Boolean)
        ).then(res => res.slice(0, 4));

        parsed.remedialSubtopics = await Promise.all(
            parsed.remedialSubtopics
                .filter(st => st.name && st.description && Array.isArray(st.resourceLinks))
                .map(async (st) => ({
                    name: st.name,
                    description: st.description,
                    resourceLinks: await Promise.all(
                        st.resourceLinks
                            .filter(r => r.title && r.url)
                            .map(async (r) => (await isValidUrl(r.url) ? r : null))
                            .filter(Boolean)
                    ).then(res => res.slice(0, 2))
                }))
        );

        // Add fallback resources if none provided
        const fallbackResources = {
            'JavaScript': [
                { title: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide' },
                { title: 'freeCodeCamp JavaScript', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg' }
            ],
            'Mathematics': [
                { title: 'Khan Academy Algebra', url: 'https://www.khanacademy.org/math/algebra' },
                { title: '3Blue1Brown Linear Algebra', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' }
            ]
        };
        if (parsed.resources.length === 0 && fallbackResources[topicName]) {
            parsed.resources = fallbackResources[topicName].slice(0, 4);
        }
        parsed.remedialSubtopics = parsed.remedialSubtopics.map(st => {
            if (st.resourceLinks.length === 0 && fallbackResources[topicName]) {
                st.resourceLinks = fallbackResources[topicName].slice(0, 2);
            }
            return st;
        });

        return parsed;
    } catch (error) {
        console.error('analyzeQuizPerformance error:', error.message);
        return {
            strengths: 'No specific strengths identified.',
            weaknesses: 'No specific weaknesses identified.',
            resources: [],
            remedialSubtopics: []
        };
    }
};

const transcribeAudio = async (audioBuffer, mimetype = 'audio/webm') => {
    try {
        if (!audioBuffer || audioBuffer.length < 1024) {
            throw new Error('Audio buffer is empty or too small');
        }

        const inputFormat = mimetype.includes('webm') ? 'webm' : mimetype.split('/')[1] || 'auto';
        const wavBuffer = await new Promise((resolve, reject) => {
            const inputStream = new PassThrough();
            const outputStream = new PassThrough();
            inputStream.end(audioBuffer);

            ffmpeg(inputStream)
                .inputFormat(inputFormat)
                .audioCodec('pcm_s16le')
                .format('wav')
                .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
                .pipe(outputStream);

            const chunks = [];
            outputStream.on('data', (chunk) => chunks.push(chunk));
            outputStream.on('end', () => resolve(Buffer.concat(chunks)));
            outputStream.on('error', (err) => reject(err));
        });

        let response;
        try {
            response = await deepgram.listen.prerecorded.transcribeFile(
                wavBuffer,
                { model: 'nova-2', language: 'en-US', smart_format: true }
            );
        } catch (err) {
            console.warn('nova-2 failed, trying nova model:', err.message);
            response = await deepgram.listen.prerecorded.transcribeFile(
                wavBuffer,
                { model: 'nova', language: 'en-US', smart_format: true }
            );
        }

        const { result, error } = response;
        if (error) {
            throw new Error(`Deepgram API error: ${error.message}`);
        }
        if (!result?.results?.channels?.[0]?.alternatives?.[0]) {
            throw new Error('Deepgram returned an empty transcription result');
        }
        return result.results.channels[0].alternatives[0].transcript || '';
    } catch (error) {
        console.error('transcribeAudio error:', error.message);
        throw new Error(`Deepgram transcription error: ${error.message}`);
    }
};

const synthesizeSpeech = async (text, outputFile) => {
    try {
        const { result } = await deepgram.speak.request(
            { text },
            { model: 'aura-asteria-en' }
        );
        const audioBuffer = Buffer.from(await result.arrayBuffer());
        fs.writeFileSync(outputFile, audioBuffer);
        return outputFile;
    } catch (error) {
        console.error('synthesizeSpeech error:', error.message);
        throw new Error(`Deepgram text-to-speech error: ${error.message}`);
    }
};

module.exports = {
    generateSimplifiedContent,
    generateAIResponse,
    generateAdaptivePath,
    generateSmartQuiz,
    analyzeQuizPerformance,
    transcribeAudio,
    synthesizeSpeech
};