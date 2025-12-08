
import { feedbackCollector, FeedbackItem } from './feedbackCollector';
import { showMessage } from '../../ui';
import { openModal, closeModal } from '../../components/modals/ModalSystem';
import { clearFeedbackData } from '../../components/modals';
import { updateFeedbackBadge } from '../../services/ui/feedbackNotificationService';

let modalElement: HTMLElement | null = null;
let googleFormsUrl: string = '';

const FORMS_URL_KEY = 'sts-google-forms-url';
const DEFAULT_FORMS_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSc8XbRtth7AIBK_kn7LEYf1UG4KAbPexoa7d0vHgIYjpIO5zQ/viewform';

export function initFeedbackPreviewModal() {
    loadFormsUrl();
    createModalHtml();
    setupEventListeners();
}

function loadFormsUrl() {
    googleFormsUrl = localStorage.getItem(FORMS_URL_KEY) || DEFAULT_FORMS_URL;
}

function saveFormsUrl(url: string) {
    googleFormsUrl = url;
    localStorage.setItem(FORMS_URL_KEY, url);
}

function createModalHtml() {
    const existingModal = document.getElementById('feedbackPreviewModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'feedbackPreviewModal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/40" id="feedbackPreviewBackdrop"></div>
        <div class="modal-content" style="max-width: 700px; max-height: 85vh; overflow-y: auto;">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold flex items-center gap-2">
                    <span>📋</span>
                    <span>Samlad Feedback</span>
                    <span id="feedbackPreviewCount" class="text-sm bg-blue-500 text-white px-2 py-0.5 rounded-full">0</span>
                </h3>
                <button id="feedbackPreviewClose" class="text-gray-400 hover:text-white text-2xl leading-none">&times;</button>
            </div>
            
            <div class="flex gap-2 items-center justify-between mb-3">
                <label class="text-sm font-semibold text-gray-300">Feedbacktext:</label>
                <button id="feedbackCopyBtn" class="btn btn-secondary btn-sm flex items-center justify-center gap-1">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    Kopiera
                </button>
            </div>
            
            <div id="feedbackPreviewContent" class="bg-gray-900 p-4 rounded border border-gray-700 text-sm font-mono whitespace-pre-wrap max-h-[40vh] overflow-y-auto mb-4">
                Ingen feedback ännu...
            </div>
            
            <div class="space-y-4">
                <div class="flex gap-2">
                    <a id="feedbackSendBtn" href="https://docs.google.com/forms/d/e/1FAIpQLSc8XbRtth7AIBK_kn7LEYf1UG4KAbPexoa7d0vHgIYjpIO5zQ/viewform" target="_blank" class="btn btn-primary flex-1 flex items-center justify-center gap-2">
                        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        Öppna Google Forms
                    </a>
                </div>
                
                <div class="pt-4 border-t border-gray-700">
                    <button id="feedbackClearBtn" class="text-red-400 hover:text-red-300 text-sm underline">
                        Rensa all feedback
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modalElement = modal;
}

function setupEventListeners() {
    if (!modalElement) return;
    
    const backdrop = modalElement.querySelector('#feedbackPreviewBackdrop');
    const closeBtn = modalElement.querySelector('#feedbackPreviewClose');
    const copyBtn = modalElement.querySelector('#feedbackCopyBtn');
    const clearBtn = modalElement.querySelector('#feedbackClearBtn');
    
    backdrop?.addEventListener('click', () => closeFeedbackPreviewModal());
    closeBtn?.addEventListener('click', () => closeFeedbackPreviewModal());
    
    copyBtn?.addEventListener('click', async () => {
        const text = feedbackCollector.format();
        try {
            await navigator.clipboard.writeText(text);
            showMessage('Kopierat till urklipp!', 'success');
        } catch (e) {
            showMessage('Kunde inte kopiera', 'error');
        }
    });
    
    clearBtn?.addEventListener('click', () => {
        if (confirm('Är du säker på att du vill rensa all feedback?')) {
            feedbackCollector.clear();
            clearFeedbackData(); // Rensa även alla feedback-maps (feedbackMap, positiveFeedbackMap, etc.)
            updateFeedbackBadge(0); // Uppdatera badge till 0
            updatePreviewContent();
            showMessage('All feedback har rensats', 'success');
        }
    });
}

function updatePreviewContent() {
    if (!modalElement) return;
    
    const content = modalElement.querySelector('#feedbackPreviewContent');
    const countEl = modalElement.querySelector('#feedbackPreviewCount');
    
    const count = feedbackCollector.getCount();
    
    if (countEl) countEl.textContent = count.toString();
    
    if (content) {
        if (count === 0) {
            content.textContent = 'Ingen feedback ännu...\n\nAnvänd appen och ge feedback med:\n- 👍/👎 på tecken\n- 👍/👎 på meningar\n- Ändra tecken\n- Rapportera fel\n\nAllt samlas automatiskt här!';
        } else {
            content.textContent = feedbackCollector.format();
        }
    }
}

export function openFeedbackPreviewModal() {
    if (!modalElement) {
        initFeedbackPreviewModal();
    }
    updatePreviewContent();
    openModal(modalElement!);
}

export function closeFeedbackPreviewModal() {
    if (modalElement) {
        closeModal(modalElement);
    }
}
