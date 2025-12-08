
import { appState, feedbackMap, sentenceFeedbackMap, positiveFeedbackMap, negativeFeedbackMap, questionClarifications, learnedPreferences } from '../../state';
import { showMessage } from '../../ui';

export interface FeedbackItem {
    type: 'thumbUp' | 'thumbDown' | 'changeSign' | 'newSignSuggestion' | 'reportError' | 'sentenceFeedback' | 'glosaCorrection' | 'appFeedback';
    timestamp: number;
    data: any;
}

export interface FeedbackCollection {
    thumbUp: Array<{ word: string; signId: string; count: number }>;
    thumbDown: Array<{ word: string; signId: string; reason: string }>;
    changeSign: Array<{ word: string; fromSignId: string; toSignId: string; toWord: string }>;
    newSignSuggestion: Array<{ word: string; videoBlob?: Blob; note?: string }>;
    reportError: Array<{ word: string; signId: string; comment: string }>;
    sentenceFeedback: Array<{ sentence: string; glosa?: string; rating: 'up' | 'down'; comment?: string }>;
    glosaCorrection: Array<{ swedish: string; aiGlosa: string; userGlosa: string }>;
    appFeedback: { rating?: number; comment?: string };
}

const STORAGE_KEY = 'sts-feedback-collection';

let feedbackItems: FeedbackItem[] = [];
let feedbackCount = 0;
let onFeedbackChange: (() => void) | null = null;

export function initFeedbackCollector() {
    loadFromStorage();
    updateFeedbackCount();
}

export function setOnFeedbackChange(callback: () => void) {
    onFeedbackChange = callback;
}

function loadFromStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            feedbackItems = JSON.parse(stored);
        }
    } catch (e) {
        console.error('Failed to load feedback from storage:', e);
        feedbackItems = [];
    }
}

function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(feedbackItems));
    } catch (e) {
        console.error('Failed to save feedback to storage:', e);
    }
}

function updateFeedbackCount() {
    feedbackCount = feedbackItems.length;
    if (onFeedbackChange) {
        onFeedbackChange();
    }
}

export function getFeedbackCount(): number {
    return feedbackCount;
}

export function addFeedback(item: Omit<FeedbackItem, 'timestamp'>) {
    const fullItem: FeedbackItem = {
        ...item,
        timestamp: Date.now()
    };
    feedbackItems.push(fullItem);
    saveToStorage();
    updateFeedbackCount();
}

export function addThumbUp(word: string, signId: string) {
    addFeedback({
        type: 'thumbUp',
        data: { word, signId }
    });
}

export function addThumbDown(word: string, signId: string, reason: string) {
    addFeedback({
        type: 'thumbDown',
        data: { word, signId, reason }
    });
}

export function addChangeSign(word: string, fromSignId: string, toSignId: string, toWord: string) {
    addFeedback({
        type: 'changeSign',
        data: { word, fromSignId, toSignId, toWord }
    });
}

export function addNewSignSuggestion(word: string, videoBlob?: Blob, note?: string) {
    addFeedback({
        type: 'newSignSuggestion',
        data: { word, hasVideo: !!videoBlob, note }
    });
}

export function addReportError(word: string, signId: string, comment: string) {
    addFeedback({
        type: 'reportError',
        data: { word, signId, comment }
    });
}

export function addSentenceFeedback(sentence: string, glosa: string | undefined, rating: 'up' | 'down', comment?: string) {
    addFeedback({
        type: 'sentenceFeedback',
        data: { sentence, glosa, rating, comment }
    });
}

export function addGlosaCorrection(swedish: string, aiGlosa: string, userGlosa: string) {
    addFeedback({
        type: 'glosaCorrection',
        data: { swedish, aiGlosa, userGlosa }
    });
}

export function addAppFeedback(rating: number, comment: string) {
    addFeedback({
        type: 'appFeedback',
        data: { rating, comment }
    });
}

export function getAllFeedback(): FeedbackItem[] {
    return [...feedbackItems];
}

export function clearFeedback() {
    feedbackItems = [];
    saveToStorage();
    updateFeedbackCount();
}

