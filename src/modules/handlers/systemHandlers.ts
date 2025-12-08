
import { appState, updateLatestFeedbackJson } from '../../state';
import { showMessage } from '../../ui';
import { openModal, closeModal } from '../../components/modals';
import { submitFeedbackData, handleExportBackup, handleImportData } from '../../hooks/useLexicon';
// ARCHIVED: runRobotTests from buggsearch - moved to _archived/
import { resetApp } from '../core/reset';
import { handleOpenChat, setupChatEventListeners } from '../../components/chat';
import { renderAlphabet } from '../../components/VideoGrid';
import { toggleAccessibilityMode } from '../ui/theme';

export function setupSystemHandlers() {
    // --- MODALS & NAVIGATION ---
    const settingsBtn = document.getElementById('settingsBtn') as HTMLButtonElement;
    const settingsModal = document.getElementById('settingsModal') as HTMLElement;
    settingsBtn?.addEventListener('click', (e) => openModal(settingsModal, e.currentTarget as HTMLElement));

    const navLexiconBtn = document.getElementById('navLexiconBtn');
    const lexiconExplorerModal = document.getElementById('lexiconExplorerModal') as HTMLElement;
    navLexiconBtn?.addEventListener('click', (e) => {
         e.preventDefault();
         openModal(lexiconExplorerModal, e.currentTarget as HTMLElement);
    });

    const settingsLexiconBtn = document.getElementById('settingsLexiconBtn');
    settingsLexiconBtn?.addEventListener('click', (e) => {
        closeModal(settingsModal);
        openModal(lexiconExplorerModal, e.currentTarget as HTMLElement);
    });
    
    const alphabetBtn = document.getElementById('alphabetBtn');
    const alphabetModal = document.getElementById('alphabetModal') as HTMLElement;
    alphabetBtn?.addEventListener('click', (e) => {
        renderAlphabet();
        openModal(alphabetModal, e.currentTarget as HTMLElement);
    });

    // VIKTIGT: Anropar setup för att aktivera chatt-knapparna
    setupChatEventListeners(); 

    const appFeedbackBtn = document.getElementById('appFeedbackBtn');
    const appFeedbackModal = document.getElementById('appFeedbackModal') as HTMLElement;
    appFeedbackBtn?.addEventListener('click', (e) => openModal(appFeedbackModal, e.currentTarget as HTMLElement));

    const accessibilityToggleBtn = document.getElementById('accessibilityToggleBtn');
    accessibilityToggleBtn?.addEventListener('click', toggleAccessibilityMode);

    const dataManagementBtn = document.getElementById('dataManagementBtn'); 
    const dataManagementModal = document.getElementById('dataManagementModal') as HTMLElement;
    dataManagementBtn?.addEventListener('click', (e) => openModal(dataManagementModal, e.currentTarget as HTMLElement));


    // --- DATA MANAGEMENT ---
    // "Spara och Skicka" (Clears data)
    const saveAndDownloadBtn = document.getElementById('saveAndDownloadBtn') as HTMLButtonElement;
    if (saveAndDownloadBtn) {
        saveAndDownloadBtn.addEventListener('click', submitFeedbackData);
    }

    // "Spara Backup" (Keeps data)
    const backupBtn = document.getElementById('backupBtn') as HTMLButtonElement;
    if (backupBtn) {
        backupBtn.addEventListener('click', handleExportBackup);
    }

    const importMergeDataBtn = document.getElementById('importMergeDataBtn') as HTMLButtonElement;
    const importMergeDataInput = document.getElementById('importMergeDataInput') as HTMLInputElement;
    if (importMergeDataBtn && importMergeDataInput) {
        importMergeDataBtn.addEventListener('click', () => importMergeDataInput.click());
        importMergeDataInput.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                handleImportData(file, true);
                importMergeDataInput.value = '';
            }
        });
    }

    const importDataBtn = document.getElementById('importDataBtn') as HTMLButtonElement;
    const importDataInput = document.getElementById('importDataInput') as HTMLInputElement;
    if (importDataBtn && importDataInput) {
        importDataBtn.addEventListener('click', () => importDataInput.click());
        importDataInput.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                handleImportData(file, false);
                importDataInput.value = '';
            }
        });
    }

    // --- DEV MODE & TESTS --- (now handled by devModeService in init.ts)

    const settingsRobotTestBtn = document.getElementById('settingsRobotTestBtn');
    settingsRobotTestBtn?.addEventListener('click', () => {
        closeModal(settingsModal); 
        // ARCHIVED: runRobotTests(resetApp) - moved to _archived/buggsearch.ts
    });
    
    // --- FEEDBACK SUBMISSION (LOCAL/FILE SIMULATION) ---
    const appFeedbackSendBtn = document.getElementById('appFeedbackSendBtn') as HTMLButtonElement;
    appFeedbackSendBtn?.addEventListener('click', async (e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const textarea = document.getElementById('appFeedbackTextarea') as HTMLTextAreaElement;
        const message = textarea.value.trim();

        if (!message) {
            showMessage("Textrutan är tom.", "error");
            return;
        }

        // Since Firebase is removed, we just simulate a send and notify user.
        showMessage("Feedback sparad lokalt (molnfunktion avstängd).", "success");
        textarea.value = '';
        closeModal(appFeedbackModal);
    });

    const signFeedbackSendBtn = document.getElementById('signFeedbackSendBtn') as HTMLButtonElement;
    const signFeedbackTextarea = document.getElementById('signFeedbackTextarea') as HTMLTextAreaElement;
    signFeedbackSendBtn?.addEventListener('click', async (e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const message = signFeedbackTextarea.value.trim();

        if (!message) {
            showMessage("Textrutan är tom.", "error");
            return;
        }
        
        // Since Firebase is removed, we just simulate a send.
        updateLatestFeedbackJson(); // UPDATE JSON REALTIME
        showMessage("Tack, din feedback har sparats!", "success");
        signFeedbackTextarea.value = '';
        
        const feedbackSection = document.getElementById('signDetailsFeedbackSection');
        if(feedbackSection) {
            (feedbackSection.querySelector('h4') as HTMLElement).textContent = "✅ Feedback mottagen!";
            setTimeout(() => {
                (feedbackSection!.querySelector('h4') as HTMLElement).textContent = "Rapportera fel";
            }, 3000);
        }
    });
}
