// Script: check_video_links.js
// Läser lexikon från snabb-mapp, bygger videolänkar och testar om video finns
// Kör: node scripts/check_video_links.js

const fs = require('fs');
const path = require('path');
const https = require('https');

// Hitta alla lexikonfiler automatiskt i snabb-mappen
const SNABB_DIR = 'snabb';
let LEXICON_FILES = [];
try {
  LEXICON_FILES = fs.readdirSync(path.resolve(SNABB_DIR))
    .filter(f => f.startsWith('lexikon_sammanslagen_del_') && f.endsWith('.json'))
    .map(f => path.join(SNABB_DIR, f));
  if (LEXICON_FILES.length === 0) {
    console.error('Inga lexikonfiler hittades i', SNABB_DIR);
  }
} catch (err) {
  console.error('Kunde inte läsa mappen', SNABB_DIR, err);
}

function buildVideoUrl(word, id) {
  const xx = id.substring(0, 2);
  // Specialfall-mappning
  const specialCases = {
    'andraspråk': 'l2',
    // Lägg till fler specialfall här vid behov
  };
  let wordForUrl;
  if (specialCases[word.toLowerCase()]) {
    wordForUrl = specialCases[word.toLowerCase()];
  } else {
    wordForUrl = word.toLowerCase()
      .replace(/å|ä/g, 'a')
      .replace(/ö/g, 'o');
    // Ersätt alla sekvenser av mellanslag och bindestreck mellan siffror med ett bindestreck
    wordForUrl = wordForUrl.replace(/\s*[- ]\s*/g, '-');
    // Ta bort allt utom bokstäver, siffror och bindestreck
    wordForUrl = wordForUrl.replace(/[^a-z0-9\-]/g, '');
    // Ta bort flera bindestreck i rad
    wordForUrl = wordForUrl.replace(/-+/g, '-');
    // Ta bort bindestreck i början/slut
    wordForUrl = wordForUrl.replace(/^[-]+|[-]+$/g, '');
  }
  return `https://teckensprakslexikon.su.se/movies/${xx}/180x180/${wordForUrl}-${id}-tecken.mp4`;
}

function checkVideo(url) {
  return new Promise(resolve => {
    try {
      https.get(url, res => {
        resolve(res.statusCode === 200);
      }).on('error', () => resolve(false));
    } catch (err) {
      resolve(false);
    }
  });
}

async function main() {
  let allEntries = [];
  for (const file of LEXICON_FILES) {
    try {
      if (!fs.existsSync(path.resolve(file))) {
        console.error('Lexikonfil saknas:', file);
        continue;
      }
      const raw = fs.readFileSync(path.resolve(file), 'utf8');
      const data = JSON.parse(raw);
      if (!data.lexicon) {
        console.error('Ingen lexicon-lista i:', file);
        continue;
      }
      allEntries = allEntries.concat(data.lexicon);
    } catch (err) {
      console.error('Fel vid läsning/parsing av', file, err);
    }
  }
  console.log(`Totalt ${allEntries.length} lexikonposter.`);
    let found = [], missing = [];
    const maxParallel = 10;
    let index = 0;
    async function runBatch() {
      const batch = [];
      for (let j = 0; j < maxParallel && index < allEntries.length; j++, index++) {
        const { word, id } = allEntries[index];
        const url = buildVideoUrl(word, id);
        batch.push(
          checkVideo(url).then(ok => {
            if (ok) found.push(id);
            else missing.push(id);
            console.log(`${id}: ${ok ? 'OK' : 'saknas'} - ${url}`);
          }).catch(err => {
            console.error(`Fel vid test av video ${id}:`, err);
          })
        );
      }
      await Promise.all(batch);
      if (index < allEntries.length) {
        await runBatch();
      }
    }
    await runBatch();
  console.log(`\nFungerande video-id: ${found.join(', ')}`);
  console.log(`Saknade video-id: ${missing.join(', ')}`);
  // Spara resultat till fil
  const result = {
    date: new Date().toISOString(),
    found,
    missing
  };
  fs.writeFileSync('video_check_results.json', JSON.stringify(result, null, 2), 'utf8');
  console.log('Resultat sparat i video_check_results.json');
}

main();
