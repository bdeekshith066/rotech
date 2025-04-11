from flask import Flask, request, send_file
from flask_cors import CORS
from gtts import gTTS
import os
import uuid

app = Flask(__name__)
CORS(app)

AUDIO_FOLDER = "audio"
os.makedirs(AUDIO_FOLDER, exist_ok=True)

@app.route("/api/tts", methods=["POST"])
def tts():
    data = request.json
    text = data.get("text")
    lang = data.get("lang", "en")

    if not text:
        return {"error": "No text provided"}, 400

    filename = f"{uuid.uuid4()}.mp3"
    filepath = os.path.join(AUDIO_FOLDER, filename)

    try:
        tts = gTTS(text, lang=lang)
        tts.save(filepath)
        return send_file(filepath, mimetype="audio/mpeg")
    except Exception as e:
        return {"error": str(e)}, 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
