const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host { display:block; font-family:system-ui, Arial, sans-serif; color: var(--text); }
    form { display:flex; gap:8px; flex-wrap:wrap; align-items:end; margin: 0 0 16px; }
    label { display:grid; gap:4px; font-size:0.9rem; color: var(--muted); }
    input[type="text"], select {
      padding:8px 10px; border:1px solid var(--border); border-radius:8px; min-width: 180px; background: var(--bg); color: var(--text);
    }
    input::placeholder { color: var(--muted); }
    select { appearance: auto; }
    input:focus, select:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
    .error { color: var(--error); font-size:0.8rem; }
    button { padding:8px 12px; border-radius:8px; border:1px solid var(--accent); background: var(--accent); color:#fff; cursor:pointer; }
  </style>
  <form part="form">
    <label> Title
      <input name="q" type="text" placeholder="e.g. Batman" required minlength="3" />
      <small class="error q-error" hidden>Enter at least 3 characters.</small>
    </label>
    <label> Year
      <select name="y">
        <option value="">Any</option>
      </select>
    </label>
    <label> Type
      <select name="type">
        <option value="">Any</option>
        <option value="movie">Movie</option>
        <option value="series">Series</option>
        <option value="episode">Episode</option>
      </select>
    </label>
      <label> Sort
        <select name="sort">
          <option value="">Relevance</option>
          <option value="title-asc">Title A→Z</option>
          <option value="title-desc">Title Z→A</option>
          <option value="year-asc">Year Old→New</option>
          <option value="year-desc">Year New→Old</option>
        </select>
      </label>
    <button type="submit">Search</button>
  </form>
`;

export default class MovieSearch extends HTMLElement {
    static get observedAttributes() {
        return ['apikey'];
    }

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        this.shadowRoot
            .querySelector('form')
            ?.addEventListener('submit', this.#onSubmit);
        this.#populateYears();
        const qInput = this.shadowRoot.querySelector('input[name="q"]');
        const qError = this.shadowRoot.querySelector('.q-error');
        qInput?.addEventListener('input', () => {
            const len = qInput.value.trim().length;
            if (qError) qError.hidden = len >= 3 || len === 0;
        });
        this.#bootstrapFromStorage();
    }

    disconnectedCallback() {
        this.shadowRoot
            .querySelector('form')
            ?.removeEventListener('submit', this.#onSubmit);
    }

    get apikey() {
        return this.getAttribute('apikey') || '';
    }
    set apikey(v) {
        if (v == null) this.removeAttribute('apikey');
        else this.setAttribute('apikey', v);
    }

    #onSubmit = (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const q = (fd.get('q') || '').toString().trim();
        const y = (fd.get('y') || '').toString().trim();
        const type = (fd.get('type') || '').toString().trim();
        const sort = (fd.get('sort') || '').toString().trim();
        const qInput = form.querySelector('input[name="q"]');
        const qError = this.shadowRoot.querySelector('.q-error');
        if (!q || q.length < 3) {
            if (qError) qError.hidden = false;
            qInput?.focus();
            return;
        }
        try {
            const last = { q, y: y || '', type: type || '', sort: sort || '' };
            localStorage.setItem('final-last-search', JSON.stringify(last));
        } catch {}
        this.dispatchEvent(
            new CustomEvent('movie-search', {
                detail: {
                    q,
                    y: y || undefined,
                    type: type || undefined,
                    sort: sort || undefined,
                    apikey: this.apikey || undefined,
                },
                bubbles: true,
                composed: true,
            })
        );
    };

    #bootstrapped = false;
    #bootstrapFromStorage() {
        if (this.#bootstrapped) return;
        this.#bootstrapped = true;
        const qInput = this.shadowRoot.querySelector('input[name="q"]');
        const ySel = this.shadowRoot.querySelector('select[name="y"]');
        const typeSel = this.shadowRoot.querySelector('select[name="type"]');
        const sortSel = this.shadowRoot.querySelector('select[name="sort"]');
        let data = null;
        try {
            data = JSON.parse(
                localStorage.getItem('final-last-search') || 'null'
            );
        } catch {}
        const q = data?.q && data.q.length >= 3 ? data.q : 'Batman';
        const y = data?.y || '';
        const type = data?.type || '';
        const sort = data?.sort || '';
        if (qInput) qInput.value = q;
        if (ySel) ySel.value = y;
        if (typeSel) typeSel.value = type;
        if (sortSel) sortSel.value = sort;
        const qError = this.shadowRoot.querySelector('.q-error');
        if (qError) qError.hidden = true;
        const detail = {
            q,
            y: y || undefined,
            type: type || undefined,
            sort: sort || undefined,
            apikey: this.apikey || undefined,
        };
        setTimeout(() => {
            this.dispatchEvent(
                new CustomEvent('movie-search', {
                    detail,
                    bubbles: true,
                    composed: true,
                })
            );
        }, 0);
    }
    #populateYears() {
        const sel = this.shadowRoot.querySelector('select[name="y"]');
        if (!sel || sel.options.length > 1) return;
        const current = new Date().getFullYear();
        for (let y = current; y >= 1900; y--) {
            const opt = document.createElement('option');
            opt.value = String(y);
            opt.textContent = String(y);
            sel.appendChild(opt);
        }
    }
}

customElements.define('movie-search', MovieSearch);
