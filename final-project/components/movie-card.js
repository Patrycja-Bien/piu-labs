import { DEFAULT_API_KEY } from './config.js';
import { loadPrefs, savePrefs } from './prefs.js';
const API_URL = 'https://www.omdbapi.com/';

const template = document.createElement('template');

template.innerHTML = `
    <style>
        :host {
            display: grid;
            grid-template-rows: auto 1fr auto;
            width: 240px;
            border: 1px solid var(--border);
            border-radius: 12px;
            background: var(--bg);
            color: var(--text);
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            font-family: system-ui, Arial, sans-serif;
            transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        }
        :host { cursor: pointer; }
        :host(:hover) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.12); border-color: var(--accent); }
        :host(:focus) { outline: 2px solid var(--accent); outline-offset: 2px; }
        .poster {
            position: relative;
            width: 100%;
            aspect-ratio: 2 / 3;
            background: var(--border);
            display: grid;
            place-items: center;
        }
        .poster img { width:100%; height:100%; object-fit: cover; }
        .overlay {
            position: absolute; right: 8px; top: 8px;
            display: flex; gap: 6px; opacity: 0; pointer-events: none;
            transition: opacity 120ms ease;
        }
        :host(:hover) .overlay { opacity: 1; pointer-events: auto; }
        .overlay button {
            width: 32px; height: 32px; border-radius: 50%;
            border: 1px solid var(--border);
            background: var(--bg); color: var(--text);
            display: grid; place-items: center; cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }
        .overlay button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .overlay button:focus { outline: 2px solid var(--accent); }
        .body { padding: 12px; display:grid; gap:6px; }
        .title { font-weight: 600; line-height: 1.2; color: var(--text); }
        .year { color: var(--muted); font-size: 0.9rem; }
        .user-rating { color: var(--accent); font-size: 0.9rem; font-weight: 600; }
        .note { color: var(--error); font-size:0.85rem; }
    </style>
    <div class="poster">
        <img alt="Poster" />
        <div class="overlay" aria-label="Quick actions">
            <button class="love" title="Loved" aria-label="Loved">❤</button>
            <button class="hate" title="Hated" aria-label="Hated">🗙</button>
            <button class="watched" title="Watched" aria-label="Watched">✓</button>
            <button class="watchlist" title="Watchlist" aria-label="Watchlist">➕</button>
        </div>
    </div>
  <div class="body">
    <div class="title">Movie title</div>
    <div class="year">Year</div>
        <div class="user-rating" hidden><span class="val"></span>/10</div>
    <div class="note" hidden></div>
  </div>
    
`;

export default class MovieCard extends HTMLElement {
    static get observedAttributes() {
        return ['imdb', 'title', 'y', 'apikey'];
    }

