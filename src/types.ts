import { GoogleGenAI, Chat } from '@google/genai';

// --- GLOBAL SPEECH RECOGNITION TYPES ---
declare global {
    interface SpeechRecognitionAlternative {
        readonly transcript: string;
        readonly confidence: number;
    }

    interface SpeechRecognitionResult {
        readonly isFinal: boolean;
        readonly length: number;
        item(index: number): SpeechRecognitionAlternative;
        [index: number]: SpeechRecognitionAlternative;
    }

    interface SpeechRecognitionResultList {
        readonly length: number;
        item(index: number): SpeechRecognitionResult;
        [index: number]: SpeechRecognitionResult;
    }

    interface SpeechRecognitionEvent extends Event {
        readonly resultIndex: number;
        readonly results: SpeechRecognitionResultList;
    }

    interface SpeechRecognitionErrorEvent extends Event {
        readonly error: string;
    }

    interface SpeechRecognition extends EventTarget {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: (event: SpeechRecognitionEvent) => void;
        onerror: (event: SpeechRecognitionErrorEvent) => void;
        onend: () => void;
        start(): void;
        stop(): void;
    }

    var SpeechRecognition: {
        prototype: SpeechRecognition;
        new (): SpeechRecognition;
    };

    var webkitSpeechRecognition: {
        prototype: SpeechRecognition;
        new (): SpeechRecognition;
    };

    interface Window {
        showFeedbackVideo: (cardId: string, signId: string) => void;
        SpeechRecognition: typeof SpeechRecognition;
        webkitSpeechRecognition: typeof webkitSpeechRecognition;
    }
}


// --- CORE TYPES ---
export type Sign = { id: string; word: string };

export type LexiconMetadata = {
    videoUrlPatterns: {
        ord: string;
        example: string;
        related: string;
    };
    korpusUrlPattern: string;
    ordforklaringUrlPattern: string;
    nycklar: { [key: string]: string };
};

export type Example = {
    sentence: string;
    phraseNumber: number;
    id: string; // Original ID of the sign entry
    word: string; // Original word of the sign entry
};

export type RelatedSignInfo = {
    sentence: string;
    relatedId: string;
    relatedWord: string;
    phraseNumber: number;
    originalId: string; // ID of the sign entry this is related to
    originalWord: string; // Word of the sign entry this is related to
};

export type WordMapEntry = {
    original: string;
    base: string;
    isWord: boolean;
    pos: string;
    signs: Sign[] | null;
    isCompound?: boolean;
    isHandled?: boolean;
    isSpelledOut?: boolean;
    rationale?: string;
    examples?: Example[];
    related?: RelatedSignInfo[];
    gloss?: string;
    isEnriched?: boolean;
};

// --- FEEDBACK & LEARNING TYPES ---
export type FeedbackEntry = {
    feedback: string;
    originalWords: string;
    groupId?: string;
    suggestedSigns?: Sign[];
    questionKey?: string;
};

export type PositiveFeedbackEntry = {
    sign: Sign;
    originalWords: string;
    count: number;
};

export type NegativeFeedbackEntry = {
    sign: Sign;
    originalWords: string;
    reason?: string;
};

// --- LEARNING FILE TYPES ---
export type LearningFileNewWord = {
    lookupKey: string;
    signs: Sign[];
    isCompound?: boolean;
};

export type LearningFileModification = {
    signs: Sign[];
};

export type LearningFileLearnedPreferences = { [lookupKey: string]: { [signId: string]: number } };

export type LearningFileFeedbackReport = {
    signFeedback: ({ cardId: string } & FeedbackEntry)[];
    sentenceFeedback: { sentence: string, comment: string }[];
    negativeFeedback: ({ cardId: string, signId: string } & NegativeFeedbackEntry)[];
    positiveFeedback: ({ cardId: string, signId: string } & PositiveFeedbackEntry)[];
};

export type HomonymResolution = {
    pos: string;
    sign: Sign;
};

export type LearningData = {
    schemaVersion: string;
    lastUpdated: string;
    description: string;
    newWords: LearningFileNewWord[];
    modifications: { [lookupKey: string]: LearningFileModification };
    learnedPreferences: LearningFileLearnedPreferences;
    feedbackReports: LearningFileFeedbackReport;
    homonymResolutions: { [word: string]: { pos: string, sign: Sign }[] };
    assistantInstructions?: { id: string, instruction: string }[];
};

// --- CONTEXT & STATE TYPES ---
export type SuggestionContext = {
    phraseTokens: WordMapEntry[];
    lookupKey: string;
    fullOriginalPhrase: string;
};

