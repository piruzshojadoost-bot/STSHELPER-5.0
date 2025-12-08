
import { appState } from '../state';
import { showMessage, originalTextDisplay, voiceInputBtn } from '../ui';
import { initializePlaceholder } from '../modules/ui/textDisplay';

export function initializeSpeechRecognition() {
    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionApi) {
        appState.recognition = new SpeechRecognitionApi();
        appState.recognition.continuous = true;
        appState.recognition.interimResults = true;
        appState.recognition.lang = 'sv-SE';

        appState.recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                else interimTranscript += event.results[i][0].transcript;
            }
            originalTextDisplay.textContent = finalTranscript + interimTranscript;
            if (finalTranscript) originalTextDisplay.classList.add('text-area-editable');

            // VIKTIGT: Tvinga fram en 'input'-händelse så att Sök-knappen (convertBtn) aktiveras
            originalTextDisplay.dispatchEvent(new Event('input', { bubbles: true }));
        };

        appState.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            let userMessage = `Röstigenkänning misslyckades: ${event.error}`;
            if (event.error === 'not-allowed') {
                userMessage = 'Du måste tillåta mikrofonåtkomst i din webbläsare för att använda röstinmatning.';
            } else if (event.error === 'no-speech') {
                userMessage = 'Ingen röst upptäcktes. Försök igen.';
            }
            showMessage(userMessage, 'error');
            appState.isListening = false;
            if (voiceInputBtn) voiceInputBtn.classList.remove('is-listening');
        };

        appState.recognition.onend = () => {
            if (appState.isListening) {
                try { appState.recognition?.start(); } catch (e) { console.error("Could not restart recognition:", e); }
            }
        };

        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => {
                if (!appState.recognition) {
                    showMessage('Röstigenkänning stöds inte av din webbläsare.', 'error');
                    return;
                }
                if (appState.isListening) {
                    appState.isListening = false;
                    appState.recognition.stop();
                    voiceInputBtn.classList.remove('is-listening');
                } else {
                    appState.isListening = true;
                    if (originalTextDisplay.textContent === originalTextDisplay.dataset.placeholder) {
                        originalTextDisplay.textContent = '';
                        originalTextDisplay.classList.add('text-area-editable');
                    }
                    appState.recognition.start();
                    voiceInputBtn.classList.add('is-listening');
                }
            });
        }

    } else {
        if (voiceInputBtn) {
            voiceInputBtn.addEventListener('click', () => {
                showMessage('Röstigenkänning stöds inte av din webbläsare.', 'error');
            });
        }
    }
}
