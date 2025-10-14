# voiceover_utils.py

import os
import subprocess
from gtts import gTTS
import tempfile


def generate_voiceover(text):
    """
    Convert input text to speech using gTTS and save as MP3.
    Returns path to the saved file.
    """
    tts = gTTS(text)
    temp_audio_path = os.path.join(tempfile.gettempdir(), "voiceover.mp3")
    tts.save(temp_audio_path)
    print(f"🔊 Voiceover saved to: {temp_audio_path}")
    return temp_audio_path


def add_voiceover_to_video(video_path, audio_path):
    """
    Ug se ffmpeto merge video and audio into a new output file.
    Ensures video matches the length of the narration:
      - If audio is longer → video loops until narration ends
      - If video is longer → video trims to narration length
    Returns path to the final merged video.
    """
    if not os.path.exists(video_path):
        print(f"❌ Video not found at: {video_path}")
        return None

    output_path = video_path.replace(".mp4", "_vo.mp4")

    # ffmpeg command: loop video (-stream_loop -1), cut to audio length (-shortest)
    command = [
        "ffmpeg",
        "-y",  # Overwrite without asking
        "-stream_loop", "-1",  # Loop video if shorter than audio
        "-i", video_path,
        "-i", audio_path,
        "-c:v", "libx264",      # Re-encode video for compatibility
        "-tune", "animation",   # Optimize for animation
        "-c:a", "aac",          # Encode audio in AAC
        "-shortest",            # Trim longer stream to match shorter
        output_path
    ]

    try:
        print("🎞️ Merging video and voiceover using ffmpeg...")
        subprocess.run(command, check=True)
        print(f"✅ Final video with voiceover saved at: {output_path}")
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"❌ ffmpeg failed: {e}")
        return None
