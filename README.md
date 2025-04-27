# LearnFlow - AI-Powered Document Chat System

LearnFlow is an intelligent document chat system that allows users to upload PDF documents and have interactive conversations about their content. The system uses Google's Gemini AI for text generation and embeddings, combined with Pinecone for efficient vector storage and retrieval.

## Youtube Link
- Youtube (https://youtu.be/du6j-i-jWos)

## Features

- 🚀 PDF Document Processing
  - Upload and process PDF documents
  - Automatic text extraction and chunking
  - Generate comprehensive document summaries
  - Store semantic embeddings for efficient retrieval

- 💬 Interactive Chat
  - Ask questions about uploaded documents
  - Get context-aware responses
  - View chat history
  - Real-time processing

- 🎨 Modern UI
  - Clean and intuitive interface
  - Responsive design
  - Beautiful gradient animations
  - Loading states and error handling

## Tech Stack

### Backend
- Flask (Python web framework)
- Google Generative AI (Gemini)
  - Text generation (gemini-2.0-flash)
  - Text embeddings (embedding-001)
- Pinecone (Vector database)
- PyPDF (PDF processing)

### Frontend
- React
- Tailwind CSS
- Axios (API communication)

## Setup

### Prerequisites
- Python 3.8+
- Node.js and npm
- Pinecone Account
- Google AI API Key (Gemini)

### Environment Variables
Create a `.env` file in the `FlaskBackend` directory with the following variables:
```
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENV=your_pinecone_environment
PINECONE_INDEX_NAME=your_index_name
```

### Backend Setup
1. Navigate to the backend directory:
```bash
cd FlaskBackend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the Flask server:
```bash
python app.py
```

### Frontend Setup
1. Navigate to the frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

## Project Structure

```
├── FlaskBackend/
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   └── uploads/           # Temporary PDF storage
├── Frontend/
│   ├── src/
│   │   ├── Pages/
│   │   │   └── Recognition/  # Document chat interface
│   │   └── ...
│   ├── package.json
│   └── ...
└── README.md
```

## API Endpoints

### POST /upload
Upload and process a PDF document.
- Request: Multipart form data with 'file' field
- Response: 
  ```json
  {
    "message": "File processed successfully",
    "summary": "Document summary text",
    "page_count": 1,
    "chunk_count": 3
  }
  ```

### POST /chat
Ask questions about the uploaded document.
- Request:
  ```json
  {
    "question": "Your question about the document"
  }
  ```
- Response:
  ```json
  {
    "answer": "AI-generated answer",
    "context": ["Relevant document chunks"]
  }
  ```

## Current Progress

✅ Implemented:
- PDF upload and processing
- Document text extraction and chunking
- Integration with Gemini AI for text generation
- Integration with Pinecone for vector storage
- Adaptive quiz recommendations with interactive buttons
- Gamification hub for streaks and badges
- Quick access toolbar for navigation
- Smooth animations using Framer Motion
- Token-based authentication and navigation
- Chatbot interface for answering questions
- Step-by-step concept explanations
- Text-based interaction support
- Voice-based interaction with silence detection
- Audio response playback for answers
- Chat history persistence
- Document management features
- Enhanced UI/UX features

## Contributing

This project is part of HackSpire 2025. Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Google Generative AI (Gemini)
- Pinecone Vector Database
- Flask and React communities
- All contributors and testers 

## Authors

- Nishant Mehta (Frontend Developer)
- Khush Patel (Backend Developer)
- Pranshu Oza (Frontend Developer)
- Vrajesh Sharma (ML Developer)
