import { appState } from '../../state';
import { showMessage } from '../../ui';
import { openModal, closeModal } from '../../components/modals/ModalSystem';

let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let timerInterval: number | null = null;

function stopStream() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resetSuggestionModalUI() {
    const modal = document.getElementById('suggestionModal');
    if (!modal) return;
    
    const videoPreview = document.getElementById('suggestionVideoPreview') as HTMLVideoElement;
    const statusText = document.getElementById('suggestionStatusText') as HTMLElement;
    const timerDisplay = document.getElementById('timerDisplay') as HTMLElement;
    
    const uploadBtn = document.getElementById('uploadVideoButton') as HTMLButtonElement;
    const recordBtn = document.getElementById('recordVideoButton') as HTMLButtonElement;
    const stopBtn = document.getElementById('stopRecordingButton') as HTMLButtonElement;
    const useBtn = document.getElementById('useVideoButton') as HTMLButtonElement;
    const retakeBtn = document.getElementById('retakeVideoButton') as HTMLButtonElement;

    stopStream();
    
    videoPreview.srcObject = null;
    videoPreview.src = '';
    videoPreview.classList.add('hidden');
    statusText.classList.remove('hidden');
    timerDisplay.classList.add('hidden');
    statusText.textContent = 'Välj inspelning eller ladda upp.';
    
    uploadBtn.classList.remove('hidden');
    recordBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    useBtn.classList.add('hidden');
    retakeBtn.classList.add('hidden');
    
    appState.modalContexts.sendSuggestion = null;
}

function startRecording() {
    const videoPreview = document.getElementById('suggestionVideoPreview') as HTMLVideoElement;
    const statusText = document.getElementById('suggestionStatusText') as HTMLElement;
    const timerDisplay = document.getElementById('timerDisplay') as HTMLElement;
    const uploadBtn = document.getElementById('uploadVideoButton') as HTMLButtonElement;
    const recordBtn = document.getElementById('recordVideoButton') as HTMLButtonElement;
    const stopBtn = document.getElementById('stopRecordingButton') as HTMLButtonElement;

    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
            mediaStream = stream;
            videoPreview.srcObject = stream;
            videoPreview.classList.remove('hidden');
            videoPreview.play();
            
            statusText.classList.add('hidden');
            uploadBtn.classList.add('hidden');
            recordBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            timerDisplay.classList.remove('hidden');
            
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                handleVideoReady(blob);
            };
            
            mediaRecorder.start();
            
            let seconds = 0;
            timerDisplay.textContent = "00:00";
            timerInterval = window.setInterval(() => {
                seconds++;
                const m = Math.floor(seconds / 60).toString().padStart(2, '0');
                const s = (seconds % 60).toString().padStart(2, '0');
                timerDisplay.textContent = `${m}:${s}`;
            }, 1000);
        })
        .catch(err => {
            console.error("Kunde inte starta kamera:", err);
            showMessage("Kunde inte komma åt kameran.", "error");
        });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        stopStream();
    }
}

function handleVideoReady(blob: Blob) {
    const videoPreview = document.getElementById('suggestionVideoPreview') as HTMLVideoElement;
    const statusText = document.getElementById('suggestionStatusText') as HTMLElement;
    const timerDisplay = document.getElementById('timerDisplay') as HTMLElement;
    const stopBtn = document.getElementById('stopRecordingButton') as HTMLButtonElement;
    const useBtn = document.getElementById('useVideoButton') as HTMLButtonElement;
    const retakeBtn = document.getElementById('retakeVideoButton') as HTMLButtonElement;
    
    const url = URL.createObjectURL(blob);
    videoPreview.srcObject = null;
    videoPreview.src = url;
    videoPreview.controls = true;
    videoPreview.classList.remove('hidden');
    
    statusText.classList.add('hidden');
    timerDisplay.classList.add('hidden');
    stopBtn.classList.add('hidden');
    
    useBtn.classList.remove('hidden');
    retakeBtn.classList.remove('hidden');
    
    if (appState.modalContexts.suggestion) {
        appState.modalContexts.sendSuggestion = {
            blob: blob,
            context: appState.modalContexts.suggestion
        };
    }
}

function handleFileUpload(file: File) {
    handleVideoReady(file);
}

export function openSendSuggestionModal() {
    const suggestionContext = appState.modalContexts.sendSuggestion;
    if (!suggestionContext) return;
    
    const suggestionModal = document.getElementById('suggestionModal') as HTMLElement;
    closeModal(suggestionModal);
    
    const sendModal = document.getElementById('sendSuggestionModal') as HTMLElement;
    const preview = document.getElementById('sendSuggestionVideoPreview') as HTMLVideoElement;
    const downloadBtn = document.getElementById('downloadSuggestionBtn') as HTMLAnchorElement;
    const textArea = document.getElementById('sendSuggestionText') as HTMLTextAreaElement;
    const copyBtn = document.getElementById('copySuggestionTextBtn') as HTMLButtonElement;
    
    if (!sendModal || !preview || !downloadBtn || !textArea) return;
    
    const blobUrl = URL.createObjectURL(suggestionContext.blob);
    preview.src = blobUrl;
    
    downloadBtn.href = blobUrl;
    downloadBtn.download = `teckenforslag_${suggestionContext.context.lookupKey}.webm`;
    
    const infoText = `NYTT TECKEN FÖRSLAG\n\nOrd: ${suggestionContext.context.lookupKey.toUpperCase()}\nKontext: "${suggestionContext.context.fullOriginalPhrase}"\n\n(Bifoga den nedladdade videofilen i mailet)`;
    textArea.value = infoText;
    
    copyBtn.onclick = () => {
        textArea.select();
        document.execCommand('copy');
        showMessage("Text kopierad till urklipp!", "success");
    };
    
    openModal(sendModal);
}

export function initializeSuggestionModalEventListeners() {
    const uploadBtn = document.getElementById('uploadVideoButton');
    const fileInput = document.getElementById('videoUploadInput') as HTMLInputElement;
    const recordBtn = document.getElementById('recordVideoButton');
    const stopBtn = document.getElementById('stopRecordingButton');
    const useBtn = document.getElementById('useVideoButton');
    const retakeBtn = document.getElementById('retakeVideoButton');
    
    uploadBtn?.addEventListener('click', () => fileInput.click());
    fileInput?.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) handleFileUpload(file);
    });
    
    recordBtn?.addEventListener('click', startRecording);
    stopBtn?.addEventListener('click', stopRecording);
    
    useBtn?.addEventListener('click', openSendSuggestionModal);
    retakeBtn?.addEventListener('click', resetSuggestionModalUI);
    
    // Reset UI when modal closes
    const suggestionModal = document.getElementById('suggestionModal');
    if(suggestionModal) {
         const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && !suggestionModal.classList.contains('show')) {
                    stopStream();
                    resetSuggestionModalUI();
                }
            });
        });
        observer.observe(suggestionModal, { attributes: true });
    }
}

export function openSuggestionModal(context: NonNullable<typeof appState.modalContexts.improveSign>) {
    const modal = document.getElementById('suggestionModal') as HTMLElement;
    const title = document.getElementById('suggestionModalTitle') as HTMLElement;
    if (!modal || !title) return;

    appState.modalContexts.suggestion = {
        phraseTokens: context.phraseTokens,
        lookupKey: context.lookupKey,
        fullOriginalPhrase: context.fullOriginalPhrase
    };
    title.textContent = `Föreslå tecken för "${context.fullOriginalPhrase}"`;
    openModal(modal, context.cardContainer);
}