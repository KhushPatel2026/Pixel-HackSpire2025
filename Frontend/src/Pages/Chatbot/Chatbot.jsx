import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, User, Mail, Lock, LogIn, UserPlus, Mic, Send, StopCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const silenceTimeoutRef = useRef(null);
    const lastSoundTimeRef = useRef(null);
    
    const [stars, setStars] = useState([]);
    
    useEffect(() => {
        const generateStars = () => {
            const newStars = [];
            for (let i = 0; i < 150; i++) {
                newStars.push({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.8 + 0.2,
                    blinking: Math.random() > 0.7,
                });
            }
            setStars(newStars);
        };
        
        generateStars();
    }, []);

    const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');

    const SILENCE_THRESHOLD = -50;
    const SILENCE_DURATION = 2000;
    const CHECK_INTERVAL = 100;

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    useEffect(() => {
        return () => {
            stopRecording();
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
            const chunks = [];

            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 2048;
            const dataArray = new Float32Array(analyserRef.current.frequencyBinCount);

            const checkSilence = () => {
                if (!isRecording) return;

                analyserRef.current.getFloatTimeDomainData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i] * dataArray[i];
                }
                const rms = Math.sqrt(sum / dataArray.length);
                const db = 20 * Math.log10(rms);

                if (db > SILENCE_THRESHOLD) {
                    lastSoundTimeRef.current = Date.now();
                    clearTimeout(silenceTimeoutRef.current);
                } else if (lastSoundTimeRef.current && Date.now() - lastSoundTimeRef.current >= SILENCE_DURATION) {
                    handleVoiceToggle();
                    return;
                }

                setTimeout(checkSilence, CHECK_INTERVAL);
            };

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                clearTimeout(silenceTimeoutRef.current);
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }

                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                if (audioBlob.size < 1024) {
                    setError('Recording too short or empty. Please speak clearly.');
                    setIsThinking(false);
                    setVoiceStatus('');
                    return;
                }
                await sendAudioToBackend(audioBlob);
            };

            mediaRecorderRef.current.start();
            lastSoundTimeRef.current = Date.now();
            setVoiceStatus('Recording... Speak now!');
            setError('');
            setTimeout(checkSilence, CHECK_INTERVAL);
        } catch (error) {
            setError(`Microphone access error: ${error.message}`);
            setIsRecording(false);
            setVoiceStatus('');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white overflow-hidden">
            <div className="fixed inset-0 z-0 overflow-hidden">
                {stars.map((star) => (
                    <div
                        key={star.id}
                        className={`absolute rounded-full bg-green-200 ${star.blinking ? 'animate-pulse' : ''}`}
                        style={{
                            left: star.x + '%',
                            top: star.y + '%',
                            width: star.size + 'px',
                            height: star.size + 'px',
                            opacity: star.opacity,
                        }}
                    />
                ))}
            </div>

            <div className="fixed inset-0 z-0 bg-gradient-radial from-[#0d400d80] via-transparent to-transparent opacity-50" />
            <div className="fixed inset-0 z-0 bg-gradient-radial from-[#1e8f1e80] via-transparent to-transparent opacity-50 translate-x-1/2" />
            <div className="fixed inset-0 z-0 bg-gradient-radial from-[#00510080] via-transparent to-transparent opacity-40 translate-y-1/4" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-5xl p-1 bg-gradient-to-tr from-[#0d1f0d] to-[#153515] rounded-2xl shadow-2xl relative z-10 mx-4 h-[85vh]"
            >
                <div className="bg-[#0a1a0a]/90 backdrop-blur-lg p-6 rounded-2xl border border-green-500/20 relative h-full flex flex-col">
                    <div className="absolute -right-20 top-0 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-0" />
                    <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-0" />
                    
                    <div className="flex items-center justify-center mb-4 relative z-10">
                        <div className="p-2 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block mr-4">
                            <BookOpen className="h-6 w-6 text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                            LearnFlow Study Buddy
                        </h1>
                    </div>
                    
                    <div 
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto mb-4 relative z-10 rounded-xl p-2 backdrop-blur-sm"
                        style={{
                            background: 'rgba(10, 26, 10, 0.3)',
                            boxShadow: 'inset 0 0 30px rgba(0, 50, 0, 0.2)'
                        }}
                    >
                        {chatHistory.map((chat, index) => (
                            <div key={index} className="space-y-2 mb-4">
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="chat-message user-message"
                                >
                                    {chat.question}
                                </motion.div>
                                {chat.answer && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.2 }}
                                        className="chat-message bot-message"
                                    >
                                        <div className="whitespace-pre-wrap">{chat.answer}</div>
                                        {chat.audioUrl && (
                                            <audio 
                                                controls 
                                                src={chat.audioUrl} 
                                                className="mt-3 w-full opacity-80" 
                                                style={{ 
                                                    height: '36px',
                                                    borderRadius: '18px',
                                                    background: 'rgba(16, 185, 129, 0.1)'
                                                }}
                                            />
                                        )}
                                        {chat.followUp && (
                                            <div className="text-sm text-green-300 mt-2 border-t border-green-900/20 pt-2">
                                                <span className="font-medium">Follow-up suggestion:</span> {chat.followUp}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </div>
                        ))}
                        {isThinking && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="chat-message bot-message"
                            >
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </motion.div>
                        )}
                        {chatHistory.length === 0 && !isThinking && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-green-300 opacity-80">
                                <div className="p-3 bg-gradient-to-tr from-green-600/10 to-emerald-600/10 rounded-full mb-4">
                                    <BookOpen className="h-10 w-10 text-green-400" />
                                </div>
                                <p className="text-lg mb-2">Welcome to LearnFlow Study Buddy</p>
                                <p className="text-sm max-w-md">Start a conversation by typing or using voice input</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="relative z-10">
                        {voiceStatus && (
                            <div className="text-sm text-green-300 mb-2 bg-[#0d1f0d]/50 p-2 rounded-lg inline-block">
                                {voiceStatus}
                            </div>
                        )}
                        {error && (
                            <div className="text-sm text-red-400 mb-2 bg-[#1f0d0d]/50 p-2 rounded-lg">
                                {error}
                            </div>
                        )}
                        
                        <form onSubmit={handleTextSubmit} className="flex space-x-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    className="w-full px-4 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                                    placeholder="Type your question..."
                                    disabled={isThinking}
                                />
                            </div>
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-3 rounded-lg hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                disabled={isThinking || !question.trim()}
                            >
                                <Send className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={handleVoiceToggle}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`p-3 rounded-lg text-white transition-all duration-300 ${
                                    isRecording
                                        ? 'bg-red-600 hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]'
                                        : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                disabled={isThinking}
                            >
                                {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </motion.button>
                        </form>
                    </div>
                </div>
            </motion.div>

            <style jsx>{`
                .chat-message {
                    margin: 10px;
                    padding: 12px 16px;
                    border-radius: 12px;
                    max-width: 80%;
                    line-height: 1.5;
                }
                .user-message {
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15));
                    border: 1px solid rgba(16, 185, 129, 0.2);
                    margin-left: auto;
                    color: #e0f2f1;
                    box-shadow: 0 2px 10px rgba(0, 50, 0, 0.1);
                }
                .bot-message {
                    background: rgba(15, 23, 42, 0.3);
                    border: 1px solid rgba(16, 185, 129, 0.1);
                    margin-right: auto;
                    color: #f1f5f9;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }
                .typing-indicator {
                    display: flex;
                    padding: 6px 0;
                }
                .typing-indicator span {
                    height: 8px;
                    width: 8px;
                    margin: 0 2px;
                    background-color: rgba(16, 185, 129, 0.6);
                    border-radius: 50%;
                    display: block;
                    opacity: 0.4;
                }
                .typing-indicator span:nth-child(1) {
                    animation: pulse 1s infinite 0.1s;
                }
                .typing-indicator span:nth-child(2) {
                    animation: pulse 1s infinite 0.3s;
                }
                .typing-indicator span:nth-child(3) {
                    animation: pulse 1s infinite 0.5s;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.4; }
                    50% { transform: scale(1.2); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.4; }
                }
                
                ::-webkit-scrollbar {
                    width: 6px;
                }
                ::-webkit-scrollbar-track {
                    background: rgba(3, 7, 18, 0.1);
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(16, 185, 129, 0.3);
                    border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                    background: rgba(16, 185, 129, 0.5);
                }
                
                .bg-gradient-radial {
                    background-image: radial-gradient(var(--tw-gradient-stops));
                }
            `}</style>
        </div>
    );
};

export default Chatbot;