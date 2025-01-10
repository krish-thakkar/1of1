from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import json
import random
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext, ServiceContext, load_index_from_storage
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.node_parser import SentenceSplitter
from llama_index.llms.groq import Groq

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

GROQ_API_KEY = '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'

class FlashcardPlatform:
    def _init_(self):
        self.pdf_path = None
        self.query_engine = None
        self.flashcards = []

    def initialize(self, pdf_path):
        self.pdf_path = pdf_path
        self.initialize_llama_index()
        self.flashcards = self.generate_initial_flashcards()

    def initialize_llama_index(self):
        try:
            reader = SimpleDirectoryReader(input_files=[self.pdf_path])
            documents = reader.load_data()
            text_splitter = SentenceSplitter(chunk_size=600, chunk_overlap=100)
            nodes = text_splitter.get_nodes_from_documents(documents, show_progress=True)
            
            embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
            llm = Groq(model="llama-3.2-1b-preview", api_key=GROQ_API_KEY)
            service_context = ServiceContext.from_defaults(embed_model=embed_model, llm=llm)
            vector_index = VectorStoreIndex.from_documents(documents, show_progress=True, service_context=service_context, node_parser=nodes)
            vector_index.storage_context.persist(persist_dir="./storage_mini")
            
            storage_context = StorageContext.from_defaults(persist_dir="./storage_mini")
            index = load_index_from_storage(storage_context, service_context=service_context)
            self.query_engine = index.as_query_engine(service_context=service_context)
        except Exception as e:
            print(f"Error initializing LlamaIndex: {str(e)}")
            raise

    def generate_initial_flashcards(self):
        prompt = """
        Based on the content of the uploaded PDF, generate 5 flashcards.
        Each flashcard should have a topic and an answer.
        Format the output as a JSON list of dictionaries with this structure:
        [
            {
                "topic": "The topic or question",
                "answer": "The answer or explanation"
            },
            ...
        ]
        Ensure the content is educational and covers key points from the document.
        """
        response = self.query_engine.query(prompt)
        try:
            return json.loads(response.response)
        except json.JSONDecodeError:
            print("Failed to parse response as JSON. Raw response:")
            print(response.response)
            return []

    def get_new_flashcard(self):
        prompt = """
        Generate a new flashcard based on the content of the uploaded PDF.
        The flashcard should have a topic and an answer.
        Format the output as a JSON dictionary with this structure:
        {
            "topic": "The topic or question",
            "answer": "The answer or explanation"
        }
        Ensure the content is educational and covers a key point from the document.
        """
        response = self.query_engine.query(prompt)
        try:
            return json.loads(response.response)
        except json.JSONDecodeError:
            print("Failed to parse response as JSON. Raw response:")
            print(response.response)
            return {"topic": "Error generating flashcard", "answer": "Please try again."}

flashcard_platform = FlashcardPlatform()

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.endswith('.pdf'):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        return jsonify({"message": "File uploaded successfully", "file_path": file_path}), 200
    return jsonify({"error": "Invalid file type. Please upload a PDF."}), 400

@app.route('/initialize', methods=['POST'])
def initialize():
    data = request.json
    pdf_path = data.get('pdf_path')
    if not pdf_path or not os.path.exists(pdf_path):
        return jsonify({"error": "Invalid PDF path."}), 400
    try:
        flashcard_platform.initialize(pdf_path)
        return jsonify({
            "message": "Platform initialized successfully",
            "initial_flashcards": flashcard_platform.flashcards
        }), 200
    except Exception as e:
        return jsonify({"error": f"Error initializing platform: {str(e)}"}), 500

@app.route('/flashcard', methods=['GET'])
def get_flashcard():
    if not flashcard_platform.query_engine:
        return jsonify({"error": "Platform not initialized. Please upload a PDF and initialize first."}), 400
    return jsonify(flashcard_platform.get_new_flashcard())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5010, debug=True)