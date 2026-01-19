import { DEFAULT_API_KEY } from './config.js';
import { loadPrefs, savePrefs } from './prefs.js';
const API_URL = 'https://www.omdbapi.com/';

const template = document.createElement('template');

const starIcon = `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
const heartIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
const xIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
const plusIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
const youtubeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>`;

template.innerHTML = `
    <style>
        :host { display:block; font-family: system-ui, Arial, sans-serif; color: var(--text); }
        .wrap { display:grid; gap:24px; grid-template-columns: 1fr; animation: fadein 0.3s ease; }
        @media (min-width: 800px) {
            .wrap { grid-template-columns: 300px 1fr; align-items: start; }
        }
        @keyframes fadein { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .poster { width:100%; aspect-ratio: 2/3; background: var(--bg); border:1px solid var(--border); border-radius:12px; overflow:hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .poster img { width:100%; height:100%; object-fit: cover; display:block; }
        
        h1 { margin:0 0 8px; font-size: clamp(1.8rem, 3vw, 2.5rem); line-height:1.1; color: var(--text); }
        .meta { display:flex; flex-wrap:wrap; gap:8px 16px; color: var(--muted); margin-bottom: 20px; font-size: 0.95rem; align-items: center; }
        .plot { font-size:1.05rem; line-height:1.7; color: var(--text); max-width: 65ch; margin-bottom: 24px; }
        
        .actions-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 8px; font-weight: 600; }
        .actions { display:flex; gap:12px; flex-wrap:wrap; margin-bottom: 24px; }
        .action-btn { 
            display: inline-flex; flex-direction: column; align-items: center; gap: 4px;
            background: transparent; border: 1px solid var(--border); color: var(--muted);
            padding: 8px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;
            min-width: 60px;
        }
        .action-btn:hover { background: var(--bg); border-color: var(--text); color: var(--text); transform: translateY(-2px); }
        .action-btn svg { width: 24px; height: 24px; pointer-events: none; }
        .action-btn span { font-size: 0.75rem; font-weight: 500; }
        
        .action-btn.love.active { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .action-btn.love.active svg { fill: #ef4444; }
        .action-btn.hate.active { border-color: var(--text); color: var(--text); background: var(--border); }
        .action-btn.hate.active svg { fill: var(--text); }
        .action-btn.watched.active { border-color: #22c55e; color: #22c55e; background: rgba(34, 197, 94, 0.1); }
        .action-btn.watchlist.active { border-color: var(--accent); color: var(--accent); background: rgba(59, 130, 246, 0.1); }
        .trailer-btn { text-decoration: none; border-color: #ef4444; color: #ef4444; }
        .trailer-btn:hover { background: #ef4444; color: white; border-color: #ef4444; }

        .rating-container { margin-bottom: 24px; background: var(--bg); border: 1px solid var(--border); padding: 16px; border-radius: 12px; display: inline-block; }
        .stars { display: flex; gap: 2px; cursor: pointer; color: var(--border); position: relative; }
        .stars svg { width: 26px; height: 26px; transition: transform 0.1s; fill: transparent; }
        
        .stars svg.filled { fill: #eab308; color: #eab308; }
        .stars svg.half-filled { fill: url(#halfGrad); color: #eab308; }

        .rating-text { margin-top: 8px; font-size: 0.9rem; color: var(--muted); font-weight: 500; min-height: 1.2em; }

        .review-area { width: 100%; max-width: 100%; min-width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); font-family: inherit; font-size: 0.95rem; min-height: 100px; resize: vertical; margin-bottom: 8px; }
        .review-area:focus { outline: 2px solid var(--accent); border-color: transparent; }
        .save-info { font-size: 0.8rem; color: var(--muted); text-align: right; font-style: italic; opacity: 0; transition: opacity 0.3s; }

        .more { margin-top:32px; border-top: 1px solid var(--border); padding-top: 24px; }
        .more h2 { margin:0 0 16px; font-size:1.2rem; color: var(--text); }
        .facts { display:grid; gap:12px; }
        .facts .row { display:grid; grid-template-columns: 100px 1fr; gap:12px; align-items:start; }
        .facts .label { color: var(--muted); font-size: 0.9rem; }
        .tags { display: flex; gap: 8px; flex-wrap: wrap; }
        .tag { background: var(--border); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; }
        .error { color: var(--error); padding: 20px; border: 1px solid var(--error); border-radius: 8px; background: rgba(185, 28, 28, 0.1); }
    </style>

    <svg width="0" height="0" style="position: absolute;">
      <defs>
        <linearGradient id="halfGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="50%" style="stop-color:currentColor; stop-opacity:1" />
          <stop offset="50%" style="stop-color:transparent; stop-opacity:1" />
        </linearGradient>
      </defs>
    </svg>

  <div class="wrap">
    <div class="poster"><img alt="Poster" /></div>
    
    <div class="info">
      <h1 class="title">Title</h1>
      <div class="meta"></div>
      
      <div class="actions-label">Your Actions</div>
      <div class="actions">
        <button class="action-btn love" title="Mark as Loved">${heartIcon} <span>Love</span></button>
        <button class="action-btn hate" title="Mark as Hated">${xIcon} <span>Hate</span></button>
        <button class="action-btn watched" title="Mark as Watched">${checkIcon} <span>Seen</span></button>
        <button class="action-btn watchlist" title="Add to Watchlist">${plusIcon} <span>List</span></button>
        <a href="#" target="_blank" class="action-btn trailer-btn" title="Search Trailer">${youtubeIcon} <span>Trailer</span></a>
      </div>

      <div class="actions-label">Your Rating</div>
      <div class="rating-container">
        <div class="stars"></div>
        <div class="rating-text">Rate this movie</div>
      </div>

      <div class="actions-label">Private Notes</div>
      <textarea class="review-area" placeholder="Write your private review here... (Auto-saved)"></textarea>
      <div class="save-info">Saved.</div>

      <div class="actions-label" style="margin-top: 16px">Plot</div>
      <div class="plot"></div>

      <div class="more">
        <h2>Details</h2>
        <div class="facts">
            <div class="row"><span class="label">Cast</span><span class="value actors"></span></div>
            <div class="row"><span class="label">Director</span><span class="value director"></span></div>
            <div class="row"><span class="label">Awards</span><span class="value awards"></span></div>
            <div class="row"><span class="label">Ratings</span><div class="value ratings-list"></div></div>
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
    #errorEl;
    #loveBtn;
    #hateBtn;
    #watchedBtn;
    #watchlistBtn;
    #trailerBtn;
    #actorsEl;
    #directorEl;
    #awardsEl;
    #ratingsListEl;
    #starsContainer;
    #ratingTextEl;
    #reviewArea;
    #saveInfo;

    #data = null;
    #currentRating = 0;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));

        this.#img = shadow.querySelector('img');
        this.#titleEl = shadow.querySelector('.title');
        this.#metaEl = shadow.querySelector('.meta');
        this.#plotEl = shadow.querySelector('.plot');
        this.#errorEl = shadow.querySelector('.error');
        this.#loveBtn = shadow.querySelector('.love');
        this.#hateBtn = shadow.querySelector('.hate');
        this.#watchedBtn = shadow.querySelector('.watched');
        this.#watchlistBtn = shadow.querySelector('.watchlist');
        this.#trailerBtn = shadow.querySelector('.trailer-btn');
        this.#actorsEl = shadow.querySelector('.actors');
        this.#directorEl = shadow.querySelector('.director');
        this.#awardsEl = shadow.querySelector('.awards');
        this.#ratingsListEl = shadow.querySelector('.ratings-list');
        this.#starsContainer = shadow.querySelector('.stars');
        this.#ratingTextEl = shadow.querySelector('.rating-text');
        this.#reviewArea = shadow.querySelector('.review-area');
        this.#saveInfo = shadow.querySelector('.save-info');

        this.#generateStars();
    }

    connectedCallback() {
        this.#loveBtn.addEventListener('click', () =>
            this.#toggleList('loved', this.#loveBtn),
        );
        this.#hateBtn.addEventListener('click', () =>
            this.#toggleList('hated', this.#hateBtn),
        );
        this.#watchedBtn.addEventListener('click', () =>
            this.#toggleList('watched', this.#watchedBtn),
        );
        this.#watchlistBtn.addEventListener('click', () =>
            this.#toggleList('watchlist', this.#watchlistBtn),
        );
        this.#reviewArea.addEventListener('blur', this.#onReviewBlur);
        this.#reviewArea.addEventListener(
            'input',
            () => (this.#saveInfo.style.opacity = '0'),
        );

        this.#load();
    }

    disconnectedCallback() {
        this.#reviewArea.removeEventListener('blur', this.#onReviewBlur);
    }

    get imdb() {
        return this.getAttribute('imdb') || '';
    }
    get title() {
        return this.getAttribute('title') || '';
    }
    get y() {
        return this.getAttribute('y') || '';
    }
    get apikey() {
        return this.getAttribute('apikey') || '';
    }

    attributeChangedCallback() {
        this.#load();
    }

    #generateStars() {
        this.#starsContainer.innerHTML = '';
        for (let i = 1; i <= 10; i++) {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'contents';
            wrapper.innerHTML = starIcon;
            const svg = wrapper.querySelector('svg');
            svg.dataset.index = i;

            svg.addEventListener('mousemove', (e) => this.#onStarHover(e, i));
            svg.addEventListener('click', (e) => this.#onStarClick(e, i));

            this.#starsContainer.appendChild(svg);
        }
        this.#starsContainer.addEventListener('mouseleave', () => {
            this.#highlightStars(this.#currentRating);
        });
    }

    #onStarHover(e, index) {
        const rect = e.currentTarget.getBoundingClientRect();
        const isLeftHalf = e.clientX - rect.left < rect.width / 2;
        const val = isLeftHalf ? index - 0.5 : index;
        this.#highlightStars(val, true);
    }

    #onStarClick(e, index) {
        const rect = e.currentTarget.getBoundingClientRect();
        const isLeftHalf = e.clientX - rect.left < rect.width / 2;
        const val = isLeftHalf ? index - 0.5 : index;
        this.#saveRating(val);
    }

    #highlightStars(rating, isHover = false) {
        const stars = this.#starsContainer.querySelectorAll('svg');
        stars.forEach((s) => {
            const i = parseInt(s.dataset.index, 10);
            s.classList.remove('filled', 'half-filled');

            if (i <= rating) {
                s.classList.add('filled');
            } else if (i === Math.ceil(rating) && !Number.isInteger(rating)) {
                s.classList.add('half-filled');
            }
        });

        const text =
            rating > 0 ? `${rating}/10` : isHover ? '0/10' : 'Rate this movie';
        this.#ratingTextEl.textContent = text;
        this.#ratingTextEl.style.color = isHover
            ? 'var(--text)'
            : 'var(--muted)';
    }

    async #load() {
        const id = this.imdb.trim();
        const t = this.title.trim();
        if (!id && !t) return;

        this.#showError('');
        const key = (this.apikey || DEFAULT_API_KEY).trim();
        const params = new URLSearchParams({ apikey: key, plot: 'full' });

        if (id) params.set('i', id);
        else params.set('t', t);
        if (this.y) params.set('y', this.y);

        try {
            const res = await fetch(`${API_URL}?${params.toString()}`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const json = await res.json();
            if (json.Response === 'False')
                throw new Error(json.Error || 'Not found');

            this.#data = json;
            this.#render();
        } catch (e) {
            this.#showError('Error loading details: ' + (e?.message || e));
        }
    }

    #render() {
        const d = this.#data;
        if (!d) return;

        this.#titleEl.textContent = d.Title || 'Untitled';
        const query = encodeURIComponent(`${d.Title} ${d.Year} trailer`);
        this.#trailerBtn.href = `https://www.youtube.com/results?search_query=${query}`;

        this.#metaEl.innerHTML = '';
        [d.Year, d.Rated, d.Runtime].filter(Boolean).forEach((text) => {
            const s = document.createElement('span');
            s.textContent = text;
            if (this.#metaEl.children.length > 0) this.#metaEl.append(' • ');
            this.#metaEl.appendChild(s);
        });
        if (d.Genre && d.Genre !== 'N/A') {
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'tags';
            d.Genre.split(',').forEach((g) => {
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = g.trim();
                tagsDiv.appendChild(tag);
            });
            this.#metaEl.appendChild(tagsDiv);
        }

        this.#plotEl.textContent =
            d.Plot && d.Plot !== 'N/A' ? d.Plot : 'No plot available.';

        if (d.Poster && d.Poster !== 'N/A') {
            this.#img.src = d.Poster;
            this.#img.alt = d.Title;
        } else {
            this.#img.removeAttribute('src');
        }

        const safe = (v) => (v && v !== 'N/A' ? v : '—');
        this.#actorsEl.textContent = safe(d.Actors);
        this.#directorEl.textContent = safe(d.Director);
        this.#awardsEl.textContent = safe(d.Awards);

        this.#ratingsListEl.innerHTML = '';
        if (d.imdbRating && d.imdbRating !== 'N/A') {
            this.#ratingsListEl.innerHTML += `<div><strong>IMDb:</strong> ${d.imdbRating} <small>(${d.imdbVotes})</small></div>`;
        }
        if (Array.isArray(d.Ratings)) {
            d.Ratings.forEach((r) => {
                this.#ratingsListEl.innerHTML += `<div><strong>${r.Source}:</strong> ${r.Value}</div>`;
            });
        }

        this.#updatePrefsUI();
    }

    #updatePrefsUI() {
        if (!this.#data) return;
        const id = this.#data.imdbID;
        const store = loadPrefs();

        const check = (listName, btn) => {
            const list = store[listName] || [];
            btn.classList.toggle('active', list.includes(id));
        };

        check('loved', this.#loveBtn);
        check('hated', this.#hateBtn);
        check('watched', this.#watchedBtn);
        check('watchlist', this.#watchlistBtn);

        const ratings = store.ratings || {};
        this.#currentRating = ratings[id] ? Number(ratings[id]) : 0;
        this.#highlightStars(this.#currentRating);

        const reviews = store.reviews || {};
        this.#reviewArea.value = reviews[id] || '';
    }

    #toggleList(listName, btn) {
        if (!this.#data) return;
        const id = this.#data.imdbID;
        const store = loadPrefs();
        store[listName] = store[listName] || [];

        if (listName === 'loved')
            store.hated = store.hated?.filter((x) => x !== id);
        if (listName === 'hated')
            store.loved = store.loved?.filter((x) => x !== id);

        if (store[listName].includes(id)) {
            store[listName] = store[listName].filter((x) => x !== id);
        } else {
            store[listName].push(id);
        }

        savePrefs(store);
        this.#updatePrefsUI();
        window.dispatchEvent(
            new CustomEvent('final-prefs-changed', {
                detail: { id, store },
                bubbles: true,
            }),
        );
    }

    #saveRating(val) {
        if (!this.#data) return;
        const id = this.#data.imdbID;
        const store = loadPrefs();
        store.ratings = store.ratings || {};
        store.ratings[id] = val;
        savePrefs(store);
        this.#updatePrefsUI();

        this.#ratingTextEl.style.color = 'var(--accent)';
        setTimeout(
            () => (this.#ratingTextEl.style.color = 'var(--muted)'),
            500,
        );
        window.dispatchEvent(
            new CustomEvent('final-prefs-changed', {
                detail: { id, store },
                bubbles: true,
            }),
        );
    }

    #onReviewBlur = () => {
        if (!this.#data) return;
        const id = this.#data.imdbID;
        const val = this.#reviewArea.value.trim();
        const store = loadPrefs();

        store.reviews = store.reviews || {};
        store.reviews[id] = val;

        savePrefs(store);

        this.#saveInfo.style.opacity = '1';
        setTimeout(() => (this.#saveInfo.style.opacity = '0'), 2000);
    };

    #showError(msg) {
        this.#errorEl.hidden = !msg;
        this.#errorEl.textContent = msg || '';
    }
}

customElements.define('movie-details', MovieDetails);
