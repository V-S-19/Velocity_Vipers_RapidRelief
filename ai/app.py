import json
import os
import re
import tempfile
import uuid

import cv2
import google.generativeai as genai
from flask import Flask, jsonify, request
from PIL import Image

app = Flask(__name__)

API_KEY = os.getenv("GEMINI_API_KEY", "#########")
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")


def extract_image(file_path: str) -> Image.Image:
    ext = os.path.splitext(file_path)[1].lower()
    if ext in {".mp4", ".mov", ".avi", ".mkv", ".webm"}:
        capture = cv2.VideoCapture(file_path)
        if not capture.isOpened():
            raise ValueError("Unable to open the uploaded video.")

        ok, frame = capture.read()
        capture.release()

        if not ok:
            raise ValueError("No video frame could be read for analysis.")

        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        return Image.fromarray(frame)

    return Image.open(file_path).convert("RGB")


def clean_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = text.rsplit("```", 1)[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.S)
        if match:
            return json.loads(match.group(0))
        raise ValueError("AI response was not valid JSON.")


@app.get("/health")
def health():
    return jsonify({"status": "ok", "message": "AI emergency analysis service is live."})


@app.post("/analyze")
def analyze():
    if "media" not in request.files or not request.files["media"].filename:
        return jsonify({"message": "Please upload an image or video to analyze."}), 400

    uploaded_file = request.files["media"]
    temp_path = os.path.join(tempfile.gettempdir(), f"emergency-ai-{uuid.uuid4()}-{uploaded_file.filename}")
    uploaded_file.save(temp_path)

    try:
        image = extract_image(temp_path)

        prompt = """
You are an expert emergency hazard analysis assistant.
Analyze the attached image or video frame and return ONLY valid JSON with these keys:
{
  "hazardDetected": true or false,
  "incidentType": "Fire" | "Medical" | "Accident" | "Security" | "Other",
  "severity": "Low" | "Medium" | "High" | "Critical",
  "description": "A short summary of what you observe.",
  "recommendedAction": "A short, practical response action."
}
If no hazard is found, set hazardDetected to false and explain that in the description.
"""

        response = model.generate_content([prompt, image])
        result = clean_json(response.text)

        payload = {
            "hazardDetected": bool(result.get("hazardDetected", False)),
            "incidentType": result.get("incidentType") or "Other",
            "severity": result.get("severity") or "Medium",
            "description": result.get("description") or "AI analysis completed.",
            "recommendedAction": result.get("recommendedAction") or "Dispatch responders to confirm the situation."
        }

        return jsonify(payload)
    except Exception as error:
        return jsonify({
            "hazardDetected": False,
            "incidentType": "Other",
            "severity": "Medium",
            "description": "AI analysis is temporarily unavailable. Please review the incident manually.",
            "recommendedAction": "Use the fallback review path and notify the response team.",
            "error": str(error)
        }), 500
    finally:
        try:
            os.remove(temp_path)
        except OSError:
            pass


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=False)
