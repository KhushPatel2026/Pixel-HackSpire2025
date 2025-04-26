import { useState } from 'react';
import axios from 'axios';
import { BookOpen } from 'lucide-react';

export default function DocumentChat() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  const API_BASE_URL = 'http://localhost:5000'; // Flask backend URL

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file.');
      setFile(null);
    }
  };

  // Handle file upload to /upload endpoint
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      setError(null);
      setUploadStatus(null);
      setResponse(null); // Clear any previous response

      const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Set the upload status and display the summary
      setUploadStatus(`File processed successfully! ${res.data.page_count} pages processed.`);
      setResponse(res.data.summary); // Display the summary immediately after upload
    } catch (err) {
      console.error('Upload Error:', err);
      setError(err.response?.data?.error || 'Failed to upload file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle chat question submission to /chat endpoint
  const handleChatSubmit = async () => {
    if (!question.trim()) {
      setError('Please enter a question.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResponse(null);
      setSources([]);

      const res = await axios.post(`${API_BASE_URL}/chat`, {
        question: question.trim(),
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setResponse(res.data.answer);
      setSources(res.data.sources);
      setQuestion(''); // Clear the input after successful submission
    } catch (err) {
      console.error('Chat Error:', err);
      setError(err.response?.data?.error || 'Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1a0a] via-[#0d150d] to-[#091409] text-white overflow-hidden">
      {/* Stars background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        {[...Array(100)].map((_, i) => {
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const size = Math.random() * 2 + 1;
          const opacity = Math.random() * 0.8 + 0.2;
          const blinking = Math.random() > 0.7;
          return (
            <div
              key={i}
              className={`absolute rounded-full bg-green-200 ${blinking ? 'animate-pulse' : ''}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${size}px`,
                height: `${size}px`,
                opacity,
              }}
            />
          );
        })}
      </div>

      {/* Mesh gradient overlays */}
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#0d400d80] via-transparent to-transparent opacity-50" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#1e8f1e80] via-transparent to-transparent opacity-50 translate-x-1/2" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#00510080] via-transparent to-transparent opacity-40 translate-y-1/4" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#2e8d2e80] via-transparent to-transparent opacity-60 -translate-x-1/3 translate-y-1/2" />
      <div className="fixed inset-0 z-0 bg-gradient-radial from-[#008f0080] via-transparent to-transparent opacity-60 translate-x-3/4 -translate-y-1/4" />

      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#0a1a0a] to-transparent">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-green-500" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500">
              LearnFlow
            </span>
          </div>
          <button
            className="px-6 py-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-medium transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transform hover:scale-105"
          >
            Dashboard
          </button>
        </div>
      </header>

      <main className="relative z-10 pt-20 pb-12 max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
          Document Chat
        </h1>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded-2xl border border-red-500/30">
            {error}
          </div>
        )}

        {/* File Upload Section */}
        <div className="space-y-6 bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl border border-green-500/20 mb-6">
          <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
            Upload PDF Document
          </h2>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={loading}
            className="w-full border-none p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 bg-[#0d1f0d] text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-500"
          />
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transform hover:scale-105 ${
              loading || !file ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Uploading...' : 'Upload PDF'}
          </button>
          {uploadStatus && (
            <div className="p-3 bg-green-900/50 text-green-300 rounded-2xl border border-green-500/30">
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="space-y-6 bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl border border-green-500/20">
          <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
            Ask a Question
          </h2>
          <textarea
            className="w-full border-none p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 bg-[#0d1f0d] text-white placeholder-gray-400"
            placeholder="Enter your question about the document..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            disabled={loading}
            rows="4"
          />
          <button
            onClick={handleChatSubmit}
            disabled={loading}
            className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transform hover:scale-105 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Processing...' : 'Ask Question'}
          </button>
        </div>

        {/* Chat Response Section */}
        {response && (
          <div className="mt-6 p-6 bg-[#0a1a0a]/80 backdrop-blur-sm rounded-2xl border border-green-500/20">
            <h2 className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
              Document Summary
            </h2>
            <p className="text-gray-300 mb-4 whitespace-pre-line">{response}</p>
          </div>
        )}
      </main>

      <footer className="relative py-12 border-t border-green-900/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-6 w-6 text-green-500" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500">
                  LearnFlow
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                AI-powered learning assistant that adapts to your style and pace.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-green-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-green-400 transition-colors">Pricing</a></li>
                <li><a href="#testimonials" className="text-gray-400 hover:text-green-400 transition-colors">Testimonials</a></li>
                <li><a href="#faq" className="text-gray-400 hover:text-green-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-green-400 transition-colors">About Us</a></li>
                <li><a href="#careers" className="text-gray-400 hover:text-green-400 transition-colors">Careers</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-green-400 transition-colors">Contact</a></li>
                <li><a href="#blog" className="text-gray-400 hover:text-green-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#terms" className="text-gray-400 hover:text-green-400 transition-colors">Terms of Service</a></li>
                <li><a href="#privacy" className="text-gray-400 hover:text-green-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#cookies" className="text-gray-400 hover:text-green-400 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-green-900/30 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} LearnFlow. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-green-400 transition-colors">
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}