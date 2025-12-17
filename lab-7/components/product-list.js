import './product-card.js';

const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host { display:block }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px;
    }
  </style>
  <div class="grid"></div>
`;

export default class ProductList extends HTMLElement {
    #container;
    #products = [];
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.#container = shadow.querySelector('.grid');
    }

    connectedCallback() {
        this.#load().then(() => this.#render());
    }

    async #load() {
        try {
            const url = new URL('../data/products.json', import.meta.url);
            const res = await fetch(url);
            if (!res.ok) throw new Error(String(res.status));
            this.#products = await res.json();
            this.setAttribute('data-source', 'json');
            console.info('[ProductList] Loaded products from JSON');
        } catch (e) {
            this.#products = [];
            this.setAttribute('data-source', 'none');
            console.error('[ProductList] Failed to load JSON', e);
        }
    }

    #render() {
        this.#container.innerHTML = '';
        for (const p of this.#products) {
            const card = document.createElement('product-card');
            card.id = p.id;
            card.title = p.name;
            card.price = p.price;
            if (p.image) card.image = p.image;
            if (p.promo) card.promo = p.promo;
            if (p.note) card.note = p.note;
            if (Array.isArray(p.colors)) card.colors = p.colors;
            if (Array.isArray(p.sizes)) card.sizes = p.sizes;
            this.#container.appendChild(card);
        }
    }
}

customElements.define('product-list', ProductList);
