from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
from dotenv import load_dotenv
from pypdf import PdfReader
import google.generativeai as genai
import json

app = Flask(__name__)
CORS(app)

print("Starting Flask application...")

# Load environment variables before anything else
load_dotenv()

# Configure API key and check if it exists
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

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
print("Gemini model configured with generation parameters")

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def process_pdf(file_path):
    """Process PDF and get summary from Gemini"""
    print(f"Starting to process PDF: {file_path}")
    # Read PDF
    pdf_reader = PdfReader(file_path)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text()
    
    print(f"PDF text extracted successfully. Total pages: {len(pdf_reader.pages)}")
    print(f"Extracted text length: {len(text)} characters")
    
    # Prepare the prompt for summarization
    prompt = f"""Please provide a comprehensive summary of the following document. Include:
1. Main topics and key points
2. Important findings or conclusions
3. Any significant data or statistics
4. Key recommendations (if any)

Document text:
{text}

Please structure the summary in a clear, organized manner."""
    
    try:
        print("Sending request to Gemini API...")
        # Get summary from Gemini
        response = model.generate_content(prompt)
        
        # Debug response object
        print(f"Response received. Response type: {type(response)}")
        
        if response.text:
            print("Summary generated successfully")
            print(f"Summary length: {len(response.text)} characters")
            return {
                'summary': response.text,
                'page_count': len(pdf_reader.pages)
            }
        else:
            print("Error: Empty response text from Gemini")
            raise Exception("Empty response from Gemini")
            
    except Exception as e:
        print(f"Error during Gemini API call: {str(e)}")
        print(f"Full error details: {repr(e)}")
        raise Exception(f"Failed to generate summary: {str(e)}")

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
                'page_count': result['page_count']
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
