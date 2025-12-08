
import { appState } from '../../state';
import { delay } from '../../utils';

/**
 * Öppnar ett modalfönster och hanterar fokus.
 * @param modalElement HTML-elementet för modalen som ska öppnas.
 * @param openerElement Elementet som öppnade modalen, för att återställa fokus vid stängning.
 */
export function openModal(modalElement: HTMLElement, openerElement: HTMLElement | null = null) {
    if (!modalElement) return;
    
    // Spara elementet som öppnade modalen för att kunna återställa fokus
    appState.activeModalOpener = openerElement || (document.activeElement as HTMLElement);
    
    modalElement.classList.add('show');
    modalElement.setAttribute('aria-hidden', 'false');

    // Hitta första fokuserbara elementet i modalen och ge det fokus.
    // Vi väntar en kort stund för att säkerställa att modalen är synlig och CSS-övergångar har startat.
    delay(100).then(() => {
        const focusableElements = modalElement.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = Array.from(focusableElements).find(
            el => !el.closest('.modal-close-btn') && !el.classList.contains('hidden') && el.offsetParent !== null
        );
        
        firstFocusable?.focus();
    });
}

/**
 * Stänger ett aktivt modalfönster och återställer fokus till elementet som öppnade det.
 * @param modalElement HTML-elementet för modalen som ska stängas.
 */
export function closeModal(modalElement: HTMLElement) {
    if (!modalElement || !modalElement.classList.contains('show')) return;

    modalElement.classList.remove('show');
    modalElement.setAttribute('aria-hidden', 'true');

    // Återställ fokus till det ursprungliga elementet om det finns.
    if (appState.activeModalOpener && typeof appState.activeModalOpener.focus === 'function') {
        // En liten fördröjning säkerställer att modalen är helt stängd innan fokus flyttas tillbaka.
        delay(150).then(() => {
            appState.activeModalOpener?.focus();
            appState.activeModalOpener = null;
        });
    }
}

/**
 * Initierar det globala modalsystemet. Sätter upp event listeners för att
 * stänga modaler via Escape-tangenten eller specifika stängningsknappar.
 */
export function initializeModalSystem() {
    // Hantera klick på stängningsknappar
    document.body.addEventListener('click', (e) => {
        const closeButton = (e.target as HTMLElement).closest('[data-modal-close]');
        if (closeButton) {
            const modalElement = closeButton.closest('.modal') as HTMLElement;
            if (modalElement) {
                closeModal(modalElement);
            }
        }
    });

    // Hantera Escape-tangenten för att stänga den översta modalen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModalElement = document.querySelector('.modal.show') as HTMLElement;
            if (openModalElement) {
                closeModal(openModalElement);
            }
        }
    });
}
