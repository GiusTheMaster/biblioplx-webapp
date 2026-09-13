// srd-import.js
// Fetch SRD JSON (English) and import into app data in batches of 20.
// Source used: bagelbits/5e-database raw JSON for SRD spells and SRD magic items.
// The script normalizes fields to the app schema and stores items/spells in localStorage.

const SRD_SPELLS_URL = 'https://raw.githubusercontent.com/bagelbits/5e-database/master/src/5e-SRD-Spells.json';
const SRD_ITEMS_URL = 'https://raw.githubusercontent.com/bagelbits/5e-database/master/src/5e-SRD-MagicItems.json';

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

// Minimal name translation map (can be extended)
// For now we provide common mappings; missing names will keep the original English name.
const nameTranslations = {
  "Magic Missile": "Dardo Incantato",
  "Fireball": "Palla di Fuoco",
  "Alarm": "Allarme",
  "Light": "Luce",
  "Cure Wounds": "Cura Ferite",
  "Mage Armor": "Armatura magica",
  // add more mappings here as needed
};

function translateName(enName) {
  // prefer exact match; fallback to original
  return nameTranslations[enName] || enName;
}

function normalizeSpell(s) {
  // s: spell object from the SRD JSON source
  return {
    id: s.slug || (s.name && s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || ('s-' + Date.now()),
    nome: translateName(s.name || s.nome || ''),
    livello: (typeof s.level !== 'undefined') ? s.level : (s.level_int || 0),
    scuola: s.school || s.scuola || '',
    tempo: s.casting_time || s.tempo || '',
    gittata: s.range || s.gittata || '',
    comp: Array.isArray(s.components) ? s.components.join(', ') : (s.components || s.comp || ''),
    rituale: !!s.ritual,
    desc: (s.desc && Array.isArray(s.desc)) ? s.desc.join('\n') : (s.desc || s.description || '')
  };
}

function normalizeItem(it) {
  return {
    id: it.slug || (it.name && it.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || ('itm-' + Date.now()),
    nome: it.name || it.nome || '',
    rarita: (it.rarity || it.rarita || '').toLowerCase(),
    tipo: (it.type || it.tipo || '').toLowerCase(),
    desc: (it.desc && Array.isArray(it.desc)) ? it.desc.join('\n') : (it.desc || it.description || '')
  };
}

async function importSRD() {
  const statusEl = document.getElementById('import-status');
  try {
    statusEl.textContent = 'Scaricamento SRD (incantesimi)...';
    const spellsJson = await fetchJson(SRD_SPELLS_URL);
    statusEl.textContent = `SRD incantesimi scaricati: ${spellsJson.length}. Normalizzo...`;
    const normalizedSpells = spellsJson.map(normalizeSpell);

    statusEl.textContent = 'Scaricamento SRD (oggetti)...';
    let normalizedItems = [];
    try {
      const itemsJson = await fetchJson(SRD_ITEMS_URL);
      normalizedItems = itemsJson.map(normalizeItem);
      statusEl.textContent = `SRD oggetti scaricati: ${normalizedItems.length}.`;
    } catch (e) {
      console.warn('No SRD items available or failed to fetch items:', e.message);
      statusEl.textContent = 'SRD oggetti non disponibili; procedo con incantesimi.';
    }

    // Combine into one queue and import in automatic batches of 20
    const queue = normalizedSpells.concat(normalizedItems);
    statusEl.textContent = `Inizio import automatico in blocchi da 20 (${queue.length} elementi totali).`;

    // Load existing data from localStorage (apps manage spells/items arrays)
    let existingSpells = JSON.parse(localStorage.getItem('gius_spells_55')) || [];
    let existingItems = JSON.parse(localStorage.getItem('gius_items_55')) || [];

    const BATCH = 20;
    for (let i = 0; i < queue.length; i += BATCH) {
      const batch = queue.slice(i, i + BATCH);
      let added = 0;
      batch.forEach(obj => {
        if (!obj || !obj.id) return;
        // Heuristic: spell objects have 'livello' defined, items have 'rarita' or 'tipo'
        if (typeof obj.livello !== 'undefined' && obj.nome) {
          // deduplicate by id
          if (!existingSpells.some(s => s.id === obj.id)) {
            existingSpells.push(obj);
            added++;
          }
        } else if (obj.nome) {
          if (!existingItems.some(it => it.id === obj.id)) {
            existingItems.push(obj);
            added++;
          }
        }
      });

      // Save after each batch
      localStorage.setItem('gius_spells_55', JSON.stringify(existingSpells));
      localStorage.setItem('gius_items_55', JSON.stringify(existingItems));

      statusEl.textContent = `Importati ${Math.min(i + BATCH, queue.length)} / ${queue.length} (ultimo batch: ${added} aggiunti).`;

      // Update UI by calling existing functions if present
      if (typeof renderIncantesimi === 'function') renderIncantesimi(existingSpells);
      if (typeof renderOggetti === 'function') renderOggetti(existingItems);
      if (typeof updateCounts === 'function') updateCounts();

      // wait a short moment to keep UI responsive and simulate batch processing
      await new Promise(r => setTimeout(r, 300));
    }

    statusEl.textContent = `Import SRD completato. Incantesimi totali: ${existingSpells.length}. Oggetti totali: ${existingItems.length}.`;

    // Commit attribution file into the repo - cannot do that client-side; user will see attribution file added to repo by me.
  } catch (err) {
    console.error('Import SRD failed:', err);
    const statusEl = document.getElementById('import-status');
    if (statusEl) statusEl.textContent = 'Errore durante l\'import SRD: ' + err.message;
    alert('Errore durante l\'import SRD: ' + err.message);
  }
}

// Attach to button
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-import-srd');
  if (btn) btn.addEventListener('click', () => {
    btn.disabled = true;
    importSRD().finally(() => { btn.disabled = false; });
  });
});
