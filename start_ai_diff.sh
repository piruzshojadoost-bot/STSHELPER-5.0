#!/bin/bash
# Detta script gör din AI "smart" direkt genom att mata den med prompt + minne + diff

PROMPT_FILE="ai_prompts/mega_prompt.txt"
MEMORY_FILE=".ai_project_memory.txt"

echo "=================================================="
echo "🤖 LADDAR REPLIT-MODE FÖR COPILOT..."
echo "=================================================="
echo ""
echo "--- [1] DIN MEGA PROMPT ---"
cat "$PROMPT_FILE"
echo ""
echo "--------------------------------------------------"
echo ""
echo "--- [2] PROJEKTETS MINNE (FILSTRUKTUR) ---"
if [ -f "$MEMORY_FILE" ]; then
    cat "$MEMORY_FILE"
else
    echo "⚠️ Ingen minnesfil hittad. AI kommer skapa en ny."
    # Generera en lista nu om den saknas
    find . -maxdepth 3 -not -path '*/.*' -not -path './node_modules*'
fi
echo ""
echo "--------------------------------------------------"
echo ""
echo "✅ KLART! Markera allt ovanför denna rad, kopiera och klistra in i Copilot Chat."
echo "=================================================="
