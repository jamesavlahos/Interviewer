# Setup Guide - Virtual Biographer

This guide will walk you through setting up and running the Virtual Biographer application.

## Phase 1 MVP Complete! ✅

You now have:
- ✅ Backend FastAPI relay server
- ✅ Frontend React + TypeScript interface
- ✅ Real-time voice conversation
- ✅ OpenAI Realtime API integration
- ✅ Clean UI with visual feedback

## Next Steps to Run

### Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (you'll need it in the next step)

**Note:** You need access to the Realtime API (GPT-4o realtime preview). This may require:
- A paid OpenAI account
- Access to the beta Realtime API

### Step 2: Configure Backend

```bash
cd /Users/jamesvlahos/Desktop/Code/Interviewer/backend
```

Edit the `.env` file and add your API key:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Step 3: Install Backend Dependencies

```bash
# Make sure you're in the backend directory
cd /Users/jamesvlahos/Desktop/Code/Interviewer/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 4: Install Frontend Dependencies

Open a new terminal tab/window:

```bash
cd /Users/jamesvlahos/Desktop/Code/Interviewer/frontend

# Install dependencies
npm install
```

### Step 5: Run the Application

**Terminal 1 - Start Backend:**
```bash
cd /Users/jamesvlahos/Desktop/Code/Interviewer/backend
source venv/bin/activate
python main.py
```

You should see:
```
INFO:     Started server process
INFO:     Uvicorn running on http://localhost:8000
```

**Terminal 2 - Start Frontend:**
```bash
cd /Users/jamesvlahos/Desktop/Code/Interviewer/frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Step 6: Test the Application

1. Open your browser to http://localhost:5173
2. You should see the Virtual Biographer interface
3. Click "Start Interview"
4. Allow microphone access when prompted
5. The interviewer will greet you and start the conversation!

## Troubleshooting

### Backend Issues

**"Module not found" errors:**
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

**"OpenAI API key not found":**
- Make sure you edited `backend/.env` and added your key
- Make sure the key starts with `sk-`

**"Port 8000 already in use":**
- Change PORT in `.env` to a different number like 8001
- Update the WebSocket URL in `frontend/src/App.tsx` to match

### Frontend Issues

**"npm: command not found":**
- Install Node.js from https://nodejs.org

**"Cannot connect to WebSocket":**
- Make sure the backend is running on port 8000
- Check browser console for error messages

**Microphone not working:**
- Check browser permissions (click lock icon in address bar)
- Make sure no other application is using your microphone
- Try in Chrome/Edge (best Web Audio API support)

### OpenAI API Issues

**"Invalid API key":**
- Verify your key is correct in `backend/.env`
- Make sure there are no extra spaces

**"Model not found":**
- You may not have access to the Realtime API yet
- Contact OpenAI support to request access

**High costs warning:**
- Realtime API is priced per minute of audio
- Monitor your usage at https://platform.openai.com/usage

## What's Next?

### Customizing the Interviewer

Edit `backend/main.py` and modify the `INTERVIEWER_PROMPT` variable (around line 53) to change:
- The interviewer's personality
- The types of questions asked
- The conversation style

### Phase 2 Features (Coming Soon)

- Google Sheets integration for dynamic prompts
- Post-session summarization
- Memory storage

## Testing Tips

1. **Test conversation flow:**
   - Say "Hello" and wait for response
   - Try interrupting the AI while it's speaking
   - Test with different question types

2. **Test audio quality:**
   - Use headphones to avoid echo/feedback
   - Speak clearly at normal volume
   - Check the status indicator changes

3. **Monitor costs:**
   - Keep sessions short during testing
   - Check OpenAI dashboard regularly
   - Set usage limits in OpenAI settings

## Success Indicators

✅ Backend shows "Connected to OpenAI Realtime API" in logs
✅ Frontend status changes to "Listening..." when you speak
✅ Avatar pulses when AI is speaking
✅ Natural conversation flow with minimal latency

## Need Help?

Check the logs in both terminal windows for error messages. Most issues are related to:
1. Missing OpenAI API key
2. API access permissions
3. Microphone permissions
4. Port conflicts

Enjoy your Virtual Biographer! 🎙️
