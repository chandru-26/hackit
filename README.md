# Interview-bot (trimmed)

This workspace contains the trimmed Interview Bot: only the Landing page, Start Demo, and the Anam avatar (Agent) remain. Non-Anam routes and UI components were removed or stubbed.

Quick start (development):

1. Backend

```powershell
cd backend
npm install
# Provide ANAM_API_KEY in environment or .env (do not commit .env)
$env:ANAM_API_KEY = 'your_anam_api_key_here'
npm run start
```

2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

3. Notes
- Do not commit `.env` files or API keys. Use the project root `.gitignore` to avoid accidental commits.
- If you need the removed features later, restore them from git history.
# Interview Bot

A ready-to-run voice interview/feedback workflow using OpenAI (for question generation and evaluation) and ElevenLabs (for TTS). Monorepo with Node/Express backend and React/Vite/Tailwind frontend.

## Features
- Role-specific question generation
- Answer evaluation with score/feedback
- ElevenLabs TTS endpoint (high-quality audio)
- Multi-round interview loop
- React + Tailwind UI with voice-to-voice flow

## Quick Start

1. **Clone repo and install dependencies**

   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

2. **Configure API keys**

   - Copy `backend/.env.example` to `backend/.env` and fill in your OpenAI and ElevenLabs keys.

3. **Run backend**

   ```bash
   cd backend
   npm run dev
   ```

4. **Run frontend**

   ```bash
   cd frontend
   npm run dev
   ```

5. **Open** the frontend URL (usually http://localhost:5173). Backend runs on http://127.0.0.1:8001.

## Notes
- **ElevenLabs voice ID**: Check your ElevenLabs dashboard for the correct voice id string (e.g. `alloy`, `elisabeth`, or a UUID).
- **OpenAI model**: Change `model` string in backend code if you have access to different models.
- **No ElevenLabs?**: You can use browser `speechSynthesis` instead of `/api/tts`.
- **Security**: API keys are stored server-side only.
