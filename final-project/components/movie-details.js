import { DEFAULT_API_KEY } from './config.js';
import { loadPrefs, savePrefs } from './prefs.js';
const API_URL = 'https://www.omdbapi.com/';

const template = document.createElement('template');

template.innerHTML = `
    <style>
        :host { display:block; font-family: system-ui, Arial, sans-serif; color: var(--text); }
        .wrap { display:grid; gap:20px; grid-template-columns: 1fr; }
        @media (min-width: 800px) {
            .wrap { grid-template-columns: 320px 1fr; align-items: start; }
        }
        .poster { width:100%; background: var(--bg); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
        .poster img { width:100%; height:auto; display:block; }
        h1 { margin:0; font-size: clamp(1.5rem, 2.5vw + 1rem, 2.4rem); line-height:1.2; }
        .meta { color: var(--muted); margin:6px 0 16px; }
        .plot { font-size:1rem; line-height:1.6; color: var(--text); }
        .controls { display:flex; gap:12px; flex-wrap:wrap; margin-top:16px; }
        button { padding:8px 12px; border-radius:8px; border:1px solid var(--accent); background: var(--accent); color:#fff; cursor:pointer; }
        button.secondary { background: var(--bg); color: var(--text); border-color: var(--border); }
        button.active { outline: 2px solid var(--accent); }
        .rating { display:flex; align-items:center; gap:8px; margin-top:8px; }
        .rating input { width:80px; padding:6px 8px; border:1px solid var(--border); border-radius:8px; background: var(--bg); color: var(--text); }
        .note { color:#16a34a; font-size:0.9rem; }
        .error { color: var(--error); font-size:0.9rem; }
                .more { margin-top:24px; }
                .more h2 { margin:0 0 12px; font-size:1.1rem; color: var(--text); }
                .facts { display:grid; gap:8px; }
                .facts .row { display:grid; grid-template-columns: 120px 1fr; gap:8px; align-items:start; }
                .facts .label { color: var(--muted); }
                .facts .value { color: var(--text); }
                .ext-ratings { margin-top:16px; }
                .ext-ratings h3 { margin:0 0 8px; font-size:1rem; color: var(--text); }
                .ext-ratings ul { margin:0; padding-left:18px; }
                .ext-ratings li { color: var(--text); }
    </style>
  <div class="wrap">
    <div class="poster"><img alt="Poster" /></div>
    <div class="info">
      <h1 class="title">Title</h1>
      <div class="meta"></div>
      <div class="plot"></div>
      <div class="controls">
        <button class="love">❤ Loved</button>
        <button class="hate secondary">🗙 Hated</button>
                <button class="watched secondary">✓ Watched</button>
                <button class="watchlist secondary">➕ Watchlist</button>
      </div>
      <div class="rating">
        <label> Your rating
          <input type="number" min="1" max="10" step="0.5" />
        </label>
        <button class="save secondary">Save rating</button>
        <span class="note" hidden>Saved.</span>
      </div>
            <div class="more">
                <h2>Details</h2>
                <div class="facts">
                    <div class="row"><span class="label">Actors</span><span class="value actors"></span></div>
                    <div class="row"><span class="label">Director</span><span class="value director"></span></div>
                    <div class="row"><span class="label">Awards</span><span class="value awards"></span></div>
                </div>
                <div class="ext-ratings">
                    <h3>Ratings</h3>
                    <ul class="ratings"></ul>
                </div>
            </div>
      <div class="error" hidden></div>
    </div>
  </div>
`;

export default class MovieDetails extends HTMLElement {
    static get observedAttributes() {
        return ['imdb', 'title', 'y', 'apikey'];
    }

