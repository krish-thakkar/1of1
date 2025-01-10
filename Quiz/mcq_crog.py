import google.generativeai as genai
import os
import json
import random
from dotenv import load_dotenv
from datetime import datetime
import hashlib
import time
import re
from typing import List, Dict, Union
import PyPDF2
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import RAG-related modules
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, load_index_from_storage
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.node_parser import SentenceSplitter
from llama_index.llms.groq import Groq

load_dotenv()

# Configure the Google Generative AI API
genai.configure(api_key='api_key')

# Configure Groq
GROQ_API_KEY = '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'

app = Flask(__name__)


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
class StudyAidPlatform:
    def __init__(self, pdf_path: str):
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
        embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")
        llm = Groq(model="llama-3.2-1b-preview", api_key=GROQ_API_KEY)
        service_context = ServiceContext.from_defaults(embed_model=embed_model, llm=llm)
        self.vector_index = VectorStoreIndex.from_documents(documents, show_progress=True, service_context=service_context, node_parser=nodes)
        self.query_engine = self.vector_index.as_query_engine(service_context=service_context)

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

    def generate_suggestions(self) -> str:
        if not self.question_history:
            return "Not enough data to generate suggestions. Please answer more questions."

        topics = []
        for q in self.question_history:
            if not q.get('correct', True) and 'question' in q:
                topic = self.extract_topic_from_question(q['question'])
                if topic and topic not in topics:
                    topics.append(topic)
        
        return f"Consider reviewing these topics: {', '.join(topics)}."

    def extract_topic_from_question(self, question: str) -> str:
        response = self.query_engine.query(f"What topic does this question relate to: {question}")
        return response.response.strip()

# Initialize the platform instance
study_aid_platform = None

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
    return jsonify({"suggestions": suggestions})

if __name__ == "__main__":
    app.run(debug=True)