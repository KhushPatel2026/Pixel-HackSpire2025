import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Clock, Brain, BarChart3 } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OnboardingProcess = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [learningStyle, setLearningStyle] = useState('');
  const [studyTime, setStudyTime] = useState('');
  const [stars, setStars] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedStep = localStorage.getItem('onboardingStep');
    if (savedStep) {
      setCurrentStep(parseInt(savedStep));
    }

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

  useEffect(() => {
    localStorage.setItem('onboardingStep', currentStep);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep === 1 && !difficultyLevel) {
      toast.warning('Please select a difficulty level');
      return;
    }
    if (currentStep === 2 && !learningStyle) {
      toast.warning('Please select a learning style');
      return;
    }
    if (currentStep === 3 && !studyTime) {
      toast.warning('Please select your daily study time');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:3000/api/profile/user/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({
          difficultyLevel,
          learningStyle,
          studyTime,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences');
      }

      toast.success('Your preferences have been saved!');
      localStorage.removeItem('onboardingStep');
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    {
      title: 'Welcome to LearnFlow',
      description: 'Let\'s personalize your learning experience with three quick questions.',
      icon: <BookOpen className="h-10 w-10 text-green-400" />,
      content: (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setCurrentStep(1)}
          onKeyDown={(e) => e.key === 'Enter' && setCurrentStep(1)}
          role="button"
          tabIndex={0}
          aria-label="Start onboarding"
          className="w-full py-3 mt-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-semibold transition-all duration-300 transform hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
        >
          Get Started <ChevronRight className="h-5 w-5" />
        </motion.button>
      ),
    },
    {
      title: 'What difficulty level do you prefer?',
      description: 'This helps us adjust the complexity of content and quizzes.',
      icon: <BarChart3 className="h-10 w-10 text-green-400" />,
      content: (
        <div className="grid grid-cols-3 gap-3 mt-6">
          {['Easy', 'Medium', 'Hard'].map((level) => (
            <motion.button
              key={level}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setDifficultyLevel(level)}
              onKeyDown={(e) => e.key === 'Enter' && setDifficultyLevel(level)}
              role="button"
              tabIndex={0}
              aria-label={`Select ${level} difficulty`}
              className={`py-4 px-2 rounded-lg font-medium transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
                difficultyLevel === level
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                  : 'bg-[#0d1f0d]/50 border border-green-900/50 text-gray-300 hover:bg-[#0d1f0d]/70'
              }`}
            >
              {level}
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      title: 'What\'s your preferred learning style?',
      description: 'We\'ll deliver content in your preferred format.',
      icon: <Brain className="h-10 w-10 text-green-400" />,
      content: (
        <div className="grid grid-cols-2 gap-3 mt-6">
          {[
            { name: 'Visual', desc: 'Images & diagrams' },
            { name: 'Auditory', desc: 'Sound & speech' },
            { name: 'Reading/Writing', desc: 'Written content' },
            { name: 'Kinesthetic', desc: 'Hands-on activities' },
          ].map((style) => (
            <motion.button
              key={style.name}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLearningStyle(style.name)}
              onKeyDown={(e) => e.key === 'Enter' && setLearningStyle(style.name)}
              role="button"
              tabIndex={0}
              aria-label={`Select ${style.name} learning style`}
              className={`py-4 px-3 rounded-lg font-medium transition-all duration-300 flex flex-col items-center text-center justify-center ${
                learningStyle === style.name
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                  : 'bg-[#0d1f0d]/50 border border-green-900/50 text-gray-300 hover:bg-[#0d1f0d]/70'
              }`}
            >
              <div className="font-semibold">{style.name}</div>
              <div className="text-xs mt-1 opacity-80">{style.desc}</div>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      title: 'How much time can you dedicate daily?',
      description: 'We\'ll recommend study schedules based on your available time.',
      icon: <Clock className="h-10 w-10 text-green-400" />,
      content: (
        <div className="grid grid-cols-3 gap-3 mt-6">
          {['15 mins', '30 mins', '60 mins', '90 mins', '120+ mins'].map((time) => (
            <motion.button
              key={time}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStudyTime(time)}
              onKeyDown={(e) => e.key === 'Enter' && setStudyTime(time)}
              role="button"
              tabIndex={0}
              aria-label={`Select ${time} daily study time`}
              className={`py-4 px-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                studyTime === time
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                  : 'bg-[#0d1f0d]/50 border border-green-900/50 text-gray-300 hover:bg-[#0d1f0d]/70'
              }`}
            >
              {time}
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      title: 'All set! Your journey begins',
      description: 'We\'ve personalized your learning experience based on your preferences.',
      icon: <BookOpen className="h-10 w-10 text-green-400" />,
      content: (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 space-y-4"
        >
          <div className="bg-[#0d1f0d]/70 p-4 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Difficulty Level:</span>
              <span className="text-green-400 font-medium">{difficultyLevel}</span>
            </div>
          </div>
          
          <div className="bg-[#0d1f0d]/70 p-4 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Learning Style:</span>
              <span className="text-green-400 font-medium">{learningStyle}</span>
            </div>
          </div>
          
          <div className="bg-[#0d1f0d]/70 p-4 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Daily Study Time:</span>
              <span className="text-green-400 font-medium">{studyTime}</span>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleComplete}
            onKeyDown={(e) => e.key === 'Enter' && handleComplete()}
            role="button"
            tabIndex={0}
            aria-label="Start learning"
            disabled={isLoading}
            className={`w-full py-3 mt-8 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg font-semibold transition-all duration-300 transform hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Saving...' : 'Start Learning'}
          </motion.button>
        </motion.div>
      ),
    },
  ];

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
        className="w-full max-w-md lg:max-w-lg p-1 bg-gradient-to-tr from-[#0d1f0d] to-[#153515] rounded-2xl shadow-2xl relative z-10"
      >
        <div className="bg-[#0a1a0a]/90 backdrop-blur-lg p-8 rounded-2xl border border-green-500/20 relative overflow-hidden">
          <div className="absolute -right-20 top-0 w-40 h-40 rounded-full bg-gradient-to-r from-emerald-600/20 to-green-600/20 blur-3xl z-0" />
          <div className="absolute -left-20 bottom-0 w-40 h-40 rounded-full bg-gradient-to-r from-green-600/20 to-emerald-600/20 blur-3xl z-0" />
          
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="flex justify-between mb-6 relative z-10">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= step 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600' 
                        : 'bg-[#0d1f0d] border border-green-900/50'
                    }`}
                  >
                    <span className="text-sm font-medium">{step}</span>
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-0.5 mt-4 ${
                      currentStep > step ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-[#0d1f0d]'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-tr from-green-600/20 to-emerald-600/20 rounded-xl inline-block">
              {steps[currentStep].icon}
            </div>
          </div>

          <motion.h1 
            key={`title-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400"
          >
            {steps[currentStep].title}
          </motion.h1>
          
          <motion.p
            key={`desc-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center text-gray-400 mb-6"
          >
            {steps[currentStep].description}
          </motion.p>
          
          <motion.div
            key={`content-${currentStep}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative z-10"
          >
            {steps[currentStep].content}
          </motion.div>
          
          {currentStep > 0 && currentStep < steps.length - 1 && (
            <div className="flex justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                role="button"
                tabIndex={0}
                aria-label="Continue to next step"
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-sm font-medium transition-all duration-300 transform hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              >
                Continue
              </motion.button>
            </div>
          )}
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
};

export default OnboardingProcess;