const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host { display: inline-flex; gap: 6px; align-items: center; }
    .label { color:#64748b; font-size:0.8rem; }
    .items { display:inline-flex; gap:6px; flex-wrap:wrap; }
    .items ::slotted(.size) { display:inline-block; padding:2px 6px; border:1px solid #ddd; border-radius:6px; font-size:0.75rem; cursor:pointer; }
  </style>
  <span class="label">Rozmiary:</span>
  <span class="items"><slot></slot></span>
`;

export default class SizeList extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
    }
}

customElements.define('size-list', SizeList);
