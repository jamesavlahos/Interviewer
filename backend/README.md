# Virtual Biographer - Backend

FastAPI relay server that connects the frontend to OpenAI's Realtime API.

## Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Run the server:**
   ```bash
   python main.py
   ```

Server will start on `http://localhost:8000`

## API Endpoints

- `GET /` - Health check
- `WebSocket /ws` - WebSocket connection for Realtime API relay

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `HOST` - Server host (default: localhost)
- `PORT` - Server port (default: 8000)
- `REALTIME_MODEL` - OpenAI model to use (default: gpt-4o-realtime-preview-2024-10-01)
- `VOICE` - Voice for responses (default: alloy, options: alloy, echo, shimmer)
