import puppeteer from 'puppeteer';

// Ta URL som argument, annars default
const url = process.argv[2] || 'https://teckensprakskorpus.su.se/video/sslc01_004.eaf?q=HEJ&t=23280&id=42021113';

const TIERS = [
  'Glosa_DH S1',
  'Glosa_NonDH S1',
  'Översättning S1',
  'Glosa_DH S2',
  'Glosa_NonDH S2',
  'Översättning S2',
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  // Extrahera blocksdata-variabeln från sidan
  const blocksdata = await page.evaluate(() => {
    // @ts-ignore
    return typeof blocksdata !== 'undefined' ? blocksdata : null;
  });

  if (!blocksdata) {
    console.log('Ingen blocksdata hittades.');
    await browser.close();
    return;
  }

  // Samla ord/meningar för varje tier
  const result = {};
  for (const tier of TIERS) {
    result[tier] = [];
  }

  for (const block of blocksdata) {
    if (block.tier && TIERS.includes(block.tier) && block.annotations) {
      for (const ann of block.annotations) {
        if (ann.t) {
          result[block.tier].push(ann.t);
        }
      }
    }
  }

  for (const tier of TIERS) {
    console.log(`\n${tier}:`);
    if (result[tier].length > 0) {
      for (const t of result[tier]) {
        console.log(t);
      }
    } else {
      console.log('(Inga ord/meningar)');
    }
  }

  await browser.close();
})();