export type VideoSuggestion = {
    blob: Blob;
    context: SuggestionContext;
    blobUrl: string;
};

export type ModalContexts = {
    signDetailsCardId: string | null;
    signDetailsPhrase: string | null;
    signDetailsContext: WordMapEntry | null;
    changeReason: {
        phraseTokens: WordMapEntry[];
        lookupKey: string;
        newSign: Sign;
        originalSigns: Sign[];
        allNewSigns?: Sign[];
        grammarCardIndex?: number; // Index of the card in the grammar grid
        cardId?: string; // ID of the card being changed (to fix object Object bug)
    } | null;
    thumbDownReason: {
        phraseTokens?: WordMapEntry[];
        lookupKey?: string;
        sign?: Sign;
        cardId?: string;
        fullOriginalPhrase?: string;
        isSpelledOut?: boolean;
        cardContainer?: HTMLElement;
        isGroupAction?: boolean;
    } | null;
    goodChoiceReason: {
        phraseTokens?: WordMapEntry[];
        lookupKey?: string;
        sign?: Sign;
        cardId?: string;
        fullOriginalPhrase?: string;
        isSpelledOut?: boolean;
        cardContainer?: HTMLElement;
        isGroupAction?: boolean;
    } | null;
    sentenceFeedback: {
        sentence: WordMapEntry[];
    } | null;
    suggestion: SuggestionContext | null;
    sendSuggestion: { blob: Blob; context: SuggestionContext } | null;
    improveSign: {
        phraseTokens: WordMapEntry[];
        lookupKey: string;
        fullOriginalPhrase: string;
        cardId: string;
        isSpelledOut: boolean;
        cardContainer: HTMLElement;
        grammarCardIndex?: number; // Index of the card in the grammar grid
    } | null;
};

export type MediaState = {
    mediaRecorder: MediaRecorder | null;
    recordedBlobs: Blob[];
    timerInterval: number | null;
    tempVideoBlob: Blob | null;
    mediaStream: MediaStream | null;
};

export type ChatHistoryMessage = {
    role: 'user' | 'model';
    text: string;
    file?: {
        name: string;
        type: string;
        base64: string;
    } | null;
};

export type AppState = {
    ai: GoogleGenAI | null;
    isClickableMode: boolean;
    wordMap: WordMapEntry[];
    sentences: WordMapEntry[][];
    currentSentenceIndex: number;
    currentGrammarSentenceIndex: number; // New for grammar navigation
    aiTranslatedSentences: Map<number, WordMapEntry[]>; // New cache for AI translations
    isShowingAllSentences: boolean;
    isPlayingAll: boolean;
    isAccessibilityModeActive: boolean;
    isListening: boolean;
    recognition: SpeechRecognition | null;
    activeModalOpener: HTMLElement | null;
    latestReportContent: object | null;
    latestFeedbackJson: string;
    latestReportSummary: string | null; // NEW: Stores the text content of the report
    modalContexts: ModalContexts;
    mediaState: MediaState;
    videoSuggestions: VideoSuggestion[];
    videoObserver: IntersectionObserver | null;
    alphabetObserver: IntersectionObserver | null;
    combinationSelection: { cardId: string, sign: Sign }[];
    selection: string[];
    multiSelectMode: boolean;
    selectedCardIds: Set<string>;
    chat: Chat | null;
    chatHistory: ChatHistoryMessage[];
    chatFile: { file: File; base64: string; mimeType: string } | null;
    cardIdDataMap: Map<string, { phraseTokens: WordMapEntry[], fullOriginalPhrase: string }>;
    latestAnalysisResult: { summary: string; jsonReport: string } | null;
    linguisticQuestions: any[];
    shownQuestionKeys: Set<string>;
    pendingLinguisticQuestion: any | null;
    abortController: AbortController | null;
    lexiconMetadata: LexiconMetadata | null;
    loadedLexiconParts: Set<number>;
    onlineLearningData: LearningData | null;
    localLexiconReady: boolean;
    fullLexiconLoaded: boolean;
    localLexiconProgress: number; // 0-100
    onlineLexiconProgress: number; // 0-100
    changeSignMode: 'main' | 'grammar'; // New: To track context of change sign modal
    aiEnabled: boolean; // Toggle för att aktivera/deaktivera AI-funktioner
    usePuter: boolean; // Puter.js integration flag
    aiReady: boolean; // AI system initialization status
    glosaEnabled: boolean; // BETA: GLOSA feature toggle
};