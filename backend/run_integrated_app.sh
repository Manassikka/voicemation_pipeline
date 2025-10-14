#!/bin/bash

echo "🚀 Starting Voicemation Integrated App"
echo "======================================"

# Start Flask backend in background
echo "📡 Starting Flask backend on http://localhost:5000"
cd /Users/manavmaharishi/Downloads/voicemation_pipeline
python app.py &
FLASK_PID=$!

# Wait a moment for Flask to start
sleep 3

# Start React frontend
echo "⚛️  Starting React frontend on http://localhost:5173"
cd /Users/manavmaharishi/Downloads/voicemation_pipeline/Voicemation/voicemation
npm run dev &
REACT_PID=$!

echo ""
echo "✅ Both services are running:"
echo "   - Flask Backend: http://localhost:5000"
echo "   - React Frontend: http://localhost:5173"
echo ""
echo "🎤 Open http://localhost:5173 in your browser to use the voice-to-animation feature"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user to stop services
wait $REACT_PID $FLASK_PID

# Cleanup
echo "🛑 Stopping services..."
kill $FLASK_PID 2>/dev/null
kill $REACT_PID 2>/dev/null
echo "✅ Services stopped"
