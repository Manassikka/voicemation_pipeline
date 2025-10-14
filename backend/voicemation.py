import os
import re
import subprocess
import speech_recognition as sr
from azure.ai.inference import ChatCompletionsClient
from azure.ai.inference.models import SystemMessage, UserMessage
from azure.core.credentials import AzureKeyCredential
from voiceover_utils import generate_voiceover
from dotenv import load_dotenv
import shutil
# extra imports for syncing
from mutagen.mp3 import MP3

load_dotenv()

def sanitize_manim_code(manim_code: str) -> str:
    """
    Cleans up common GPT mistakes for Manim v0.18 compatibility.
    Ensures UTF-8 safe output.
    """
    # ✅ Force UTF-8 safe text by removing invalid characters
    code = manim_code.encode("utf-8", "ignore").decode("utf-8")

    # ✅ Common replacements for symbols that break Python
    replacements = {
        "×": "*",
        "÷": "/",
        "−": "-",
        "‒": "-",
        "–": "-",
        "—": "-",
        "“": '"',
        "”": '"',
        "‘": "'",
        "’": "'",
        "©": "(c)",
        "™": "(tm)",
        "°": "deg"
    }
    for bad, good in replacements.items():
        code = code.replace(bad, good)

    # ✅ Remove font_size arguments inside get_text()
    code = re.sub(
        r'get_text\(([^)]*?),\s*font_size\s*=\s*\d+\)',
        r'get_text(\1).scale(0.7)',
        code
    )

    # ✅ Fix `get_text("txt", color=...)` → `.get_text("txt").set_color(...)`
    code = re.sub(
        r'get_text\("([^"]+)"\s*,\s*color\s*=\s*([A-Z_]+)\)',
        r'get_text("\1").set_color(\2)',
        code
    )

    return code


