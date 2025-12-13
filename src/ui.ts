
import { setupKorpusModal } from './modules/korpus/korpusModal';

// Initiera Korpus-modal när sidan laddas
if (typeof window !== 'undefined') {
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', setupKorpusModal);
	} else {
		setupKorpusModal();
	}
}
// --- CENTRAL UI EXPORT MODULE (FACADE) ---

// Notification Service
export { showMessage, updateButtonProgress, showProgressStartup, ICON_LOADING_SVG, messageBox } from './services/ui/notificationService';

// Video Service
export { buildVideoUrl, playVideo, VIDEO_BASE_URL } from './services/media/videoService';

// Lexicon Data Service
export { getLexiconUrl, LEXICON_ORD_URL, LEXICON_SEARCH_URL } from './services/data/lexiconUrlService';

// Dev Mode Service
export { isDevMode } from './services/system/devModeService';

// Feedback Notification Service
export { activateFeedbackButton, FEEDBACK_SUMMARY_PREFIX } from './services/ui/feedbackNotificationService';

// Tooltip Module
// VIKTIGT: Använd relativ sökväg här, inte alias
export { initializeTooltips } from './modules/ui/tooltip';

// Video Grid Selection Service
export { updateSelectionUI } from './services/ui/videoGridSelectionService';

// DOM Elements
export { originalTextDisplay, voiceInputBtn, imageInputBtn, imageInputFile } from './modules/dom/elements';

// Helper to delay (Utility re-export if needed by legacy consumers)
export { delay } from './utils';
