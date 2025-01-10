from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import google.generativeai as genai
import json
import random
from datetime import datetime
import hashlib
import time
import re
from typing import List, Dict, Union
import PyPDF2
from gtts import gTTS
from moviepy.editor import ImageClip, AudioFileClip, CompositeVideoClip
from PIL import Image, ImageDraw, ImageFont
import textwrap
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import json
import logging
from werkzeug.exceptions import HTTPException

# Import RAG-related modules
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, ServiceContext
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.node_parser import SentenceSplitter
from llama_index.llms.groq import Groq

load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://localhost:3000"],  # Add your React frontend URLs
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True  # Add this if you're using credentials/cookies
    }
})
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Configure Google API
GOOGLE_API_KEY = "AIzaSyA4oJilLLoN362wuqnz_XTGRN2bchrqTeE"
genai.configure(api_key=GOOGLE_API_KEY)

# Configure Groq
GROQ_API_KEY = "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"

# Define paths
UPLOAD_FOLDER = 'uploads'
OUTPUT_VIDEO_PATH = 'videos'
TEMP_AUDIO_PATH = 'temp_audio.mp3'
TEMP_IMAGE_PATH = 'temp_background.png'

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_VIDEO_PATH, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max-limit

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

class StudyAidPlatform:
    def _init_(self, pdf_path: str):
        self.model = genai.GenerativeModel('gemini-pro')
        self.chat = self.model.start_chat(history=[])
        self.pdf_path = pdf_path
        self.document_content = self.extract_text_from_pdf()
        self.cache_file = "study_aid_cache.json"
        self.api_call_count = 0
        self.last_api_call_time = time.time()
        self.load_cache()
        
        # Initialize RAG components
        self.initialize_rag()
        
        self.summary = self.get_or_generate_content("summary", self.generate_summary)
        self.topics = self.get_or_generate_content("topics", self.extract_topics)
        self.quiz_questions = self.get_or_generate_content("quiz_questions", self.generate_initial_questions)
        self.current_difficulty = 5  # Middle of 1-10 scale
        self.consecutive_correct = 0
        self.consecutive_incorrect = 0
        self.user_score = 0
        self.question_history = []
        self.used_questions = set()
        self.current_question = None

    def initialize_rag(self):
        reader = SimpleDirectoryReader(input_files=[self.pdf_path])
        documents = reader.load_data()
        text_splitter = SentenceSplitter(chunk_size=600, chunk_overlap=100)
        nodes = text_splitter.get_nodes_from_documents(documents, show_progress=True)
        
        # Remove the trust_remote_code parameter
        embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        
        llm = Groq(model="llama-3.2-1b-preview", api_key=GROQ_API_KEY)
        service_context = ServiceContext.from_defaults(embed_model=embed_model, llm=llm)
        self.vector_index = VectorStoreIndex.from_documents(documents, show_progress=True, service_context=service_context, node_parser=text_splitter)
        self.query_engine = self.vector_index.as_query_engine(service_context=service_context)

    # ... (rest of the class methods remain the same)

    def extract_text_from_pdf(self) -> str:
        with open(self.pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text

    def load_cache(self):
        if os.path.exists(self.cache_file):
            with open(self.cache_file, 'r') as f:
                self.cache = json.load(f)
        else:
            self.cache = {}

    def save_cache(self):
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f, indent=2)

    def get_or_generate_content(self, key: str, generate_function):
        cache_key = hashlib.md5(f"{key}_{self.document_content[:100]}".encode()).hexdigest()
        if cache_key in self.cache:
            return self.cache[cache_key]
        content = generate_function()
        self.cache[cache_key] = content
        self.save_cache()
        return content

    def rate_limited_call(self, func, *args, **kwargs):
        current_time = time.time()
        if current_time - self.last_api_call_time < 1:
            time.sleep(1 - (current_time - self.last_api_call_time))
        self.last_api_call_time = time.time()
        self.api_call_count += 1
        return func(*args, **kwargs)

    def safe_generate_content(self, prompt: str) -> Union[List, Dict, str]:
        try:
            response = self.rate_limited_call(self.model.generate_content, prompt)
            print(f"Raw API response: {response.text}")
            clean_response = re.sub(r'json\s*|\s*', '', response.text)
            try:
                return json.loads(clean_response)
            except json.JSONDecodeError:
                return clean_response.strip()
        except Exception as e:
            print(f"API Error: {str(e)}. Retrying in 5 seconds...")
            time.sleep(5)
            return self.safe_generate_content(prompt)

    def generate_summary(self) -> str:
        response = self.query_engine.query("Summarize the main points of the document in 300 words.")
        return response.response

    def extract_topics(self) -> List[str]:
        response = self.query_engine.query("Extract 5-10 main topics from the document.")
        topics = [topic.strip() for topic in response.response.split(',')]
        return topics

    def generate_initial_questions(self) -> List[Dict]:
        questions = []
        for topic in self.topics:
            questions.extend(self.generate_questions_for_topic(topic, 2))
        return questions

    def generate_questions_for_topic(self, topic: str, num_questions: int) -> List[Dict]:
        prompt = f"""
        Based on the following topic, generate {num_questions} diverse quiz questions:
        Topic: {topic}

        Generate questions with a mix of the following types:
        - Multiple Choice Questions (MCQ)
        - Fill in the Blank
        - Short Answer Questions

        For each question:
        1. Ensure it's context-aware and related to the given topic
        2. Provide the correct answer
        3. Assign a difficulty level from 1 to 10 (1 being easiest, 10 being hardest)
        4. For 1 out of every 3 questions, incorporate information from your general knowledge that's relevant to the topic but not explicitly mentioned in the document content

        Format the output as a JSON list of dictionaries with this structure:
        {{
            "type": "mcq" | "fill_blank" | "short_answer",
            "question": "The question text with proper spacing",
            "options": ["A", "B", "C", "D"] (for MCQs only),
            "correct_answer": "The correct answer",
            "difficulty": 1-10,
            "topic": "{topic}",
            "source": "document" | "general_knowledge"
        }}
        """
        response = self.safe_generate_content(prompt)
        if isinstance(response, list):
            return response
        elif isinstance(response, str):
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                print("Failed to parse response as JSON. Raw response:")
                print(response)
                return []
        else:
            raise ValueError("Unexpected response format from API")

    def get_next_question(self) -> Dict:
        difficulty_range = 2
        suitable_questions = [q for q in self.quiz_questions 
                              if abs(q['difficulty'] - self.current_difficulty) <= difficulty_range 
                              and q['question'] not in self.used_questions]
        if not suitable_questions:
            suitable_questions = [q for q in self.quiz_questions 
                                  if q['question'] not in self.used_questions]
        if not suitable_questions:
            self.used_questions.clear()
            return self.get_next_question()
        
        question = random.choice(suitable_questions)
        self.used_questions.add(question['question'])
        self.current_question = question
        return question

    def check_answer(self, user_answer: str) -> bool:
        if not self.current_question:
            raise ValueError("No current question to check answer against")
        
        correct = user_answer.lower() == self.current_question['correct_answer'].lower()
        self.question_history.append({"question": self.current_question['question'], "correct": correct})
        self.adjust_difficulty(correct)
        self.update_score(correct, self.current_question['difficulty'])
        return correct

    def adjust_difficulty(self, correct: bool):
        if correct:
            self.consecutive_correct += 1
            self.consecutive_incorrect = 0
            if self.consecutive_correct >= 3:
                self.increase_difficulty()
        else:
            self.consecutive_incorrect += 1
            self.consecutive_correct = 0
            if self.consecutive_incorrect >= 2:
                self.decrease_difficulty()

    def increase_difficulty(self):
        self.current_difficulty = min(10, self.current_difficulty + 1)
        self.consecutive_correct = 0

    def decrease_difficulty(self):
        self.current_difficulty = max(1, self.current_difficulty - 1)
        self.consecutive_incorrect = 0

    def update_score(self, correct: bool, difficulty: int):
        if correct:
            self.user_score += difficulty
        else:
            self.user_score = max(0, self.user_score - 1)

    def generate_suggestions(self) -> Dict[str, Union[str, int]]:
        if not self.question_history:
            return {
                "suggestions": "Not enough data to generate suggestions. Please answer more questions.",
                "score": self.user_score
            }

        topics = []
        for q in self.question_history:
            if not q.get('correct', True) and 'question' in q:
                topic = self.extract_topic_from_question(q['question'])
                if topic:
                    topics.append(topic)

        if not topics:
            return {
                "suggestions": "Great job! You haven't struggled with any topics yet.",
                "score": self.user_score
            }

        topic_counts = {topic: topics.count(topic) for topic in set(topics)}
        weak_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:3]

        prompt = f"""
        Based on the user's performance, they struggled most with these topics:
        {', '.join([topic for topic, _ in weak_topics])}

        Provide 3 concise suggestions for improvement, including recommended study resources or techniques.
        """
        suggestions = self.safe_generate_content(prompt)

        return {
            "suggestions": suggestions,
            "score": self.user_score
        }

    def extract_topic_from_question(self, question: str) -> str:
        response = self.query_engine.query(f"What topic does this question relate to: {question}")
        return response.response.strip()

