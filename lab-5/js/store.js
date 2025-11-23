const STORAGE_KEY = 'lab5-shapes-v1';

class Store {
    #state = { shapes: [] };
    #subscribers = new Map();

    constructor() {
        this.#load();
    }

    subscribe(prop, callback) {
        if (!this.#subscribers.has(prop)) {
            this.#subscribers.set(prop, new Set());
        }
        this.#subscribers.get(prop).add(callback);
        callback({
            value: this.#state[prop],
            change: { action: 'init' },
            counts: this.getCounts(),
        });
        return () => this.#subscribers.get(prop).delete(callback);
    }

    getCounts() {
        let squares = 0,
            circles = 0;
        for (const s of this.#state.shapes) {
            if (s.type === 'square') squares++;
            else if (s.type === 'circle') circles++;
        }
        return { squares, circles };
    }

    addShape(shape) {
        this.#state.shapes.push(shape);
        this.#persistAndNotify('shapes', { action: 'add', shape });
    }

    removeShape(id) {
        const idx = this.#state.shapes.findIndex((s) => s.id === id);
        if (idx === -1) return;
        this.#state.shapes.splice(idx, 1);
        this.#persistAndNotify('shapes', { action: 'remove', id });
    }

    recolorType(type, randomColorFn) {
        const updated = [];
        for (const s of this.#state.shapes) {
            if (s.type === type) {
                s.color = randomColorFn();
                updated.push({ id: s.id, color: s.color });
            }
        }
        if (updated.length) {
            this.#persistAndNotify('shapes', {
                action: 'recolor-type',
                type,
                updated,
            });
        }
    }
    // internal metody
    #notify(prop, change) {
        const subs = this.#subscribers.get(prop);
        if (!subs) return;
        const payloadBase = {
            value: this.#state[prop],
            change,
            counts: this.getCounts(),
        };
        for (const cb of subs) cb(payloadBase);
    }

    #persistAndNotify(prop, change) {
        this.#save();
        this.#notify(prop, change);
    }

    #save() {
        const data = {
            shapes: this.#state.shapes.map((s) => ({
                id: s.id,
                type: s.type,
                color: s.color,
            })),
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
    }

    #load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (data && Array.isArray(data.shapes)) {
                this.#state.shapes = data.shapes.filter(
                    (s) =>
                        s &&
                        s.id &&
                        (s.type === 'square' || s.type === 'circle')
                );
            }
        } catch (e) {
            // ignore
        }
    }
}

export const store = new Store();
