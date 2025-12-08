
// Constants
export const ICON_LOADING_SVG = '<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';

// DOM Elements (Internal usage for this service)
export const messageBox = document.getElementById('messageBox') as HTMLElement;

export function showMessage(message: string, type: 'success' | 'error' = 'success', duration: number = 4000) {
    if (!messageBox) return;
    
    messageBox.textContent = message;
    messageBox.className = 'message-box p-4 rounded-xl font-bold text-center text-lg backdrop-blur-md shadow-lg';
    if (type === 'success') {
        messageBox.style.backgroundColor = 'rgba(16, 185, 129, 0.9)';
        messageBox.style.color = 'white';
        messageBox.style.border = '1px solid rgba(255,255,255,0.2)';
    } else {
        messageBox.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
        messageBox.style.color = 'white';
        messageBox.style.border = '1px solid rgba(255,255,255,0.2)';
    }
    messageBox.classList.add('show');
    setTimeout(() => {
        messageBox.classList.remove('show');
    }, duration);
}

export function showProgressStartup(progress: number, source: 'local' | 'online') {
    const messageBox = document.getElementById('messageBox') as HTMLElement;
    if (!messageBox) return;
    
    const sourceText = source === 'local' ? '📍 Laddar lokalt' : '☁️ Laddar online';
    messageBox.innerHTML = `<div class="text-center">
        <div>${sourceText}</div>
        <div class="text-sm mt-1">${progress}% färdigt</div>
        <div class="w-full bg-gray-600 rounded-full h-2 mt-2 overflow-hidden">
            <div class="h-full bg-blue-500" style="width: ${progress}%"></div>
        </div>
    </div>`;
    messageBox.style.backgroundColor = 'rgba(59, 130, 246, 0.9)';
    messageBox.style.color = 'white';
    messageBox.classList.add('show');
}

export function updateButtonProgress(
    state: 'idle' | 'loading' | 'local_search' | 'ai_refine' | 'success'
) {
    const convertBtn = document.getElementById('convertBtn') as HTMLButtonElement;
    const analysisStatus = document.getElementById('analysisStatus') as HTMLElement;
    const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
    const cancelSearchBtn = document.getElementById('cancelSearchBtn') as HTMLButtonElement;
    const analysisContainer = document.getElementById('analysisContainer') as HTMLElement;
    const originalTextDisplay = document.getElementById('originalTextDisplay') as HTMLElement;
    const wrapper = document.querySelector('.input-aurora-wrapper');

    if (!convertBtn || !analysisStatus || !clearBtn || !cancelSearchBtn) return;

    const originalText = 'Sök';
    const states = {
        idle: { html: `<span>${originalText}</span>`, disabled: false, showStatus: false, searching: false },
        loading: { html: `${ICON_LOADING_SVG} <span>Startar...</span>`, disabled: true, showStatus: true, searching: true },
        local_search: { html: `${ICON_LOADING_SVG} <span>Snabbsöker...</span>`, disabled: true, showStatus: true, searching: true },
        ai_refine: { html: `${ICON_LOADING_SVG} <span>Förfinar med AI...</span>`, disabled: true, showStatus: true, searching: true },
        success: { html: `<span>Klart!</span>`, disabled: true, showStatus: false, searching: false }
    };
    
    const currentState = states[state];
    
    convertBtn.disabled = currentState.disabled;
    clearBtn.disabled = currentState.disabled;
    convertBtn.innerHTML = currentState.html;

    // Toggle Aurora Animation
    if (wrapper) {
        if (currentState.searching) {
            wrapper.classList.add('is-searching');
        } else {
            wrapper.classList.remove('is-searching');
        }
    }

    if (currentState.showStatus) {
        analysisStatus.innerHTML = currentState.html; // Use the same html
        if (analysisContainer) analysisContainer.classList.remove('hidden');
        cancelSearchBtn.classList.remove('hidden');
    } else {
        if (analysisContainer) analysisContainer.classList.add('hidden');
        cancelSearchBtn.classList.add('hidden');
    }

    if (state === 'success') {
        setTimeout(() => updateButtonProgress('idle'), 1500);
    } else if (state === 'idle') {
        const isOnline = navigator.onLine;
        const btnSpan = convertBtn.querySelector('span');
        if (!isOnline) {
            convertBtn.disabled = true;
            if (btnSpan) btnSpan.textContent = 'Offline';
        } else {
             const hasText = originalTextDisplay && originalTextDisplay.innerText?.trim() && originalTextDisplay.innerText !== originalTextDisplay.dataset.placeholder;
             convertBtn.disabled = !hasText;
             if (btnSpan) btnSpan.textContent = originalText;
        }
    }
}
