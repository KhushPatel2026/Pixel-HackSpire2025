import { useState } from "react";
import axios from "axios";
import { BookOpen } from "lucide-react";

// Utility function to format text with markdown-style syntax
const formatText = (text) => {
  if (!text) return "";

  // Replace ** ** with bold text
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Replace single * with bullet points
  text = text.replace(/^\* (.+)$/gm, "• $1");

  // Convert newlines to <br> tags
  text = text
    .split("\n")
    .map((line) => line.trim())
    .join("<br>");

  return text;
};

export default function DocumentChat() {
  const [file, setFile] = useState(null);
  const [youtubeLink, setYoutubeLink] = useState("");
  const [uploadType, setUploadType] = useState("");
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [summary, setSummary] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);

  const API_BASE_URL = "http://localhost:5000"; // Flask backend URL

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setYoutubeLink(""); // Clear YouTube link if file is provided
      setUploadType("pdf");
      setError(null);
    } else {
      setError("Please select a valid PDF file.");
      setFile(null);
    }
  };

  // Handle YouTube link input
  const handleYoutubeLink = (e) => {
    const link = e.target.value;
    setYoutubeLink(link);
    if (link) {
      setFile(null); // Clear PDF file if YouTube link is provided
      setUploadType("youtube");
      setError(null);
    } else {
      setUploadType(file ? "pdf" : "");
    }
  };

  // Handle file upload to /upload endpoint
  const handleUpload = async () => {
    // Reset states
    setError(null);
    setUploadStatus(null);
    setSummary(null);
    setChatHistory([]);

    // PDF upload handling
    if (uploadType === "pdf" && file) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        setLoading(true);

        const res = await axios.post(`${API_BASE_URL}/upload`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setUploadStatus(
          `File processed successfully! ${res.data.page_count} pages processed into ${res.data.chunk_count} chunks.`
        );
        setSummary(res.data.summary);
      } catch (err) {
        console.error("Upload Error:", err);
        setError(
          err.response?.data?.error ||
            "Failed to upload file. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }
    // YouTube link handling
    else if (uploadType === "youtube" && youtubeLink) {
      try {
        setLoading(true);

        // Validate YouTube link format
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        if (!youtubeRegex.test(youtubeLink)) {
          throw new Error("Please enter a valid YouTube URL");
        }

        // Send YouTube link to backend
        const res = await axios.post(`${API_BASE_URL}/process-youtube`, {
          youtube_url: youtubeLink,
        });

        setUploadStatus(
          `YouTube video processed successfully! ${
            res.data.transcript_length || 0
          } characters of transcript processed.`
        );
        setSummary(res.data.summary);
      } catch (err) {
        console.error("YouTube Processing Error:", err);
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to process YouTube video. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }
    // No content selected
    else {
      setError("Please select a PDF file or enter a YouTube link.");
      return;
    }
  };

  // Handle chat question submission
  const handleChatSubmit = async () => {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await axios.post(`${API_BASE_URL}/chat`, {
        question: question.trim(),
      });

      // Add the Q&A to chat history
      setChatHistory((prev) => [
        ...prev,
        {
          question: question.trim(),
          answer: res.data.answer,
        },
      ]);

      setQuestion(""); // Clear the input after successful submission
    } catch (err) {
      console.error("Chat Error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to get a response. Please try again."
      );
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
              className={`absolute rounded-full bg-green-200 ${
                blinking ? "animate-pulse" : ""
              }`}
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
            Upload Learning Material
          </h2>

          {/* PDF Upload Section */}
          <div className="space-y-3">
            <label className="text-sm text-green-400 font-medium">
              Upload PDF Document
            </label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={loading}
              className="w-full border-none p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 bg-[#0d1f0d] text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-500"
            />
          </div>

          {/* YouTube Link Input */}
          <div className="space-y-3">
            <label className="text-sm text-green-400 font-medium">
              OR Add YouTube Video Link
            </label>
            <input
              type="text"
              placeholder="https://www.youtube.com/watch?v=..."
              onChange={handleYoutubeLink}
              disabled={loading}
              className="w-full border-none p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 bg-[#0d1f0d] text-white placeholder-green-300/30"
            />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={loading || (!file && !youtubeLink)}
            className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transform hover:scale-105 ${
              loading || (!file && !youtubeLink)
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            {loading ? "Processing..." : "Upload Material"}
          </button>

          {/* Status Message */}
          {uploadStatus && (
            <div className="p-3 bg-green-900/50 text-green-300 rounded-2xl border border-green-500/30">
              {uploadStatus}
            </div>
          )}
        </div>

        {/* Document Summary Section */}
        {summary && (
          <div className="mt-6 p-6 bg-[#0a1a0a]/80 backdrop-blur-sm rounded-2xl border border-green-500/20">
            <h2 className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
              Document Summary
            </h2>
            <p
              className="text-gray-300 mb-4 prose prose-invert"
              dangerouslySetInnerHTML={{ __html: formatText(summary) }}
            />
          </div>
        )}

        {/* Chat Section */}
        {summary && (
          <div className="space-y-6 bg-[#0a1a0a]/80 backdrop-blur-sm p-6 rounded-2xl border border-green-500/20 mt-6">
            <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
              Ask Questions About Your Document
            </h2>
            <div className="space-y-4">
              {/* Chat History */}
              {chatHistory.map((chat, index) => (
                <div key={index} className="space-y-2">
                  <div className="bg-green-900/30 p-3 rounded-xl">
                    <p className="font-semibold text-green-400">Question:</p>
                    <p className="text-gray-200">{chat.question}</p>
                  </div>
                  <div className="bg-[#0d1f0d] p-3 rounded-xl">
                    <p className="font-semibold text-emerald-400">Answer:</p>
                    <p
                      className="text-gray-300 prose prose-invert"
                      dangerouslySetInnerHTML={{
                        __html: formatText(chat.answer),
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Question Input */}
              <div className="space-y-4">
                <textarea
                  className="w-full border-none p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-600 bg-[#0d1f0d] text-white placeholder-gray-400"
                  placeholder="Ask a question about your document..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={loading}
                  rows="3"
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={loading || !question.trim()}
                  className={`w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transform hover:scale-105 ${
                    loading || !question.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {loading ? "Processing..." : "Ask Question"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
