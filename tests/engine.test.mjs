import test from 'node:test';
import assert from 'node:assert/strict';
import { adjacent, groups, move, pairCount, isComplete, solve } from '../src/engine.js';
import { LEVELS } from '../src/levels.js';

test('adjacency excludes diagonals and wrapping across rows', () => {
  assert.equal(adjacent(2,3,3), false);
  assert.equal(adjacent(0,4,3), false);
  assert.equal(adjacent(0,3,3), true);
});
test('a move merges matching neighbors without changing numbers', () => {
  const original = [1,0,1,2,0,2];
  const next = move(original,3,0,'right');
  assert.deepEqual(next.board, [0,1,1,2,0,2]);
  assert.equal(next.merged,1);
  assert.deepEqual(original,[1,0,1,2,0,2]);
});
test('a fused pair slides along its axis with one blank, and never separates', () => {
  const next = move([1,1,0,2,0,2],3,0,'right');
  assert.deepEqual(next.board,[0,1,1,2,0,2]);
  assert.equal(pairCount(next.board,3),1);
  assert.equal(move([1,1,0,2,0,2],3,0,'down'),null);
});
test('a fused pair moves sideways only with both destinations free', () => {
  assert.deepEqual(move([1,0,2,1,0,2,3,0,3],3,0,'right').board,[0,1,2,0,1,2,3,0,3]);
  assert.equal(move([1,0,2,1,3,2,3,0,0],3,0,'right'),null);
});
test('edges, occupied cells, blank selections, and invalid directions are rejected', () => {
  const board = [1,2,0,2,0,1];
  assert.equal(move(board,3,0,'left'),null);
  assert.equal(move(board,3,0,'up'),null);
  assert.equal(move(board,3,0,'right'),null);
  assert.equal(move(board,3,2,'left'),null);
  assert.equal(move(board,3,0,'diagonal'),null);
});
test('solver distinguishes solved, impossible, and bounded-search outcomes', () => {
  assert.deepEqual(solve([1,1,0,0],2).path,[]);
  assert.equal(solve([1,2,2,1],2).status,'impossible');
  assert.equal(solve([1,0,1,2,0,2],3,1).status,'limit');
});
for (const [difficulty, levels] of Object.entries(LEVELS)) {
  test(`${difficulty}: all eight levels have exact pairs, the promised blanks, and valid solutions`, () => {
    assert.equal(levels.length,8);
    for (const level of levels) {
      let board = level.board.slice();
      const blanks = {easy:3,normal:2,hard:1}[difficulty];
      assert.equal(board.filter(v=>v===0).length,blanks);
      assert.equal(pairCount(board,level.width),0);
      for (const value of new Set(board.filter(Boolean))) assert.equal(board.filter(v=>v===value).length,2);
      for (const action of level.solution) {
        const before = groups(board,level.width).filter(g=>g.cells.length===2).map(g=>g.value);
        const next = move(board,level.width,action.index,action.direction);
        assert.ok(next,`Invalid witness in ${difficulty}`);
        board = next.board;
        const after = groups(board,level.width).filter(g=>g.cells.length===2).map(g=>g.value);
        assert.ok(before.every(v=>after.includes(v)), 'An existing pair must never break');
        assert.equal(board.filter(v=>v===0).length,blanks);
      }
      assert.equal(isComplete(board,level.width),true);
    }
  });
}
