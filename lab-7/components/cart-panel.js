const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host { display:block; border:1px solid #ddd; border-radius:10px; padding:12px; background:#fff; font-family:system-ui, Arial, sans-serif; }
    h2 { font-size:1rem; margin:0 0 10px; }
    ul { list-style:none; padding:0; margin:0; display:grid; gap:8px; }
    li { display:grid; grid-template-columns: 1fr auto auto auto; align-items:center; gap:8px; }
    .price { font-weight:600; }
    .qty { display:inline-flex; align-items:center; gap:6px; }
    .qty button { width:26px; height:26px; padding:0; }
    button { cursor:pointer; border:1px solid #ddd; background:#f8fafc; border-radius:6px; padding:4px 8px; }
    .remove { color:#b91c1c; }
    .summary { margin-top:12px; display:flex; justify-content:space-between; align-items:center; font-weight:600; }
    .empty { color:#64748b; font-size:0.9rem; }
  </style>
  <h2>Koszyk</h2>
  <ul class="items"></ul>
  <div class="empty" hidden>Brak produktów.</div>
  <div class="summary"><span>Suma</span><span class="total">0,00 zł</span></div>
`;

export default class CartPanel extends HTMLElement {
    #items = [];
    #onAdd;
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        shadow.appendChild(template.content.cloneNode(true));
        this.#onAdd = (e) => this.addItem(e.detail);
    }

    connectedCallback() {
        document.addEventListener('add-to-cart', this.#onAdd);
        this.shadowRoot.addEventListener('click', (e) => {
            if (!(e.target instanceof HTMLButtonElement)) return;
            if (e.target.dataset.inc) {
                const index = Number(e.target.dataset.inc);
                this.increment(index);
            } else if (e.target.dataset.dec) {
                const index = Number(e.target.dataset.dec);
                this.decrement(index);
            } else if (e.target.dataset.remove) {
                const index = Number(e.target.dataset.remove);
                this.removeItem(index);
            }
        });
        this.#render();
    }

    disconnectedCallback() {
        document.removeEventListener('add-to-cart', this.#onAdd);
    }

    addItem(item) {
        if (!item) return;
        const key = item.id ?? item.title ?? '';
        const price = Number(item.price) || 0;
        const idx = this.#items.findIndex(
            (it) => it.key === key && price === it.price
        );
        if (idx >= 0) {
            this.#items[idx].qty += 1;
        } else {
            this.#items.push({
                key,
                title: item.title,
                price,
                priceText: item.priceText || this.#fmt(price),
                qty: 1,
            });
        }
        this.#render();
    }

    removeItem(index) {
        if (index >= 0 && index < this.#items.length) {
            this.#items.splice(index, 1);
            this.#render();
        }
    }

    increment(index) {
        if (index >= 0 && index < this.#items.length) {
            this.#items[index].qty += 1;
            this.#render();
        }
    }

    decrement(index) {
        if (index >= 0 && index < this.#items.length) {
            const it = this.#items[index];
            it.qty -= 1;
            if (it.qty <= 0) this.#items.splice(index, 1);
            this.#render();
        }
    }

    #fmt(n) {
        try {
            return Number(n).toLocaleString('pl-PL', {
                style: 'currency',
                currency: 'PLN',
            });
        } catch {
            return '0,00 zł';
        }
    }

    #render() {
        const list = this.shadowRoot.querySelector('.items');
        const empty = this.shadowRoot.querySelector('.empty');
        const totalEl = this.shadowRoot.querySelector('.total');
        list.innerHTML = '';
        if (this.#items.length === 0) {
            empty.hidden = false;
        } else {
            empty.hidden = true;
            this.#items.forEach((it, idx) => {
                const li = document.createElement('li');
                const name = document.createElement('span');
                name.textContent = it.title;
                const qty = document.createElement('div');
                qty.className = 'qty';
                const btnDec = document.createElement('button');
                btnDec.textContent = '−';
                btnDec.setAttribute('data-dec', String(idx));
                const qtyVal = document.createElement('span');
                qtyVal.textContent = String(it.qty);
                const btnInc = document.createElement('button');
                btnInc.textContent = '+';
                btnInc.setAttribute('data-inc', String(idx));
                qty.append(btnDec, qtyVal, btnInc);
                const price = document.createElement('span');
                price.className = 'price';
                const line = (Number(it.price) || 0) * (Number(it.qty) || 0);
                price.textContent = this.#fmt(line);
                const btn = document.createElement('button');
                btn.className = 'remove';
                btn.textContent = '✖';
                btn.setAttribute('data-remove', String(idx));
                li.append(name, qty, price, btn);
                list.appendChild(li);
            });
        }
        const sum = this.#items.reduce(
            (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0),
            0
        );
        totalEl.textContent = this.#fmt(sum);
    }
}

customElements.define('cart-panel', CartPanel);
