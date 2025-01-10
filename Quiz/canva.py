import os
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

def load_image(image_path):
    return Image.open(image_path)

def analyze_image_clip(image, prompt):
    try:
        model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

        inputs = processor(text=[prompt, "unrelated image"], images=image, return_tensors="pt", padding=True)

        with torch.no_grad():
            outputs = model(**inputs)

        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1)

        is_related = probs[0][0].item() > probs[0][1].item()
        confidence = probs[0][0].item() if is_related else probs[0][1].item()

        return is_related, confidence

    except Exception as e:
        logging.error(f"Error during CLIP analysis: {e}")
        return False, 0.0

@app.route("/analyze", methods=["POST"])
def analyze_image():
    try:
        logging.info("Received request to /analyze")
        
        if 'image' not in request.files:
            return jsonify({"error": "No image file in request"}), 400
        
        image_file = request.files['image']
        prompt = request.form.get('prompt')

        if not prompt:
            return jsonify({"error": "No prompt in request"}), 400

        logging.info(f"Received image: {image_file.filename}, prompt: {prompt}")

        # Save the image file temporarily
        temp_path = "temp_image.png"
        image_file.save(temp_path)

        # Load and analyze the image
        image = load_image(temp_path)
        is_related, confidence = analyze_image_clip(image, prompt)

        # Clean up the temporary file
        os.remove(temp_path)

        logging.info(f"Analysis complete. Confidence: {confidence:.2%}")

        return jsonify({
            "confidence": f"{confidence:.2%}",
        })

    except Exception as e:
        logging.error(f"An error occurred: {e}")
        return jsonify({"error": f"An error occurred: {e}"}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5030, debug=True)