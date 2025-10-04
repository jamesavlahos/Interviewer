# Virtual Biographer

A voice-based interview application that allows you to have natural conversations with an AI biographer who asks thoughtful questions about your life and experiences.

## Features

- 🎙️ Real-time speech-to-speech conversation
- 🤖 Powered by OpenAI's Realtime API (GPT-4o)
- 💬 Natural interruption handling
- 🎨 Clean, modern web interface
- 🔒 Secure relay server architecture

## Tech Stack

**Backend:**
- Python + FastAPI
- WebSocket relay server
- OpenAI Realtime API integration

**Frontend:**
- React + TypeScript
- Vite build tool
- Web Audio API

## Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API key with Realtime API access

### 1. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Open your browser to:** `http://localhost:5173`

## Usage

1. Click "Start Interview" to begin
2. Allow microphone access when prompted
3. Have a natural conversation with the Virtual Biographer
4. Click "End Interview" when done

## Project Structure

```
Interviewer/
├── backend/           # FastAPI relay server
│   ├── main.py       # Main server code
│   ├── requirements.txt
│   └── .env.example
├── frontend/          # React frontend
│   ├── src/
│   │   ├── App.tsx   # Main app component
│   │   ├── App.css   # Styles
│   │   └── main.tsx
│   └── package.json
└── README.md
```

## Development Roadmap

### Phase 1 (MVP) ✅
- Voice interface with call button
- OpenAI Realtime API integration
- Static hardcoded prompt
- Natural conversation flow

### Phase 2 (Coming Soon)
- Google Sheets prompt assembly
- Post-session LLM summarization
- Memory storage in Google Sheets

### Phase 3 (Future)
- Enhanced error handling
- Session history
- UI polish and refinements

## License

MIT
