
import { appState } from '../../state';
import { initializeLexicon } from '../../hooks/useLexicon';
import { initializeAI } from '../../hooks/useAI';
import { initializeSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { initializeModals } from '../../components/modals';
import { updateButtonProgress } from '../../ui';
import { initLocalSearch } from '../search/localSearchWithFallback';
import { resetApp } from './reset';

// Import UI Modules
import { updateHeaderLexiconProgress, updateDualLexiconProgressUI } from '../ui/progress';
import { initTheme } from '../ui/theme';
import { initializePlaceholder } from '../ui/textDisplay';
import { injectModals } from '../ui/modalTemplates';

// Import Handlers
import { setupInputHandlers } from '../handlers/inputHandlers';
import { setupNavHandlers } from '../handlers/navHandlers';
import { setupSystemHandlers } from '../handlers/systemHandlers';

// Import Services
import { initLexiconStatusHeader } from '../../services/lexiconStatusHeader';
import { quotaTracker } from '../../services/quotaTracker';

// Import Feedback System
import { feedbackCollector } from '../feedback/feedbackCollector';
import { initFeedbackPreviewModal } from '../feedback/feedbackPreviewModal';
import { updateFeedbackBadge } from '../../services/ui/feedbackNotificationService';

// Import Dev Mode Service
import { initDevMode } from '../../services/system/devModeService';
// ARCHIVED: initQuotaDisplay, initDotPercentage - moved to _archived/

export function initCore() {
    // 0. Initialize Dev Mode (check URL for ?dev=hemlig)
    initDevMode();
    
    // 0b. Initialize Quota Display
    quotaTracker.updateUI();
    
    // 1. Inject Modals
    injectModals();

    // 1. UI & Theme Init
    initTheme();
    
    // 2. Check AI Mode
    const aiModeToggle = document.getElementById('aiModeToggle') as HTMLInputElement;
    if (aiModeToggle) {
        aiModeToggle.checked = appState.aiEnabled;
        aiModeToggle.addEventListener('change', (e) => {
            appState.aiEnabled = (e.target as HTMLInputElement).checked;
            localStorage.setItem('aiEnabled', String(appState.aiEnabled));
            const status = appState.aiEnabled ? 'aktiverat' : 'deaktiverat';
            import('../../ui').then(m => m.showMessage(`AI-funktioner ${status}. Bara lokal sökning används nu.`, 'success'));
        });
    }
    
    // Initialize AI Status Indicator
    const aiStatusIndicator = document.getElementById('aiStatusIndicator') as HTMLElement;
    if (aiStatusIndicator) {
        aiStatusIndicator.classList.add('ai-loading');
        aiStatusIndicator.title = 'AI status: Loading...';
    }

    // 3. Check Dev Mode (handled in settings menu only)

    // 3A. HF-API QUOTA BUTTON
    const quotaBtn = document.getElementById('hf-api-quota') as HTMLButtonElement;
    const quotaModal = document.getElementById('quota-modal') as HTMLElement;
    const quotaModalClose = document.getElementById('quota-modal-close') as HTMLButtonElement;
    const quotaModalBackdrop = document.getElementById('quota-modal-backdrop') as HTMLElement;

    if (quotaBtn && quotaModal) {
        quotaBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            quotaModal.classList.remove('hidden');
        });
    }

    if (quotaModalClose && quotaModal) {
        quotaModalClose.addEventListener('click', () => {
            quotaModal.classList.add('hidden');
        });
    }

    if (quotaModalBackdrop && quotaModal) {
        quotaModalBackdrop.addEventListener('click', () => {
            quotaModal.classList.add('hidden');
        });
    }

    // 3B. GLOSA Beta Feature Toggle
    const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
    const betaMenu = document.getElementById('betaFeaturesMenu') as HTMLElement;
    const glosaToggle = document.getElementById('glosaToggle') as HTMLInputElement;
    const glosaBtn = document.getElementById('glosaBtn') as HTMLButtonElement;

    if (settingsBtn && betaMenu) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            betaMenu.classList.toggle('hidden');
        });
        
        document.addEventListener('click', (e) => {
            if (!settingsBtn.contains(e.target as Node) && !betaMenu.contains(e.target as Node)) {
                betaMenu.classList.add('hidden');
            }
        });
    }

    if (glosaToggle && glosaBtn) {
        // Set initial state from localStorage
        const glosaEnabledSaved = localStorage.getItem('glosaEnabled') === 'true';
        glosaToggle.checked = glosaEnabledSaved;
        appState.glosaEnabled = glosaEnabledSaved;
        glosaBtn.classList.toggle('hidden', !glosaEnabledSaved);
        
        // Listen for changes
        glosaToggle.addEventListener('change', () => {
            appState.glosaEnabled = glosaToggle.checked;
            localStorage.setItem('glosaEnabled', String(glosaToggle.checked));
            glosaBtn.classList.toggle('hidden', !glosaToggle.checked);
            
            const status = glosaToggle.checked ? 'aktiverad' : 'deaktiverad';
            import('../../ui').then(m => m.showMessage(`🚀 GLOSA Beta ${status}`, 'success'));
        });
    }

    // 3B. Dev Mode Toggle - now handled by devModeService
    const devModeToggle = document.getElementById('devModeToggle') as HTMLInputElement;
    if (devModeToggle) {
        import('../../services/system/devModeService').then(({ isDevMode, toggleDevMode }) => {
            devModeToggle.checked = isDevMode();
            
            devModeToggle.addEventListener('change', () => {
                toggleDevMode(devModeToggle.checked);
                const status = devModeToggle.checked ? 'aktiverat' : 'inaktiverat';
                import('../../ui').then(m => m.showMessage(`Dev Mode ${status}`, 'success'));
            });
        });
    }

    // 4. Observers
    appState.alphabetObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video') as HTMLVideoElement;
            if (!video) return;
            
            // Lazy load video src if not already loaded
            if (entry.isIntersecting && !video.src && video.dataset.src) {
                video.src = video.dataset.src;
                video.load();
            }
        });
    }, { rootMargin: '50px', threshold: 0.1 });

    // 5. Core Services Init
    updateHeaderLexiconProgress();
    initLocalSearch();
    initLexiconStatusHeader();
    // ARCHIVED: initQuotaDisplay, initDotPercentage
    initializeAI(resetApp).catch(e => console.error("AI init failed:", e));
    
    initializeLexicon(
        () => { },
        (progress) => { 
            appState.localLexiconProgress = progress;
            updateHeaderLexiconProgress();
            updateDualLexiconProgressUI();
        },
        (progress) => {
            appState.onlineLexiconProgress = progress;
            updateHeaderLexiconProgress();
            updateDualLexiconProgressUI();
        }
    );
    
    initializeSpeechRecognition();
    initializeModals();

    // 6. Wiring Event Handlers
    setupInputHandlers();
    setupNavHandlers();
    setupSystemHandlers();

    // 6b. ARCHIVED: GLOSATranscription component moved to _archived/
    // Sign Language Transcription Lexicon (GLOSA) is still integrated in main app through other means

    // 7. Final UI Prep
    initializePlaceholder();
    import('../../ui').then(m => m.initializeTooltips());
    updateButtonProgress('idle');
    
    // 8. Initialize Feedback System
    feedbackCollector.init();
    initFeedbackPreviewModal();
    feedbackCollector.setOnChange(() => {
        updateFeedbackBadge(feedbackCollector.getCount());
    });
    updateFeedbackBadge(feedbackCollector.getCount());

    // Förbättrad inklistring
    const textDiv = document.getElementById('originalTextDisplay');
    if (textDiv) {
        textDiv.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || (window as any).clipboardData).getData('text');
            const clean = text.replace(/\r?\n/g, '<br>');
            textDiv.innerHTML = clean;
        });
        textDiv.addEventListener('drop', (e) => {
            e.preventDefault();
        });
    }
}
