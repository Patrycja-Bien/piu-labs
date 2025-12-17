const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 0;
      width: 220px;
      border: 1px solid #ddd;
      border-radius: 10px;
      background: #fff;
      font-family: system-ui, Arial, sans-serif;
      overflow: visible;
      box-sizing: border-box;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: box-shadow 160ms ease, transform 160ms ease;
    }
    .image {
      width: 90%;
      aspect-ratio: 4 / 5;
      display: grid;
      place-items: center;
    }
    .image ::slotted(img) {
      width: 90%;
      height: 90%;
      object-fit: cover;
      transition: transform 220ms ease;
    }
    .image img {
      width: 90%;
      height: 90%;
      object-fit: cover;
      transition: transform 220ms ease;
    }
    .body {
      padding: 10px 12px;
      display: grid;
      gap: 6px;
      overflow-wrap: anywhere;
    }
    .title {
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.3;
      min-height: 2.6em;
    }
    .price {
      font-size: 1rem;
      color: #0f172a;
    }
    .muted { color: #64748b; font-size: 0.8rem; }
    .row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .promo { color: #b91c1c; font-weight: 600; font-size: 0.85rem; }
    .footer {
      padding: 10px 12px 12px;
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      min-height: 40px; /* ensure space for button */
      box-sizing: border-box;
    }
    button.add {
      cursor: pointer;
      border: 1px solid #2563eb;
      background: #2563eb;
      color: #fff;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 0.9rem;
    }
    button.add:hover { filter: brightness(0.95); }

    :host(:hover) {
      transform: translateY(-2px);
      box-shadow: 0 8px 18px rgba(0,0,0,0.10);
    }

    :host(:hover) .image ::slotted(img),
    :host(:hover) .image img {
      transform: scale(1.03);
    }

    button.add:hover {
      filter: none;
      background-color: #1e40af;
      border-color: #1e40af;
      transform: translateY(-1px);
    }
  </style>
  <div class="image">
    <slot name="image">
      <img alt="placeholder" src="https://via.placeholder.com/400x400?text=Product" />
    </slot>
  </div>
  <div class="body">
    <div class="title"><slot name="name">Produkt</slot></div>
    <div class="price"><slot name="price">0,00 zł</slot></div>
    <div class="row muted"><slot name="colors"></slot></div>
    <div class="row muted"><slot name="sizes"></slot></div>
    <div class="promo"><slot name="promo"></slot></div>
  </div>
  <div class="footer">
    <span class="muted"><slot name="note"></slot></span>
    <button class="add" type="button">Do koszyka</button>
  </div>
`;

export default class ProductCard extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
    }

    static get observedAttributes() {
        return ['title', 'price', 'image', 'promo', 'note'];
    }

    connectedCallback() {
        this.shadowRoot
            .querySelector('button.add')
            ?.addEventListener('click', this.#onAdd);
        this.#render();
    }

    disconnectedCallback() {
        this.shadowRoot
            .querySelector('button.add')
            ?.removeEventListener('click', this.#onAdd);
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal === newVal) return;
        if (name === 'title') this.#data.title = newVal || '';
        if (name === 'price') this.#setPrice(newVal);
        if (name === 'image') this.#data.image = newVal || '';
        if (name === 'promo') this.#data.promo = newVal || '';
        if (name === 'note') this.#data.note = newVal || '';
        this.#render();
    }

    get id() {
        return this.#data.id;
    }
    set id(v) {
        this.#data.id = v;
    }

    get title() {
        return this.#data.title;
    }
    set title(v) {
        this.#data.title = v ?? '';
        this.#render();
    }

    get price() {
        return this.#data.price;
    }
    set price(v) {
        this.#setPrice(v);
        this.#render();
    }

    get image() {
        return this.#data.image;
    }
    set image(v) {
        this.#data.image = v ?? '';
        this.#render();
    }

    get promo() {
        return this.#data.promo;
    }
    set promo(v) {
        this.#data.promo = v ?? '';
        this.#render();
    }

    get note() {
        return this.#data.note;
    }
    set note(v) {
        this.#data.note = v ?? '';
        this.#render();
    }

    get colors() {
        return this.#data.colors;
    }
    set colors(arr) {
        this.#data.colors = Array.isArray(arr) ? arr : [];
        this.#render();
    }

    get sizes() {
        return this.#data.sizes;
    }
    set sizes(arr) {
        this.#data.sizes = Array.isArray(arr) ? arr : [];
        this.#render();
    }

    #data = {
        id: null,
        title: '',
        price: 0,
        priceText: '0,00 zł',
        image: '',
        promo: '',
        note: '',
        colors: [],
        sizes: [],
    };

    #formatPrice(n) {
        try {
            return Number(n).toLocaleString('pl-PL', {
                style: 'currency',
                currency: 'PLN',
            });
        } catch {
            return String(n ?? '');
        }
    }

    #setPrice(v) {
        if (typeof v === 'number') {
            this.#data.price = v;
            this.#data.priceText = this.#formatPrice(v);
        } else if (typeof v === 'string') {
            this.#data.price =
                Number(v.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
            this.#data.priceText = v;
        } else {
            this.#data.price = 0;
            this.#data.priceText = this.#formatPrice(0);
        }
    }

    #render() {
        const nameSlot = this.shadowRoot.querySelector('slot[name="name"]');
        if (nameSlot && nameSlot.assignedNodes().length === 0)
            nameSlot.textContent = this.#data.title || 'Produkt';

        const priceSlot = this.shadowRoot.querySelector('slot[name="price"]');
        if (priceSlot && priceSlot.assignedNodes().length === 0)
            priceSlot.textContent = this.#data.priceText;

        const promoSlot = this.shadowRoot.querySelector('slot[name="promo"]');
        if (promoSlot && promoSlot.assignedNodes().length === 0)
            promoSlot.textContent = this.#data.promo || '';

        const noteSlot = this.shadowRoot.querySelector('slot[name="note"]');
        if (noteSlot && noteSlot.assignedNodes().length === 0)
            noteSlot.textContent = this.#data.note || '';

        const imgEl = this.shadowRoot.querySelector('.image slot img');
        if (imgEl && this.#data.image) {
            imgEl.src = this.#data.image;
            imgEl.alt = this.#data.title || imgEl.alt || '';
        }

        const colorsSlot = this.shadowRoot.querySelector('slot[name="colors"]');
        if (colorsSlot && colorsSlot.assignedNodes().length === 0) {
            colorsSlot.innerHTML = (this.#data.colors || [])
                .map(
                    (c) =>
                        `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;border:1px solid #ccc;background:${c}"></span>`
                )
                .join(' ');
        }

        const sizesSlot = this.shadowRoot.querySelector('slot[name="sizes"]');
        if (sizesSlot && sizesSlot.assignedNodes().length === 0) {
            sizesSlot.innerHTML = (this.#data.sizes || [])
                .map(
                    (s) =>
                        `<span style="display:inline-block;padding:2px 6px;border:1px solid #ddd;border-radius:6px;font-size:0.75rem;">${s}</span>`
                )
                .join(' ');
        }
    }

    #onAdd = () => {
        const detail = {
            id: this.#data.id,
            title: this.#data.title,
            price: this.#data.price,
            priceText: this.#data.priceText,
            image: this.#data.image,
        };
        this.dispatchEvent(
            new CustomEvent('add-to-cart', {
                detail,
                bubbles: true,
                composed: true,
            })
        );
    };
}

customElements.define('product-card', ProductCard);
