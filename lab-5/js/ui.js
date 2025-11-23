import { store } from './store.js';

const controlsWrap = document.querySelector('[data-role="controls"]');
const cntSquaresEl = document.querySelector('[data-counter="squares"]');
const cntCirclesEl = document.querySelector('[data-counter="circles"]');
const board = document.getElementById('board');

// Delegacja usuwania kształtów
board.addEventListener('click', (e) => {
    const shapeEl = e.target.closest('.shape');
    if (!shapeEl) return;
    const id = shapeEl.dataset.id;
    if (id) {
        store.removeShape(id);
    }
});

function updateCounters(counts) {
    cntSquaresEl.textContent = counts.squares;
    cntCirclesEl.textContent = counts.circles;
}

// Subskrypcja zmian listy kształtów
store.subscribe('shapes', (payload) => {
    const { change, counts } = payload;
    updateCounters(counts);
    switch (change.action) {
        case 'init': {
            board.innerHTML = '';
            for (const s of payload.value) {
                board.appendChild(renderShape(s));
            }
            break;
        }
        case 'add': {
            const el = renderShape(change.shape);
            el.classList.add('shape-enter');
            board.appendChild(el);
            break;
        }
        case 'remove': {
            const el = board.querySelector(`.shape[data-id="${change.id}"]`);
            if (el) {
                el.classList.add('shape-remove');
                el.addEventListener('animationend', () => el.remove(), {
                    once: true,
                });
            }
            break;
        }
        case 'recolor-type': {
            for (const u of change.updated) {
                const el = board.querySelector(`.shape[data-id="${u.id}"]`);
                if (el) el.style.backgroundColor = u.color;
            }
            break;
        }
    }
});

function renderShape(shape) {
    const el = document.createElement('div');
    el.className = `shape ${shape.type}`;
    el.dataset.id = shape.id;
    el.style.backgroundColor = shape.color;
    return el;
}

// API dla app.js
export function wireControls(actions) {
    controlsWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === 'add-square') actions.addSquare();
        else if (action === 'add-circle') actions.addCircle();
        else if (action === 'recolor-squares') actions.recolorSquares();
        else if (action === 'recolor-circles') actions.recolorCircles();
    });
}
