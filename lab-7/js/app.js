// Data-driven rendering to avoid duplication in HTML
import '../components/product-card.js';

const grid = document.getElementById('productsGrid');

const products = [
    {
        name: 'T-shirt Classic',
        priceHTML: '<span class="price-new">59,99 zł</span>',
        image: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=600',
        colors: ['#111', '#777', '#0ea5e9'],
        sizes: ['S', 'M', 'L', 'XL'],
    },
    {
        name: 'Bluza Hoodie',
        priceHTML: '<span class="price-new">149,00 zł</span>',
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600',
        colors: ['#334155', '#ef4444'],
        sizes: ['S', 'M', 'L'],
    },
    {
        name: 'Spodnie Slim Fit',
        priceHTML: '<span class="price-new">199,00 zł</span>',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600',
        colors: ['#111'],
        sizes: ['M', 'L'],
        promo: '-10% przy zakupie 2 szt.',
    },
    {
        name: 'Sukienka Summer',
        priceHTML:
            '<span class="price-old">249,00 zł</span> <span class="price-new">199,00 zł</span>',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600',
        colors: ['#ef4444', '#f59e0b'],
        sizes: ['XS', 'S', 'M'],
        promo: 'Promocja!',
    },
    {
        name: 'Sneakers Street',
        priceHTML: '<span class="price-new">299,00 zł</span>',
        image: 'https://images.unsplash.com/photo-1519741491051-1ae5b8702b84?w=600',
        colors: ['#111', '#16a34a'],
        sizes: ['40', '41', '42', '43'],
    },
    {
        name: 'Kurtka Windbreaker',
        priceHTML: '<span class="price-new">349,00 zł</span>',
        image: 'https://images.unsplash.com/photo-1460353906629-9aaa04ed1824?w=600',
        colors: ['#0284c7', '#f59e0b'],
        sizes: ['M', 'L', 'XL'],
    },
];

function makeSlotElement(tag, slotName, innerHTML) {
    const el = document.createElement(tag);
    el.setAttribute('slot', slotName);
    el.innerHTML = innerHTML;
    return el;
}

function renderProduct(p) {
    const card = document.createElement('product-card');

    // image
    const img = document.createElement('img');
    img.setAttribute('slot', 'image');
    img.src = p.image;
    img.alt = p.name;
    card.appendChild(img);

    // name and price
    card.appendChild(makeSlotElement('span', 'name', p.name));
    card.appendChild(makeSlotElement('span', 'price', p.priceHTML));

    // colors
    if (p.colors && p.colors.length) {
        const span = document.createElement('span');
        span.setAttribute('slot', 'colors');
        span.textContent = 'Kolory: ';
        for (const c of p.colors) {
            const dot = document.createElement('span');
            dot.className = 'color';
            dot.style.background = c;
            span.appendChild(dot);
        }
        card.appendChild(span);
    }

    // sizes
    if (p.sizes && p.sizes.length) {
        const span = document.createElement('span');
        span.setAttribute('slot', 'sizes');
        span.textContent = 'Rozmiary: ';
        for (const s of p.sizes) {
            const badge = document.createElement('span');
            badge.className = 'size';
            badge.textContent = s;
            span.appendChild(badge);
        }
        card.appendChild(span);
    }

    // promo
    if (p.promo) {
        card.appendChild(makeSlotElement('span', 'promo', p.promo));
    }

    return card;
}

for (const p of products) {
    grid.appendChild(renderProduct(p));
}
