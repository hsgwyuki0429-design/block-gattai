export const DIRECTIONS = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };

export function adjacent(a, b, width) {
  return Math.abs(a % width - b % width) + Math.abs(Math.floor(a / width) - Math.floor(b / width)) === 1;
}

export function groups(board, width) {
  const seen = new Set();
  return board.flatMap((value, index) => {
    if (!value || seen.has(index)) return [];
    const mate = board.findIndex((v, i) => i !== index && v === value);
    const cells = mate >= 0 && adjacent(index, mate, width) ? [index, mate] : [index];
    cells.forEach(i => seen.add(i));
    return [{ value, cells }];
  });
}

export function pairCount(board, width) {
  return groups(board, width).filter(group => group.cells.length === 2).length;
}

export function isComplete(board, width) {
  return groups(board, width).every(group => group.cells.length === 2);
}

export function move(board, width, index, direction) {
  const delta = DIRECTIONS[direction];
  if (!delta || !board[index]) return null;
  const group = groups(board, width).find(g => g.cells.includes(index));
  const height = board.length / width;
  const targets = group.cells.map(i => {
    const x = i % width + delta[0], y = Math.floor(i / width) + delta[1];
    return x < 0 || x >= width || y < 0 || y >= height ? -1 : y * width + x;
  });
  if (targets.some(i => i < 0 || (board[i] && !group.cells.includes(i)))) return null;
  const next = board.slice();
  group.cells.forEach(i => { next[i] = 0; });
  targets.forEach(i => { next[i] = group.value; });
  return { board: next, index: index + delta[0] + delta[1] * width, merged: pairCount(next, width) - pairCount(board, width) };
}

export function legalMoves(board, width) {
  return groups(board, width).flatMap(group => Object.keys(DIRECTIONS).flatMap(direction => {
    const index = group.cells[0];
    const result = move(board, width, index, direction);
    return result ? [{ index, direction, ...result, source: index }] : [];
  }));
}

// Breadth-first search returns a shortest solution, or a distinct exhausted/limit status.
export function solve(board, width, limit = 150000) {
  const queue = [{ board, parent: -1, action: null }];
  const visited = new Set([board.join(',')]);
  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    if (isComplete(node.board, width)) {
      const path = [];
      for (let n = head; queue[n].parent !== -1; n = queue[n].parent) path.push(queue[n].action);
      return { status: 'solved', path: path.reverse(), explored: head + 1 };
    }
    for (const candidate of legalMoves(node.board, width)) {
      const key = candidate.board.join(',');
      if (visited.has(key)) continue;
      if (queue.length >= limit) return { status: 'limit', path: [], explored: head + 1 };
      visited.add(key);
      queue.push({ board: candidate.board, parent: head, action: { index: candidate.source, direction: candidate.direction } });
    }
  }
  return { status: 'impossible', path: [], explored: queue.length };
}
