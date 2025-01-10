from flask import Flask, request, render_template, redirect, url_for, jsonify
from flask_cors import CORS
from groq import Groq
import base64
import os
from PIL import Image
import warnings
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Suppress warnings
warnings.filterwarnings('ignore')

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Constants
LLAVA_MODEL = "llama-3.2-11b-vision-preview"

# Initialize the Groq client
groq_api_key = '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'
client = Groq(api_key=groq_api_key)

class ImageProcessor:
    @staticmethod
    def encode_image(img_path: str) -> str:
        """Encode image to base64 string."""
        try:
            with open(img_path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
        except Exception as e:
            logger.error(f"Error encoding image: {str(e)}")
            raise Exception(f"Error encoding image: {str(e)}")

    @staticmethod
    def convert_to_jpg(input_image_path: str) -> str:
        """Converts any image to JPG format."""
        try:
            with Image.open(input_image_path) as img:
                img = img.convert("RGB")
                base_name = os.path.splitext(input_image_path)[0]
                output_image_path = f"{base_name}.jpg"
                img.save(output_image_path, "JPEG")
                return output_image_path
        except Exception as e:
            logger.error(f"Error converting image: {str(e)}")
            raise Exception(f"Error converting image: {str(e)}")

    def process_image_with_llm(self, encoded_image: str, model: str = LLAVA_MODEL) -> str:
        """Process image with LLM model."""
        try:
            # Validate encoded image
            if not encoded_image:
                raise ValueError("Encoded image is empty")

            # Log the request (excluding the actual image data for brevity)
            logger.debug(f"Processing image with model: {model}")

            response = client.chat.completions.create(
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyze this image and provide insights."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{encoded_image}",
                            },
                        },
                    ],
                }],
                model=model
            )

            if not response or not response.choices:
                raise Exception("No response received from LLM")

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"Error processing image with LLM: {str(e)}")
            raise Exception(f"Error processing image with LLM: {str(e)}")

@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        logger.debug("Received request to /upload")

        if 'image' not in request.files:
            logger.warning("No file uploaded")
            return jsonify({
                "success": False,
                "error": "No file uploaded"
            }), 400

        image_file = request.files['image']
        if image_file.filename == '':
            logger.warning("No selected file")
            return jsonify({
                "success": False,
                "error": "No selected file"
            }), 400

        # Create a unique filename
        filename = f"{uuid.uuid4().hex}_{image_file.filename}"
        image_path = os.path.join('static', filename)
        
        logger.debug(f"Saving uploaded file to: {image_path}")
        image_file.save(image_path)

        try:
            processor = ImageProcessor()
            
            # Convert image to JPG if necessary
            if not image_path.lower().endswith('.jpg'):
                logger.debug("Converting image to JPG format")
                image_path = processor.convert_to_jpg(image_path)

            # Encode the image
            logger.debug("Encoding image to base64")
            encoded_result = processor.encode_image(image_path)

            # Clean up the file after encoding
            try:
                logger.debug(f"Cleaning up temporary file: {image_path}")
                os.remove(image_path)
            except Exception as e:
                logger.warning(f"Failed to clean up temporary file: {str(e)}")

            return jsonify({
                "success": True,
                "encoded_image": encoded_result
            }), 200

        finally:
            # Ensure cleanup happens even if there's an error
            try:
                if os.path.exists(image_path):
                    os.remove(image_path)
            except:
                pass

    except Exception as e:
        logger.error(f"Error in /upload: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/get_caption', methods=['POST'])
def get_caption():
    try:
        # Log incoming request
        logger.debug("Received request to /get_caption")

        # Validate request data
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400

        if 'encoded_image' not in data:
            return jsonify({"error": "No encoded image provided"}), 400

        encoded_image = data['encoded_image']
        if not encoded_image:
            return jsonify({"error": "Encoded image is empty"}), 400

        # Process the image
        processor = ImageProcessor()
        result = processor.process_image_with_llm(encoded_image)

        logger.debug("Successfully processed image and generated caption")
        return jsonify({
            "success": True,
            "caption": result
        }), 200

    except Exception as e:
        logger.error(f"Error in /get_caption: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.errorhandler(500)
def handle_500_error(e):
    logger.error(f"Internal server error: {str(e)}")
    return jsonify({
        "success": False,
        "error": "Internal server error occurred. Please check server logs for details."
    }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == "__main__":
    # Make sure the static folder exists
    os.makedirs('static', exist_ok=True)
    # Run the app
    app.run(host='0.0.0.0', port=5020, debug=True)