// View renderers for the Leonida Platinum Guide: checklist, guide detail, roadmap, missables.
export const GRADE_POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
export const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
export const KIND_LABELS = {
  story: 'Story', collectible: 'Collectible', combat: 'Combat', exploration: 'Exploration',
  activity: 'Activity', money: 'Money', challenge: 'Challenge',
};

export function gradePoints(grade) {
  return GRADE_POINTS[grade] ?? 0;
}

export function earnedPoints(trophies, earned) {
  let total = 0;
  for (const t of trophies) if (earned.has(t.id)) total += gradePoints(t.grade);
  return total;
}

export function totalPoints(trophies) {
  let total = 0;
  for (const t of trophies) total += gradePoints(t.grade);
  return total;
}

export function isSpoilerHidden(trophy, earned, spoilersOn) {
  return spoilersOn && trophy.kind === 'story' && !earned.has(trophy.id);
}

export function trophyDisplayName(trophy, state) {
  return isSpoilerHidden(trophy, state.earned, state.settings.spoilers)
    ? 'Hidden story trophy'
    : trophy.name;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderStats(statsNode, trophies, earned) {
  statsNode.replaceChildren();
  const pct = Math.round((earned.size / trophies.length) * 100);
  const earnedBox = el('div', 'stat wide');
  earnedBox.append(el('b', null, earned.size + ' / ' + trophies.length + ' earned'));
  earnedBox.append(el('span', null, 'Trophies  |  ' + pct + '%  |  ' + earnedPoints(trophies, earned) + ' of ' + totalPoints(trophies) + ' points'));
  const bar = el('div', 'bar');
  const fill = document.createElement('i');
  fill.style.width = pct + '%';
  bar.append(fill);
  earnedBox.append(bar);
  statsNode.append(earnedBox);
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const ofGrade = trophies.filter((t) => t.grade === grade);
    const got = ofGrade.filter((t) => earned.has(t.id)).length;
    const box = el('div', 'stat');
    box.append(el('b', null, got + ' / ' + ofGrade.length));
    box.append(el('span', null, GRADE_LABELS[grade]));
    statsNode.append(box);
  }
  const missable = trophies.filter((t) => t.missable);
  const missGot = missable.filter((t) => earned.has(t.id)).length;
  const missBox = el('div', 'stat');
  missBox.append(el('b', null, missGot + ' / ' + missable.length));
  missBox.append(el('span', null, 'Missables done'));
  statsNode.append(missBox);
}

