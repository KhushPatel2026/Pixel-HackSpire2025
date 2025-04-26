from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from pypdf import PdfReader
import google.generativeai as genai
import json
import numpy as np
from pinecone import Pinecone, ServerlessSpec
from langchain.text_splitter import RecursiveCharacterTextSplitter
import time

app = Flask(__name__)
CORS(app)

print("Starting Flask application...")

# Load environment variables before anything else
load_dotenv()

# Configure API keys and check if they exist
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
PINECONE_ENV = os.getenv('PINECONE_ENV')
PINECONE_INDEX_NAME = os.getenv('PINECONE_INDEX_NAME', 'pdf-embeddings')

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")
if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY not found in environment variables")
if not PINECONE_ENV:
    raise ValueError("PINECONE_ENV not found in environment variables")

# Initialize Gemini
print("Configuring Gemini API...")
genai.configure(api_key=GEMINI_API_KEY)

# Configure generation parameters
generation_config = {
    'temperature': 0.7,
    'top_p': 0.8,
    'top_k': 40,
    'max_output_tokens': 2048,
}
model = genai.GenerativeModel('gemini-2.0-flash', generation_config=generation_config)

# Initialize embedding model
print("Configuring embedding model...")
embedding_model = genai.GenerativeModel('embedding-001')

def get_embedding(text):
    """Get embedding for a text using Gemini directly"""
    try:
        response = genai.embed_content(
            model='models/embedding-001',
            content=text,
            task_type='retrieval_query'
        )
        return response['embedding']
    except Exception as e:
        print(f"Error generating embedding: {str(e)}")
        raise

def batch_get_embeddings(texts, batch_size=20):
    """Get embeddings for multiple texts in batches"""
    all_embeddings = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_embeddings = []
        for text in batch:
            try:
                response = genai.embed_content(
                    model='models/embedding-001',
                    content=text,
                    task_type='retrieval_document'
                )
                batch_embeddings.append(response['embedding'])
            except Exception as e:
                print(f"Error in batch embedding: {str(e)}")
                raise
        all_embeddings.extend(batch_embeddings)
        print(f"Processed batch {i//batch_size + 1} of {(len(texts) + batch_size - 1)//batch_size}")
    return all_embeddings

# Initialize Pinecone with new client
print("Initializing Pinecone...")
pc = Pinecone(api_key=PINECONE_API_KEY)

# Create or get the index
DIMENSION = 768  # dimension for embedding model
DEFAULT_NAMESPACE = "default"  # Add default namespace

try:
    # Try to get existing index
    print(f"Checking for existing index: {PINECONE_INDEX_NAME}")
    existing_indexes = pc.list_indexes().names()
    
    if PINECONE_INDEX_NAME not in existing_indexes:
        print(f"Creating new Pinecone index: {PINECONE_INDEX_NAME}")
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=DIMENSION,
            metric='cosine',
            spec=ServerlessSpec(
                cloud='aws',
                region='us-west-2'
            )
        )
        # Wait for index to be ready
        print("Waiting for index to be ready...")
        time.sleep(20)  # Give more time for index creation
    
    # Connect to the index
    index = pc.Index(PINECONE_INDEX_NAME)
    
    # Test the connection with a simple operation
    try:
        stats = index.describe_index_stats()
        print(f"Successfully connected to index. Stats: {stats}")
    except Exception as e:
        print(f"Error testing index connection: {str(e)}")
        raise
        
except Exception as e:
    print(f"Error initializing Pinecone: {str(e)}")
    raise

print("Pinecone index ready")

