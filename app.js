// Database iniziale di esempio D&D 5.5
let defaultSpells = [
  { id: "dardo-incantato-55", nome: "Dardo Incantato", livello: 1, scuola: "Evocazione", tempo: "1 Azione", gittata: "36m", comp: "V, S", rituale: false, desc: "Crea tre dardi di forza magica. Ogni dardo colpisce automaticamente una creatura a scelta e infligge 1d4 + 1 danni da forza." },
  { id: "palla-di-fuoco-55", nome: "Palla di Fuoco", livello: 3, scuola: "Evocazione", tempo: "1 Azione", gittata: "45m", comp: "V, S, M", rituale: false, desc: "Un'esplosione di fuoco sferica con raggio 6 metri. Le creature nell'area devono effettuare un Tiro Salvezza su Destrezza (subiscono 8d6 danni da fuoco se falliscono, o la metà se riescono)." },
  { id: "allarme-55", nome: "Allarme", livello: 1, scuola: "Abiurazione", tempo: "1 Minuto", gittata: "9m", comp: "V, S, M", rituale: true, desc: "Imposti un avvertimento contro le intrusioni. Scegli un punto non occupato ed entro la gittata per creare un'area protetta." }
];

let defaultItems = [
  { id: "borsa-conservante", nome: "Borsa Conservante", rarita: "Non Comune", desc: "Oggetto extradimensionale in grado di contenere fino a 250 kg di peso per un volume massimo di 1,8 m³." }
];

// Carica da LocalStorage o usa i default
let spells = JSON.parse(localStorage.getItem('gius_spells_55')) || defaultSpells;
let items = JSON.parse(localStorage.getItem('gius_items_55')) || defaultItems;
let favorites = JSON.parse(localStorage.getItem('gius_favs_55')) || [];

function saveToStorage() {
  localStorage.setItem('gius_spells_55', JSON.stringify(spells));
  localStorage.setItem('gius_items_55', JSON.stringify(items));
  localStorage.setItem('gius_favs_55', JSON.stringify(favorites));
  updateCounts();
}

function updateCounts() {
  document.getElementById('spells-count').textContent = spells.length;
  document.getElementById('items-count').textContent = items.length;
  document.getElementById('fav-count').textContent = favorites.length;
}

function closeCover() { document.getElementById('grimoire-intro').classList.add('hidden'); }
function openCover() { document.getElementById('grimoire-intro').classList.remove('hidden'); }

function switchTab(tabId, btn) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));

  if (btn && btn.classList) btn.classList.add('active');
  const el = document.getElementById('tab-' + tabId);
  if (el) el.classList.add('active');
}

function toggleFav(id) {
  if (favorites.includes(id)) {
    favorites = favorites.filter(f => f !== id);
  } else {
    favorites.push(id);
  }
  saveToStorage();
  renderIncantesimi(spells);
  renderPreparati();
}

function renderIncantesimi(data) {
  const container = document.getElementById('incantesimi-container');
  container.innerHTML = data.map(s => {
    const isFav = favorites.includes(s.id);
    return `
      <div class="card">
        <div class="card-title">
          <span>${s.nome} ${s.rituale ? '<span class="tag-ritual">RITUALE</span>' : ''}</span>
          <span class="fav-star ${isFav ? 'active' : ''}" onclick="toggleFav('${s.id}')">★</span>
        </div>
        <div class="card-sub">${s.livello === 0 ? 'Trucchetto' : 'Livello ' + s.livello} • ${s.scuola}</div>
        <div class="meta-grid">
          <div><b>Tempo:</b> ${s.tempo}</div>
          <div><b>Gittata:</b> ${s.gittata}</div>
          <div style="grid-column:1/-1;"><b>Comp:</b> ${s.comp}</div>
        </div>
        <div class="card-desc">${s.desc}</div>
      </div>
    `;
  }).join('');
}

