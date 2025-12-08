
export const FEEDBACK_SUMMARY_PREFIX = "Inlärningssammanfattning för STS-helper:";

export function activateFeedbackButton() {
    updateFeedbackBadge();
    
    const feedbackBtn = document.getElementById('feedbackNavBtn');
    if (feedbackBtn) {
        feedbackBtn.classList.add('glow-attention');
    }
}

export function updateFeedbackBadge(count?: number) {
    const badge = document.getElementById('feedbackBadge');
    if (!badge) return;
    
    let feedbackCount = count;
    
    if (feedbackCount === undefined) {
        try {
            const stored = localStorage.getItem('sts-feedback-collection');
            if (stored) {
                const items = JSON.parse(stored);
                feedbackCount = Array.isArray(items) ? items.length : 0;
            } else {
                feedbackCount = 0;
            }
        } catch {
            feedbackCount = 0;
        }
    }
    
    if (feedbackCount > 0) {
        badge.textContent = feedbackCount > 99 ? '99+' : feedbackCount.toString();
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

export function clearFeedbackGlow() {
    const feedbackBtn = document.getElementById('feedbackNavBtn');
    if (feedbackBtn) {
        feedbackBtn.classList.remove('glow-attention');
    }
}
