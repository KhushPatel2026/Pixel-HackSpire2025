import React, { useState, useEffect, useRef } from 'react';

const Chatbot = () => {
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');
    const [voiceStatus, setVoiceStatus] = useState('');
    const recognitionRef = useRef(null);
    const chatContainerRef = useRef(null);

    const API_BASE_URL = 'http://localhost:3000';
    const token = localStorage.getItem('token');

    // Initialize Web Speech API
    useEffect(() => {
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
            recognitionRef.current = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
            recognitionRef.current.lang = 'en-US';
            recognitionRef.current.interimResults = false;
            recognitionRef.current.maxAlternatives = 1;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                // Just update the input field with the transcript instead of sending immediately
                setQuestion(transcript);
            };

            recognitionRef.current.onerror = (event) => {
                setError(`Voice recognition error: ${event.error}`);
                setIsRecording(false);
                setVoiceStatus('');
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
                setVoiceStatus('');
                // Don't auto-restart recognition when it ends
            };
        } else {
            setVoiceStatus('Voice recognition not supported in this browser.');
        }

        return () => {
            if (recognitionRef.current && isRecording) {
                recognitionRef.current.stop();
            }
        };
    }, [isRecording]);

    // Scroll to bottom of chat container
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // Handle Sending Question
    const sendQuestion = async (questionText, type) => {
        if (!questionText.trim()) return;
        if (!token) {
            setError('No authentication token found. Please log in.');
            return;
        }
        setError('');

        // Add user message to chat history
        setChatHistory((prev) => [
            ...prev,
            { question: questionText, answer: '', audioUrl: null, source: type, date: new Date() }
        ]);

        try {
            const response = await fetch(`${API_BASE_URL}/api/learning/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                },
                body: JSON.stringify({ question: questionText, type })
            });
            const data = await response.json();

            if (data.status === 'ok') {
                setChatHistory((prev) => [
                    ...prev.slice(0, -1),
                    {
                        question: questionText,
                        answer: data.data.answer,
                        audioUrl: data.data.audioUrl,
                        source: type,
                        date: new Date()
                    }
                ]);
                setQuestion('');

                // Auto-play audio for voice mode
                if (type === 'voice' && data.data.audioUrl) {
                    const audio = new Audio(data.data.audioUrl);
                    audio.play().catch((err) => console.error('Audio playback error:', err));
                }
            } else {
                setError(data.error || 'Failed to send message. Please try again.');
            }
        } catch (err) {
            setError('Server error. Please try again.');
        }
    };

    // Handle Text Question
    const handleTextSubmit = (e) => {
        e.preventDefault();
        // Determine if this was originally from voice input or text input
        const sourceType = isRecording ? 'voice' : 'text';
        sendQuestion(question, sourceType);
    };

    // Handle Voice Recording
    const handleVoiceToggle = () => {
        if (!recognitionRef.current) return;

        if (!isRecording) {
            setIsRecording(true);
            setVoiceStatus('Recording... Speak now');
            recognitionRef.current.start();
        } else {
            setIsRecording(false);
            setVoiceStatus('');
            recognitionRef.current.stop();
        }
    };

    return (
        <div className="bg-gray-100 flex items-center justify-center min-h-screen">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold text-center mb-4">LearnFlow Chatbot</h1>
                <div
                    ref={chatContainerRef}
                    className="border border-gray-300 rounded-md p-4 bg-gray-50 max-h-[500px] overflow-y-auto mb-4"
                >
                    {chatHistory.map((chat, index) => (
                        <div key={index} className="space-y-2">
                            <div className="chat-message user-message ml-auto bg-blue-100 p-3 rounded-lg max-w-[80%]">
                                {chat.question}
                            </div>
                            {chat.answer && (
                                <div className="chat-message bot-message mr-auto bg-gray-200 p-3 rounded-lg max-w-[80%]">
                                    {chat.source === 'voice' ? 'Voice response' : chat.answer}
                                    {chat.audioUrl && (
                                        <>
                                            <br />
                                            <audio controls src={chat.audioUrl} />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <form onSubmit={handleTextSubmit} className="flex space-x-2">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-md"
                        placeholder="Type your question..."
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
                    >
                        Send
                    </button>
                    <button
                        type="button"
                        onClick={handleVoiceToggle}
                        className={`p-2 rounded-md text-white ${
                            isRecording
                                ? 'bg-red-600 hover:bg-red-700'
                                : recognitionRef.current
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!recognitionRef.current}
                    >
                        {isRecording ? 'Stop Recording' : 'Record Voice'}
                    </button>
                </form>
                {voiceStatus && <p className="text-sm text-gray-600 mt-2">{voiceStatus}</p>}
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                <style>
                    {`
                        .chat-message {
                            margin: 10px;
                            padding: 10px;
                            border-radius: 10px;
                            max-width: 80%;
                        }
                        .user-message {
                            background-color: #e0f7fa;
                            margin-left: auto;
                        }
                        .bot-message {
                            background-color: #f1f5f9;
                            margin-right: auto;
                        }
                    `}
                </style>
            </div>
        </div>
    );
};

export default Chatbot;