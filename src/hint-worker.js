import { solve } from './engine.js';
self.onmessage = ({ data }) => self.postMessage({ id: data.id, ...solve(data.board, data.width, 180000) });