export function formatFeedbackForForms(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    
    const thumbUps = feedbackItems.filter(f => f.type === 'thumbUp');
    const thumbDowns = feedbackItems.filter(f => f.type === 'thumbDown');
    const changeSigns = feedbackItems.filter(f => f.type === 'changeSign');
    const newSuggestions = feedbackItems.filter(f => f.type === 'newSignSuggestion');
    const reportErrors = feedbackItems.filter(f => f.type === 'reportError');
    const sentenceFeedbacks = feedbackItems.filter(f => f.type === 'sentenceFeedback');
    const glosaCorrections = feedbackItems.filter(f => f.type === 'glosaCorrection');
    const appFeedbacks = feedbackItems.filter(f => f.type === 'appFeedback');
    
    let output = `=== STS-helper Feedback ===\n`;
    output += `Datum: ${dateStr} ${timeStr}\n`;
    output += `Totalt: ${feedbackItems.length} feedback-poster\n\n`;
    
    if (thumbUps.length > 0) {
        output += `👍 TUMME UPP (${thumbUps.length} st):\n`;
        thumbUps.forEach(f => {
            output += `- ${f.data.word} (id: ${f.data.signId})\n`;
        });
        output += '\n';
    }
    
    if (thumbDowns.length > 0) {
        output += `👎 TUMME NER (${thumbDowns.length} st):\n`;
        thumbDowns.forEach(f => {
            output += `- ${f.data.word} (id: ${f.data.signId}): "${f.data.reason}"\n`;
        });
        output += '\n';
    }
    
    if (changeSigns.length > 0) {
        output += `🔄 ÄNDRADE TECKEN (${changeSigns.length} st):\n`;
        changeSigns.forEach(f => {
            output += `- "${f.data.word}" → bytte från (id: ${f.data.fromSignId}) till ${f.data.toWord} (id: ${f.data.toSignId})\n`;
        });
        output += '\n';
    }
    
    if (newSuggestions.length > 0) {
        output += `🆕 FÖRSLAG PÅ NYA TECKEN (${newSuggestions.length} st):\n`;
        newSuggestions.forEach(f => {
            output += `- Ord: "${f.data.word}"${f.data.hasVideo ? ' [VIDEO INSPELAD]' : ''}${f.data.note ? ` - "${f.data.note}"` : ''}\n`;
        });
        output += '\n';
    }
    
    if (reportErrors.length > 0) {
        output += `💬 RAPPORTERADE FEL (${reportErrors.length} st):\n`;
        reportErrors.forEach(f => {
            output += `- ${f.data.word} (id: ${f.data.signId}): "${f.data.comment}"\n`;
        });
        output += '\n';
    }
    
    if (sentenceFeedbacks.length > 0) {
        output += `📝 MENINGS-FEEDBACK (${sentenceFeedbacks.length} st):\n`;
        sentenceFeedbacks.forEach(f => {
            const icon = f.data.rating === 'up' ? '👍' : '👎';
            output += `- "${f.data.sentence}" → ${icon}`;
            if (f.data.glosa) output += ` (GLOSA: ${f.data.glosa})`;
            if (f.data.comment) output += ` - "${f.data.comment}"`;
            output += '\n';
        });
        output += '\n';
    }
    
    if (glosaCorrections.length > 0) {
        output += `✏️ GLOSA-KORRIGERINGAR (${glosaCorrections.length} st):\n`;
        glosaCorrections.forEach(f => {
            output += `- "${f.data.swedish}"\n`;
            output += `  AI: ${f.data.aiGlosa}\n`;
            output += `  Rättat: ${f.data.userGlosa}\n`;
        });
        output += '\n';
    }
    
    if (appFeedbacks.length > 0) {
        const latest = appFeedbacks[appFeedbacks.length - 1];
        output += `⭐ APP-FEEDBACK:\n`;
        if (latest.data.rating) output += `Betyg: ${latest.data.rating}/5\n`;
        if (latest.data.comment) output += `Kommentar: "${latest.data.comment}"\n`;
    }
    
    return output;
}

export function submitToGoogleForms(formsUrl: string): boolean {
    const feedbackText = formatFeedbackForForms();
    
    try {
        const formId = extractFormId(formsUrl);
        if (!formId) {
            showMessage('Ogiltig Google Forms-länk', 'error');
            return false;
        }
        
        const prefilledUrl = `https://docs.google.com/forms/d/e/${formId}/viewform?usp=pp_url&entry.0=${encodeURIComponent(feedbackText)}`;
        
        window.open(prefilledUrl, '_blank');
        
        return true;
    } catch (e) {
        console.error('Failed to submit to Google Forms:', e);
        showMessage('Kunde inte öppna Google Forms', 'error');
        return false;
    }
}

function extractFormId(url: string): string | null {
    const match = url.match(/\/d\/e\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
    
    const match2 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match2) return match2[1];
    
    return null;
}

export const feedbackCollector = {
    init: initFeedbackCollector,
    setOnChange: setOnFeedbackChange,
    getCount: getFeedbackCount,
    getAll: getAllFeedback,
    clear: clearFeedback,
    format: formatFeedbackForForms,
    submit: submitToGoogleForms,
    addThumbUp,
    addThumbDown,
    addChangeSign,
    addNewSignSuggestion,
    addReportError,
    addSentenceFeedback,
    addGlosaCorrection,
    addAppFeedback
};
