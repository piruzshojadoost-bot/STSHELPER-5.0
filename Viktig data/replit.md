# STS-helper (BETA) - Svenskt Teckenspråkslexikon med AI

## Overview

STS-helper is a Swedish Sign Language (Svenskt Teckenspråk) assistant application that translates Swedish text into sign language videos. It integrates a comprehensive local sign language dictionary with AI-powered translation for generating GLOSA (sign language notation). The application aims to provide a robust, offline-capable solution for learning and understanding Swedish Sign Language, featuring interactive tools, grammar-aware processing, and a feedback system.

## User Preferences

- Preferred communication style: Simple, everyday language.
- Work style: Autonomous, make assumptions, don't ask questions.
- Workflow: User states task → TASK_CONTEXT.md → PLAN.md → work → delete PLAN.md → "Jobbet är slutfört"

## Recent Changes (December 2025)

- **Dev Mode System**: All AI/developer features are hidden from regular users
  - AI toggle, "Fråga AI" button, and Glosa button disabled by default
  - Secret URL parameter `?dev=hemlig` activates dev mode
  - Dev mode persists in localStorage until manually disabled
  - `src/services/system/devModeService.ts` controls all visibility
- **Puter.js Disabled**: Temporarily disabled (scripts commented out), will be re-enabled later
- **User-Friendly Interface**: App now shows only essential features (Sök, Feedback)
- **Automatic Feedback Collection**: FeedbackCollector module automatically gathers:
  - Thumbs up/down on signs
  - Sign change selections ("Ändra tecken")
  - GLOSA corrections
  - Sentence-level feedback
  - Sends to Google Forms: https://forms.gle/2Dfx9iAZY48EG7aZA
- **Puter Cloud Sync** (DISABLED): Automatic cloud synchronization of all user data via Puter.js KV (100% free):
  - GLOSA-korrigeringar (AI Learning)
  - Tumme upp/ner feedback
  - "Ändra tecken" val
  - Meningsfeedback
  - Inlärda preferenser
  - Data laddas automatiskt vid start och synkas debounced (2 sek) efter ändringar
- **Meta Learning**: Varje AI-anrop sparas automatiskt för att förbättra offline-motorn
- **Dual-Pane GLOSA Layout**: New side-by-side layout separates Swedish input from GLOSA output. Original text preserved, GLOSA shown in dedicated panel with status indicator (AI/Offline). Responsive: stacked on mobile, side-by-side on desktop.
- **Clickable Word Styling**: Removed bright gradient colors from clickable words - now uses neutral text with subtle dotted underline for better readability
- **GLOSA Punctuation Handling**: Extended punctuation preservation to support all common delimiters (commas, periods, exclamation marks, question marks, semicolons, colons, dashes, parentheses, brackets) - uses proportional mapping to preserve position relative to GLOSA output
- **Responsive Design Overhaul**: Implemented comprehensive CSS custom properties system with clamp-based tokens for typography, spacing, and components
- **Alphabet Modal Fix**: Display all 29 letters in compact grid (5 columns mobile, 6 tablet, auto-fit desktop) with direct video loading for thumbnails
- **Layout Refactoring**: Replaced conflicting Tailwind classes with custom CSS classes (.header-inner, .header-container, .main-container, .action-buttons-grid, .input-action-btn)
- **Safe Area Support**: Added CSS environment variables for mobile OS navigation bars

## Current Features

- **Search Button:** Tokenizes input text → finds sign candidates → displays videos with Swedish text
- **GLOSA Button:** Translates text to GLOSA using AI → tokenizes → finds sign candidates → displays videos with GLOSA words
- Both buttons use identical video lookup and display process

## System Architecture

### Frontend

- **Framework:** Vanilla TypeScript with minimal React usage.
- **Build Tool:** Vite 7.2.0.
- **Styling:** TailwindCSS (CDN) with custom CSS variables, adhering to Material Design principles.
- **UI/UX:** Glassmorphism theme ("Midnight Aurora" palette), accessibility-first (ARIA, keyboard navigation), responsive design (mobile-first).
- **Core Patterns:** Module-based organization (`modules/`), component-driven UI (`components/`), service layer, centralized state management (`src/state.ts`), and event-driven interactions.

### Data Storage & Caching

- **Primary Storage:** IndexedDB (`TeckensprakslexikonDB v6`) for offline lexicon and user data (`lexicon`, `userData`).
- **Configuration Storage:** LocalStorage for user preferences, AI quota, and a temporary AI learning cache.
- **Data Loading:** Prioritizes local JSON files (`/data/lexikon/offline/snabb/` and `/data/lexikon/offline/full/`), with online fallback to GitHub Gist URLs.

