import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BookOpen, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

function AuthComponent() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [stars, setStars] = useState([]);

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
                    opacity: Math.random() * 0.8 + 0.2,
                    blinking: Math.random() > 0.7,
                });
            }
            setStars(newStars);
        };
        generateStars();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        const url = isLogin 
            ? 'http://localhost:3000/api/auth/login'
            : 'http://localhost:3000/api/auth/register';
        
        const body = isLogin 
            ? { email, password }
            : { name, email, password };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.user) {
                localStorage.setItem('token', data.user);
                toast.success(`${isLogin ? 'Login' : 'Registration'} successful!`);
                setTimeout(() => {
                    if(isLogin==='Login') {
                    window.location.href = '/dashboard';
                    } else {
                    window.location.href = '/chatbot';
                    }
                }, 1500);
            } else {
                toast.error('Please check your credentials');
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
            console.error('Auth error:', error);
        }
    }

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
        setName('');
        setEmail('');
        setPassword('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white overflow-hidden">
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

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md p-1 bg-gradient-to-tr from-[#0d1f0d] to-[#153515] rounded-2xl shadow-2xl relative z-10"
            >
                <div className="bg-[#0a1a0a]/90 backdrop-blur-lg p-8 rounded-2xl border border-green-500/20 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute -right-20 top-0 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-0" />
                    <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-0" />
                    
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block">
                            <BookOpen className="h-8 w-8 text-green-400" />
                        </div>
                    </div>

                    <motion.h1 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400"
                    >
                        {isLogin ? 'Welcome Back' : 'Join LearnFlow'}
                    </motion.h1>
                    
                    <motion.form 
                        onSubmit={handleSubmit} 
                        className="space-y-6 relative z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        {!isLogin && (
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 h-5 w-5 text-green-500" />
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text"
                                    placeholder="Full Name"
                                    required
                                    className="w-full px-12 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                                />
                            </div>
                        )}
                        
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 h-5 w-5 text-green-500" />
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                placeholder="Email Address"
                                required
                                className="w-full px-12 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                            />
                        </div>
                        
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-green-500" />
                            <input
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                placeholder="Password"
                                required
                                className="w-full px-12 py-3 bg-[#0d1f0d]/50 border border-green-900/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300"
                            />
                        </div>

                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-semibold transition-all duration-300 transform hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
                        >
                            {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </motion.button>
                    </motion.form>

                    {isLogin && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <div className="relative flex items-center my-6">
                                <div className="flex-grow border-t border-green-900/30"></div>
                                <span className="flex-shrink mx-4 text-sm text-gray-400">or continue with</span>
                                <div className="flex-grow border-t border-green-900/30"></div>
                            </div>
                            
                            <a href="http://localhost:3000/auth/google">
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-3 bg-[#0d1f0d]/50 border border-green-900/50 text-white rounded-lg font-medium hover:bg-[#0d1f0d]/70 transition-all duration-300 flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.04.69-2.36 1.09-3.71 1.09-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.66-2.84z"/>
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l2.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                    </svg>
                                    Google
                                </motion.button>
                            </a>
                        </motion.div>
                    )}

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                        onClick={toggleAuthMode}
                        className="w-full mt-6 text-green-400 hover:text-green-300 transition-colors duration-300 text-sm font-medium"
                    >
                        {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
                    </motion.button>
                </div>
            </motion.div>

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
        </div>
    );
}

export default AuthComponent;