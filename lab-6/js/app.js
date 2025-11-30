import { createAjax } from './ajax.js';

// Global Ajax instance
const api = createAjax({
    baseURL: 'https://jsonplaceholder.typicode.com',
    timeout: 6000,
    headers: {
        Accept: 'application/json',
    },
});

// DOM refs
const itemsList = document.getElementById('itemsList');
const loaderEl = document.getElementById('loader');
const errorBox = document.getElementById('errorBox');
const panel = document.querySelector('.panel');

function showLoader(active) {
    loaderEl.classList.toggle('active', !!active);
}

function showError(message) {
    errorBox.textContent = message || '';
}

function clearItems() {
    itemsList.innerHTML = '';
}

function renderItems(items) {
    clearItems();
    for (const item of items) {
        const li = document.createElement('li');
        li.textContent = item.title;
        itemsList.appendChild(li);
    }
}

async function handleLoadSuccess() {
    showError('');
    showLoader(true);
    try {
        // Limit to a few items for brevity
        const data = await api.get('/todos?_limit=6');
        renderItems(data);
    } catch (e) {
        showError(e.message);
    } finally {
        showLoader(false);
    }
}

async function handleLoadError() {
    showError('');
    showLoader(true);
    try {
        // Non-existing endpoint to force 404
        await api.get('/unknown-endpoint');
    } catch (e) {
        showError(e.message);
        clearItems();
    } finally {
        showLoader(false);
    }
}

function handleReset() {
    showError('');
    clearItems();
}

panel.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    if (action === 'load-success') handleLoadSuccess();
    else if (action === 'load-error') handleLoadError();
    else if (action === 'reset') handleReset();
});
