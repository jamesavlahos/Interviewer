import { useEffect, useRef, useState } from 'react';
import './App.css';

type ConnectionState = 'disconnected' | 'connecting' | 'connected';
type ConversationState = 'idle' | 'listening' | 'speaking' | 'thinking';

function App() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [conversationState, setConversationState] = useState<ConversationState>('idle');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize audio context
  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
    }
  };

  // Play audio chunk with crossfading to prevent clicks
  const playAudioChunk = async (audioData: Int16Array) => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const audioBuffer = audioContext.createBuffer(1, audioData.length, 24000);
    const channelData = audioBuffer.getChannelData(0);

    // Convert Int16 to Float32 with proper normalization
    for (let i = 0; i < audioData.length; i++) {
      channelData[i] = audioData[i] / 32768.0;
    }

    // Apply fade in/out to prevent clicks (3ms each)
    const fadeLength = Math.floor(24000 * 0.003); // 3ms at 24kHz = 72 samples
    for (let i = 0; i < fadeLength && i < audioData.length; i++) {
      // Fade in at the start
      channelData[i] *= i / fadeLength;
      // Fade out at the end
      const fadeOutIndex = audioData.length - 1 - i;
      if (fadeOutIndex >= 0 && fadeOutIndex < audioData.length) {
        channelData[fadeOutIndex] *= i / fadeLength;
      }
    }

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();

    // Wait for this chunk to finish before playing next
    return new Promise<void>((resolve) => {
      source.onended = () => resolve();
    });
  };

  // Process audio queue sequentially
  const processAudioQueue = async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    console.log('🔊 Starting audio playback, queue size:', audioQueueRef.current.length);
    isPlayingRef.current = true;
    setConversationState('speaking');

    // Play chunks sequentially, waiting for each to finish
    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift();
      if (chunk) {
        console.log('🔉 Playing chunk, length:', chunk.length);
        await playAudioChunk(chunk);
      }
    }

    console.log('✅ Audio playback complete');
    isPlayingRef.current = false;
    setConversationState('idle');
  };

  // Handle WebSocket messages from backend
  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Log ALL messages for debugging
      console.log('📨 Received:', data.type, data);

      switch (data.type) {
        case 'session.created':
        case 'session.updated':
          console.log('✅ Session configured');
          break;

        case 'response.audio.delta':
          if (data.delta) {
            console.log('🔊 Receiving audio chunk, length:', data.delta.length);
            // Decode base64 audio
            const audioData = Uint8Array.from(atob(data.delta), c => c.charCodeAt(0));
            const int16Array = new Int16Array(audioData.buffer);
            audioQueueRef.current.push(int16Array);
            console.log('📊 Audio queue length:', audioQueueRef.current.length);
            processAudioQueue();
          }
          break;

        case 'response.audio.done':
          console.log('✅ Response complete');
          break;

        case 'input_audio_buffer.speech_started':
          setConversationState('listening');
          console.log('🎤 User started speaking');
          break;

        case 'input_audio_buffer.speech_stopped':
          setConversationState('thinking');
          console.log('🤔 User stopped speaking');
          break;
          
        case 'response.audio_transcript.delta':
          console.log('📝 AI transcript:', data.delta);
          break;
          
        case 'response.done':
          console.log('✅ Full response done');
          break;

        case 'error':
          console.error('❌ Error from server:', data.error);
          break;

        default:
          console.log('📩 Received:', data.type);
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  };

  // Start call
  const startCall = async () => {
    try {
      setConnectionState('connecting');
      initAudioContext();

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Connect to backend WebSocket
      const ws = new WebSocket('ws://localhost:8000/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ Connected to server');
        setConnectionState('connected');
        
        // Wait a moment for session to be configured, then trigger first response
        setTimeout(() => {
          console.log('🚀 Requesting initial greeting from AI');
          ws.send(JSON.stringify({
            type: 'response.create',
            response: {
              modalities: ['text', 'audio']
            }
          }));
        }, 1000);
        
        // Start sending audio
        startAudioStreaming(stream, ws);
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        endCall();
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        endCall();
      };

    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not access microphone. Please grant permission and try again.');
      setConnectionState('disconnected');
    }
  };

  // Stream audio from microphone
  const startAudioStreaming = (stream: MediaStream, ws: WebSocket) => {
    const audioContext = new AudioContext({ sampleRate: 24000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const int16Data = new Int16Array(inputData.length);

      // Convert Float32 to Int16
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      // Send to backend
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(int16Data.buffer)));
      ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio
      }));
    };
  };

  // End call
  const endCall = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState('disconnected');
    setConversationState('idle');
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  return (
    <div className="app">
      <div className="container">
        {/* Interviewer Avatar */}
        <div className={`avatar ${conversationState}`}>
          <div className="avatar-circle">
            <img src="/interviewer-avatar-2.png" alt="Delphina Avatar" className="avatar-icon" />
          </div>
          <div className="pulse-ring"></div>
        </div>

        {/* Interviewer Name */}
        <h1 className="title">Hi, I'm Delphina!</h1>

        {/* Status Text */}
        <p className="status">
          {connectionState === 'disconnected' && '... and I want to get to know you!'}
          {connectionState === 'connecting' && 'Connecting...'}
          {connectionState === 'connected' && conversationState === 'idle' && 'Interview in progress'}
          {conversationState === 'listening' && 'Listening...'}
          {conversationState === 'thinking' && 'Thinking...'}
          {conversationState === 'speaking' && 'Speaking...'}
        </p>

        {/* Call Button */}
        <button
          className={`call-button ${connectionState}`}
          onClick={connectionState === 'disconnected' ? startCall : endCall}
          disabled={connectionState === 'connecting'}
        >
          {connectionState === 'disconnected' && 'Start Interview'}
          {connectionState === 'connecting' && 'Connecting...'}
          {connectionState === 'connected' && 'End Interview'}
        </button>
      </div>
    </div>
  );
}

export default App;
