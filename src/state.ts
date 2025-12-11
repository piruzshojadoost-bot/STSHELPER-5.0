
import { AppState, FeedbackEntry, PositiveFeedbackEntry, NegativeFeedbackEntry, Sign, WordMapEntry, ChatHistoryMessage, LexiconMetadata, LearningData } from './types';

// --- APP STATE ---
export const appState: AppState = {
    ai: null,
    isClickableMode: true, // Default to true as the app's main function is analysis
    wordMap: [],
    sentences: [],
    currentSentenceIndex: 0,
    currentGrammarSentenceIndex: 0, // New
    aiTranslatedSentences: new Map(), // New
    isShowingAllSentences: false,
    isPlayingAll: false,
    isAccessibilityModeActive: false,
    isListening: false,
    recognition: null,
    activeModalOpener: null,
    latestReportContent: null,
    latestFeedbackJson: "",
    latestReportSummary: null, // NEW
    modalContexts: {
        signDetailsCardId: null,
        signDetailsPhrase: null,
        signDetailsContext: null,
        changeReason: null,
        thumbDownReason: null,
        goodChoiceReason: null,
        sentenceFeedback: null,
        suggestion: null,
        sendSuggestion: null,
        improveSign: null,
    },
    mediaState: {
        mediaRecorder: null,
        recordedBlobs: [],
        timerInterval: null,
        tempVideoBlob: null,
        mediaStream: null,
    },
    videoSuggestions: [],
    videoObserver: null,
    alphabetObserver: null,
    combinationSelection: [],
    selection: [],
    multiSelectMode: false,
    selectedCardIds: new Set<string>(),
    chat: null,
    chatHistory: [],
    chatFile: null,
    cardIdDataMap: new Map(),
    latestAnalysisResult: null,
    linguisticQuestions: [],
    shownQuestionKeys: new Set(),
    pendingLinguisticQuestion: null,
    abortController: null,
    lexiconMetadata: null,
    loadedLexiconParts: new Set<number>(),
    onlineLearningData: null,
    localLexiconReady: false,
    fullLexiconLoaded: false,
    localLexiconProgress: 0,
    onlineLexiconProgress: 0,
    changeSignMode: 'main', // New
    aiEnabled: localStorage.getItem('aiEnabled') === 'true', // Default: AV (användaren måste aktivera)
    usePuter: false, // Puter.js integration flag
    aiReady: true, // AI system with API keys ready
    glosaEnabled: localStorage.getItem('glosaEnabled') === 'true' || false, // BETA feature toggle
    // Available API Keys (via environment variables)
    // HUGGINGFACE_TOKEN, GOOGLE_AI_STUDIO_KEY, MISTRAL_API_KEY, DEEPAI_KEY, OLLAMA_KEY, LAOZHANG_API_KEY
};

// --- LEXICON DATA STATE ---
export const localLexiconMap = new Map<string, Sign[]>();
export const idToWordMap = new Map<string, string>();
export const alphabetSignsMap = new Map<string, Sign[]>();
export let searchableLexicon: string[] = [];
export let latestSignsFromLexicon: { word: string; id: string }[] = [];
export const homonymMap = new Map<string, Map<string, Sign>>();
export const aliasMap = new Map<string, string>();
export const fullLexiconMap = new Map<string, any[]>();
export const inflectionMap = new Map<string, string>();
// Swedish inflection mappings (ordform -> lemma)
// Definite singular forms (with article)
inflectionMap.set('himlen', 'himmel');
inflectionMap.set('året', 'år');
inflectionMap.set('dagen', 'dag');
inflectionMap.set('natten', 'natt');
inflectionMap.set('mannen', 'man');
inflectionMap.set('kvinnan', 'kvinna');
inflectionMap.set('barnet', 'barn');
inflectionMap.set('huset', 'hus');
inflectionMap.set('gatan', 'gata');
inflectionMap.set('morgonen', 'morgon');
inflectionMap.set('kvällen', 'kväll');
inflectionMap.set('vattnet', 'vatten');
inflectionMap.set('skogen', 'skog');
inflectionMap.set('solen', 'sol');

// Plural forms (common -ar, -er, -or endings)
inflectionMap.set('fåglarna', 'fågel');
inflectionMap.set('hundarna', 'hund');
inflectionMap.set('katterna', 'katt');
inflectionMap.set('träden', 'träd');
inflectionMap.set('blommorna', 'blomma');
inflectionMap.set('husen', 'hus');
inflectionMap.set('människorna', 'människa');
inflectionMap.set('barnen', 'barn');
inflectionMap.set('djuren', 'djur');
inflectionMap.set('dagarna', 'dag');
inflectionMap.set('nätterna', 'natt');
inflectionMap.set('männen', 'man');
inflectionMap.set('kvinnorna', 'kvinna');
inflectionMap.set('gatorna', 'gata');
inflectionMap.set('morgonarna', 'morgon');
inflectionMap.set('kvällarna', 'kväll');
inflectionMap.set('nya', 'ny');
inflectionMap.set('små', 'liten');

// Verb inflections (present tense to infinitive)
inflectionMap.set('förstår', 'förstå');

