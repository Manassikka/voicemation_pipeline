from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import os
import tempfile
import subprocess
from voicemation import process_speech  # existing pipeline
import speech_recognition as sr
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

OUTPUT_VIDEO = None  # store the latest video path


@app.route("/")
def index():
    return render_template("index.html")


# Existing text-based route (optional)
@app.route("/generate", methods=["POST"])
def generate():
    global OUTPUT_VIDEO
    data = request.get_json()
    text = data.get("text", "")

    if not text.strip():
        return jsonify({"error": "No text provided"}), 400

    OUTPUT_VIDEO = process_speech(text, False)  # Default to normal mode for this endpoint

    if OUTPUT_VIDEO:
        return jsonify({"message": "Video generated!", "video_url": "/download"})
    else:
        return jsonify({"error": "Failed to generate video"}), 500


@app.route("/download")
def download():
    global OUTPUT_VIDEO
    if OUTPUT_VIDEO and os.path.exists(OUTPUT_VIDEO):
        return send_file(OUTPUT_VIDEO, as_attachment=False, mimetype='video/mp4')
    return "No video generated yet.", 404


@app.route("/video/<path:filename>")
def serve_video(filename):
    """Serve video files from the media directory"""
    video_path = os.path.join(os.getcwd(), filename)
    if os.path.exists(video_path):
        return send_file(video_path, as_attachment=False, mimetype='video/mp4')
    return "Video not found.", 404


# NEW: Voice-only route with WebM -> WAV conversion
@app.route("/generate_audio", methods=["POST"])
def generate_audio():
    global OUTPUT_VIDEO
    
    # Handle JSON text input
    if request.is_json:
        data = request.get_json()
        speech_text = data.get("text", "")
        in_depth_mode = data.get("inDepthMode", False)
        print(f"🔍 JSON inDepthMode: {data.get('inDepthMode')} -> {in_depth_mode}")
        
        if not speech_text.strip():
            return jsonify({"success": False, "error": "No text provided"}), 400
            
        print(f"📝 Processing text input: {speech_text} (In Depth Mode: {in_depth_mode})")
        
    # Handle audio file upload
    elif "audio" in request.files:
        audio_file = request.files["audio"]
        in_depth_mode_str = request.form.get("inDepthMode", "false")
        in_depth_mode = in_depth_mode_str.lower() == "true"
        print(f"🔍 FormData inDepthMode: '{in_depth_mode_str}' -> {in_depth_mode}")

        # Save WebM temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_webm:
            audio_file.save(tmp_webm.name)
            webm_path = tmp_webm.name

        # Convert WebM -> WAV using ffmpeg
        wav_fd, wav_path = tempfile.mkstemp(suffix=".wav")
        os.close(wav_fd)  # Close fd so ffmpeg can write

        try:
            subprocess.run(
                ["ffmpeg", "-y", "-i", webm_path, wav_path],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

            # Recognize speech
            recognizer = sr.Recognizer()
            with sr.AudioFile(wav_path) as source:
                audio_data = recognizer.record(source)
                speech_text = recognizer.recognize_google(audio_data)
                
            print(f"🎤 Recognized speech: {speech_text}")

        except sr.UnknownValueError:
            return jsonify({"success": False, "error": "Could not understand audio"}), 400
        except sr.RequestError:
            return jsonify({"success": False, "error": "Speech recognition service unavailable"}), 503
        except subprocess.CalledProcessError:
            return jsonify({"success": False, "error": "Failed to convert audio"}), 500
        finally:
            os.remove(webm_path)
            os.remove(wav_path)
    else:
        return jsonify({"success": False, "error": "No audio file or text provided"}), 400

    # Call existing pipeline
    try:
        print(f"🚀 Calling process_speech('{speech_text}', {in_depth_mode})")
        OUTPUT_VIDEO = process_speech(speech_text, in_depth_mode)
        print(f"🎬 process_speech returned: {OUTPUT_VIDEO}")
    except Exception as e:
        print(f"❌ Error in process_speech: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": f"Pipeline error: {str(e)}"}), 500

    if OUTPUT_VIDEO:
        # Return the relative path from the server root for the frontend
        video_url = f"/video/{OUTPUT_VIDEO}"
        return jsonify({
            "success": True,
            "videoUrl": video_url, 
            "prompt": speech_text,
            "video_url": video_url,  # Keep both for compatibility
            "text": speech_text      # Keep both for compatibility
        })
    else:
        return jsonify({"success": False, "error": "Failed to generate video"}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)
