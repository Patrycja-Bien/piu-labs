const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 1000;
    }
    button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--text);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }
    button:focus { outline: 2px solid var(--accent); outline-offset: 2px; }
    .icon { font-size: 1rem; }
  </style>
  <button aria-label="Toggle color theme" title="Toggle color theme">
    <span class="icon">🌙</span>
    <span class="label">Dark</span>
  </button>
`;

export default class ThemeToggle extends HTMLElement {
    #btn;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.#btn = shadow.querySelector('button');
    }

    connectedCallback() {
        const current = this.#getInitialTheme();
        this.#applyTheme(current);
        this.#btn.addEventListener('click', this.#onToggle);
        this.#btn.addEventListener('keydown', this.#onKey);
    }

    disconnectedCallback() {
        this.#btn.removeEventListener('click', this.#onToggle);
        this.#btn.removeEventListener('keydown', this.#onKey);
    }

    #onToggle = () => {
        const next =
            document.documentElement.getAttribute('data-theme') === 'dark'
                ? 'light'
                : 'dark';
        this.#applyTheme(next);
    };

    #onKey = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.#onToggle();
        }
    };

    #applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('final-theme', theme);
        const isDark = theme === 'dark';
        const icon = this.shadowRoot.querySelector('.icon');
        const label = this.shadowRoot.querySelector('.label');
        icon.textContent = isDark ? '☀️' : '🌙';
        label.textContent = isDark ? 'Light' : 'Dark';
        this.#btn.setAttribute('aria-pressed', String(isDark));
    }

    #getInitialTheme() {
        try {
            const saved = localStorage.getItem('final-theme');
            if (saved === 'dark' || saved === 'light') return saved;
        } catch {}
        const prefersDark =
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches;
        return prefersDark ? 'dark' : 'light';
    }
}

customElements.define('theme-toggle', ThemeToggle);
