from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from pypdf import PdfReader
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from pinecone import Pinecone
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai
import json

app = Flask(__name__)
load_dotenv()

# Configure API keys
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Initialize Gemini
genai.configure(api_key=GEMINI_API_KEY)
llm = ChatGoogleGenerativeAI(model="gemini-pro", temperature=0.7)

# Initialize Pinecone with new API
pc = Pinecone(api_key=PINECONE_API_KEY)
index_name = "n8n-rag"

# Create index if it doesn't exist
if index_name not in pc.list_indexes().names():
    pc.create_index(
        name=index_name,
        dimension=1536,
        metric='cosine'
    )

index = pc.Index(index_name)

# Initialize OpenAI embeddings (still using OpenAI for embeddings as they're very reliable)
embeddings = OpenAIEmbeddings()

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def process_pdf(file_path):
    """Process PDF and store embeddings in Pinecone"""
    # Read PDF
    pdf_reader = PdfReader(file_path)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    
    # Split text into chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    
    # Create embeddings and store in Pinecone
    for i, chunk in enumerate(chunks):
        embedding = embeddings.embed_query(chunk)
        index.upsert(vectors=[{
            'id': f"{os.path.basename(file_path)}_chunk_{i}",
            'values': embedding,
            'metadata': {'text': chunk, 'source': os.path.basename(file_path)}
        }])
    
    return len(chunks)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.endswith('.pdf'):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        try:
            chunks_processed = process_pdf(file_path)
            return jsonify({
                'message': 'File processed successfully',
                'chunks_processed': chunks_processed
            }), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Only PDF files are allowed'}), 400

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'question' not in data:
        return jsonify({'error': 'No question provided'}), 400
    
    question = data['question']
    
    # Get question embedding
    question_embedding = embeddings.embed_query(question)
    
    # Search Pinecone for similar contexts
    search_results = index.query(
        vector=question_embedding,
        top_k=3,
        include_metadata=True
    )
    
    # Prepare context from search results
    contexts = [match['metadata']['text'] for match in search_results['matches']]
    
    # Prepare prompt
    prompt = f"""You are a helpful AI assistant that answers questions based on the provided context. 
Please answer the following question using ONLY the context provided below. 
If the answer cannot be found in the context, say "I cannot find the answer in the provided documents."

Context:
{' '.join(contexts)}

Question: {question}

Answer:"""
    
    # Get response from Gemini
    response = llm.invoke(prompt)
    
    return jsonify({
        'answer': response.content,
        'sources': [match['metadata']['source'] for match in search_results['matches']]
    })

if __name__ == '__main__':
    app.run(debug=True)
