// Modal för Korpus-sökning
// Visar sökfält, lista och video för Korpus.json

const korpusModalHtml = `
  <div id="korpusModal" class="korpus-modal hidden">
    <div class="korpus-modal-content">
      <div class="korpus-modal-header">
        <span class="korpus-modal-title">Korpus</span>
        <button id="korpusModalClose" class="korpus-modal-close">&times;</button>
      </div>
      <input type="text" id="korpusSearchInput" class="korpus-modal-search" placeholder="Sök i korpus...">
      <div id="korpusResultList" class="korpus-modal-list"></div>
      <div id="korpusVideoContainer" class="korpus-modal-video"></div>
    </div>
  </div>
`;

export function setupKorpusModal() {
  // Lägg till modal i body om den inte finns
  if (!document.getElementById('korpusModal')) {
    document.body.insertAdjacentHTML('beforeend', korpusModalHtml);
  }

  const modal = document.getElementById('korpusModal');
  const closeBtn = document.getElementById('korpusModalClose');
  const searchInput = document.getElementById('korpusSearchInput') as HTMLInputElement;
  const resultList = document.getElementById('korpusResultList');
  const videoContainer = document.getElementById('korpusVideoContainer');
  const korpusBtn = document.getElementById('korpusBtn');

  if (!modal || !closeBtn || !searchInput || !resultList || !videoContainer || !korpusBtn) return;

  // Öppna modal
  korpusBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
    searchInput.value = '';
    resultList.innerHTML = '';
    videoContainer.innerHTML = '';
    searchInput.focus();
  });

  // Stäng modal
  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    resultList.innerHTML = '';
    videoContainer.innerHTML = '';
  });

  // Sökfunktion
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim().toLowerCase();
    resultList.innerHTML = '';
    videoContainer.innerHTML = '';
    if (!query) return;
    // Ladda korpusdata
    let korpusData: any[] = [];
    try {
      const res = await fetch('/data/god_korpus/Korpus.json');
      korpusData = await res.json();
    } catch (e) {
      resultList.innerHTML = '<div class="korpus-modal-error">Kunde inte ladda korpusdata.</div>';
      return;
    }
    // Filtrera på alla översättning-fält (case-insensitive)
    const results = korpusData.filter(item => {
      return Object.keys(item).some(key =>
        key.toLowerCase().startsWith('översättning') &&
        typeof item[key] === 'string' &&
        item[key].toLowerCase().includes(query)
      );
    });
    if (results.length === 0) {
      resultList.innerHTML = '<div class="korpus-modal-empty">Inga träffar.</div>';
      return;
    }
    // Visa endast unika filnamn som lista
    const uniqueFiles = Array.from(new Set(results.map(item => item.filnamn)));
    resultList.innerHTML = uniqueFiles.map(filnamn => {
      // Hämta första matchande item för denna filnamn (för video)
      const item = results.find(i => i.filnamn === filnamn);
      return `
        <div class="korpus-modal-item" data-id="${item?.unikanummer || ''}" data-word="${item?.ord || ''}">
          <div><b>${filnamn}</b></div>
        </div>
      `;
    }).join('');
    // Klick på item visar video (om info finns)
    resultList.querySelectorAll('.korpus-modal-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.id || '';
        const word = (el as HTMLElement).dataset.word || '';
        if (!id || !word) return;
        const xx = id.padStart(5, '0').slice(0,2);
        const videoUrl = `https://teckensprakslexikon.su.se/movies/${xx}/180x180/${word}-${id.padStart(5, '0')}-tecken.mp4`;
        videoContainer.innerHTML = `<video src="${videoUrl}" controls autoplay style="max-width:320px; margin-top:1em;"></video>`;
      });
    });
  });
}
