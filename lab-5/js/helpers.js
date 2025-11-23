export function randomHsl() {
    return `hsl(${Math.floor(Math.random() * 360)} 70% 75%)`;
}

export function makeId(prefix = 'sh') {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}