    #img;
    #titleEl;
    #metaEl;
    #plotEl;
    #loveBtn;
    #hateBtn;
    #watchedBtn;
    #watchlistBtn;
    #ratingInput;
    #saveBtn;
    #noteEl;
    #errorEl;
    #actorsEl;
    #directorEl;
    #awardsEl;
    #ratingsList;
    #data = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.#img = shadow.querySelector('img');
        this.#titleEl = shadow.querySelector('.title');
        this.#metaEl = shadow.querySelector('.meta');
        this.#plotEl = shadow.querySelector('.plot');
        this.#loveBtn = shadow.querySelector('.love');
        this.#hateBtn = shadow.querySelector('.hate');
        this.#watchedBtn = shadow.querySelector('.watched');
        this.#watchlistBtn = shadow.querySelector('.watchlist');
        this.#ratingInput = shadow.querySelector('input[type="number"]');
        this.#saveBtn = shadow.querySelector('.save');
        this.#noteEl = shadow.querySelector('.note');
        this.#errorEl = shadow.querySelector('.error');
        this.#actorsEl = shadow.querySelector('.actors');
        this.#directorEl = shadow.querySelector('.director');
        this.#awardsEl = shadow.querySelector('.awards');
        this.#ratingsList = shadow.querySelector('.ratings');
    }

    connectedCallback() {
        this.#loveBtn.addEventListener('click', this.#onLove);
        this.#hateBtn.addEventListener('click', this.#onHate);
        this.#watchedBtn.addEventListener('click', this.#onWatched);
        this.#watchlistBtn.addEventListener('click', this.#onWatchlist);
        this.#saveBtn.addEventListener('click', this.#onSave);
        this.#load();
    }
    disconnectedCallback() {
        this.#loveBtn.removeEventListener('click', this.#onLove);
        this.#hateBtn.removeEventListener('click', this.#onHate);
        this.#watchedBtn.removeEventListener('click', this.#onWatched);
        this.#watchlistBtn.removeEventListener('click', this.#onWatchlist);
        this.#saveBtn.removeEventListener('click', this.#onSave);
    }

    attributeChangedCallback() {
        this.#load();
    }

    get imdb() {
        return this.getAttribute('imdb') || '';
    }
    set imdb(v) {
        v == null ? this.removeAttribute('imdb') : this.setAttribute('imdb', v);
    }
    get title() {
        return this.getAttribute('title') || '';
    }
    set title(v) {
        v == null
            ? this.removeAttribute('title')
            : this.setAttribute('title', v);
    }
    get y() {
        return this.getAttribute('y') || '';
    }
    set y(v) {
        v == null ? this.removeAttribute('y') : this.setAttribute('y', v);
    }
    get apikey() {
        return this.getAttribute('apikey') || '';
    }
    set apikey(v) {
        v == null
            ? this.removeAttribute('apikey')
            : this.setAttribute('apikey', v);
    }

    async #load() {
        const id = this.imdb.trim();
        const t = this.title.trim();
        if (!id && !t) return;
        this.#showError('');
        this.#note('Loading…');
        const key = (this.apikey || DEFAULT_API_KEY).trim();
        const params = new URLSearchParams({ apikey: key });
        if (id) params.set('i', id);
        else params.set('t', t);
        if (this.y) params.set('y', this.y);
        params.set('plot', 'full');
        const url = `${API_URL}?${params.toString()}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            if (json.Response === 'False')
                throw new Error(json.Error || 'Not found');
            this.#data = json;
            this.#render();
            this.#note('');
        } catch (e) {
            this.#note('');
            this.#showError('Error: ' + (e?.message || e));
        }
    }

    #render() {
        const d = this.#data;
        if (!d) return;
        this.#titleEl.textContent = `${d.Title || ''}`;
        const metaParts = [d.Year, d.Rated, d.Runtime, d.Genre].filter(Boolean);
        this.#metaEl.textContent = metaParts.join(' • ');
        this.#plotEl.textContent = d.Plot && d.Plot !== 'N/A' ? d.Plot : '—';
        if (d.Poster && d.Poster !== 'N/A') {
            this.#img.src = d.Poster;
            this.#img.alt = `${d.Title} (${d.Year}) poster`;
        } else {
            this.#img.removeAttribute('src');
            this.#img.alt = 'No poster';
        }

        const safeText = (v) => (v && v !== 'N/A' ? v : '—');
        if (this.#actorsEl) this.#actorsEl.textContent = safeText(d.Actors);
        if (this.#directorEl)
            this.#directorEl.textContent = safeText(d.Director);
        if (this.#awardsEl) this.#awardsEl.textContent = safeText(d.Awards);
        // external ratings
        if (this.#ratingsList) {
            this.#ratingsList.innerHTML = '';
            const items = [];
            if (d.imdbRating && d.imdbRating !== 'N/A') {
                const votes =
                    d.imdbVotes && d.imdbVotes !== 'N/A'
                        ? ` (${d.imdbVotes} votes)`
                        : '';
                items.push(`IMDb: ${d.imdbRating}/10${votes}`);
            }
            if (Array.isArray(d.Ratings)) {
                for (const r of d.Ratings) {
                    if (r?.Source && r?.Value)
                        items.push(`${r.Source}: ${r.Value}`);
                }
            }
            if (items.length === 0) {
                const li = document.createElement('li');
                li.textContent = '—';
                this.#ratingsList.appendChild(li);
            } else {
                for (const t of items) {
                    const li = document.createElement('li');
                    li.textContent = t;
                    this.#ratingsList.appendChild(li);
                }
            }
        }

        const store = loadPrefs();
        const loved = new Set(store.loved || []);
        const hated = new Set(store.hated || []);
        const watched = new Set(store.watched || []);
        const watchlist = new Set(store.watchlist || []);
        const ratings = store.ratings || {};
        const id = d.imdbID;
        this.#loveBtn.classList.toggle('active', loved.has(id));
        this.#hateBtn.classList.toggle('active', hated.has(id));
        if (this.#watchedBtn)
            this.#watchedBtn.classList.toggle('active', watched.has(id));
        if (this.#watchlistBtn)
            this.#watchlistBtn.classList.toggle('active', watchlist.has(id));
        this.#ratingInput.value =
            ratings[id] != null ? String(ratings[id]) : '';
    }

    #onLove = () => {
        if (!this.#data) return;
        const id = this.#data.imdbID;
        const store = loadPrefs();
        store.loved = store.loved || [];
        store.hated = store.hated || [];
        // toggle
        if (!store.loved.includes(id)) store.loved.push(id);
        else store.loved = store.loved.filter((x) => x !== id);
        // ensure not hated simultaneously
        store.hated = store.hated.filter((x) => x !== id);
        saveStore(store);
        this.#render();
    };

    #onHate = () => {
        if (!this.#data) return;
        const id = this.#data.imdbID;
        const store = loadPrefs();
        store.hated = store.hated || [];
        store.loved = store.loved || [];
        if (!store.hated.includes(id)) store.hated.push(id);
        else store.hated = store.hated.filter((x) => x !== id);
        store.loved = store.loved.filter((x) => x !== id);
        saveStore(store);
        this.#render();
    };

    #onWatched = () => {
        if (!this.#data) return;
        const id = this.#data.imdbID;
        const store = loadPrefs();
        store.watched = store.watched || [];
        store.watchlist = store.watchlist || [];
        if (!store.watched.includes(id)) store.watched.push(id);
        else store.watched = store.watched.filter((x) => x !== id);
        store.watchlist = store.watchlist.filter((x) => x !== id);
        savePrefs(store);
        this.#render();
    };

    #onWatchlist = () => {
        if (!this.#data) return;
        const id = this.#data.imdbID;
        const store = loadPrefs();
        store.watchlist = store.watchlist || [];
        store.watched = store.watched || [];
        if (!store.watchlist.includes(id)) store.watchlist.push(id);
        else store.watchlist = store.watchlist.filter((x) => x !== id);
        store.watched = store.watched.filter((x) => x !== id);
        savePrefs(store);
        this.#render();
    };

    #onSave = () => {
        if (!this.#data) return;
        const id = this.#data.imdbID;
        const val = this.#ratingInput.value.trim();
        if (!val) {
            this.#note('');
            return;
        }
        const num = Number(val);
        if (!(num >= 1 && num <= 10)) {
            this.#showError('Rating must be 1–10');
            return;
        }
        const store = loadPrefs();
        store.ratings = store.ratings || {};
        store.ratings[id] = num;
        savePrefs(store);
        this.#showError('');
        this.#note('Saved.');
        setTimeout(() => this.#note(''), 1500);
    };

    #note(msg) {
        if (!this.#noteEl) return;
        this.#noteEl.hidden = !msg;
        this.#noteEl.textContent = msg || '';
    }
    #showError(msg) {
        this.#errorEl.hidden = !msg;
        this.#errorEl.textContent = msg || '';
    }
}

customElements.define('movie-details', MovieDetails);
