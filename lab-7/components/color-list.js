const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host { display: inline-flex; gap: 6px; align-items: center; }
    .label { color:#64748b; font-size:0.8rem; }
    .items { display:inline-flex; gap:6px; }
    .items ::slotted(.color) { display:inline-block; width:14px; height:14px; border-radius:50%; border:1px solid #ccc; cursor:pointer; }
  </style>
  <span class="label">Kolory:</span>
  <span class="items"><slot></slot></span>
`;

export default class ColorList extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
    }
}

customElements.define('color-list', ColorList);
