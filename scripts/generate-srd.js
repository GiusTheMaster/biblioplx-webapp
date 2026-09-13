// scripts/generate-srd.js
// Fetch SRD spell lists and magic items from BTMorton dnd-5e-srd JSON files
// Generate a single all-skeletons.json containing spells and items skeletons

const fs = require('fs').promises;
const path = require('path');

const SPELLCASTING_URL = 'https://raw.githubusercontent.com/BTMorton/dnd-5e-srd/master/json/08%20spellcasting.json';
const ITEMS_URL = 'https://raw.githubusercontent.com/BTMorton/dnd-5e-srd/master/json/10%20magic%20items.json';

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

function parseSpellLists(data) {
  // data is the content of 08 spellcasting.json
  const lists = (data && data.Spellcasting && data.Spellcasting['Spell Lists']) || {};
  const spellsMap = new Map();

  for (const className of Object.keys(lists)) {
    const classObj = lists[className];
    for (const levelKey of Object.keys(classObj)) {
      const levelArr = classObj[levelKey];
      if (!Array.isArray(levelArr)) continue;
      // Determine level number from levelKey
      let lvl = 0;
      if (/cantrip/i.test(levelKey) || /0/.test(levelKey)) lvl = 0;
      else {
        const m = levelKey.match(/(\d+)/);
        if (m) lvl = parseInt(m[1], 10);
        else lvl = 0;
      }

      levelArr.forEach(name => {
        if (!name || typeof name !== 'string') return;
        const key = name.toLowerCase();
        if (!spellsMap.has(key)) {
          spellsMap.set(key, {
            id: `srd-${slugify(name)}`,
            nome: name,
            livello: lvl,
            scuola: '',
            tempo: '',
            gittata: '',
            comp: '',
            note: 'scheletro SRD - traduzione/descrizione non inclusa'
          });
        } else {
          // prefer lowest level if multiple classes list different levels
          const existing = spellsMap.get(key);
          if ((existing.livello || 99) > lvl) existing.livello = lvl;
        }
      });
    }
  }

  return Array.from(spellsMap.values());
}

function parseItems(itemsJson) {
  // itemsJson may be an array of objects or an object with entries
  const itemsArr = Array.isArray(itemsJson) ? itemsJson : (itemsJson.items || []);
  const out = itemsArr.map(it => {
    const name = it.name || it.nome || (typeof it === 'string' ? it : 'Item');
    return {
      id: `srd-item-${slugify(name)}`,
      nome: name,
      rarita: (it.rarity || '').toLowerCase(),
      tipo: (it.type || it.tipo || '').toLowerCase(),
      desc: '',
      note: 'scheletro SRD - descrizione non inclusa'
    };
  });
  return out;
}

async function main() {
  console.log('Fetching spell lists...');
  const spellData = await fetchJson(SPELLCASTING_URL);
  console.log('Parsing spells...');
  const spells = parseSpellLists(spellData);
  console.log(`Found ${spells.length} unique spells from SRD lists.`);

  console.log('Fetching magic items...');
  let items = [];
  try {
    const itemsJson = await fetchJson(ITEMS_URL);
    items = parseItems(itemsJson);
    console.log(`Found ${items.length} items.`);
  } catch (e) {
    console.warn('Failed to fetch/parse items:', e.message);
  }

  const out = {
    generated_at: new Date().toISOString(),
    source: {
      repo: 'BTMorton/dnd-5e-srd',
      urls: [SPELLCASTING_URL, ITEMS_URL]
    },
    spells,
    items
  };

  const outPath = path.join(process.cwd(), 'all-skeletons-srd-phb.json');
  await fs.writeFile(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', outPath);
}

main().catch(err => { console.error(err); process.exit(1); });
