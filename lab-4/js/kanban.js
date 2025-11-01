(function () {
    const STORAGE_KEY = 'lab4-kanban-v1';
    const columnsConfig = [
        { id: 'todo', title: 'Do zrobienia' },
        { id: 'doing', title: 'W trakcie' },
        { id: 'done', title: 'Zrobione' },
    ];

    const randomColor = () => {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue} 70% 85%)`;
    };

    const state = {
        columns: {
            todo: [],
            doing: [],
            done: [],
        },
        sortAscending: { todo: true, doing: true, done: true },
    };

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data && data.columns) {
                ['todo', 'doing', 'done'].forEach((id) => {
                    if (Array.isArray(data.columns[id]))
                        state.columns[id] = data.columns[id].map((c) => ({
                            ...c,
                            _enter: true,
                        }));
                });
                if (data.sortAscending)
                    state.sortAscending = data.sortAscending;
            }
        } catch (e) {
            console.warn('Nie można wczytać stanu', e);
        }
    }
    function stripTransient(card) {
        delete card._enter;
        delete card._moved;
        delete card._recolor;
        delete card._remove;
        return card;
    }
    function saveState() {
        const clean = {
            columns: {
                todo: state.columns.todo.map(stripTransient),
                doing: state.columns.doing.map(stripTransient),
                done: state.columns.done.map(stripTransient),
            },
            sortAscending: state.sortAscending,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    }

    function createColumn(col) {
        const wrap = document.createElement('div');
        wrap.className = 'kanban-column';
        wrap.dataset.column = col.id;

        const header = document.createElement('header');
        const h2 = document.createElement('h2');
        h2.textContent = col.title;
        const counter = document.createElement('span');
        counter.className = 'card-counter';
        counter.textContent = '0';
        const actions = document.createElement('div');
        actions.className = 'column-actions';

        const addBtn = btn('Dodaj kartę', 'add');
        const colorAllBtn = btn('Koloruj kolumnę', 'color-all');
        const sortBtn = btn('Sortuj', 'sort');
        const sortIndicator = document.createElement('span');
        sortIndicator.className = 'sort-indicator';
        sortIndicator.textContent = '↑';
        sortBtn.appendChild(sortIndicator);

        actions.append(addBtn, colorAllBtn, sortBtn);
        header.append(h2, counter, actions);
        const cards = document.createElement('div');
        cards.className = 'kanban-cards';
        wrap.append(header, cards);
        return wrap;
    }

    function btn(label, action) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'btn';
        b.dataset.action = action;
        b.textContent = label;
        return b;
    }

    function render() {
        columnsConfig.forEach((col) => {
            const columnEl = document.querySelector(
                `.kanban-column[data-column="${col.id}"]`
            );
            const list = state.columns[col.id];
            const cardsWrap = columnEl.querySelector('.kanban-cards');
            cardsWrap.innerHTML = '';
            list.forEach((card) => {
                const cardEl = renderCard(card);
                if (card._enter) {
                    cardEl.classList.add('card-enter');
                    delete card._enter;
                }
                if (card._moved === 'left') {
                    cardEl.classList.add('card-move-left');
                    delete card._moved;
                } else if (card._moved === 'right') {
                    cardEl.classList.add('card-move-right');
                    delete card._moved;
                }
                if (card._recolor) {
                    cardEl.classList.add('card-recolor');
                    delete card._recolor;
                }
                cardsWrap.appendChild(cardEl);
            });
            updateCounter(col.id);
            updateSortIndicator(col.id);
        });
    }

    function renderCard(card) {
        const el = document.createElement('div');
        el.className = 'kanban-card';
        el.dataset.id = card.id;
        el.style.background = card.color;

        const content = document.createElement('div');
        content.className = 'card-content';
        content.contentEditable = 'true';
        content.spellcheck = false;
        content.textContent = card.title;
        el.appendChild(content);

        const toolbar = document.createElement('div');
        toolbar.className = 'card-toolbar';
        toolbar.appendChild(cardButton('&#8592;', 'move-left'));
        toolbar.appendChild(cardButton('&#8594;', 'move-right'));
        toolbar.appendChild(cardButton('&#127912;', 'recolor'));
        toolbar.appendChild(cardButton('&#10006;', 'delete'));
        el.appendChild(toolbar);

        content.addEventListener('input', () => {
            const id = card.id;
            const c = findCard(id);
            if (c) {
                c.title = content.textContent.trim();
                saveState();
            }
        });
        return el;
    }

    function cardButton(txt, action) {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.cardAction = action;
        b.innerHTML = txt;
        return b;
    }

    function findCard(id) {
        for (const col of Object.keys(state.columns)) {
            const found = state.columns[col].find((c) => c.id === id);
            if (found) return found;
        }
        return null;
    }

    function updateCounter(columnId) {
        const columnEl = document.querySelector(
            `.kanban-column[data-column="${columnId}"]`
        );
        const counter = columnEl.querySelector('.card-counter');
        counter.textContent = state.columns[columnId].length;
    }
    function updateSortIndicator(columnId) {
        const columnEl = document.querySelector(
            `.kanban-column[data-column="${columnId}"]`
        );
        const sortBtn = columnEl.querySelector(
            '[data-action="sort"] .sort-indicator'
        );
        sortBtn.textContent = state.sortAscending[columnId] ? '↑' : '↓';
    }

    function addCard(columnId) {
        const id =
            'c_' + Date.now() + '_' + Math.random().toString(16).slice(2, 8);
        const card = {
            id,
            title: 'Nowa karta',
            color: randomColor(),
            _enter: true,
        };
        state.columns[columnId].push(card);
        applySort(columnId);
        render();
        saveState();
    }

    function moveCard(cardId, direction) {
        const order = ['todo', 'doing', 'done'];
        let currentCol = null;
        for (const col of order) {
            if (state.columns[col].some((c) => c.id === cardId)) {
                currentCol = col;
                break;
            }
        }
        if (!currentCol) return;
        const idxCol = order.indexOf(currentCol);
        const targetIdx = direction === 'left' ? idxCol - 1 : idxCol + 1;
        if (targetIdx < 0 || targetIdx >= order.length) return;
        const targetCol = order[targetIdx];
        const cardArr = state.columns[currentCol];
        const cardIndex = cardArr.findIndex((c) => c.id === cardId);
        const [card] = cardArr.splice(cardIndex, 1);
        card._moved = direction;
        state.columns[targetCol].push(card);
        applySort(targetCol);
        const currentWrap = document.querySelector(
            `.kanban-column[data-column="${currentCol}"] .kanban-cards`
        );
        const targetWrap = document.querySelector(
            `.kanban-column[data-column="${targetCol}"] .kanban-cards`
        );
        [currentWrap, targetWrap].forEach(
            (w) => w && w.classList.add('hide-horizontal')
        );
        render();
        setTimeout(() => {
            [currentWrap, targetWrap].forEach(
                (w) => w && w.classList.remove('hide-horizontal')
            );
        }, 420);
        saveState();
    }

    function deleteCard(cardId) {
        let targetCol = null;
        let targetIdx = -1;
        for (const col of Object.keys(state.columns)) {
            const arr = state.columns[col];
            const idx = arr.findIndex((c) => c.id === cardId);
            if (idx !== -1) {
                targetCol = col;
                targetIdx = idx;
                break;
            }
        }
        if (targetCol == null) return;
        const el = document.querySelector(`.kanban-card[data-id="${cardId}"]`);
        if (!el) {
            state.columns[targetCol].splice(targetIdx, 1);
            saveState();
            render();
            return;
        }
        el.style.setProperty('--card-height', el.offsetHeight + 'px');
        el.classList.add('card-remove');
        el.addEventListener(
            'animationend',
            () => {
                state.columns[targetCol].splice(targetIdx, 1);
                saveState();
                render();
            },
            { once: true }
        );
    }

    function recolorCard(cardId) {
        const card = findCard(cardId);
        if (card) {
            card.color = randomColor();
            card._recolor = true;
            render();
            saveState();
        }
    }

    function colorAll(columnId) {
        state.columns[columnId].forEach((c) => {
            c.color = randomColor();
            c._recolor = true;
        });
        render();
        saveState();
    }

    function toggleSort(columnId) {
        state.sortAscending[columnId] = !state.sortAscending[columnId];
        applySort(columnId);
        render();
        saveState();
    }
    function applySort(columnId) {
        const asc = state.sortAscending[columnId];
        state.columns[columnId].sort((a, b) => {
            return asc
                ? a.title.localeCompare(b.title)
                : b.title.localeCompare(a.title);
        });
    }

    function handleColumnClick(e) {
        const actionBtn = e.target.closest('button.btn');
        if (actionBtn) {
            const action = actionBtn.dataset.action;
            const columnEl = actionBtn.closest('.kanban-column');
            const columnId = columnEl.dataset.column;
            if (action === 'add') addCard(columnId);
            else if (action === 'color-all') colorAll(columnId);
            else if (action === 'sort') toggleSort(columnId);
            return;
        }
        const cardBtn = e.target.closest('button[data-card-action]');
        if (cardBtn) {
            const action = cardBtn.dataset.cardAction;
            const cardEl = cardBtn.closest('.kanban-card');
            const id = cardEl.dataset.id;
            if (action === 'delete') deleteCard(id);
            else if (action === 'move-left') moveCard(id, 'left');
            else if (action === 'move-right') moveCard(id, 'right');
            else if (action === 'recolor') recolorCard(id);
        }
    }

    function init() {
        loadState();
        const app = document.getElementById('kanban-app');
        columnsConfig.forEach((col) => {
            app.appendChild(createColumn(col));
        });
        app.addEventListener('click', handleColumnClick);
        render();
    }

    document.addEventListener('DOMContentLoaded', init);
})();
