import { store } from './store.js';
import { wireControls } from './ui.js';
import { randomHsl, makeId } from './helpers.js';

function addSquare() {
    store.addShape({ id: makeId('sq'), type: 'square', color: randomHsl() });
}
function addCircle() {
    store.addShape({ id: makeId('ci'), type: 'circle', color: randomHsl() });
}
function recolorSquares() {
    store.recolorType('square', randomHsl);
}
function recolorCircles() {
    store.recolorType('circle', randomHsl);
}

wireControls({ addSquare, addCircle, recolorSquares, recolorCircles });
