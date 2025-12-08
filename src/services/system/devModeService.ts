/**
 * Dev Mode Service - Check if developer mode is enabled
 * Dev mode is activated via secret URL parameter: ?dev=hemlig
 * Puter.js only loads in dev mode
 */

let devModeActive = false;
let puterLoaded = false;

export function initDevMode(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const devParam = urlParams.get('dev');
    
    if (devParam === 'hemlig') {
        devModeActive = true;
        localStorage.setItem('devMode', 'true');
        console.log('🔧 Dev mode activated via URL parameter');
    } else if (localStorage.getItem('devMode') === 'true') {
        devModeActive = true;
        console.log('🔧 Dev mode active from localStorage');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            applyDevModeVisibility();
            if (devModeActive) loadPuterJs();
        });
    } else {
        applyDevModeVisibility();
        if (devModeActive) loadPuterJs();
    }
    
    setTimeout(() => applyDevModeVisibility(), 100);
}

function loadPuterJs(): void {
    if (puterLoaded) return;
    
    console.log('🔧 Loading Puter.js for dev mode...');
    
    const script1 = document.createElement('script');
    script1.src = 'https://js.puter.com/v2/';
    script1.onload = () => {
        console.log('✅ Puter.js v2 loaded');
        puterLoaded = true;
    };
    document.head.appendChild(script1);
    
    const script2 = document.createElement('script');
    script2.src = 'https://cdn.jsdelivr.net/npm/@puter/puter@latest/dist/puter.min.js';
    script2.onload = () => {
        console.log('✅ Puter SDK loaded');
    };
    document.head.appendChild(script2);
}

export function isDevMode(): boolean {
    return devModeActive;
}

export function toggleDevMode(enabled: boolean): void {
    devModeActive = enabled;
    localStorage.setItem('devMode', enabled ? 'true' : 'false');
    applyDevModeVisibility();
    
    if (enabled && !puterLoaded) {
        loadPuterJs();
    }
}

export function exitDevMode(): void {
    devModeActive = false;
    localStorage.removeItem('devMode');
    applyDevModeVisibility();
}

export function applyDevModeVisibility(): void {
    console.log('🔧 Applying dev mode visibility:', devModeActive ? 'ON' : 'OFF');
    
    const devOnlyElements = document.querySelectorAll('.dev-only');
    devOnlyElements.forEach(el => {
        (el as HTMLElement).style.display = devModeActive ? '' : 'none';
    });
    
    const aiContainer = document.getElementById('aiModeContainer');
    if (aiContainer) {
        aiContainer.style.display = devModeActive ? 'flex' : 'none';
    }
    
    const askAiBtn = document.getElementById('askAiAboutStsBtn');
    if (askAiBtn) {
        askAiBtn.style.display = devModeActive ? 'flex' : 'none';
    }
    
    const devModeToggle = document.getElementById('devModeToggle');
    if (devModeToggle) {
        const container = devModeToggle.closest('.border-t');
        if (container) (container as HTMLElement).style.display = devModeActive ? 'block' : 'none';
        (devModeToggle as HTMLInputElement).checked = devModeActive;
    }
}
