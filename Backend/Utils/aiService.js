const { GoogleGenerativeAI } = require('@google/generative-ai');
const { gTTS } = require('gtts');
const fs = require('fs');
const path = require('path');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateSimplifiedContent = async (content, contentType) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Simplify the following ${contentType} content for easier understanding:\n\n${content}\n\nProvide a simplified version and list key points.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const simplifiedText = text.split('Key Points:')[0].trim();
    const keyPoints = text
        .split('Key Points:')[1]
        ?.split('\n')
        .filter(point => point.trim())
        .map(point => point.replace(/^- /, '')) || [];

    return { simplifiedText, keyPoints };
};

const generateAIResponse = async (question) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are a learning assistant for the LearnFlow platform. Provide a clear, concise, and accurate answer to the following question in a friendly and engaging tone. Adapt to the user's learning preferences and ask a follow-up question to gauge understanding:\n\n${question}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

const generateAdaptivePath = async (userId, courseName, difficultyLevel, preferences) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate a personalized learning path for user ${userId} for the course "${courseName}" with difficulty "${difficultyLevel}". Consider preferences: ${JSON.stringify(preferences)}. Return a JSON object with topics (name, description, resourceLinks), strength, weakness, and duration.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
};

const generateSmartQuiz = async (topicName, difficultyLevel, numQuestions) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate a quiz for the topic "${topicName}" with ${numQuestions} questions at ${difficultyLevel} difficulty. Each question should have a question, options, correctAnswer, questionType (MCQ/True/False/Short Answer), marks, and aiGeneratedExplanation. Also include duration. Return a JSON object.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
};

const generateProgressReport = async (userId, learningPaths, quizzes) => {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate a progress report for user ${userId} based on their learning paths: ${JSON.stringify(learningPaths)} and quizzes: ${JSON.stringify(quizzes)}. Include strengths, improvements, recommendations, and a summary. Return a JSON object.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
};

const synthesizeSpeech = async (text, outputFile) => {
    try {
        const tts = new gTTS(text, 'en');
        await new Promise((resolve, reject) => {
            tts.save(outputFile, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        return outputFile;
    } catch (error) {
        throw new Error(`Text-to-speech error: ${error.message}`);
    }
};

module.exports = {
    generateSimplifiedContent,
    generateAIResponse,
    generateAdaptivePath,
    generateSmartQuiz,
    generateProgressReport,
    synthesizeSpeech
};