### Sign Language Processing

- **Text Analysis:** Input normalization, local lexicon search (exact, inflection, alias, suffix, fuzzy matching), with AI fallback via Puter.js.
- **GLOSA Translation:** Offline engine uses `data/grammar-rules.json` and `data/word-filters.json` for grammar transformations (e.g., TOPIC-COMMENT structure, verb directionality, non-manual signals). Integrates AI learning for progressive improvement.
- **Linguistic Features:** Handles homonyms, verb directionality, and temporal expressions through a context-aware question system.

### AI Integration

- **Strategy:** Multi-provider approach via Puter.js for 100% free user access, abstracting API keys.
- **Model Selection:** Specific AI models (e.g., GPT-5.1, Claude Opus 4.5, Gemini 2.5 Pro) are chosen based on task (GLOSA translation, sentence generation, image analysis, summarization).
- **Learning System:** An `aiLearningSystem` caches successful AI translations (max 1000 entries, LRU) to enhance the offline engine.

### Video Playback

- **Source:** Swedish Sign Language Lexicon (`https://www.svensktteckensprak.se/ordbok/`).
- **Features:** Sequential playback, video grid, alphabet player, standard video controls, lazy loading via Intersection Observer.

### Modals & Navigation

- **System:** Centralized modal management (`ModalSystem.ts`) with focus trapping, accessibility features (ARIA, keyboard navigation), and stack management.
- **Key Modals:** Sign details, AI chat, alphabet player, feedback, settings.

### User Feedback & Learning

- **Feedback:** Allows users to provide positive/negative feedback, suggest alternative signs, and rate overall translation quality.
- **Learning Data:** Stores learned preferences, custom signs, homonym clarifications, and AI-generated feedback summaries locally in IndexedDB. Data is privacy-focused, stored only client-side, with export/import functionality.

### Search vs GLOSA Process (Data & Link Creation)

**IDENTICAL PROCESS for both Search and GLOSA buttons:**

**Complete Flow:**
1. Tokenize input text (same regex: `/([,."!?\n\s]+)/g`)
2. Call `findCandidatesForToken(token)` for each token (identical search in `localLexiconMap`)
3. Retrieve unique sign IDs from lexicon: `signs[].id` (same ID format)
4. Create `WordMapEntry` with `signs` array (identical structure)
5. Store in `appState.wordMap` (identical data model)
6. Call `renderCurrentSentence()` → `populateVideoGrid()` → creates video cards with `buildVideoUrl()`

**Difference:**
- **Search:** Shows original Swedish text in video cards
- **GLOSA:** Shows GLOSA words first via `renderGlossesOnly()`, then video cards below

**Data Flow is Identical** → unique numbers retrieved the same way, link creation uses same functions, both use `populateVideoGrid()` for video card generation.

### Search & Discovery

- **Algorithm:** Prioritizes exact, inflection, alias, suffix, and fuzzy matching in the local lexicon, with an AI fallback.
- **Cache:** LRU cache for search results to improve performance.
- **Lexicon Structure:** Optimized maps for fast lookups by word and ID.

## DETAILED COMPARISON: SEARCH vs GLOSA BUTTONS

### 1. Text Processing Flow

**Search Button:**
- Takes original text directly from input field
- Tokenizes → Searches lexicon → Displays results

**GLOSA Button:**
- Takes original text from input field
- Sends to AI (`translateToGlosa`) for GLOSA translation
- Extracts punctuation marks from original text
- Combines GLOSA words + original punctuation
- THEN searches lexicon with combined text

### 2. Sentence Management

**Search Button:**
- Runs `splitTextIntoSentences()` to divide text into multiple sentences
- Can create **MULTIPLE sentences** from input
- Sentence navigation (previous/next) fully functional with all sentences

**GLOSA Button:**
- Sets `appState.sentences = [glosaWordMap]` 
- Always creates **EXACTLY ONE "sentence"** regardless of input
- Sentence navigation buttons are effectively inactive (only 1 sentence exists)

### 3. Background Processing

**Search Button:**
- ✅ Runs `enrichWordMapDataInBackground()`
  - Fetches examples, related information, contextual data
  - Enriches data for each word
  - Enhances user experience with additional context

**GLOSA Button:**
- ❌ Does **NOT** run background enrichment
  - Words receive minimal contextual data
  - No automatic data enrichment process