export function filterTrophies(trophies, state) {
  const q = state.filters.search.trim().toLowerCase();
  return trophies.filter((t) => {
    if (state.filters.kind !== 'all' && t.kind !== state.filters.kind) return false;
    if (state.filters.grade !== 'all' && t.grade !== state.filters.grade) return false;
    if (state.filters.status === 'earned' && !state.earned.has(t.id)) return false;
    if (state.filters.status === 'remaining' && state.earned.has(t.id)) return false;
    if (state.filters.missableOnly && !t.missable) return false;
    if (q) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function renderChecklist(listNode, trophies, state, callbacks) {
  listNode.replaceChildren();
  const shown = filterTrophies(trophies, state);
  const line = el('p', 'count-line', 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies. Tick a trophy to mark it earned; click its name to read the guide.');
  listNode.append(line);
  if (shown.length === 0) {
    listNode.append(el('p', 'count-line', 'No trophies match these filters. Clear the search or widen the filters.'));
    return;
  }
  for (const t of shown) {
    const hidden = isSpoilerHidden(t, state.earned, state.settings.spoilers);
    const card = el('article', 'trophy' + (state.earned.has(t.id) ? ' earned' : '') + (state.selectedId === t.id ? ' selected' : ''));
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.id);
    box.setAttribute('aria-label', 'Mark ' + (hidden ? 'hidden story trophy' : t.name) + ' earned');
    box.addEventListener('change', () => callbacks.onToggle(t.id, box.checked));
    box.addEventListener('click', (e) => e.stopPropagation());
    card.append(box);
    const body = el('div');
    const title = el('h3', hidden ? 'hidden-name' : null, hidden ? 'Hidden story trophy' : t.name);
    body.append(title);
    body.append(el('p', null, hidden ? 'Hidden story trophy: earn it to reveal.' : t.description));
    const meta = el('div', 'meta');
    meta.append(el('span', 'badge ' + t.grade, GRADE_LABELS[t.grade]));
    meta.append(el('span', 'tag', KIND_LABELS[t.kind]));
    if (t.target) meta.append(el('span', 'tag target', 'PSN target ' + t.target));
    if (t.missable) meta.append(el('span', 'tag missable', 'Possibly missable'));
    body.append(meta);
    card.append(body);
    const side = el('div', 'grade-col', (state.earned.has(t.id) ? 'Earned' : 'Not earned') + '\n' + gradePoints(t.grade) + ' pts');
    card.append(side);
    card.addEventListener('click', () => callbacks.onSelect(t.id));
    listNode.append(card);
  }
}

export function renderDetail(detailNode, trophies, state, callbacks) {
  detailNode.replaceChildren();
  const t = trophies.find((x) => x.id === state.selectedId);
  if (!t) {
    detailNode.append(el('p', 'placeholder', 'Select a trophy on the left to read its full guide, with its official description, its kind, its PSN target, its missable note, and its sources.'));
    return;
  }
  const hidden = isSpoilerHidden(t, state.earned, state.settings.spoilers);
  if (hidden) {
    detailNode.append(el('p', 'placeholder', 'Hidden story trophy: earn it to reveal.'));
    detailNode.append(el('p', 'placeholder', 'Spoilers are on, so this story trophy stays hidden until you tick it earned. Turn off "Hide story spoilers" above to reveal every story trophy.'));
    return;
  }
  detailNode.append(el('span', 'badge ' + t.grade, GRADE_LABELS[t.grade]));
  detailNode.append(el('h2', null, t.name));
  detailNode.append(el('p', 'official', 'Official description: ' + t.description));
  const meta = el('div', 'meta');
  meta.append(el('span', 'tag', KIND_LABELS[t.kind]));
  if (t.target) meta.append(el('span', 'tag target', 'PSN target ' + t.target));
  if (t.missable) meta.append(el('span', 'tag missable', 'Possibly missable'));
  detailNode.append(meta);
  if (t.missable) detailNode.append(el('p', null, 'Missable note: ' + t.missable_note));
  else detailNode.append(el('p', null, 'Missable note: ' + t.missable_note));
  const parts = t.guide.split('Sources:');
  detailNode.append(el('p', 'guide-text', parts[0].trim()));
  detailNode.append(el('p', 'sources', 'Sources: ' + (parts[1] || '').trim()));
  const earnRow = el('div', 'earn-row');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.id = 'detail-earned';
  box.addEventListener('change', () => callbacks.onToggle(t.id, box.checked));
  const lab = document.createElement('label');
  lab.htmlFor = 'detail-earned';
  lab.textContent = state.earned.has(t.id) ? 'Earned: ticked in your checklist' : 'Mark earned';
  earnRow.append(box, lab);
  detailNode.append(earnRow);
  detailNode.append(el('label', null, 'Your note'));
  const note = document.createElement('textarea');
  note.className = 'note-box';
  note.placeholder = 'Your own note for this trophy, saved in this browser.';
  note.value = state.notes[t.id] || '';
  note.addEventListener('input', () => callbacks.onNote(t.id, note.value));
  detailNode.append(note);
}

export function renderRoadmap(roadmapNode, data, state) {
  roadmapNode.replaceChildren();
  for (const stage of data.roadmap) {
    const box = el('section', 'stage');
    const done = stage.trophy_ids.filter((id) => state.earned.has(id)).length;
    const head = el('h2', null, '');
    head.append(el('span', 'step', 'Stage ' + stage.stage + ': '));
    head.append(document.createTextNode(stage.title));
    box.append(head);
    box.append(el('p', 'stage-progress', done + ' of ' + stage.trophy_ids.length + ' earned in this stage'));
    box.append(el('p', null, stage.detail));
    const chips = el('div', 'chips');
    for (const id of stage.trophy_ids) {
      const t = data.trophies.find((x) => x.id === id);
      if (!t) continue;
      const hidden = isSpoilerHidden(t, state.earned, state.settings.spoilers);
      chips.append(el('span', 'chip' + (state.earned.has(id) ? ' done' : '') + (hidden ? ' hidden-chip' : ''), hidden ? 'Hidden story trophy' : t.name));
    }
    box.append(chips);
    roadmapNode.append(box);
  }
}

export function renderMissables(missNode, trophies, state) {
  missNode.replaceChildren();
  const flagged = trophies.filter((t) => t.missable);
  for (const t of flagged) {
    const card = el('section', 'miss-card');
    card.append(el('h2', null, (state.earned.has(t.id) ? 'Earned: ' : '') + t.name));
    card.append(el('p', null, 'Official description: ' + t.description));
    card.append(el('p', 'warn', 'Why it is flagged: ' + t.missable_note));
    card.append(el('p', null, 'Do it when the chance appears, and tick it off here as soon as it pops. The flag is built from the official description alone and is not confirmed in the game.'));
    missNode.append(card);
  }
  const note = el('p', 'page-intro', 'The other ' + (trophies.length - flagged.length) + ' trophies are not flagged missable. Story trophies come from finishing missions, and the rest can be retried or done at any time, as each trophy guide explains.');
  missNode.append(note);
}
