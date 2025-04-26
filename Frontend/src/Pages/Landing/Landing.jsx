// src/pages/Home.jsx
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Users, BarChart, MessageSquare, ChevronRight, Star, ArrowRight, Menu, X } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [stars, setStars] = useState([]);
  const token = localStorage.getItem('token');
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialsRef = useRef(null);

  // Parallax effects
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -150]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);

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

  // Handle CTA button click
  const handleCTAClick = () => {
    navigate(token ? '/dashboard' : '/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white overflow-hidden">
      {/* Stars background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {stars.map((star) => (
          <div
          key={star.id}
          className={`absolute rounded-full bg-green-200 ${star.blinking ? 'animate-pulse' : ''}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
          }}
        />
        ))}
      </div>

      {/* Mesh gradient overlays */}
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#0d400d80] via-transparent to-transparent opacity-50" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#1e8f1e80] via-transparent to-transparent opacity-50 translate-x-1/2" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#00510080] via-transparent to-transparent opacity-40 translate-y-1/4" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#2e8d2e80] via-transparent to-transparent opacity-60 -translate-x-1/3 translate-y-1/2" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#008f0080] via-transparent to-transparent opacity-60 translate-x-3/4 -translate-y-1/4" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#0a1a0a] to-transparent">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-green-500" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500">
              LearnFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={handleCTAClick}
              className="px-6 py-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transform hover:scale-105"
            >
              {token ? 'Dashboard' : 'Join Now'}
            </button>
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#0a1a0a]/95 backdrop-blur-md"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
                <Link
                  to="#features"
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  to="#testimonials"
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  to="#contact"
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleCTAClick();
                  }}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium text-center"
                >
                  {token ? 'Dashboard' : 'Join Now'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
        style={{ y: heroY, opacity: heroOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="container mx-auto px-4 z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block px-4 py-1 mb-6 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30"
            >
              <span className="text-sm font-medium text-green-400">AI-Powered Learning Companion</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-none"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                Learn Your Way
              </span>
              <br />
              <span className="text-white">Master Every Subject</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto"
            >
              Discover a personalized learning experience with LearnFlow's AI-powered tools, designed to adapt to your unique style and pace.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <button
                  onClick={handleCTAClick}
                  className="rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transform hover:scale-105 px-8 py-3 w-full sm:w-auto text-center"
                >
                  <span className="relative">{token ? 'Go to Dashboard' : 'Start Learning Now'}</span>
                </button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="mt-12 text-sm text-gray-400 flex items-center justify-center"
            >
              <Star className="h-4 w-4 text-green-500 mr-2" />
              Trusted by thousands of students worldwide
            </motion.div>
          </div>
        </div>

        {/* Floating elements */}
        <motion.div
          className="absolute -right-20 top-1/4 w-64 h-64 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-10"
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
        />
        <motion.div
          className="absolute -left-20 bottom-1/4 w-80 h-80 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-10"
          animate={{
            x: [0, -20, 0],
            y: [0, 20, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'reverse',
          }}
        />
      </motion.section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="relative py-20 md:py-16">
        <div className="container mx-auto px-4 z-10 relative">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                Features
              </span>{' '}
              for Personalized Learning
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-300 max-w-2xl mx-auto"
            >
              LearnFlow empowers students with AI-driven tools to simplify complex topics, track progress, and stay engaged.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#0d1f0d] to-[#153515] p-1 rounded-2xl group"
            >
              <div className="bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-green-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <BookOpen className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">Simplified Explanation Generator</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Paste or upload textbook or lecture content, and our AI simplifies complex material into student-friendly explanations.
                </p>
              </div>
            </motion.div>

            {/* Feature Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#0d1f0d] to-[#153515] p-1 rounded-2xl group"
            >
              <div className="bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-green-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <Sparkles className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">Adaptive Learning Assistant</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Personalized learning paths, quizzes, and summaries tailored to your progress and topic difficulty.
                </p>
              </div>
            </motion.div>

            {/* Feature Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#0d1f0d] to-[#153515] p-1 rounded-2xl group"
            >
              <div className="bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-green-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <MessageSquare className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">Conversational Study Partner</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Chat with an AI study buddy that answers questions and explains concepts step-by-step, with optional voice support.
                </p>
              </div>
            </motion.div>

            {/* Feature Card 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#0d1f0d] to-[#153515] p-1 rounded-2xl group"
            >
              <div className="bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-green-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <Users className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">Smart Quiz Builder</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Automatically generate customized quizzes with instant feedback and resource suggestions.
                </p>
              </div>
            </motion.div>

            {/* Feature Card 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#0d1f0d] to-[#153515] p-1 rounded-2xl group md:col-span-2 lg:col-span-1"
            >
              <div className="bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-green-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <BarChart className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">Personalized Progress Tracker</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Monitor your performance with visual dashboards and monthly reports highlighting strengths and next steps.
                </p>
              </div>
            </motion.div>

            {/* Feature Card 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="bg-gradient-to-tr from-[#0d1f0d] to-[#153515] p-1 rounded-2xl group"
            >
              <div className="bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-green-500/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-green-600/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block mb-4 relative z-10">
                  <Star className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white relative z-10">Gamified Learning Missions</h3>
                <p className="text-gray-300 mb-4 relative z-10">
                  Stay motivated with streaks, badges, and fun challenges, plus peer collaboration for extra engagement.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" ref={testimonialsRef} className="relative py-20 md:py-32">
        <div className="container mx-auto px-4 z-10 relative">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-bold mb-6"
            >
              How{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                LearnFlow
              </span>{' '}
              Works
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-300 max-w-2xl mx-auto"
            >
              A simple four-step process to personalize your learning journey
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="relative"
            >
              <div className="bg-gradient-to-tr from-[#0d1f0d] to-[#153515] p-1 rounded-2xl h-full">
                <div className="bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-green-500/20 relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-green-600/10 blur-xl" />
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                      1
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-white">Upload Your Content</h3>
                    </div>
                  </div>
                  <p className="text-gray-300">
                    Paste or upload textbook excerpts, lecture notes, or YouTube videos to get simplified explanations.
                  </p>
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-green-500 to-transparent" />
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="relative"
            >
              <div className="bg-gradient-to-tr from-[#0d1f0d] to-[#153515] p-1 rounded-2xl h-full">
                <div className="bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-green-500/20 relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-emerald-600/10 blur-xl" />
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center text-white font-bold text-lg">
                      2
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-white">Receive a Personalized Plan</h3>
                    </div>
                  </div>
                  <p className="text-gray-300">
                    Our AI analyzes your input and creates tailored learning paths, quizzes, and summaries.
                  </p>
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent" />
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="relative"
            >
              <div className="bg-gradient-to-tr from-[#0d1f0d] to-[#153515] p-1 rounded-2xl h-full">
                <div className="bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-green-500/20 relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-green-600/10 blur-xl" />
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                      3
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-white">Engage with Your Study Buddy</h3>
                    </div>
                  </div>
                  <p className="text-gray-300">
                    Interact with our AI chatbot to ask questions, get explanations, or practice with quizzes.
                  </p>
                </div>
              </div>
              <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-green-500 to-transparent" />
            </motion.div>

            {/* Step 4 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
            >
              <div className="bg-gradient-to-tr from-[#0d1f0d] to-[#153515] p-1 rounded-2xl h-full">
              <div className="bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl h-full border border-green-500/20 relative overflow-hidden">
                  <div className="absolute -right-12 -top-12 w-24 h-24 rounded-full bg-emerald-600/10 blur-xl" />
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center text-white font-bold text-lg">
                      4
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-white">Track Your Progress</h3>
                    </div>
                  </div>
                  <p className="text-gray-300">
                    Monitor your learning journey with visual dashboards showing your mastery and improvement areas.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 text-center"
          >
            <button 
              onClick={handleCTAClick}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transform hover:scale-105 group"
            >
              <span className="flex items-center justify-center">
                Start Your Learning Journey
                <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}


      {/* Call to Action Section */}
      <section className="relative py-20 md:py-32">
        <div className="container mx-auto px-4 z-10 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-r from-green-600/30 to-emerald-600/30 rounded-3xl p-1 backdrop-blur-lg"
          >
            <div className="bg-[#0a1a0a]/90 rounded-3xl p-12 md:p-16 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />

              <div className="max-w-3xl mx-auto text-center relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">
                  Ready to{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                    Transform
                  </span>{' '}
                  Your Learning?
                </h2>
                <p className="text-lg md:text-xl text-gray-300 mb-10">
                  Join thousands of students who are mastering subjects faster and more effectively with personalized AI assistance.
                </p>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button
                    onClick={handleCTAClick}
                    className="px-8 py-4 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.6)] transform group"
                  >
                    <span className="flex items-center justify-center text-lg">
                      {token ? 'Go to Dashboard' : 'Start learning now'}
                      <ChevronRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </button>
                </motion.div>

                <p className="mt-6 text-gray-400 text-sm">Who are you waiting for? Start learning in an exciting wayyy now!</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 border-t border-green-900/30">
        <div className="container mx-auto px-4">
          

            <p className="text-gray-400 text-sm mb-4 md:mb-0 text-center">
              © {new Date().getFullYear()} LearnFlow. Made with ❤️ by Pixel.
            </p>
            
          
        </div>
      </footer>
    </div>
  );
}