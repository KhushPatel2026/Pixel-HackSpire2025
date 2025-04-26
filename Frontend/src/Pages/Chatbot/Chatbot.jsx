import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff, BookOpen, User } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ChatbotWithTheme = () => {
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');
    const [voiceStatus, setVoiceStatus] = useState('');
    const [stars, setStars] = useState([]);
    const recognitionRef = useRef(null);
    const chatContainerRef = useRef(null);

    const API_BASE_URL = 'http://localhost:3000';
    const token = localStorage.getItem('token');

    // Generate stars for background
    useEffect(() => {
        const generateStars = () => {
            const newStars = [];
            for (let i = 0; i < 100; i++) {
                newStars.push({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.7 + 0.3,
                    blinking: Math.random() > 0.7,
                });
            }
            setStars(newStars);
        };
        
        generateStars();
    }, []);

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
            toast.error('No authentication token found. Please log in.');
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
                toast.error(data.error || 'Failed to send message. Please try again.');
            }
        } catch (err) {
            setError('Server error. Please try again.');
            toast.error('Server error. Please try again.');
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
            toast.info('Recording... Speak now');
            recognitionRef.current.start();
        } else {
            setIsRecording(false);
            setVoiceStatus('');
            recognitionRef.current.stop();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white overflow-hidden flex flex-col">
            {/* Stars background */}
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

            {/* Mesh gradient overlays */}
            <div className="fixed inset-0 z-0 bg-gradient-radial from-[#0d400d80] via-transparent to-transparent opacity-50" />
            <div className="fixed inset-0 z-0 bg-gradient-radial from-[#1e8f1e80] via-transparent to-transparent opacity-50 translate-x-1/2" />
            <div className="fixed inset-0 z-0 bg-gradient-radial from-[#00510080] via-transparent to-transparent opacity-40 translate-y-1/4" />

            <div className="flex-1 flex justify-center items-center relative z-10 p-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-2xl p-1 bg-gradient-to-tr from-[#0d1f0d] to-[#153515] rounded-2xl shadow-2xl"
                >
                    <div className="bg-[#0a1a0a]/90 backdrop-blur-lg p-4 rounded-2xl border border-green-500/20 relative overflow-hidden h-[600px] flex flex-col">
                        {/* Decorative elements */}
                        <div className="absolute -right-20 top-0 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-0" />
                        <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-0" />
                        
                        {/* Header */}
                        <div className="flex items-center justify-center mb-4 relative z-10">
                            <div className="p-2 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block mr-2">
                                <BookOpen className="h-5 w-5 text-green-400" />
                            </div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                                LearnFlow Chatbot
                            </h1>
                        </div>
                        
                        {/* Chat messages */}
                        <div 
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto mb-4 p-2 space-y-4 relative z-10 custom-scrollbar"
                        >
                            {chatHistory.map((chat, index) => (
                                <div key={index} className="space-y-3">
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex justify-end"
                                    >
                                        <div className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 p-3 rounded-tl-lg rounded-tr-lg rounded-bl-lg max-w-[80%] shadow-lg border border-green-500/30">
                                            <div className="flex items-center justify-between mb-1">
                                                <User className="h-4 w-4 text-green-200 mr-1" />
                                                <span className="text-xs text-green-200">
                                                    {new Date(chat.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-white text-sm">{chat.question}</p>
                                        </div>
                                    </motion.div>
                                    
                                    {chat.answer && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3, delay: 0.2 }}
                                            className="flex justify-start"
                                        >
                                            <div className="bg-[#0d1f0d]/80 p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg max-w-[80%] shadow-lg border border-green-500/30">
                                                <div className="flex items-center justify-between mb-1">
                                                    <BookOpen className="h-4 w-4 text-green-400 mr-1" />
                                                    <span className="text-xs text-green-400">
                                                        {new Date(chat.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-gray-200 text-sm">
                                                    {chat.source === 'voice' && chat.audioUrl ? 'Voice response available below:' : chat.answer}
                                                </p>
                                                {chat.audioUrl && (
                                                    <div className="mt-2">
                                                        <audio 
                                                            controls 
                                                            src={chat.audioUrl} 
                                                            className="w-full h-8 audio-player"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            ))}
                            {chatHistory.length === 0 && (
                                <div className="h-full flex items-center justify-center opacity-70">
                                    <p className="text-green-400 text-center">
                                        Ask me anything you want to learn about!
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        {/* Input form */}
                        <form onSubmit={handleTextSubmit} className="relative z-10">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    className="flex-1 p-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                                    placeholder="Type your question..."
                                />
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="submit"
                                    className="p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg transition-all duration-300 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                >
                                    <Send className="h-5 w-5" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    type="button"
                                    onClick={handleVoiceToggle}
                                    disabled={!recognitionRef.current}
                                    className={`p-3 rounded-lg text-white transition-all duration-300 ${
                                        isRecording
                                            ? 'bg-red-600 hover:bg-red-700 hover:shadow-[0_0_10px_rgba(220,38,38,0.5)]'
                                            : recognitionRef.current
                                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                                            : 'bg-gray-600/50 cursor-not-allowed'
                                    }`}
                                >
                                    {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                </motion.button>
                            </div>
                            
                            {voiceStatus && (
                                <p className="text-xs text-green-400 mt-2 ml-2">{voiceStatus}</p>
                            )}
                            
                            {error && (
                                <p className="text-xs text-red-400 mt-2 ml-2">{error}</p>
                            )}
                        </form>
                    </div>
                </motion.div>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(13, 31, 13, 0.3);
                    border-radius: 10px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, rgba(16, 185, 129, 0.6), rgba(5, 150, 105, 0.6));
                    border-radius: 10px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.8));
                }
                
                .audio-player::-webkit-media-controls-panel {
                    background-color: rgba(13, 31, 13, 0.7);
                }
                
                .audio-player::-webkit-media-controls-time-remaining-display,
                .audio-player::-webkit-media-controls-current-time-display {
                    color: #10b981;
                }
                
                .audio-player::-webkit-media-controls-play-button {
                    background-color: rgba(16, 185, 129, 0.7);
                    border-radius: 50%;
                }
            `}</style>
        </div>
    );
};

export default ChatbotWithTheme;