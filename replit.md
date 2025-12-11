# STSHELPER

## Overview
STSHELPER is a Swedish Sign Language (Svenskt teckenspråk) helper application. It provides tools for translating Swedish text to sign language glosses, searching for signs, and viewing sign language videos.

## Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Styled Components + CSS + Tailwind (via CDN)
- **Runtime**: Node.js 20

## Project Structure
```
├── src/
│   ├── components/     # React components (GlosaSearch, VideoGrid, etc.)
│   ├── hooks/          # Custom React hooks (useAI, useLexicon, etc.)
│   ├── modules/        # Feature modules (search, glossing, etc.)
│   ├── services/       # Service layer (lexicon, video, notifications)
│   ├── styles/         # CSS stylesheets
│   └── App.tsx         # Main application component
├── public/
│   └── data/           # Lexicon data and user data files
├── data/               # Application data (glossing rules, filters)
└── index.html          # Entry point
```

## Key Features
- Text-to-gloss translation for Swedish Sign Language
- Sign search and video playback
- Offline lexicon support with multiple data files
- AI-powered features (requires API keys)
- Speech recognition support

## Development
```bash
npm run dev       # Start development server on port 5000
npm run build     # Build for production
npm run preview   # Preview production build
```

## API Keys (Optional)
The app supports various AI providers through environment variables:
- `ANTHROPIC_API_KEY`
- `GOOGLE_GENAI_API_KEY`
- `OPENAI_API_KEY`
- `GROQ_API_KEY`
- `MISTRAL_API_KEY`

## Deployment
Configured for Replit autoscale deployment:
- Build: `npm run build`
- Run: `npm run preview`
