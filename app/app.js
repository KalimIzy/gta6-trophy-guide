// Leonida Platinum Guide: boot, saved progress, filters, routing, export and import.
import {
  renderStats,
  renderChecklist,
  renderDetail,
  renderRoadmap,
  renderMissables,
} from './views.js';

const PROGRESS_KEY = 'gta6-trophy-progress-v1';
const NOTES_KEY = 'gta6-trophy-notes-v1';
const SETTINGS_KEY = 'gta6-trophy-settings-v1';

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;

const state = {
  earned: new Set(loadIds(PROGRESS_KEY)),
  notes: loadObject(NOTES_KEY),
  settings: { spoilers: true, ...loadObject(SETTINGS_KEY) },
  filters: { search: '', kind: 'all', grade: 'all', status: 'all', missableOnly: false },
  selectedId: null,
  route: 'checklist',
};

function loadIds(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n)) : [];
  } catch {
    return [];
  }
}

function loadObject(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...state.earned].sort((a, b) => a - b)));
}

function saveNotes() {
  localStorage.setItem(NOTES_KEY, JSON.stringify(state.notes));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}

const statsNode = document.getElementById('stats');
const listNode = document.getElementById('list');
const detailNode = document.getElementById('detail');
const roadmapNode = document.getElementById('roadmap');
const missNode = document.getElementById('missables');

const callbacks = {
  onToggle(id, checked) {
    if (checked) state.earned.add(id);
    else state.earned.delete(id);
    saveProgress();
    renderAll();
  },
  onSelect(id) {
    state.selectedId = id;
    history.replaceState(null, '', '#/trophy/' + id);
    renderAll();
  },
  onNote(id, text) {
    if (text.trim()) state.notes[id] = text;
    else delete state.notes[id];
    saveNotes();
  },
};

function renderAll() {
  renderStats(statsNode, trophies, state.earned);
  renderChecklist(listNode, trophies, state, callbacks);
  renderDetail(detailNode, trophies, state, callbacks);
  renderRoadmap(roadmapNode, data, state);
  renderMissables(missNode, trophies, state);
  for (const view of ['checklist', 'roadmap', 'missables']) {
    document.getElementById('view-' + view).hidden = state.route !== view;
    document.getElementById('tab-' + view).classList.toggle('active', state.route === view);
  }
  document.getElementById('controls').style.display = state.route === 'checklist' ? '' : 'none';
}

function readRoute() {
  const hash = location.hash || '#/';
  if (hash.startsWith('#/roadmap')) return { route: 'roadmap', id: null };
  if (hash.startsWith('#/missables')) return { route: 'missables', id: null };
  const match = hash.match(/^#\/trophy\/(\d+)/);
  if (match) return { route: 'checklist', id: Number(match[1]) };
  return { route: 'checklist', id: null };
}

function applyRoute() {
  const parsed = readRoute();
  state.route = parsed.route;
  if (parsed.id && trophies.some((t) => t.id === parsed.id)) state.selectedId = parsed.id;
  if (state.route === 'checklist' && state.selectedId === null) {
    state.selectedId = trophies[0].id;
  }
  renderAll();
}

window.addEventListener('hashchange', applyRoute);

const searchInput = document.getElementById('search');
const kindSelect = document.getElementById('kind');
const gradeSelect = document.getElementById('grade');
const statusSelect = document.getElementById('status');
const missableBox = document.getElementById('missableOnly');
const spoilerBox = document.getElementById('spoilers');

spoilerBox.checked = state.settings.spoilers;
searchInput.addEventListener('input', () => { state.filters.search = searchInput.value; renderAll(); });
kindSelect.addEventListener('change', () => { state.filters.kind = kindSelect.value; renderAll(); });
gradeSelect.addEventListener('change', () => { state.filters.grade = gradeSelect.value; renderAll(); });
statusSelect.addEventListener('change', () => { state.filters.status = statusSelect.value; renderAll(); });
missableBox.addEventListener('change', () => { state.filters.missableOnly = missableBox.checked; renderAll(); });
spoilerBox.addEventListener('change', () => {
  state.settings.spoilers = spoilerBox.checked;
  saveSettings();
  renderAll();
});

document.getElementById('export').addEventListener('click', () => {
  const payload = {
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    notes: state.notes,
    settings: state.settings,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const raw = JSON.parse(await file.text());
    const ids = Array.isArray(raw) ? raw : raw.earned;
    if (!Array.isArray(ids)) throw new Error('No earned list in file');
    const valid = new Set(trophies.map((t) => t.id));
    state.earned = new Set(ids.filter((n) => valid.has(n)));
    if (raw.notes && typeof raw.notes === 'object') state.notes = raw.notes;
    if (raw.settings && typeof raw.settings === 'object') {
      state.settings = { spoilers: true, ...raw.settings };
      spoilerBox.checked = state.settings.spoilers;
    }
    saveProgress();
    saveNotes();
    saveSettings();
    renderAll();
  } catch {
    alert('That file is not a progress export from this guide.');
  }
  event.target.value = '';
});

document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned ticks and notes in this browser?')) return;
  state.earned = new Set();
  state.notes = {};
  saveProgress();
  saveNotes();
  renderAll();
});

document.addEventListener('keydown', (event) => {
  if (event.target.matches('input, textarea, select')) return;
  if (event.key === '/') {
    event.preventDefault();
    location.hash = '#/';
    searchInput.focus();
  } else if (event.key === '1') {
    location.hash = '#/';
  } else if (event.key === '2') {
    location.hash = '#/roadmap';
  } else if (event.key === '3') {
    location.hash = '#/missables';
  } else if (event.key === 'Escape') {
    state.selectedId = null;
    history.replaceState(null, '', '#/');
    renderAll();
  }
});

applyRoute();
