
import { appState } from '../../state';

export const ICON_STATUS_READY = `<svg class="w-7 h-7 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15L15 9.75" class="text-white" stroke-width="2.5" /></svg>`;

export function updateHeaderLexiconProgress() {
    const iconContainer = document.getElementById('lexicon-status-icon');
    if (!iconContainer) return;

    if (appState.localLexiconReady && appState.fullLexiconLoaded) {
        iconContainer.innerHTML = ICON_STATUS_READY;
        iconContainer.dataset.tooltipText = "Lexikon fullständigt!";
        return;
    }

    // Simple loading spinner without percentage
    iconContainer.innerHTML = '<svg class="w-6 h-6 text-blue-400 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    iconContainer.dataset.tooltipText = "Laddar lexikon...";
}

export function updateDualLexiconProgressUI() {
    const statusContainer = document.getElementById('lexiconLoadingStatus');
    if (!statusContainer) return;

    if (appState.localLexiconReady && appState.fullLexiconLoaded) {
        statusContainer.classList.add('hidden');
    } else {
        statusContainer.classList.remove('hidden');
    }
}