# Initialize the platform instance
study_aid_platform = None

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
        return jsonify({"file_path": file_path}), 200
    return jsonify({"error": "Invalid file type. Please upload a PDF."}), 400

@app.route('/initialize', methods=['POST'])
def initialize():
    global study_aid_platform
    data = request.json
    pdf_path = data.get('pdf_path')
    if not pdf_path or not os.path.exists(pdf_path):
        return jsonify({"error": "Invalid PDF path."}), 400
    study_aid_platform = StudyAidPlatform(pdf_path)
    return jsonify({"message": "Platform initialized successfully."})

@app.route('/question', methods=['GET'])
def get_question():
    if not study_aid_platform:
        return jsonify({"error": "Platform not initialized."}), 400
    question = study_aid_platform.get_next_question()
    return jsonify(question)

@app.route('/answer', methods=['POST'])
def answer_question():
    if not study_aid_platform:
        return jsonify({"error": "Platform not initialized."}), 400
    data = request.json
    user_answer = data.get('answer')
    if not user_answer:
        return jsonify({"error": "Answer is required."}), 400
    correct = study_aid_platform.check_answer(user_answer)
    return jsonify({"correct": correct})

@app.route('/suggestions', methods=['GET'])
def get_suggestions():
    if not study_aid_platform:
        return jsonify({"error": "Platform not initialized."}), 400
    suggestions = study_aid_platform.generate_suggestions()
    return jsonify(suggestions)

