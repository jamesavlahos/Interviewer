"""
Virtual Biographer Interviewer - Backend Relay Server
Connects frontend to OpenAI Realtime API via WebSocket
"""

import os
import json
import asyncio
import base64
from typing import Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import aiohttp
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Virtual Biographer API")

# Configure CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
REALTIME_MODEL = os.getenv("REALTIME_MODEL", "gpt-4o-realtime-preview-2024-10-01")
VOICE = os.getenv("VOICE", "alloy")

# Interviewer System Prompt (hardcoded for MVP)
INTERVIEWER_PROMPT = """You are a warm, empathetic virtual biographer conducting a life story interview. 

Your role is to:
- Ask thoughtful questions about the person's life experiences, memories, and stories
- Listen actively and show genuine interest in their responses
- Follow up on interesting details they mention
- Create a natural, comfortable conversation flow
- Be curious but respectful, never pushy
- Help them share stories they might not have thought about in years

Start by warmly greeting the person and asking them to share a bit about where they grew up or an early childhood memory. Let the conversation flow naturally from there.

Keep your responses conversational and brief - this is a dialogue, not a monologue."""


class RealtimeSession:
    """Manages a single Realtime API session"""
    
    def __init__(self, client_ws: WebSocket):
        self.client_ws = client_ws
        self.openai_ws: Optional[aiohttp.ClientWebSocketResponse] = None
        self.session_active = False
        
    async def connect_to_openai(self):
        """Establish WebSocket connection to OpenAI Realtime API"""
        url = f"wss://api.openai.com/v1/realtime?model={REALTIME_MODEL}"
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "OpenAI-Beta": "realtime=v1"
        }
        
        session = aiohttp.ClientSession()
        try:
            self.openai_ws = await session.ws_connect(url, headers=headers)
            logger.info("Connected to OpenAI Realtime API")
            return session
        except Exception as e:
            logger.error(f"Failed to connect to OpenAI: {e}")
            await session.close()
            raise
    
    async def configure_session(self):
        """Send session configuration to OpenAI"""
        config = {
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": INTERVIEWER_PROMPT,
                "voice": VOICE,
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "input_audio_transcription": {
                    "model": "whisper-1"
                },
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 500
                }
            }
        }
        await self.openai_ws.send_json(config)
        logger.info("Session configured")
    
    async def forward_client_to_openai(self):
        """Forward messages from frontend client to OpenAI"""
        try:
            while self.session_active:
                message = await self.client_ws.receive_text()
                data = json.loads(message)
                
                # Forward to OpenAI
                await self.openai_ws.send_json(data)
                logger.debug(f"Client -> OpenAI: {data.get('type', 'unknown')}")
                
        except WebSocketDisconnect:
            logger.info("Client disconnected")
            self.session_active = False
        except Exception as e:
            logger.error(f"Error forwarding client message: {e}")
            self.session_active = False
    
    async def forward_openai_to_client(self):
        """Forward messages from OpenAI to frontend client"""
        try:
            async for msg in self.openai_ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    
                    # Forward to client
                    await self.client_ws.send_text(msg.data)
                    logger.debug(f"OpenAI -> Client: {data.get('type', 'unknown')}")
                    
                elif msg.type == aiohttp.WSMsgType.ERROR:
                    logger.error(f"OpenAI WebSocket error: {self.openai_ws.exception()}")
                    break
                    
        except Exception as e:
            logger.error(f"Error forwarding OpenAI message: {e}")
        finally:
            self.session_active = False
    
    async def start(self):
        """Start the relay session"""
        session = None
        try:
            # Connect to OpenAI
            session = await self.connect_to_openai()
            
            # Configure the session
            await self.configure_session()
            
            # Start bidirectional forwarding
            self.session_active = True
            await asyncio.gather(
                self.forward_client_to_openai(),
                self.forward_openai_to_client()
            )
            
        except Exception as e:
            logger.error(f"Session error: {e}")
            await self.client_ws.send_json({
                "type": "error",
                "error": str(e)
            })
        finally:
            # Cleanup
            if self.openai_ws:
                await self.openai_ws.close()
            if session:
                await session.close()
            logger.info("Session ended")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Virtual Biographer API",
        "version": "1.0.0"
    }


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for frontend connections"""
    await websocket.accept()
    logger.info("New client connected")
    
    # Create and start relay session
    session = RealtimeSession(websocket)
    await session.start()


if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("HOST", "localhost")
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"Starting Virtual Biographer API on {host}:{port}")
    uvicorn.run(app, host=host, port=port)
