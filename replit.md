# STS-helper - Swedish Sign Language Assistant

## Overview

STS-helper is a web-based Swedish Sign Language (Svenskt Teckenspråk) translation and learning tool that converts Swedish text into sign language video sequences. The application features a comprehensive local sign language dictionary, AI-powered text analysis (optional), and a user feedback collection system to improve translation quality.

**Core Purpose:** Help users learn and communicate in Swedish Sign Language by providing instant visual translations of Swedish text through video demonstrations.

**Key Features:**
- Text-to-sign-language video translation
- Local lexicon with 10,000+ signs (offline-first architecture)
- GLOSA (sign language gloss notation) generation
- User feedback collection for continuous improvement
- Dev mode with AI-powered enhancements (hidden by default)
- Responsive mobile-first design

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** Vanilla TypeScript with Vite build system
- No heavy framework dependencies (React/Vue/Angular)
- Direct DOM manipulation for performance
- TypeScript for type safety
- Modular architecture with clear separation of concerns

**Styling:** 
- CSS custom properties for theming (dark/light mode)
- Tailwind CSS via CDN for utility classes
- Responsive design with clamp-based fluid typography
- Mobile-first approach with safe area support for notched devices

**UI Components:**
- Modal system with focus management and accessibility
- Video grid with lazy loading via IntersectionObserver
- Dual-pane input layout (Swedish text + GLOSA output)
- Toast notifications for user feedback

### Core Application Flow

1. **Text Input → Tokenization → Sign Lookup → Video Display**
   - User enters Swedish text
   - Text is split into words/tokens
   - Each token is matched against local lexicon
   - Matching sign videos are displayed in grid

2. **GLOSA Translation (Offline-First)**
   - Converts Swedish text to sign language gloss notation
   - Uses local inflection rules and lemmatization
   - Applies sign language grammar rules (word order, filtering)
   - No AI required for basic functionality

### Data Management

**Local Lexicon Structure:**
- Split into multiple JSON files for progressive loading
- Fast search files (parts 1-6): Basic word-to-sign mappings
- Full detail files (parts 1-10): Complete with examples, videos, metadata
- IndexedDB caching for offline access
- Fallback to online Gist URLs if local files unavailable

**User Data Storage:**
- Browser localStorage for preferences and feedback
- IndexedDB for lexicon caching
- Optional cloud sync via Puter.js (currently disabled)

**Data Models:**
```typescript
Sign: { id: string, word: string }
WordMapEntry: { original, base, signs[], examples[], isWord, gloss }
FeedbackEntry: Thumbs up/down, sign changes, corrections
```

### Search & Matching Algorithm

**Local Search with Fallback:**
1. Check local lexicon map (O(1) lookup)
2. Try inflection rules for verb/adjective forms
3. Apply alias expansion (abbreviations, synonyms)
4. Levenshtein distance for fuzzy matching
5. Fallback to online lexicon if no local match

**Prioritization:**
- User-learned preferences stored and applied
- Frequency-based ranking from feedback data
- Context-aware sign selection

### AI Integration (Dev Mode Only)

**Status:** AI features hidden from regular users, activated via `?dev=hemlig` URL parameter

**AI Providers (Optional):**
- Anthropic Claude (via API)
- OpenAI GPT (via API)
- Google Gemini (via API)
- Groq (fast inference)
- Mistral AI

**AI Use Cases:**
- Enhanced GLOSA translation
- Text analysis and sentence generation
- Learning from user feedback
- Image-to-text extraction

**Quota Tracking:**
- Daily usage limits per API provider
- Visual quota indicators in dev mode
- Automatic fallback to offline mode when quotas exceeded

### Feedback Collection System

**Automatic Collection (Google Forms Integration):**
- Thumbs up/down on sign selections
- "Change sign" selections with reasons
- GLOSA corrections
- Sentence-level feedback
- Sends to: https://forms.gle/2Dfx9iAZY48EG7aZA

**Feedback Types:**
```typescript
PositiveFeedbackEntry: signId, cardId, reason, timestamp
NegativeFeedbackEntry: signId, originalSignId, changeReason, timestamp
SentenceFeedback: Swedish text, GLOSA corrections, comments
```

### Video Playback System

**Lazy Loading Strategy:**
- IntersectionObserver monitors viewport
- Videos load 100px before entering view
- Data-src attribute holds actual URL until needed
- Prevents bandwidth waste and improves performance

**Playback Features:**
- Sequential playback ("Play All" button)
- Individual sign video loops
- Sentence navigation (previous/next)
- Alphabet demonstration mode

### Dev Mode System

**Activation:** URL parameter `?dev=hemlig`
**Persistence:** Stored in localStorage
**Hidden Features:**
- AI toggle switch
- "Fråga AI" chat button
- GLOSA generation button
- Advanced debugging tools
- Quota displays

**Implementation:** `devModeService.ts` controls all visibility via CSS class toggles

### Accessibility Features

**Screen Reader Support:**
- ARIA labels on interactive elements
- Modal focus management
- Semantic HTML structure

**Keyboard Navigation:**
- Tab order optimization
- Focus visible styles
- Escape key closes modals

**Mobile Optimization:**
- Touch targets minimum 44x44px
- Safe area insets for notched devices
- Landscape/portrait responsive layouts
- Prevent iOS zoom on input focus (16px minimum font size)

## External Dependencies

### Third-Party Services

**Puter.js Cloud (Disabled)**
- Purpose: Free cloud storage for user data sync
- Status: Currently commented out in code
- Future: Will be re-enabled for cross-device sync

**Google Forms**
- Purpose: Feedback collection endpoint
- URL: https://forms.gle/2Dfx9iAZY48EG7aZA
- Data: User feedback, sign corrections, preferences

**AI API Providers (Dev Mode)**
- Anthropic Claude API
- OpenAI API
- Google Generative AI
- Groq API
- Mistral AI API
- Configuration: API keys via environment variables or dev mode endpoints

### NPM Dependencies

**Core:**
- `vite` - Build tool and dev server
- `typescript` - Type checking and compilation

**Libraries:**
- `react` + `react-dom` - UI component framework (minimal usage)
- `styled-components` - CSS-in-JS for components
- `openai` - OpenAI API client (dev mode)

**Dev Tools:**
- `@typescript-eslint/eslint-plugin` - Linting
- `@typescript-eslint/parser` - TypeScript parsing
- `@types/node` - Node.js type definitions

### Static Assets

**Video CDN:**
- Base URL pattern for sign videos
- Videos referenced by sign ID
- Hosted externally (not in repository)

**Lexicon Data:**
- Local JSON files in `/data/lexikon/offline/`
- Fallback Gist URLs for online access
- User data files in `/data/user/`

### Browser APIs

**Required:**
- Web Speech API (voice input)
- MediaRecorder API (video recording)
- IntersectionObserver (lazy loading)
- IndexedDB (offline storage)
- LocalStorage (preferences)

**Optional:**
- File API (image upload)
- Clipboard API (copy functionality)