@app.route('/generate_video', methods=['POST'])
def generate_video():
    data = request.json
    topic = data.get('topic', 'Untitled')

    # Generate content for the video
    prompt = f"Generate informative educative facts/steps/important points on the topic: {topic} (in 3-4 short sentences)"
    response = study_aid_platform.model.generate_content(prompt)
    content = response.text

    # Generate audio
    tts = gTTS(text=content, lang='en', slow=False)
    tts.save(TEMP_AUDIO_PATH)

# Create background image with text
    img = Image.open('background.png')
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("arial.ttf", 36)  # Adjust font and size as needed
    
    # Wrap text to fit image
    margin = 50
    text_width = img.width - 2 * margin
    wrapped_text = textwrap.fill(content, width=40)  # Adjust width as needed
    
    # Calculate text position (centered)
    text_height = draw.multiline_textbbox((0, 0), wrapped_text, font=font)[3]
    text_position = ((img.width - text_width) / 2, (img.height - text_height) / 2)
    
    # Add text to image
    draw.multiline_text(text_position, wrapped_text, font=font, fill=(255, 255, 255), align="center")
    img.save(TEMP_IMAGE_PATH)

    # Create video
    audio_clip = AudioFileClip(TEMP_AUDIO_PATH)
    image_clip = ImageClip(TEMP_IMAGE_PATH).set_duration(audio_clip.duration)
    video = CompositeVideoClip([image_clip])
    video = video.set_audio(audio_clip)
    
    video_file_path = os.path.join(OUTPUT_VIDEO_PATH, f'{topic.replace(" ", "_")}.mp4')
    video.write_videofile(video_file_path, fps=24)

    # Clean up temporary files
    os.remove(TEMP_AUDIO_PATH)
    os.remove(TEMP_IMAGE_PATH)

    video_url = f"/videos/{topic.replace(' ', '_')}.mp4"
    return jsonify({"video_url": video_url})

@app.route('/videos/<filename>')
def serve_video(filename):
    return send_from_directory(OUTPUT_VIDEO_PATH, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)