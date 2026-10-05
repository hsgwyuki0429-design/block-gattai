import { writeFileSync } from 'node:fs';
import { solve, pairCount } from '../src/engine.js';
let seed = 20261005;
function random() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; }
const settings = [
  { id: 'easy', width: 3, height: 3, blanks: 3, min: 3, max: 12 },
  { id: 'normal', width: 4, height: 3, blanks: 2, min: 6, max: 24 },
  { id: 'hard', width: 3, height: 3, blanks: 1, min: 6, max: 35 },
];
const levels = {};
for (const setting of settings) {
  const count = (setting.width * setting.height - setting.blanks) / 2;
  const found = [];
  for (let attempt = 0; found.length < 8 && attempt < 10000; attempt++) {
    const board = Array.from({ length: count * 2 }, (_, i) => Math.floor(i / 2) + 1).concat(Array(setting.blanks).fill(0));
    for (let i = board.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [board[i], board[j]] = [board[j], board[i]]; }
    if (pairCount(board, setting.width) > 0 || found.some(l => l.board.join() === board.join())) continue;
    const solution = solve(board, setting.width, 70000);
    if (solution.status !== 'solved' || solution.path.length < setting.min || solution.path.length > setting.max) continue;
    found.push({ board, width: setting.width, solution: solution.path });
    console.log(`${setting.id}: ${found.length}/8 (${solution.path.length} moves)`);
  }
  if (found.length < 8) throw new Error(`Not enough ${setting.id} levels`);
  levels[setting.id] = found.sort((a, b) => a.solution.length - b.solution.length);
}
writeFileSync(new URL('../src/levels.js', import.meta.url), `// Generated with a seeded search. Every level includes a verified shortest solution.\nexport const LEVELS = ${JSON.stringify(levels, null, 2)};\n`);
