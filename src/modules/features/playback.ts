
import { appState } from '../../state';

const playAllBtn = document.getElementById('playAllBtn') as HTMLButtonElement;
const videoGrid = document.getElementById('videoGrid') as HTMLElement;

let stopPlayAllFn = () => {};

export async function playSequence(cards: HTMLElement[]) {
    appState.isPlayingAll = true;
    if (playAllBtn) playAllBtn.textContent = 'Stoppa';
    
    let shouldStop = false;
    stopPlayAllFn = () => { shouldStop = true; };

    for (const card of cards) {
        if (shouldStop) break;

        const video = card.querySelector('video');
        if (video) {
            video.muted = true; 
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            video.currentTime = 0;
            
            const playPromise = video.play();
            
            const endedPromise = new Promise(resolve => {
                const onEnded = () => {
                    video.removeEventListener('ended', onEnded);
                    resolve(true);
                };
                video.addEventListener('ended', onEnded);
                
                // Update the stopper to also resolve this promise
                const originalStopper = stopPlayAllFn;
                stopPlayAllFn = () => {
                    originalStopper(); // call the flag setter
                    video.pause();
                    video.currentTime = 0;
                    card.classList.remove('is-playing-all');
                    video.removeEventListener('ended', onEnded);
                    resolve(false); 
                };
            });
            
            card.classList.add('is-playing-all');
            await playPromise;
            await endedPromise;

            card.classList.remove('is-playing-all');
        }
    }
    
    appState.isPlayingAll = false;
    if (playAllBtn) playAllBtn.textContent = 'Spela Alla';
    stopPlayAllFn = () => {}; 
}

export function handlePlayAll() {
    if (appState.isPlayingAll) {
        stopPlayAllFn();
    } else {
        if (!videoGrid) return;
        const visibleCards = Array.from(videoGrid.querySelectorAll<HTMLElement>('.video-card:not(.video-card-no-sign)'));
        if (visibleCards.length > 0) {
            playSequence(visibleCards);
        }
    }
}

export function stopPlayAll() {
    stopPlayAllFn();
}
