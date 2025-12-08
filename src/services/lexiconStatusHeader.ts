export function initLexiconStatusHeader() {
    const localBar = document.getElementById('local-progress-bar-header');
    const onlineBar = document.getElementById('online-progress-bar-header');
    const localPct = document.getElementById('local-pct-header');
    const onlinePct = document.getElementById('online-pct-header');
    
    window.addEventListener('lexicon-progress', ((e: any) => {
        const { local, online } = e.detail || {};
        if (local !== undefined && localBar && localPct) {
            localBar.style.width = local + '%';
            localPct.textContent = local + '%';
        }
        if (online !== undefined && onlineBar && onlinePct) {
            onlineBar.style.width = online + '%';
            onlinePct.textContent = online + '%';
        }
    }) as EventListener);
}