    #data = { title: '', year: '', poster: '' };
    #img;
    #titleEl;
    #yearEl;
    #noteEl;
    #userRatingEl;
    #userRatingValEl;
    #loveBtn;
    #hateBtn;
    #watchedBtn;
    #watchlistBtn;
    #detailsHref = '';

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.#img = shadow.querySelector('img');
        this.#titleEl = shadow.querySelector('.title');
        this.#yearEl = shadow.querySelector('.year');
        this.#noteEl = shadow.querySelector('.note');
        this.#userRatingEl = shadow.querySelector('.user-rating');
        this.#userRatingValEl = shadow.querySelector('.user-rating .val');
        this.#loveBtn = shadow.querySelector('.overlay .love');
        this.#hateBtn = shadow.querySelector('.overlay .hate');
        this.#watchedBtn = shadow.querySelector('.overlay .watched');
        this.#watchlistBtn = shadow.querySelector('.overlay .watchlist');
    }

    connectedCallback() {
        this.addEventListener('click', this.#onNavigate);
        this.addEventListener('keydown', this.#onKey);
        this.setAttribute('tabindex', '0');
        this.#loveBtn?.addEventListener('click', this.#onLove);
        this.#hateBtn?.addEventListener('click', this.#onHate);
        this.#watchedBtn?.addEventListener('click', this.#onWatched);
        this.#watchlistBtn?.addEventListener('click', this.#onWatchlist);
        this.#load();
    }
    attributeChangedCallback() {
        this.#load();
    }
    disconnectedCallback() {
        this.removeEventListener('click', this.#onNavigate);
        this.removeEventListener('keydown', this.#onKey);
        this.#loveBtn?.removeEventListener('click', this.#onLove);
        this.#hateBtn?.removeEventListener('click', this.#onHate);
        this.#watchedBtn?.removeEventListener('click', this.#onWatched);
        this.#watchlistBtn?.removeEventListener('click', this.#onWatchlist);
    }

    get imdb() {
        return this.getAttribute('imdb');
    }
    set imdb(v) {
        if (v == null) this.removeAttribute('imdb');
        else this.setAttribute('imdb', v);
    }

    get movieTitle() {
        return this.getAttribute('title');
    }
    set movieTitle(v) {
        if (v == null) this.removeAttribute('title');
        else this.setAttribute('title', v);
    }

    get y() {
        return this.getAttribute('y');
    }
    set y(v) {
        if (v == null) this.removeAttribute('y');
        else this.setAttribute('y', v);
    }

    get apikey() {
        return this.getAttribute('apikey');
    }
    set apikey(v) {
        if (v == null) this.removeAttribute('apikey');
        else this.setAttribute('apikey', v);
    }

    async #load() {
        const id = this.imdb?.trim();
        const t = this.movieTitle?.trim();
        if (!id && !t) {
            this.#renderNote('Set imdb or title attribute.');
            return;
        }

        this.#renderNote('Ładowanie…', true);

        const key = (this.apikey || DEFAULT_API_KEY).trim();
        const params = new URLSearchParams({ apikey: key });
        if (id) params.set('i', id);
        else params.set('t', t);
        if (this.y) params.set('y', this.y);

        const url = `${API_URL}?${params.toString()}`;
        try {
            const c = new AbortController();
            const timer = setTimeout(() => c.abort(), 8000);
            const res = await fetch(url, { signal: c.signal });
            clearTimeout(timer);
            if (!res.ok) {
                let msg = 'HTTP ' + res.status;
                try {
                    const ct = res.headers.get('content-type') || '';
                    if (ct.includes('application/json')) {
                        const j = await res.json();
                        if (j && j.Error)
                            msg = `${j.Error} (HTTP ${res.status})`;
                    } else {
                        const t = await res.text();
                        if (t) msg = `${t} (HTTP ${res.status})`;
                    }
                } catch {}
                throw new Error(msg);
            }
            const json = await res.json();
            if (json.Response === 'False')
                throw new Error(json.Error || 'Not found');
            this.#data.title = json.Title || '';
            this.#data.year = json.Year || '';
            this.#data.poster =
                json.Poster && json.Poster !== 'N/A' ? json.Poster : '';
            this.#data.imdbID = json.imdbID || '';
            this.#render();
            this.#updatePrefsUI();
            this.#renderNote('');
        } catch (e) {
            this.#data.title = t || id || '';
            this.#data.year = '';
            this.#data.poster = '';
            this.#render();
            this.#updatePrefsUI();
            this.#renderNote('Błąd: ' + (e?.message || e), false, true);
        }
    }

    #render() {
        this.#titleEl.textContent = this.#data.title || '—';
        this.#yearEl.textContent = this.#data.year || '';
        if (this.#data.poster) {
            this.#img.src = this.#data.poster;
            this.#img.alt = `${this.#data.title} (${this.#data.year})`;
        } else {
            this.#img.removeAttribute('src');
            this.#img.alt = 'No poster';
        }
        const key = (this.apikey || '').trim();
        const id = this.imdb?.trim() || this.#data.imdbID || '';
        const params = new URLSearchParams();
        if (key) params.set('apikey', key);
        if (id) params.set('imdb', id);
        else if (this.movieTitle) {
            params.set('title', this.movieTitle);
            if (this.y) params.set('y', this.y);
        }
        this.#detailsHref = `./details.html${
            params.toString() ? '?' + params.toString() : ''
        }`;
        this.#updatePrefsUI();
    }

    #renderNote(msg, isError = false) {
        if (!msg) {
            this.#noteEl.hidden = true;
            this.#noteEl.textContent = '';
            return;
        }
        this.#noteEl.hidden = false;
        this.#noteEl.textContent = msg;
        this.#noteEl.style.color = isError ? '#b91c1c' : '#64748b';
    }

    #onNavigate = () => {
        if (!this.#detailsHref) return;
        window.location.href = this.#detailsHref;
    };
    #onKey = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.#onNavigate();
        }
    };
    #updatePrefsUI() {
        const id = this.#data?.imdbID || this.imdb?.trim();
        if (!id) return;
        const store = loadPrefs();
        const loved = new Set(store.loved || []);
        const hated = new Set(store.hated || []);
        const watched = new Set(store.watched || []);
        const watchlist = new Set(store.watchlist || []);
        this.#loveBtn?.classList.toggle('active', loved.has(id));
        this.#hateBtn?.classList.toggle('active', hated.has(id));
        this.#watchedBtn?.classList.toggle('active', watched.has(id));
        this.#watchlistBtn?.classList.toggle('active', watchlist.has(id));
        const ratings = store.ratings || {};
        const r = ratings[id];
        if (r != null) {
            if (this.#userRatingEl && this.#userRatingValEl) {
                this.#userRatingEl.hidden = false;
                this.#userRatingValEl.textContent = String(r);
            }
        } else {
            if (this.#userRatingEl) this.#userRatingEl.hidden = true;
        }
    }
    #onLove = (e) => {
        e.stopPropagation();
        const id = this.#data?.imdbID;
        if (!id) return;
        const store = loadPrefs();
        store.loved = store.loved || [];
        store.hated = store.hated || [];
        if (!store.loved.includes(id)) store.loved.push(id);
        else store.loved = store.loved.filter((x) => x !== id);
        store.hated = store.hated.filter((x) => x !== id);
        savePrefs(store);
        this.#updatePrefsUI();
    };
    #onHate = (e) => {
        e.stopPropagation();
        const id = this.#data?.imdbID;
        if (!id) return;
        const store = loadPrefs();
        store.hated = store.hated || [];
        store.loved = store.loved || [];
        if (!store.hated.includes(id)) store.hated.push(id);
        else store.hated = store.hated.filter((x) => x !== id);
        store.loved = store.loved.filter((x) => x !== id);
        savePrefs(store);
        this.#updatePrefsUI();
    };
    #onWatched = (e) => {
        e.stopPropagation();
        const id = this.#data?.imdbID;
        if (!id) return;
        const store = loadPrefs();
        store.watched = store.watched || [];
        store.watchlist = store.watchlist || [];
        if (!store.watched.includes(id)) store.watched.push(id);
        else store.watched = store.watched.filter((x) => x !== id);
        store.watchlist = store.watchlist.filter((x) => x !== id);
        savePrefs(store);
        this.#updatePrefsUI();
    };
    #onWatchlist = (e) => {
        e.stopPropagation();
        const id = this.#data?.imdbID;
        if (!id) return;
        const store = loadPrefs();
        store.watchlist = store.watchlist || [];
        store.watched = store.watched || [];
        if (!store.watchlist.includes(id)) store.watchlist.push(id);
        else store.watchlist = store.watchlist.filter((x) => x !== id);
        store.watched = store.watched.filter((x) => x !== id);
        savePrefs(store);
        this.#updatePrefsUI();
    };
}

customElements.define('movie-card', MovieCard);