// 🆕 PERFECT PARTICIP - dessa är redan grundformer, ska INTE modifieras
inflectionMap.set('sett', 'sett');
inflectionMap.set('gjort', 'gjort');
inflectionMap.set('varit', 'varit');
inflectionMap.set('kommit', 'kommit');
inflectionMap.set('tagit', 'tagit');
inflectionMap.set('läst', 'läst');
inflectionMap.set('skrivit', 'skrivit');
inflectionMap.set('ätit', 'ätit');
inflectionMap.set('drunkit', 'drunkit');
inflectionMap.set('sovit', 'sovit');
inflectionMap.set('stått', 'stått');
inflectionMap.set('satt', 'satt');
inflectionMap.set('legat', 'legat');
inflectionMap.set('gett', 'gett');
inflectionMap.set('kunnat', 'kunnat');
inflectionMap.set('velat', 'velat');
inflectionMap.set('måttat', 'måttat');
inflectionMap.set('brutit', 'brutit');
inflectionMap.set('kassat', 'kassat');
inflectionMap.set('sparkat', 'sparkat');
inflectionMap.set('levt', 'levt');

// --- SIGN LANGUAGE GLOSS INFLECTION MAP ---
// Maps sign language gloss variations to base glosor (teckenspråks-varianter)
export const signInflectionMap = new Map<string, string>();
// Classifier variations (klassificerare-varianter)
signInflectionMap.set('HUND-LITEN', 'HUND');
signInflectionMap.set('HUND-STOR', 'HUND');
signInflectionMap.set('HUND-MÅNGA', 'HUND');
signInflectionMap.set('KATT-LITEN', 'KATT');
signInflectionMap.set('KATT-STOR', 'KATT');
signInflectionMap.set('FÅGEL-MÅNGA', 'FÅGEL');
signInflectionMap.set('FÅGEL-LITEN', 'FÅGEL');

// Aspectual variations (verb-varianter med aspect)
signInflectionMap.set('ÄTA-MYCKET', 'ÄTA');
signInflectionMap.set('ÄTA-LITE', 'ÄTA');
signInflectionMap.set('ÄTA-SNABBT', 'ÄTA');
signInflectionMap.set('GÅ-LÅNGSAMT', 'GÅ');
signInflectionMap.set('GÅ-SNABBT', 'GÅ');
signInflectionMap.set('SE-LÄNGE', 'SE');
signInflectionMap.set('SE-KORT', 'SE');

// Negation variations
signInflectionMap.set('ÄT-INTE', 'ÄTA');
signInflectionMap.set('GÅ-INTE', 'GÅ');
signInflectionMap.set('SE-INTE', 'SE');
signInflectionMap.set('KOMMA-INTE', 'KOMMA');

// Intensity/Reduplikation variations
signInflectionMap.set('LEDSEN-MYCKET', 'LEDSEN');
signInflectionMap.set('GLAD-MYCKET', 'GLAD');
signInflectionMap.set('TRÖTT-MYCKET', 'TRÖTT');
signInflectionMap.set('RÖD-MYCKET', 'RÖD');

// --- CACHING STATE ---
export const aiAnalysisCache = new Map<string, WordMapEntry[]>();

// --- USER FEEDBACK & PREFERENCES STATE ---
export const feedbackMap = new Map<string, FeedbackEntry>();
export const sentenceFeedbackMap = new Map<string, string>();
export const positiveFeedbackMap = new Map<string, Map<string, PositiveFeedbackEntry>>();
export const negativeFeedbackMap = new Map<string, Map<string, NegativeFeedbackEntry>>();
export const learnedPreferences = new Map<string, Map<string, number>>();
export const questionClarifications = new Map<string, string>();


// --- DEV MODE STATE ---
export const localUserSigns = new Map<string, { signs: Sign[], isCompound?: boolean }>();
export const localVideoMap = new Map<string, string>();

// --- REACTIVE STATE UPDATERS ---

/**
 * Generates the JSON string from current feedback maps immediately.
 * This ensures appState.latestFeedbackJson is always up to date.
 */
export function updateLatestFeedbackJson() {
    const feedbackReport = {
        signFeedback: Array.from(feedbackMap.entries()).map(([cardId, entry]) => ({ cardId, ...entry })),
        sentenceFeedback: Array.from(sentenceFeedbackMap.entries()).map(([sentence, comment]) => ({ sentence, comment })),
        negativeFeedback: Array.from(negativeFeedbackMap.entries()).flatMap(([cardId, innerMap]) => Array.from(innerMap.entries()).map(([signId, entry]) => ({ cardId, signId, ...entry }))),
        positiveFeedback: Array.from(positiveFeedbackMap.entries()).flatMap(([cardId, innerMap]) => Array.from(innerMap.entries()).map(([signId, entry]) => ({ cardId, signId, ...entry }))),
    };
    
    appState.latestFeedbackJson = JSON.stringify(feedbackReport, null, 2);
    
    // Optional: Notify dev console
    // console.log("Feedback JSON updated:", appState.latestFeedbackJson.length, "chars");
}
