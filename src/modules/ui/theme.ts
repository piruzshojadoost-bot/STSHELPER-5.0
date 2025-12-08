
import { appState } from '../../state';
import { showMessage } from '../../ui';

const accessibilityToolbar = document.getElementById('accessibilityToolbar') as HTMLElement;

// Uppdatera ikoner baserat på aktuellt tema
function updateThemeIcons(theme: 'light' | 'dark') {
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    
    if (!sunIcon || !moonIcon) return;

    if (theme === 'light') {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
    } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }
}

export function setTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcons(theme);
}

export function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (!themeToggleBtn) return;

    // Sätt initialt värde baserat på localStorage eller default 'dark'
    const currentTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    // Force update of icons immediately
    updateThemeIcons(currentTheme);
    setTheme(currentTheme);

    themeToggleBtn.onclick = () => {
        const activeTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
        const newTheme = activeTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };
}

export function toggleAccessibilityMode() {
    const htmlEl = document.documentElement;
    htmlEl.classList.toggle('accessibility-mode');
    const isActive = htmlEl.classList.contains('accessibility-mode');
    appState.isAccessibilityModeActive = isActive;
    localStorage.setItem('accessibilityMode', isActive.toString());
    
    showMessage(`Tillgänglighetsläge ${isActive ? 'aktiverat' : 'avaktiverat'}.`, 'success');
    if (isActive) {
        if (accessibilityToolbar) accessibilityToolbar.classList.remove('hidden');
    } else {
        if (accessibilityToolbar) accessibilityToolbar.classList.add('hidden');
    }
}

export function initTheme() {
    setupThemeToggle();
    
    if (localStorage.getItem('accessibilityMode') === 'true') {
        document.documentElement.classList.add('accessibility-mode');
        appState.isAccessibilityModeActive = true;
        if (accessibilityToolbar) accessibilityToolbar.classList.remove('hidden');
    } else {
        document.documentElement.classList.remove('accessibility-mode');
        appState.isAccessibilityModeActive = false;
        if (accessibilityToolbar) accessibilityToolbar.classList.add('hidden');
    }
}
