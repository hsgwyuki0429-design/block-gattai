import { LEVELS } from './levels.js';
import { groups, move, pairCount, isComplete, legalMoves } from './engine.js';
const $ = selector => document.querySelector(selector);
const PALETTE = [null, ['#e9a085','#75452f','#cd8269'],['#ebd583','#786526','#caba6c'],['#b2c9a0','#4f6946','#94ac83'],['#b9b4d3','#61577e','#9d96b7'],['#9fc7d0','#3c6774','#7fadb7']];
const names = ['つながる、はじまり。','となりまで、あと少し。','空きをつくって。','順番を、ひと工夫。','くっつく、その前に。','遠回りも、いい一手。','ふたりで、道をあけて。','最後は、みんな一緒。'];
const dirNames = { up: '上 ↑', right: '右 →', down: '下 ↓', left: '左 ←' };
let difficulty = 'normal', levelIndex = 0, board = [], selected = null, history = [], worker = null, hintId = 0, hintTimer = null, hinted = null;
let completed = {};
try { completed = JSON.parse(localStorage.getItem('block-gattai-completed') || '{}'); if (!completed || typeof completed !== 'object' || Array.isArray(completed)) completed = {}; } catch { completed = {}; }
const level = () => LEVELS[difficulty][levelIndex];
const width = () => level().width;
const boardEl = $('#board');
function say(message) { $('#instruction').textContent = message; }
function cancelHint() { hintId++; worker?.terminate(); worker = null; clearTimeout(hintTimer); $('#hint').disabled = false; $('#hint').innerHTML = '<span aria-hidden="true">✧</span> ヒント'; hinted = null; }
function loadLevel(nextDifficulty = difficulty, nextIndex = levelIndex) {
  setWinInert(false);
  cancelHint(); difficulty = nextDifficulty; levelIndex = nextIndex; board = level().board.slice(); history = []; selected = null;
  $('#win-panel').hidden = true;
  render(); say('ブロックをスワイプ、または選んで矢印で移動');
}
function render() {
  const w = width(), h = board.length / w, joined = pairCount(board, w), total = board.filter(Boolean).length / 2;
  boardEl.style.setProperty('--cols', w); boardEl.style.setProperty('--rows', h);
  $('.game').style.setProperty('--aspect', w / h);
  boardEl.replaceChildren();
  for (let i = 0; i < board.length; i++) { const cell = document.createElement('div'); cell.className = 'cell'; cell.setAttribute('aria-hidden', 'true'); boardEl.append(cell); }
  const allGroups = groups(board, w);
  const selectedGroup = allGroups.find(g => g.cells.includes(selected));
  board.forEach((value, index) => {
    if (!value) return;
    const group = allGroups.find(g => g.cells.includes(index));
    const tile = document.createElement('button'); tile.type = 'button'; tile.className = 'tile'; tile.dataset.index = index;
    tile.style.setProperty('--x', index % w); tile.style.setProperty('--y', Math.floor(index / w));
    const [color, ink, shadow] = PALETTE[value]; tile.style.setProperty('--tile', color); tile.style.setProperty('--ink', ink); tile.style.setProperty('--shadow', shadow);
    tile.textContent = value;
    if (selectedGroup?.cells.includes(index)) tile.classList.add('selected');
    if (hinted === index) tile.classList.add('hinted');
    tile.setAttribute('aria-pressed', String(!!selectedGroup?.cells.includes(index)));
    tile.setAttribute('aria-label', `${Math.floor(index / w) + 1}行${index % w + 1}列、数字${value}${group.cells.length === 2 ? '、合体済み' : ''}`);
    if (group.cells.length === 2) {
      const mate = group.cells.find(i => i !== index), delta = mate - index;
      tile.classList.add(`joined-${delta === 1 ? 'right' : delta === -1 ? 'left' : delta === w ? 'down' : 'up'}`);
      const mark = document.createElement('span'); mark.className = 'link-mark'; mark.textContent = '•'; mark.setAttribute('aria-hidden','true'); tile.append(mark);
    }
    boardEl.append(tile);
  });
  $('#pairs').textContent = joined; $('#total-pairs').textContent = total; $('#moves').textContent = String(history.length).padStart(2, '0');
  $('#pair-progress').innerHTML = Array.from({length:total}, (_, i) => `<i class="${i < joined ? 'done' : ''}"></i>`).join('');
  $('#undo').disabled = history.length === 0;
  $('#level-label').textContent = {easy:'やさしい',normal:'ふつう',hard:'むずかしい'}[difficulty];
  $('#stage-number').textContent = String(levelIndex + 1).padStart(2, '0');
  $('#stage-title').textContent = names[levelIndex]; $('#board-spec').textContent = `${w} × ${h}`;
  $('#stage-count').textContent = `${String(levelIndex + 1).padStart(2, '0')} / 08`;
  document.querySelectorAll('[data-difficulty]').forEach(b => { b.classList.toggle('active', b.dataset.difficulty === difficulty); b.setAttribute('aria-pressed', String(b.dataset.difficulty === difficulty)); });
  $('#stages').replaceChildren();
  LEVELS[difficulty].forEach((_, i) => { const b = document.createElement('button'); b.className = 'stage-button'; b.textContent = i + 1; b.classList.toggle('active', i === levelIndex); b.classList.toggle('completed', !!completed[`${difficulty}-${i}`]); b.setAttribute('aria-label', `ステージ${i + 1}${completed[`${difficulty}-${i}`] ? '、クリア済み' : ''}`); b.setAttribute('aria-pressed', String(i === levelIndex)); b.onclick = () => { loadLevel(difficulty, i); $('#stages-dialog').close(); }; $('#stages').append(b); });
  document.querySelectorAll('[data-direction]').forEach(b => { b.disabled = selected === null || isComplete(board, w) || !move(board, w, selected, b.dataset.direction); });
}
function select(index, focus = false) {
  if (isComplete(board, width())) return;
  selected = index; hinted = null; render();
  if (focus) boardEl.querySelector(`[data-index="${selected}"]`)?.focus({ preventScroll: true });
  const group = groups(board, width()).find(g => g.cells.includes(index));
  say(group.cells.length === 2 ? `数字 ${board[index]} のペアを選択中。2マス一緒に動くよ` : `数字 ${board[index]} を選択中。矢印かスワイプで移動`);
}
function perform(direction, source = selected) {
  if (source === null || isComplete(board, width())) return;
  const next = move(board, width(), source, direction);
  if (!next) { say('その方向には動けないよ。空きマスを確認しよう'); const tile = boardEl.querySelector(`[data-index="${source}"]`); tile?.classList.remove('bump'); void tile?.offsetWidth; tile?.classList.add('bump'); return; }
  const keyboardFocus = boardEl.contains(document.activeElement);
  cancelHint(); history.push({ board: board.slice(), selected }); board = next.board; selected = next.index; render();
  if (keyboardFocus) boardEl.querySelector(`[data-index="${selected}"]`)?.focus({preventScroll:true});
  if (isComplete(board, width())) {
    completed[`${difficulty}-${levelIndex}`] = true;
    try { localStorage.setItem('block-gattai-completed', JSON.stringify(completed)); } catch { /* Play remains available when storage is blocked. */ }
    render(); $('#win-detail').textContent = `${history.length} 手で、${board.filter(Boolean).length / 2} 組すべてが合体！`;
    $('#next-level').innerHTML = levelIndex === 7 ? '最初のステージへ <span>↻</span>' : '次のステージへ <span>→</span>';
    $('#win-panel').hidden = false; setWinInert(true); $('#next-level').focus({preventScroll:true}); say('クリア！すべてのペアが合体しました'); celebrate();
  } else if (!legalMoves(board, width()).length) say('動かせるブロックがないよ。「一手戻す」で別の順番を試そう');
  else say(next.merged ? 'ぴたっ！ 合体したペアは、ここからずっと一緒' : 'いいね。その調子でペアをつなごう');
}
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 22; i++) { const dot = document.createElement('i'); dot.className = 'confetti'; dot.style.setProperty('--color', PALETTE[i % 5 + 1][0]); dot.style.setProperty('--dx', `${(Math.random() - .5) * 310}px`); dot.style.setProperty('--dy', `${(Math.random() - .5) * 320}px`); dot.style.setProperty('--rotate', `${Math.random() * 720}deg`); $('.game').append(dot); setTimeout(() => dot.remove(), 1100); }
}
function undo() { if (!history.length) return; cancelHint(); const previous = history.pop(); board = previous.board; selected = previous.selected; $('#win-panel').hidden = true; render(); say('一手戻したよ。別の道を探してみよう'); }
let gesture = null, suppressClick = false;
boardEl.addEventListener('pointerdown', e => { const tile = e.target.closest('.tile'); if (!tile || (e.pointerType === 'mouse' && e.button !== 0)) return; gesture = { index:Number(tile.dataset.index), x:e.clientX, y:e.clientY, id:e.pointerId }; boardEl.setPointerCapture(e.pointerId); });
boardEl.addEventListener('pointerup', e => {
  if (!gesture || gesture.id !== e.pointerId) return;
  const { index, x, y } = gesture; gesture = null;
  const dx = e.clientX - x, dy = e.clientY - y;
  if (Math.hypot(dx,dy) > 18) { selected = index; perform(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right':'left') : (dy > 0 ? 'down':'up'), index); }
  else select(index);
  suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
});
boardEl.addEventListener('pointercancel', () => { gesture = null; });
boardEl.addEventListener('click', e => { const tile = e.target.closest('.tile'); if (tile && !suppressClick) select(Number(tile.dataset.index), e.detail === 0); });
document.querySelectorAll('[data-direction]').forEach(b => b.onclick = () => perform(b.dataset.direction));
document.querySelectorAll('[data-difficulty]').forEach(b => b.onclick = () => loadLevel(b.dataset.difficulty, 0));
document.addEventListener('keydown', e => {
  if ($('#help-dialog').open || $('#stages-dialog').open || !$('#win-panel').hidden || e.altKey || e.ctrlKey || e.metaKey) return;
  const direction = {ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left'}[e.key];
  if (direction && selected !== null) { e.preventDefault(); perform(direction); }
});
$('#undo').onclick = undo; $('#reset').onclick = () => loadLevel();
$('#next-level').onclick = () => loadLevel(difficulty, (levelIndex + 1) % LEVELS[difficulty].length);
function setWinInert(value) { document.querySelectorAll('.game-header, .hud, .board-area, .direction-pad, .game-controls').forEach(el => { el.inert = value; }); }
$('#win-close').onclick = () => { $('#win-panel').hidden = true; setWinInert(false); $('#reset').focus({preventScroll:true}); };
$('#win-panel').addEventListener('keydown', e => { if (e.key === 'Escape') $('#win-close').click(); if(e.key === 'Tab') { e.preventDefault(); (document.activeElement === $('#next-level') ? $('#win-close') : $('#next-level')).focus(); } });
$('#stages-open').onclick = $('#level-open').onclick = () => $('#stages-dialog').showModal();
$('#stages-close').onclick = $('#stages-play').onclick = () => $('#stages-dialog').close();
$('#help-open').onclick = () => $('#help-dialog').showModal();
$('#help-close').onclick = $('#help-play').onclick = () => $('#help-dialog').close();
$('#help-dialog').addEventListener('click', e => { if (e.target === $('#help-dialog')) { const r = e.target.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });
$('#hint').onclick = () => {
  if (isComplete(board, width())) { say('もう全員くっついているよ！次のステージを選ぼう'); return; }
  cancelHint();
  const showHint = result => {
    $('#hint').disabled = false; $('#hint').innerHTML = '<span aria-hidden="true">✧</span> ヒント';
    if (result.status === 'solved' && result.path.length) { const action = result.path[0]; selected = action.index; hinted = action.index; render(); say(`${Math.floor(action.index / width()) + 1}行${action.index % width() + 1}列の ${board[action.index]} を「${dirNames[action.direction]}」へ動かそう`); }
    else if(result.status === 'impossible') say('この配置からは全員を合体できないよ。一手戻してみよう');
    else say('ヒントを見つけきれなかったよ。一手戻すか、別の動きを試そう');
  };
  // Reuse the preverified solution when the player is on its path.
  let candidate = level().board.slice();
  for (let i = 0; i < level().solution.length; i++) { if (candidate.join() === board.join()) { showHint({status:'solved',path:level().solution.slice(i)}); return; } const action = level().solution[i]; candidate = move(candidate,width(),action.index,action.direction).board; }
  try {
    const id = ++hintId; worker = new Worker(new URL('./hint-worker.js', import.meta.url), {type:'module'});
    $('#hint').disabled = true; $('#hint').textContent = '考え中…'; say('合体する順番を考えているよ…');
    worker.onmessage = ({data}) => { if (data.id !== hintId) return; clearTimeout(hintTimer); worker?.terminate(); worker = null; showHint(data); };
    worker.onerror = () => { cancelHint(); say('ヒントを読み込めなかったよ。もう一度試してみよう'); };
    hintTimer = setTimeout(() => { cancelHint(); say('少し複雑な配置みたい。一手戻してから試そう'); }, 12000);
    worker.postMessage({id,board,width:width()});
  } catch { cancelHint(); say('この環境ではヒントを使えないよ。一手戻して試してみよう'); }
};
loadLevel();