# Initialize text splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
)

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def process_pdf(file_path):
    """Process PDF and create vector store in Pinecone"""
    print(f"Starting to process PDF: {file_path}")
    
    # Read PDF
    pdf_reader = PdfReader(file_path)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    
    print(f"PDF text extracted successfully. Total pages: {len(pdf_reader.pages)}")
    print(f"Extracted text length: {len(text)} characters")
    
    # Split text into chunks
    chunks = text_splitter.split_text(text)
    print(f"Split into {len(chunks)} chunks")
    
    # Create embeddings in batches
    print("Generating embeddings...")
    chunk_embeddings = batch_get_embeddings(chunks)
    print(f"Generated embeddings for {len(chunk_embeddings)} chunks")
    
    try:
        # Prepare vectors for Pinecone
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings)):
            vectors.append({
                'id': f'chunk_{i}',
                'values': embedding,
                'metadata': {
                    'text': chunk,
                    'page': i // len(pdf_reader.pages)
                }
            })
        
        # Clear existing vectors (if any) and upsert new ones
        print("Clearing existing vectors...")
        try:
            # First, try to get stats to ensure the namespace exists
            stats = index.describe_index_stats()
            print(f"Current index stats: {stats}")
            
            # Then proceed with delete
            index.delete(
                delete_all=True,
                namespace=DEFAULT_NAMESPACE
            )
        except Exception as e:
            print(f"Warning during vector cleanup: {str(e)}")
            # Continue even if delete fails (namespace might not exist yet)
        
        # Upsert in batches of 100
        print("Upserting new vectors...")
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i + batch_size]
            try:
                index.upsert(
                    vectors=batch,
                    namespace=DEFAULT_NAMESPACE
                )
                print(f"Uploaded batch {i//batch_size + 1} of {(len(vectors) + batch_size - 1)//batch_size}")
            except Exception as e:
                print(f"Error upserting batch: {str(e)}")
                raise
        
        print("Vectors uploaded to Pinecone successfully")
        
    except Exception as e:
        print(f"Error during vector operations: {str(e)}")
        raise
    
    # Generate initial summary
    summary_prompt = f"""Please provide a comprehensive summary of the following document. Format your response using these rules:
1. Use ** ** for bold text (e.g., **Important Topic**)
2. Use single * at the start of a line for bullet points
3. Use clear section headers in bold (e.g., **1. Main Topics and Key Points:**)
4. Organize the content with proper spacing between sections

Include:
**1. Main Topics and Key Points:**
* Key topics and main ideas
* Important concepts discussed
* Core arguments or themes

**2. Important Findings or Conclusions:**
* Major findings
* Key conclusions
* Significant results

**3. Significant Data or Statistics:**
* Notable numbers or percentages
* Important measurements
* Key metrics

**4. Key Recommendations:**
* Main suggestions
* Action items
* Future directions

Document text:
{text[:5000]}  # Using first 5000 chars for summary"""
    
    response = model.generate_content(summary_prompt)
    
    return {
        'summary': response.text,
        'page_count': len(pdf_reader.pages),
        'chunk_count': len(chunks)
    }

def get_relevant_chunks(query, top_k=3):
    """Retrieve most relevant chunks for a query from Pinecone"""
    try:
        # Get query embedding
        query_embedding = get_embedding(query)
        
        # Search in Pinecone
        results = index.query(
            vector=query_embedding,
            top_k=top_k,
            include_metadata=True,
            namespace=DEFAULT_NAMESPACE
        )
        
        # Extract chunks from results
        chunks = [match.metadata['text'] for match in results.matches]
        
        # Prepare context and generate response
        context = "\n\n".join(chunks)
        
        prompt = f"""Based on the following context, please answer the question. Format your response using these rules:
1. Use ** ** for bold text (e.g., **Important Point**)
2. Use single * at the start of a line for bullet points
3. If listing multiple items, use bullet points
4. If the answer cannot be found in the context, say "I cannot find information about this in the document."

Context:
{context}

Question: {query}

Answer:"""
        
        # Generate response
        response = model.generate_content(prompt)
        
        return chunks, response.text
        
    except Exception as e:
        print(f"Error retrieving chunks: {str(e)}")
        raise

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        if not data or 'question' not in data:
            return jsonify({'error': 'No question provided'}), 400
        
        question = data['question']
        print(f"Received question: {question}")
        
        # Get relevant chunks and generate response
        chunks, answer = get_relevant_chunks(question)
        
        return jsonify({
            'answer': answer,
            'context': chunks  # Optional: return context for debugging
        }), 200
        
    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        print("Error: No file part in request")
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        print("Error: No selected file")
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.endswith('.pdf'):
        try:
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            print(f"Saving file to: {file_path}")
            file.save(file_path)
            
            # Process the PDF and get summary
            result = process_pdf(file_path)
            
            # Clean up - delete the file after processing
            print("Cleaning up temporary file...")
            os.remove(file_path)
            
            print("File processing completed successfully")
            return jsonify({
                'message': 'File processed successfully',
                'summary': result['summary'],
                'page_count': result['page_count'],
                'chunk_count': result['chunk_count']
            }), 200
            
        except Exception as e:
            print(f"Error during file processing: {str(e)}")
            # Clean up in case of error
            if os.path.exists(file_path):
                os.remove(file_path)
            return jsonify({'error': str(e)}), 500
    else:
        print("Error: Invalid file type")
        return jsonify({'error': 'Only PDF files are allowed'}), 400

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'message': 'Service is running'}), 200

if __name__ == '__main__':
    app.run(debug=True)