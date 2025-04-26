const { GoogleGenerativeAI } = require('@google/generative-ai');
const { gTTS } = require('gtts');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const generateSimplifiedContent = async (content, contentType) => {
    if (!content || !contentType) throw new Error('Content and contentType are required');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Simplify the following ${contentType} content for easier understanding:\n\n${content}\n\nProvide a simplified version and list key points.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const simplifiedText = text.split('Key Points:')[0].trim();
    const keyPoints = text.split('Key Points:')[1]?.split('\n').filter(point => point.trim()).map(point => point.replace(/^- /, '')) || [];
    return { simplifiedText, keyPoints };
};

const generateAIResponse = async (question) => {
    if (!question) throw new Error('Question is required');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a learning assistant for the LearnFlow platform. Provide a clear, concise, and accurate answer to the following question in a friendly and engaging tone. Adapt to the user's learning preferences and ask a follow-up question to gauge understanding:\n\n${question}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
};

const generateAdaptivePath = async (userId, courseName, difficultyLevel, preferences) => {
    if (!userId || !courseName || !difficultyLevel) throw new Error('userId, courseName, and difficultyLevel are required');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate a personalized learning path for user ${userId} for the course "${courseName}" with difficulty "${difficultyLevel}". Consider preferences: ${JSON.stringify(preferences || {})}. Return a JSON object with topics (name, description, resourceLinks), strength, weakness, and duration.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`Invalid JSON response: ${error.message}\nRaw response: ${text}`);
    }
};

const generateSmartQuiz = async (topicName, difficultyLevel, numQuestions) => {
    if (!topicName || !difficultyLevel) throw new Error('topicName and difficultyLevel are required');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate a quiz for the topic "${topicName}" with ${numQuestions || 5} questions at ${difficultyLevel} difficulty. Each question must be one of these types only: MCQ, True/False, or Short Answer. Each question should have a question, options (empty for Short Answer), correctAnswer, questionType (MCQ/True/False/Short Answer), marks, and aiGeneratedExplanation. Also include duration as a number in minutes. Return only a valid JSON object with no comments, markdown, or extra text outside the JSON structure.`;
    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Clean the response: remove markdown, comments, and extra text
    text = text
        .replace(/```json|```/g, '') // Remove markdown code blocks
        .replace(/\/\/.*?(?=\n|$)/g, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error(`No valid JSON found in AI response: ${text}`);
    const jsonString = jsonMatch[0].trim();

    try {
        const quizData = JSON.parse(jsonString);
        // Validate structure
        if (!quizData.questions || !Array.isArray(quizData.questions)) {
            throw new Error('Invalid quiz data: questions array is missing or invalid');
        }
        if (typeof quizData.duration !== 'number') {
            throw new Error('Invalid quiz data: duration must be a number');
        }
        // Validate question types
        const invalidTypes = quizData.questions.filter(q => !['MCQ', 'True/False', 'Short Answer'].includes(q.questionType));
        if (invalidTypes.length > 0) {
            throw new Error(`Invalid question types found: ${invalidTypes.map(q => q.questionType).join(', ')}`);
        }
        return quizData;
    } catch (error) {
        throw new Error(`Failed to parse JSON: ${error.message}\nRaw JSON: ${jsonString}`);
    }
};

const generateProgressReport = async (userId, learningPaths, quizzes) => {
    if (!userId || !learningPaths || !quizzes) throw new Error('userId, learningPaths, and quizzes are required');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate a progress report for user ${userId} based on their learning paths: ${JSON.stringify(learningPaths)} and quizzes: ${JSON.stringify(quizzes)}. Include strengths, improvements, recommendations, and a summary. Return a JSON object.`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(`Invalid JSON response: ${error.message}\nRaw response: ${text}`);
    }
};

const synthesizeSpeech = async (text, outputFile) => {
    if (!text || !outputFile) throw new Error('Text and outputFile are required');
    const tts = new gTTS(text, 'en');
    await new Promise((resolve, reject) => {
        tts.save(outputFile, (err) => (err ? reject(err) : resolve()));
    });
    return outputFile;
};

module.exports = {
    generateSimplifiedContent,
    generateAIResponse,
    generateAdaptivePath,
    generateSmartQuiz,
    generateProgressReport,
    synthesizeSpeech
};