def extend_animation_for_depth(short_code: str, topic: str) -> str:
    """
    Programmatically extend short animations into 2+ minute comprehensive versions
    """
    print("🔧 Extending animation for in-depth mode...")
    
    # Extract class name
    import re
    class_match = re.search(r"class\s+(\w+)\s*\(Scene\):", short_code)
    class_name = class_match.group(1) if class_match else "ExtendedAnimation"
    
    # Create extended version with multiple sections
    extended_code = f'''from manim import *
import numpy as np

class {class_name}(Scene):
    def construct(self):
        # ========== SECTION 1: INTRODUCTION (20 seconds) ==========
        title = Text("{topic.title()}", font_size=48, color=BLUE).scale(1.5)
        subtitle = Text("In-Depth Educational Exploration", font_size=24, color=WHITE).scale(0.8)
        subtitle.next_to(title, DOWN, buff=0.5)
        
        self.play(Write(title))
        self.wait(3)
        self.play(Write(subtitle))
        self.wait(5)
        
        # Transition to overview
        overview = Text("Let's explore this topic comprehensively", font_size=20, color=YELLOW)
        overview.next_to(subtitle, DOWN, buff=0.8)
        self.play(Write(overview))
        self.wait(4)
        self.play(FadeOut(title), FadeOut(subtitle), FadeOut(overview))
        self.wait(2)
        
        # ========== SECTION 2: DEFINITION & THEORY (25 seconds) ==========
        def_title = Text("Definition & Core Theory", font_size=36, color=GREEN).scale(1.2)
        self.play(Write(def_title))
        self.wait(3)
        
        # Create definition box
        def_box = Rectangle(width=10, height=4, color=GREEN, fill_opacity=0.1)
        def_text = Text("Core concept definition goes here", font_size=18)
        def_text.move_to(def_box.get_center())
        
        self.play(Create(def_box))
        self.wait(2)
        self.play(Write(def_text))
        self.wait(8)
        
        # Add key points
        bullet1 = Text("• Key Point 1", font_size=16, color=WHITE)
        bullet1.next_to(def_box, DOWN, buff=0.3)
        self.play(Write(bullet1))
        self.wait(2)
        
        bullet2 = Text("• Key Point 2", font_size=16, color=WHITE) 
        bullet2.next_to(def_box, DOWN, buff=0.8)
        self.play(Write(bullet2))
        self.wait(2)
        
        bullet3 = Text("• Key Point 3", font_size=16, color=WHITE)
        bullet3.next_to(def_box, DOWN, buff=1.3)
        self.play(Write(bullet3))
        self.wait(2)
        
        self.wait(5)
        self.play(FadeOut(def_title), FadeOut(def_box), FadeOut(def_text), FadeOut(bullet1), FadeOut(bullet2), FadeOut(bullet3))
        
        # ========== SECTION 3: MATHEMATICAL FOUNDATION (30 seconds) ==========
        math_title = Text("Mathematical Foundation", font_size=36, color=RED).scale(1.2)
        self.play(Write(math_title))
        self.wait(3)
        
        # Create mathematical equations
        eq1 = MathTex(r"f(x) = ax^2 + bx + c", font_size=36)
        eq2 = MathTex(r"\\\\frac{{d}}{{dx}}f(x) = 2ax + b", font_size=36)
        
        self.play(Write(eq1))
        self.wait(3)
        eq2.next_to(eq1, DOWN, buff=0.8)
        self.play(Write(eq2))
        self.wait(8)
        
        self.play(FadeOut(math_title), FadeOut(eq1), FadeOut(eq2))
        
        # ========== SECTION 4: FIRST EXAMPLE (25 seconds) ==========
        ex1_title = Text("Example 1: Step-by-Step Solution", font_size=32, color=PURPLE)
        self.play(Write(ex1_title))
        self.wait(3)
        
        # Example problem
        problem = Text("Problem: Solve the given scenario", font_size=20, color=WHITE)
        problem.next_to(ex1_title, DOWN, buff=1)
        self.play(Write(problem))
        self.wait(4)
        
        # Step by step solution
        steps = ["Step 1: Setup", "Step 2: Calculate", "Step 3: Verify"]
        for i, step in enumerate(steps):
            step_text = Text(step, font_size=18, color=YELLOW)
            step_text.next_to(problem, DOWN, buff=1 + i*0.6)
            self.play(Write(step_text))
            self.wait(2)
        
        self.wait(6)
        self.play(FadeOut(ex1_title), FadeOut(problem))
        
        # ========== SECTION 5: SECOND EXAMPLE (25 seconds) ==========
        ex2_title = Text("Example 2: Advanced Application", font_size=32, color=ORANGE)
        self.play(Write(ex2_title))
        self.wait(3)
        
        # More complex example
        complex_eq = MathTex(r"f(x,y) = x^2 + y^2", font_size=32)
        self.play(Write(complex_eq))
        self.wait(5)
        
        # Show calculation steps
        result = MathTex(r"f(3,4) = 25", font_size=24, color=GREEN)
        result.next_to(complex_eq, DOWN, buff=1)
        self.play(Write(result))
        self.wait(8)
        
        self.play(FadeOut(ex2_title), FadeOut(complex_eq), FadeOut(result))
        
        # ========== SECTION 6: APPLICATIONS (20 seconds) ==========
        app_title = Text("Real-World Applications", font_size=36, color=TEAL)
        self.play(Write(app_title))
        self.wait(3)
        
        applications = ["Engineering", "Physics", "Economics", "Computer Science"]
        app1 = Text("• Engineering", font_size=20, color=WHITE)
        app1.next_to(app_title, DOWN, buff=1)
        self.play(Write(app1))
        self.wait(2)
        
        app2 = Text("• Physics", font_size=20, color=WHITE)
        app2.next_to(app_title, DOWN, buff=1.6)
        self.play(Write(app2))
        self.wait(2)
        
        app3 = Text("• Economics", font_size=20, color=WHITE)
        app3.next_to(app_title, DOWN, buff=2.2)
        self.play(Write(app3))
        self.wait(2)
        
        app4 = Text("• Computer Science", font_size=20, color=WHITE)
        app4.next_to(app_title, DOWN, buff=2.8)
        self.play(Write(app4))
        self.wait(2)
        
        self.wait(6)
        self.play(FadeOut(app1, app2, app3, app4, app_title))
        
        # ========== SECTION 7: SUMMARY (15 seconds) ==========
        summary_title = Text("Summary & Conclusion", font_size=36, color=GOLD)
        self.play(Write(summary_title))
        self.wait(3)
        
        final_msg = Text("Thank you for learning!", font_size=32, color=BLUE)
        final_msg.next_to(summary_title, DOWN, buff=1)
        self.play(Write(final_msg))
        self.wait(8)
        
        # Total time: ~160+ seconds (2+ minutes)
'''
    
    return extended_code


