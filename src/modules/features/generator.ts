
import { closeModal } from '../../components/modals';
import { showMessage, updateButtonProgress, originalTextDisplay } from '../../ui';
import { generateSentencesWithAI } from '../../hooks/useAI';
import { processAndRenderText } from './search';

export async function handleGenerateSentences(type: 'static' | 'ai', count: number) {
    const modal = document.getElementById('generateTextModal') as HTMLElement;
    if (!modal) return;

    let sentences: string[] | null = null;
    const oldTextContent = originalTextDisplay.textContent || '';
    
    closeModal(modal);

    if (type === 'static') {
        const staticSentences = [
            "Hej hur mår du idag?",
            "Jag älskar att lära mig teckenspråk.",
            "Vad vill du äta till middag?",
            "Solen skiner och fåglarna sjunger.",
            "Kan du hjälpa mig med den här uppgiften?",
            "Det är viktigt att kommunicera tydligt.",
            "Har du sett min nya bok?",
            "Jag gillar att promenera i skogen.",
            "Varför är himlen blå på dagen?",
            "Jag vill köpa en stor glass.",
            "Min familj bor i Stockholm.",
            "Vad heter du?",
            "Jag arbetar som lärare.",
            "Hur gammal är du?",
            "Var bor du någonstans?",
            "Jag tycker om att läsa böcker.",
            "Vilken färg gillar du bäst?",
            "Kan du visa mig vägen?",
            "Tack så mycket för hjälpen.",
            "Jag förstår inte vad du menar.",
            "Snälla upprepa det igen.",
            "Var ligger biblioteket?",
            "Klockan är fem.",
            "Jag är hungrig.",
            "Vill du ha kaffe eller te?",
            "Det regnar ute idag.",
            "Jag har en hund som heter Max.",
            "Vi ses imorgon!",
            "God morgon!",
            "God natt och sov gott.",
            "Jag lär mig svenska.",
            "Hur säger man det på teckenspråk?",
            "Kan du teckna långsammare?",
            "Jag behöver hjälp.",
            "Var är toaletten?",
            "Hur mycket kostar det?",
            "Jag kommer från Sverige.",
            "Vad jobbar du med?",
            "Vilken dag är det idag?",
            "Jag gillar att titta på film.",
        ];
        sentences = staticSentences.sort(() => 0.5 - Math.random()).slice(0, count);
        showMessage(`Genererade ${count} exempel-meningar.`, 'success');
    } else if (type === 'ai') {
        const loadingMessage = `AI genererar ${count} meningar... Detta kan ta en stund.`;
        if (originalTextDisplay) originalTextDisplay.textContent = loadingMessage;
        updateButtonProgress('ai_refine');

        try {
            sentences = await generateSentencesWithAI(count);
            if (sentences) {
                showMessage(`AI genererade ${count} meningar.`, 'success');
            } else {
                if (originalTextDisplay) originalTextDisplay.textContent = oldTextContent;
            }
        } catch (error) {
            if (originalTextDisplay) originalTextDisplay.textContent = oldTextContent;
        }
    }

    if (sentences) {
        const newText = sentences.join(' ');
        if (originalTextDisplay) {
            originalTextDisplay.textContent = newText;
            originalTextDisplay.classList.add('text-area-editable');
        }
        await processAndRenderText(newText);
    } else {
        updateButtonProgress('idle');
    }
}
