const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@deepgram/sdk');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

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

const generateAIResponse = async (question, chatHistory = []) => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const context = chatHistory
            .slice(-5)
            .map(chat => `User: ${chat.question}\nAssistant: ${chat.answer}`)
            .join('\n\n');
        
        const prompt = `You are a friendly, engaging learning assistant for the LearnFlow platform, designed to feel like a real person. Use a conversational, natural tone, as if chatting with a friend. Incorporate light humor or empathy where appropriate, and vary your response style to keep it fresh. Base your answer on the user's question and the recent chat history for context. Always aim to be helpful, clear, and concise. If relevant, ask a short follow-up question to keep the conversation flowing.

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

        // Clean the response: remove markdown code blocks and extra whitespace
        let cleanedText = rawText
            .replace(/```json\s*\n?/, '') // Remove ```json
            .replace(/```\s*$/, '') // Remove closing ```
            .replace(/^\s+|\s+$/g, '') // Trim whitespace
            .replace(/\n/g, ''); // Remove newlines

        // Validate JSON
        try {
            const parsedResponse = JSON.parse(cleanedText);
            if (!parsedResponse.answer) {
                throw new Error('Parsed response missing "answer" field');
            }
            return parsedResponse;
        } catch (parseError) {

            return {
                answer: 'Sorry, I had trouble processing that. Could you rephrase your question?',
                followUp: 'What else can I help with?'
            };
        }
    } catch (error) {
        throw new Error(`AI response generation failed: ${error.message}`);
    }
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

const transcribeAudio = async (audioBuffer, mimetype = 'audio/webm') => {
    try {
        // Validate buffer size
        if (!audioBuffer || audioBuffer.length < 1024) {
            throw new Error('Audio buffer is empty or too small');
        }

        // Determine input format based on mimetype
        const inputFormat = mimetype.includes('webm') ? 'webm' : mimetype.split('/')[1] || 'auto';

        // Convert audioBuffer to WAV format
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

        // Save WAV file for debugging
        const outputWavPath = path.join(__dirname/audio, `output-${Date.now()}.wav`);
        fs.writeFileSync(outputWavPath, wavBuffer);

        // Try transcribing with nova-2, fallback to nova if it fails
        let response;
        try {
            response = await deepgram.listen.prerecorded.transcribeFile(
                wavBuffer,
                { model: 'nova-2', language: 'en-US', smart_format: true }
            );
        } catch (err) {

            response = await deepgram.listen.prerecorded.transcribeFile(
                wavBuffer,
                { model: 'nova', language: 'en-US', smart_format: true }
            );
        }

        const { result, error } = response;
        if (error) {
            throw new Error(`Deepgram API error: ${error.message}`);
        }
        if (!result || !result.results || !result.results.channels || !result.results.channels[0].alternatives || !result.results.channels[0].alternatives[0]) {
            throw new Error('Deepgram returned an invalid or empty transcription result');
        }
        return result.results.channels[0].alternatives[0].transcript || '';
    } catch (error) {
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
        throw new Error(`Deepgram text-to-speech error: ${error.message}`);
    }
};

module.exports = {
    generateSimplifiedContent,
    generateAIResponse,
    generateAdaptivePath,
    generateSmartQuiz,
    generateProgressReport,
    transcribeAudio,
    synthesizeSpeech
};