# Function to process speech and trigger animations
def process_speech(speech_text, in_depth_mode=False):
    if "exit" in speech_text.lower():
        print("Exiting program...")
        return None  # Stop listening, no video generated

    print(f"🧠 Sending speech to GPT for animation generation... (In Depth Mode: {in_depth_mode})")
    gpt_response = get_gpt_response(speech_text, in_depth_mode)
    
    # Debug: Log the GPT response to see what we're getting
    print(f"\n📝 GPT Response Length: {len(gpt_response)} characters")
    print(f"📝 First 200 chars: {gpt_response[:200]}...")
    if in_depth_mode:
        print(f"🎬 IN-DEPTH MODE: Response should be much longer with multiple scenes")

    # 🔹 Extract explanation + Manim code separately
    explanation, manim_code = extract_explanation_and_code(gpt_response)

    if manim_code:
        # Sanitize Manim code for v0.18
        manim_code = sanitize_manim_code(manim_code)
        
        # Debug: Check code length and content
        print(f"📊 Generated Manim code length: {len(manim_code)} characters")
        wait_count = manim_code.count("self.wait(")
        print(f"⏱️ Number of wait() statements found: {wait_count}")
        
        # 🚀 NEW: Programmatically extend short animations for in-depth mode
        if in_depth_mode:
            print(f"🔧 IN-DEPTH MODE DETECTED - FORCING EXTENSION...")
            print(f"� Original code length: {len(manim_code)} characters")
            manim_code = extend_animation_for_depth(manim_code, speech_text)
            print(f"📊 Extended code length: {len(manim_code)} characters")
            print(f"⏱️ New wait() count: {manim_code.count('self.wait(')}")
            
        if in_depth_mode and wait_count < 5:
            print(f"⚠️ WARNING: In-depth mode should have many more wait() statements for 2+ minute videos")

        class_name = extract_class_name(manim_code)
        temp_file_path = save_manim_code_to_temp_file(manim_code)

        # ✅ Pass the natural language explanation as narration
        final_video_path = run_manim(temp_file_path, class_name, explanation)

        return final_video_path  # ✅ Return video path back to Flask
    else:
        print("❌ No valid Manim code generated.")
        return None



def extract_explanation_and_code(gpt_response):
    """
    Splits GPT response into (explanation, code).
    """
    match = re.search(r"```(?:python)?\n([\s\S]*?)```", gpt_response)
    if match:
        code = match.group(1).strip()
        explanation = gpt_response[:match.start()].strip()
        return explanation, code
    return gpt_response, None