### 4. Display Format

**Search Button:**
- Shows original Swedish text in input field
- Clickable words are original word forms
- User sees their original input

**GLOSA Button:**
- **NEW Dual-Pane Layout:** Original Swedish text preserved in left pane
- GLOSA translation shown in dedicated right pane (cyan border, status indicator)
- Status indicator shows "AI" or "Offline" depending on translation source
- Runs `renderGlossesOnly()` to display GLOSA tokens above video grid
- Clickable words are GLOSA-translated terms

### 5. Video Controls Display

**Both Buttons:**
- Display identical video control elements (previous sentence, next sentence, show all, play all)
- Same video grid interface

**Limitation:** Since GLOSA only creates 1 sentence, previous/next navigation buttons remain inactive/non-functional

### 6. Feedback & Modal Features

**Search Button:**
- ❌ No dedicated feedback modal
- Word info displayed inline

**GLOSA Button:**
- ✅ `glosaFeedbackModal` - Users can:
  - View AI-generated GLOSA translation
  - Write their own GLOSA version
  - Provide feedback comparing Swedish → AI GLOSA → their GLOSA
  - Copy feedback for reference/analysis

### 7. Button UI/UX Status

**Search Button:**
- Always clickable when text present
- No disabled state during processing

**GLOSA Button:**
- `glosaBtn.disabled = true` during AI processing
- Shows visual feedback (disabled state) while translating
- Re-enabled when translation completes

---

## Impact Matrix: How Each Button Affects Other Functions

| Function | Affected by Search | Affected by GLOSA |
|----------|-------------------|------------------|
| `enrichWordMapDataInBackground()` | ✅ YES (always runs) | ❌ NO (never runs) |
| `splitTextIntoSentences()` | ✅ YES (creates multiple) | ❌ NO (bypassed) |
| `renderGlossesOnly()` | ❌ NO | ✅ YES (renders GLOSA) |
| Sentence Navigation | ✅ Fully functional | ⚠️ Locked to 1 sentence |
| "Show All" Button | ✅ Shows multiple sentences | ⚠️ Only 1 sentence total |
| Word Click Interaction | ✅ Full functionality | ✅ Full functionality |
| Video Display | ✅ Original Swedish text | ✅ GLOSA text overlay |
| Word Data Enrichment | ✅ Rich context data | ⚠️ Minimal data |
| AI Processing Time | ❌ None (local only) | ✅ Requires AI translation |

---

## Known Limitations

- **GLOSA single-sentence limitation:** GLOSA always treats entire input as one sentence, preventing proper multi-sentence navigation
- **No background enrichment for GLOSA:** GLOSA-translated words don't receive contextual data enrichment like Search does
- **Punctuation preservation:** GLOSA successfully preserves punctuation from original text since Dec 2 update

## External Dependencies

### Third-Party APIs

- **Puter.js:** Primary AI aggregator, providing access to models like GPT-5.1, Claude Opus 4.5, Gemini 2.5 Pro, DeepSeek R1.
- **Direct AI APIs (Legacy/Fallback):** Anthropic Claude, OpenAI GPT, Groq, Mistral, Google GenAI (accessed via environment variables).

### External Resources

- **Swedish Sign Language Lexicon:** `https://www.svensktteckensprak.se/ordbok/` (video source, lexicon content).
- **KORPUS (Swedish Sign Language Corpus):** `https://teckensprakskorpus.su.se/` (external links for contextual examples).

### Build & Development Tools

- **Vite 7.2.0:** Dev server, custom middleware for API key exposure, ES2022 build target.
- **TypeScript 5.9:** With `bundler` module resolution and experimental decorators.
- **TailwindCSS:** CDN delivery, custom theming via CSS variables.

### Fonts & Icons

- **Google Fonts:** Inter (primary UI font).
- **SVG Icons:** Inline SVG icons, Heroicons style.

### Browser APIs

- **Web Speech API:** SpeechRecognition for voice input (Swedish).
- **MediaRecorder API:** For recording video suggestions.
- **IndexedDB:** Persistent data storage.
- **IntersectionObserver:** For lazy loading and performance optimization.

### Data Files (Bundled)

- `/data/lexikon/offline/`: Local JSON lexicon parts (snabb and full).
- `/data/grammar-rules.json`: Grammar rules for GLOSA translation.
- `/data/word-filters.json`: Stopwords and priority words.
- `/data/linguistic-questions.json`: Context-aware prompts.
- `/data/user/`: Templates for aliases, inflections, learning data, and synonyms.
