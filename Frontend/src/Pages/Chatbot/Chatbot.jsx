import React, { useState, useEffect, useRef } from 'react';

const Chatbot = () => {
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');
    const [voiceStatus, setVoiceStatus] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chatContainerRef = useRef(null);

    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');

    // Scroll to bottom of chat container
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    // Start recording audio
    const startRecording = async () => {
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
            const chunks = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                await sendAudioToBackend(audioBlob);
            };

            mediaRecorderRef.current.start();
            setVoiceStatus('Recording... Speak now!');
            setError('');
        } catch (error) {
            setError(`Microphone access error: ${error.message}`);
            setIsRecording(false);
            setVoiceStatus('');
        }
    };

    // Stop recording audio
    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    // Send audio to backend
    const sendAudioToBackend = async (audioBlob) => {
        if (!token) {
            setError('No authentication token found. Please log in.');
            setIsThinking(false);
            return;
        }

        setIsThinking(true);
        setVoiceStatus('Processing...');
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        formData.append('type', 'voice');

        try {
            const response = await fetch(`${API_BASE_URL}/api/learning/chat`, {
                method: 'POST',
                headers: {
                    'x-access-token': token
                },
                body: formData
            });
            const data = await response.json();

            if (data.status === 'ok') {
                setChatHistory((prev) => [
                    ...prev,
                    {
                        question: data.data.transcription,
                        answer: data.data.answer,
                        audioUrl: data.data.audioUrl,
                        source: 'voice',
                        date: new Date(),
                        followUp: data.data.followUp
                    }
                ]);
                setQuestion('');
                setIsThinking(false);

                if (data.data.audioUrl) {
                    const audio = new Audio(data.data.audioUrl);
                    audio.play().catch((err) => console.error('Audio playback error:', err));
                }
            } else {
                setError(data.error || 'Failed to process audio. Please try again.');
                setIsThinking(false);
            }
        } catch (err) {
            setError('Server error. Please try again.');
            setIsThinking(false);
        }
    };

    // Handle text question
    const handleTextSubmit = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;
        if (!token) {
            setError('No authentication token found. Please log in.');
            return;
        }

        setIsThinking(true);
        setError('');

        setChatHistory((prev) => [
            ...prev,
            { question, answer: '', audioUrl: null, source: 'text', date: new Date() }
        ]);

        try {
            const response = await fetch(`${API_BASE_URL}/api/learning/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                },
                body: JSON.stringify({ question, type: 'text' })
            });
            const data = await response.json();

            if (data.status === 'ok') {
                setChatHistory((prev) => [
                    ...prev.slice(0, -1),
                    {
                        question,
                        answer: data.data.answer,
                        audioUrl: data.data.audioUrl,
                        source: 'text',
                        date: new Date(),
                        followUp: data.data.followUp
                    }
                ]);
                setQuestion('');
                setIsThinking(false);

                if (data.data.audioUrl) {
                    const audio = new Audio(data.data.audioUrl);
                    audio.play().catch((err) => console.error('Audio playback error:', err));
                }
            } else {
                setError(data.error || 'Failed to send message. Please try again.');
                setIsThinking(false);
            }
        } catch (err) {
            setError('Server error. Please try again.');
            setIsThinking(false);
        }
    };

    // Handle voice recording toggle
    const handleVoiceToggle = async () => {
        if (!isRecording) {
            setIsRecording(true);
            setVoiceStatus('Connecting...');
            setQuestion('');
            setError('');
            await startRecording();
        } else {
            setIsRecording(false);
            setVoiceStatus('');
            stopRecording();
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
                        <div key={index} className="space-y-2 mb-4">
                            <div className="chat-message user-message ml-auto bg-blue-100 p-3 rounded-lg max-w-[80%]">
                                {chat.question}
                            </div>
                            {chat.answer && (
                                <div className="chat-message bot-message mr-auto bg-gray-200 p-3 rounded-lg max-w-[80%]">
                                    {chat.answer}
                                    {chat.audioUrl && (
                                        <audio controls src={chat.audioUrl} className="mt-2 w-full" />
                                    )}
                                    {chat.followUp && (
                                        <div className="text-sm text-gray-600 mt-2">
                                            Follow-up: {chat.followUp}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {isThinking && (
                        <div className="chat-message bot-message mr-auto bg-gray-200 p-3 rounded-lg max-w-[80%]">
                            <span className="typing-indicator">...</span>
                        </div>
                    )}
                    {chatHistory.length === 0 && !isThinking && (
                        <div className="text-center text-gray-500">
                            Start a conversation by typing or using voice input
                        </div>
                    )}
                </div>
                <form onSubmit={handleTextSubmit} className="flex space-x-2">
                    <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-md"
                        placeholder="Type your question..."
                        disabled={isThinking}
                    />
                    <button
                        type="submit"
                        className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                        disabled={isThinking || !question.trim()}
                    >
                        Send
                    </button>
                    <button
                        type="button"
                        onClick={handleVoiceToggle}
                        className={`p-2 rounded-md text-white ${
                            isRecording
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                        } disabled:bg-gray-400 disabled:opacity-50`}
                        disabled={isThinking}
                    >
                        {isRecording ? 'Stop Voice' : 'Start Voice'}
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
                        .typing-indicator {
                            display: inline-block;
                            animation: typing 1s infinite;
                        }
                        @keyframes typing {
                            0% { content: '.'; }
                            33% { content: '..'; }
                            66% { content: '...'; }
                            100% { content: '.'; }
                        }
                    `}
                </style>
            </div>
        </div>
    );
};

export default Chatbot;