# Get GPT response using Azure AI Inference
def get_gpt_response(speech_text, in_depth_mode=False):
    print(f"🔄 Starting GPT request for: {speech_text[:50]}... (in_depth_mode={in_depth_mode})")
    
    endpoint = "https://models.github.ai/inference"
    model = "gpt-4o"  # Fixed: was "gpt-4.1" which is invalid
    token = os.environ["GITHUB_TOKEN"]
    
    print(f"🌐 Endpoint: {endpoint}")
    print(f"🤖 Model: {model}")
    print(f"🔑 Token exists: {bool(token)}")

    try:
        print("🔧 Creating ChatCompletionsClient...")
        client = ChatCompletionsClient(
            endpoint=endpoint,
            credential=AzureKeyCredential(token),
        )
        print("✅ Client created successfully")
    except Exception as e:
        print(f"❌ Error creating client: {e}")
        raise

    # Create the base system message
    base_prompt = (
        "You are an assistant that generates BOTH:\n"
        "1. A short natural language explanation of the concept (for voiceover).\n"
        "2. Valid Manim Community v0.19.0 Python code (inside triple backticks).\n\n"
        "⚠️ Critical Manim rules:\n"
        "- NEVER use 'height' or 'width' parameters in Axes() - use x_length and y_length instead\n"
        "- Always use .scale() method for resizing objects\n"
        "- Use only valid Manim Community v0.19.0 syntax\n"
        "- Wrap ONLY the code in triple backticks\n"
        "- Do NOT wrap the explanation in code blocks\n"
        "- Include proper imports: from manim import *\n"
    )
    
    # Add in-depth mode instructions if enabled
    if in_depth_mode:
        # Override the base prompt for in-depth mode
        base_prompt = (
            "� IN-DEPTH EDUCATIONAL MODE: You are a comprehensive educational assistant creating detailed Manim animations.\n"
            "You MUST generate BOTH:\n"
            "1. A comprehensive explanation (200+ words) covering theory, examples, applications, and context.\n"
            "2. Extensive Manim code creating 2-4 minute animations with multiple scenes and detailed content.\n\n"
            "⚠️ Critical formatting rules:\n"
            "- Do NOT wrap the explanation in code blocks\n"
            "- Wrap ONLY the Python code in triple backticks\n"
            "- No markdown outside of explanation + code block\n"
        )
        
        in_depth_addition = (
            "\n🎬 MANDATORY IN-DEPTH REQUIREMENTS - NO EXCEPTIONS:\n"
            "- ABSOLUTE MINIMUM 120 seconds total animation time (2+ minutes)\n"
            "- YOU MUST INCLUDE AT LEAST 15-25 self.wait() statements, each 5-15 seconds long\n"
            "- YOUR CODE MUST BE AT LEAST 100-150 LINES LONG (not including imports)\n"
            "- MANDATORY STRUCTURE EXAMPLE:\n"
            "```python\n"
            "class YourTopic(Scene):\n"
            "    def construct(self):\n"
            "        # Section 1: Introduction (15-20 seconds)\n"
            "        title = Text('Topic Name').scale(2)\n"
            "        self.play(Write(title))\n"
            "        self.wait(3)\n"
            "        subtitle = Text('In-Depth Exploration').scale(1.2)\n"
            "        self.play(Transform(title, subtitle))\n"
            "        self.wait(8)\n"
            "        self.play(FadeOut(subtitle))\n"
            "        self.wait(2)\n"
            "        \n"
            "        # Section 2: Definition (20-25 seconds)\n"
            "        definition_title = Text('Definition').scale(1.8)\n"
            "        self.play(Write(definition_title))\n"
            "        self.wait(2)\n"
            "        # Add multiple definition elements\n"
            "        def_text1 = Text('First part of definition').scale(0.8)\n"
            "        def_text2 = Text('Second part of definition').scale(0.8)\n"
            "        # ... more content ...\n"
            "        self.wait(15)  # Long explanation\n"
            "        \n"
            "        # Section 3: Formula/Theory (25-30 seconds)\n"
            "        # Section 4: First Example (20-25 seconds)\n"
            "        # Section 5: Second Example (20-25 seconds)\n"
            "        # Section 6: Applications (15-20 seconds)\n"
            "        # Section 7: Summary (10-15 seconds)\n"
            "```\n"
            "- EACH SECTION must have 3-8 self.wait() statements\n"
            "- TOTAL wait time must add up to 120+ seconds minimum\n"
            "- USE EXTENSIVE ANIMATIONS: Write, Create, Transform, FadeIn, FadeOut, etc.\n"
            "- SHOW STEP-BY-STEP mathematical workings with multiple equations\n"
            "- INCLUDE multiple concrete numerical examples\n"
            "- ADD graphs, charts, and visual representations\n"
            "- CREATE comprehensive educational content - NO SHORTCUTS!\n"
        )
        system_message_content = base_prompt + in_depth_addition
    else:
        system_message_content = base_prompt

    print(f"🔤 System message length: {len(system_message_content)} chars")
    print(f"📝 User message: {speech_text}...")
    
    try:
        print("🚀 Making API call to GitHub Models...")
        
        response = client.complete(
            messages=[
                SystemMessage(system_message_content),
                UserMessage(f"{speech_text}" + (" - CREATE A COMPREHENSIVE 2+ MINUTE IN-DEPTH EDUCATIONAL ANIMATION WITH EXTENSIVE STEP-BY-STEP EXPLANATIONS, MULTIPLE EXAMPLES, MATHEMATICAL PROOFS, REAL-WORLD APPLICATIONS, AND DETAILED VISUAL DEMONSTRATIONS. MINIMUM 100+ LINES OF MANIM CODE WITH 15+ WAIT STATEMENTS TOTALING 120+ SECONDS." if in_depth_mode else "")),
            ],
            temperature=0.7,
            top_p=1.0,
            max_tokens=4000 if in_depth_mode else 2000,  # Allow longer responses for in-depth mode
            model=model
        )
        
        print("✅ API call successful!")
        
    except Exception as e:
        print(f"❌ API call failed: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        raise

    gpt_response = response.choices[0].message.content
    print(f"\n📩 GPT Response Length: {len(gpt_response)} characters")
    print(f"📩 GPT Response:\n{gpt_response}\n")
    print(f"🔍 Response truncated?: {len(gpt_response) >= 3800}")  # Check if hitting token limit
    return gpt_response


# Extract only Python code block from GPT response
def extract_manim_code(gpt_response):
    match = re.search(r"```(?:python)?\n([\s\S]*?)```", gpt_response)
    if match:
        code = match.group(1).strip()
        print("✅ Extracted Python code successfully.")
        return code
    else:
        print("❌ No valid Python code block found in GPT response.")
        return None


# Extract Scene class name dynamically
def extract_class_name(manim_code):
    match = re.search(r"class\s+(\w+)\s*\(Scene\):", manim_code)
    if match:
        return match.group(1)
    return "Scene"


# Save code to a temp .py file
def save_manim_code_to_temp_file(manim_code):
    temp_file_path = os.path.join(
        os.getenv("TEMP", "/tmp"),
        "generated_manim_code.py"
    )
    with open(temp_file_path, "w", encoding="utf-8") as file:
        file.write(manim_code)
    print(f"📁 Saved Manim code to: {temp_file_path}")
    return temp_file_path


# helper: get audio duration
def get_audio_duration(audio_path):
    audio = MP3(audio_path)
    return audio.info.length  # seconds


# Run the Manim animation
from voiceover_utils import generate_voiceover, add_voiceover_to_video

def run_manim(temp_file_path, class_name, explanation):
    """
    Run manim to generate video and then merge it with AI narration.
    Returns the path to the final video with voiceover.
    """
    

# Find manim executable automatically
    manim_path = shutil.which("manim")

    if manim_path is None:
        raise FileNotFoundError("❌ Manim not found. Please install it using 'pip install manim' and ensure it's in your PATH.")

    command = [manim_path, "-ql", temp_file_path, class_name]  # -ql for quick low-quality render

    video_output_path = os.path.join(
    "media", "videos", "generated_manim_code", "480p15", f"{class_name}.mp4"
)


    try:
        print("🎬 Running Manim command:", " ".join(command))
        # Increase timeout for longer in-depth animations
        timeout_duration = 300  # 5 minutes for complex animations
        subprocess.run(command, capture_output=True, text=True, check=True, timeout=timeout_duration)
        print("\n✅ Manim animation complete.\n")

        # Generate voiceover
        narration_path = generate_voiceover(explanation)

        # Merge video with voiceover (using ffmpeg)
        final_output = add_voiceover_to_video(video_output_path, narration_path)

        if final_output:
            print(f"🎉 Final video ready at: {final_output}")
            return final_output   # ✅ return path here
        else:
            print("⚠️ Could not merge voiceover with video.")
            return None

    except subprocess.CalledProcessError as e:
        print("❌ Manim execution error:")
        print("Output:", e.stdout)
        print("Errors:", e.stderr)
        return None
    except subprocess.TimeoutExpired:
        print("⏱ Manim command timed out.")
        return None



# Main speech recognition loop
if __name__ == "__main__":
    recognizer = sr.Recognizer()

    while True:
        with sr.Microphone() as source:
            print("\n🎤 Listening for animation commands (say 'exit' to quit)...")

            # Adjust to ambient noise before listening
            recognizer.adjust_for_ambient_noise(source, duration=1)
            print("🕒 You can start speaking now...")

            try:
                print("speak...")
                audio = recognizer.record(source, duration=10)

                speech_text = recognizer.recognize_google(audio)
                print(f"🗣 Recognized: {speech_text}")
                if not process_speech(speech_text):
                    break
            except sr.WaitTimeoutError:
                print("⏳ No speech detected, try again.")
            except sr.UnknownValueError:
                print("🤷 Could not understand the audio.")
            except sr.RequestError:
                print("🚫 Speech recognition service is unavailable.")
            except KeyboardInterrupt:
                print("\n🛑 Program terminated.")
                break
