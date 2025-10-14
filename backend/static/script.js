const recordBtn = document.getElementById("recordBtn");
const textBtn = document.getElementById("textBtn");
const textInput = document.getElementById("textInput");
let mediaRecorder;
let audioChunks = [];

// Text input handler
textBtn.addEventListener("click", async () => {
    const text = textInput.value.trim();
    if (!text) {
        alert("Please enter some text");
        return;
    }

    document.getElementById("status").innerText = "⏳ Generating animation...";

    try {
        const response = await fetch("/generate_audio", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ text: text })
        });

        const result = await response.json();
        console.log("API Response:", result); // Debug log

        if (result.success && (result.video_url || result.videoUrl)) {
            document.getElementById("status").innerText = "✅ Animation ready!";
            const video = document.getElementById("outputVideo");
            const videoUrl = result.video_url || result.videoUrl;
            video.src = videoUrl + "?t=" + new Date().getTime();
            video.style.display = "block";
            video.load(); // Force reload
        } else {
            document.getElementById("status").innerText = "❌ Error: " + (result.error || "Unknown error");
        }
    } catch (err) {
        console.error("Request failed:", err);
        document.getElementById("status").innerText = "🚫 Network error: " + err.message;
    }
});

recordBtn.addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        // Start recording
        audioChunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            const formData = new FormData();
            formData.append("audio", audioBlob, "speech.webm");

            document.getElementById("status").innerText = "⏳ Processing audio...";

            try {
                const response = await fetch("/generate_audio", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                console.log("API Response:", result); // Debug log

                if (result.success && (result.video_url || result.videoUrl)) {
                    document.getElementById("status").innerText = "✅ Animation ready!";
                    const video = document.getElementById("outputVideo");
                    const videoUrl = result.video_url || result.videoUrl;
                    video.src = videoUrl + "?t=" + new Date().getTime();
                    video.style.display = "block";
                    video.load(); // Force reload
                } else {
                    document.getElementById("status").innerText = "❌ Error: " + (result.error || "Unknown error");
                }
            } catch (err) {
                console.error("Request failed:", err);
                document.getElementById("status").innerText = "🚫 Network error: " + err.message;
            }
        };

        mediaRecorder.start();
        recordBtn.innerText = "⏹ Stop Recording";
    } else {
        // Stop recording
        mediaRecorder.stop();
        recordBtn.innerText = "🎤 Record & Generate Animation";
    }
});
