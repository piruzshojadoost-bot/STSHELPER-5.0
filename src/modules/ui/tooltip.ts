
export function showTooltip(text: string, target: HTMLElement) {
    let tooltip = document.getElementById('tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        // Basic styles ensuring visibility, specific styling handled by CSS
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '10000';
        document.body.appendChild(tooltip);
    }

    tooltip.innerHTML = text;
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';

    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = rect.bottom + 8;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

    // Boundary checks to keep tooltip on screen
    if (left < 4) left = 4;
    if (left + tooltipRect.width > window.innerWidth - 4) {
        left = window.innerWidth - tooltipRect.width - 4;
    }
    if (top + tooltipRect.height > window.innerHeight - 4) {
        top = rect.top - tooltipRect.height - 8; // Flip to top if no space below
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}

export function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.style.visibility = 'hidden';
        tooltip.style.opacity = '0';
    }
}

export function initializeTooltips() {
    // Global delegation for performance and dynamic elements
    document.body.addEventListener('mouseover', (e) => {
        const target = (e.target as HTMLElement).closest('[data-tooltip-text]') as HTMLElement;
        if (target) {
            showTooltip(target.dataset.tooltipText || '', target);
        }
    });

    document.body.addEventListener('mouseout', (e) => {
        const target = (e.target as HTMLElement).closest('[data-tooltip-text]');
        if (target) {
            hideTooltip();
        }
    });
    
    // Hide on scroll/click/focus change to prevent stuck tooltips
    window.addEventListener('scroll', hideTooltip, true);
    document.addEventListener('click', hideTooltip);
    document.addEventListener('focusin', hideTooltip);
}
