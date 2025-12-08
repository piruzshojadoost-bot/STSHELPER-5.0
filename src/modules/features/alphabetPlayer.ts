
import { alphabetSignsMap } from '../../state';
import { Sign } from '../../types';
import { buildVideoUrl, showMessage } from '../../ui';
import { openModal, closeModal } from '../../components/modals/ModalSystem';

let alphabetSequence: { sign: Sign, letter: string }[] = [];
let currentSequenceIndex = 0;
let isSequencePlaying = false;
let sequencePlayer: HTMLVideoElement | null;
let sequenceLetterEl: HTMLElement | null;
let playPauseBtn: HTMLButtonElement | null;
let prevBtn: HTMLButtonElement | null;
let nextBtn: HTMLButtonElement | null;

function setupAlphabetSequence() {
    alphabetSequence = [...alphabetSignsMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b, 'sv'))
        .map(([letter, signs]) => ({ sign: signs[0], letter: letter.toUpperCase() }));
    currentSequenceIndex = 0;
    isSequencePlaying = true;
}

function playCurrentSequenceVideo() {
    if (!sequencePlayer || !playPauseBtn || !prevBtn || !nextBtn || !sequenceLetterEl) return;

    if (alphabetSequence.length === 0) {
        showMessage("Alfabetet har inte laddats än.", "error");
        return;
    }
    
    const { sign, letter } = alphabetSequence[currentSequenceIndex];
    // const errorEl = document.getElementById('alphabetSequenceVideoError') as HTMLElement; // Kan läggas till vid behov för felhantering

    sequencePlayer.src = buildVideoUrl(sign.id, sign.word);
    sequenceLetterEl.textContent = letter;
    
    playPauseBtn.textContent = 'Pausa';
    isSequencePlaying = true;
    
    prevBtn.disabled = currentSequenceIndex === 0;
    nextBtn.disabled = currentSequenceIndex === alphabetSequence.length - 1;

    sequencePlayer.play().catch(e => console.error("Sequence play failed", e));
}

function handlePlayPauseSequence() {
    if (!sequencePlayer || !playPauseBtn) return;
    if (isSequencePlaying) {
        sequencePlayer.pause();
        playPauseBtn.textContent = 'Spela';
    } else {
        sequencePlayer.play();
        playPauseBtn.textContent = 'Pausa';
    }
    isSequencePlaying = !isSequencePlaying;
}

function handleNextSequence() {
    if (currentSequenceIndex < alphabetSequence.length - 1) {
        currentSequenceIndex++;
        playCurrentSequenceVideo();
    } else {
        isSequencePlaying = false;
        if(playPauseBtn) playPauseBtn.textContent = 'Spela om';
    }
}

function handlePrevSequence() {
    if (currentSequenceIndex > 0) {
        currentSequenceIndex--;
        playCurrentSequenceVideo();
    }
}

export function initializeAlphabetModals() {
    const playAlphabetSequenceBtn = document.getElementById('playAlphabetSequenceBtn') as HTMLButtonElement;
    const alphabetModal = document.getElementById('alphabetModal') as HTMLElement;
    const alphabetSequenceModal = document.getElementById('alphabetSequenceModal') as HTMLElement;

    sequencePlayer = document.getElementById('alphabetSequencePlayer') as HTMLVideoElement;
    sequenceLetterEl = document.getElementById('alphabetSequenceLetter') as HTMLElement;
    playPauseBtn = document.getElementById('playPauseAlphabetBtn') as HTMLButtonElement;
    prevBtn = document.getElementById('prevAlphabetBtn') as HTMLButtonElement;
    nextBtn = document.getElementById('nextAlphabetBtn') as HTMLButtonElement;

    if (!playAlphabetSequenceBtn || !alphabetModal || !alphabetSequenceModal || !sequencePlayer) return;

    playAlphabetSequenceBtn.addEventListener('click', (e) => {
        setupAlphabetSequence();
        closeModal(alphabetModal);
        openModal(alphabetSequenceModal, e.currentTarget as HTMLElement);
        playCurrentSequenceVideo();
    });

    sequencePlayer.addEventListener('ended', handleNextSequence);
    playPauseBtn.addEventListener('click', handlePlayPauseSequence);
    nextBtn.addEventListener('click', handleNextSequence);
    prevBtn.addEventListener('click', handlePrevSequence);

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class' && !(alphabetSequenceModal.classList.contains('show'))) {
                sequencePlayer?.pause();
                isSequencePlaying = false;
            }
        });
    });
    observer.observe(alphabetSequenceModal, { attributes: true });
}
