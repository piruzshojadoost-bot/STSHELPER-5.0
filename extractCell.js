
import axios from 'axios';
import * as cheerio from 'cheerio';

const url = 'https://teckensprakskorpus.su.se/video/sslc01_004.eaf?q=HEJ&t=23280&id=42021113';

axios.get(url).then(response => {
  const $ = cheerio.load(response.data);
  for (let i = 545; i <= 553; i++) {
    const cell = $(`body > table > tbody > tr:nth-child(${i}) > td.line-content`);
    console.log(`Rad ${i}:`, cell.text().trim() || 'Ingen träff');
  }
}).catch(err => {
  console.error('Fel vid hämtning:', err);
});