function renderPreparati() {
  const favSpells = spells.filter(s => favorites.includes(s.id));
  if (favSpells.length === 0) {
    document.getElementById('preparati-container').innerHTML = '<p style="color:var(--text-muted); grid-column:1/-1;">Nessun incantesimo salvato tra i preparati. Premi la stella ★ sugli incantesimi per aggiungerli qui!</p>';
    return;
  }
  renderIncantesimiCustom(favSpells, 'preparati-container');
}

function renderIncantesimiCustom(data, elementId) {
  document.getElementById(elementId).innerHTML = data.map(s => `
    <div class="card">
      <div class="card-title">
        <span>${s.nome}</span>
        <span class="fav-star active" onclick="toggleFav('${s.id}')">★</span>
      </div>
      <div class="card-sub">${s.livello === 0 ? 'Trucchetto' : 'Livello ' + s.livello} • ${s.scuola}</div>
      <div class="card-desc">${s.desc}</div>
    </div>
  `).join('');
}

function renderOggetti(data) {
  document.getElementById('oggetti-container').innerHTML = data.map(o => `
    <div class="card">
      <div class="card-title"><span>${o.nome}</span></div>
      <div class="card-sub">${o.rarita || ''}</div>
      <div class="card-desc">${o.desc}</div>
    </div>
  `).join('');
}

function saveNewSpell() {
  const nome = document.getElementById('add-nome').value.trim();
  if (!nome) return alert("Inserisci almeno il nome dell'incantesimo!");

  const newSpell = {
    id: 'custom-' + Date.now(),
    nome: nome,
    livello: parseInt(document.getElementById('add-livello').value) || 0,
    scuola: document.getElementById('add-scuola').value || 'Generica',
    tempo: document.getElementById('add-tempo').value || '1 Azione',
    gittata: document.getElementById('add-gittata').value || 'Personale',
    comp: document.getElementById('add-comp').value || 'V, S',
    rituale: document.getElementById('add-rituale').checked,
    desc: document.getElementById('add-desc').value || ''
  };

  spells.push(newSpell);
  saveToStorage();
  renderIncantesimi(spells);
  renderPreparati();
  alert("Incantesimo aggiunto con successo al grimorio!");

  // Reset form
  document.getElementById('add-nome').value = '';
  document.getElementById('add-desc').value = '';
  document.getElementById('add-livello').value = 1;
  document.getElementById('add-scuola').value = '';
  document.getElementById('add-tempo').value = '';
  document.getElementById('add-gittata').value = '';
  document.getElementById('add-comp').value = '';
  document.getElementById('add-rituale').checked = false;
}

function importJSON() {
  try {
    const raw = document.getElementById('json-import').value;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      spells = spells.concat(parsed);
      saveToStorage();
      renderIncantesimi(spells);
      renderPreparati();
      alert("Importazione riuscita!");
      document.getElementById('json-import').value = '';
    } else {
      alert("JSON deve essere un array di oggetti.");
    }
  } catch(e) {
    alert("Errore nel formato JSON incollato.");
  }
}

function exportJSON() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spells, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "biblioplex_spells_5.5.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function filterIncantesimi() {
  const q = document.getElementById('search-incantesimi').value.toLowerCase();
  if (!q) {
    renderIncantesimi(spells);
    return;
  }
  const filtered = spells.filter(s =>
    (s.nome && s.nome.toLowerCase().includes(q)) ||
    (s.scuola && s.scuola.toLowerCase().includes(q)) ||
    (s.desc && s.desc.toLowerCase().includes(q)) ||
    String(s.livello).toLowerCase() === q
  );
  renderIncantesimi(filtered);
}

function filterOggetti() {
  const q = document.getElementById('search-oggetti').value.toLowerCase();
  if (!q) {
    renderOggetti(items);
    return;
  }
  const filtered = items.filter(o =>
    (o.nome && o.nome.toLowerCase().includes(q)) ||
    (o.desc && o.desc.toLowerCase().includes(q))
  );
  renderOggetti(filtered);
}

// Init
updateCounts();
renderIncantesimi(spells);
renderOggetti(items);
renderPreparati();
