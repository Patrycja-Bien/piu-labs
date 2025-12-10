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
      /* Allow content to expand and keep footer visible */
      overflow: visible;
      box-sizing: border-box;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: box-shadow 160ms ease, transform 160ms ease;
    }
    .image {
      width: 100%;
      /* Slightly taller than wide to reserve space for details+button */
      aspect-ratio: 4 / 5;
      display: grid;
      place-items: center;
    }
    /* Normalize any slotted image */
    .image ::slotted(img) {
      width: 90%;
      height: 90%;
      object-fit: cover;
      transition: transform 220ms ease;
    }
    /* Normalize default/fallback image inside template */
    .image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 220ms ease;
    }
    .body {
      padding: 10px 12px;
      display: grid;
      gap: 6px;
      /* Prevent overly long lists from pushing footer out of view */
      overflow-wrap: anywhere;
    }
    .title {
      font-size: 0.95rem;
      font-weight: 600;
      line-height: 1.3;
      min-height: 2.6em; /* two lines */
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
}

customElements.define('product-card', ProductCard);
