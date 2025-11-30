export class Ajax {
    constructor(options = {}) {
        const defaults = {
            baseURL: '',
            headers: {},
            timeout: 5000,
            fetchOptions: {},
        };
        this._config = { ...defaults, ...options };
        this._config.headers = { ...defaults.headers, ...options.headers };
    }

    setBaseURL(url) {
        this._config.baseURL = url || '';
    }

    setTimeout(ms) {
        if (typeof ms === 'number' && ms > 0) this._config.timeout = ms;
    }

    setHeaders(h) {
        if (h && typeof h === 'object') {
            this._config.headers = { ...this._config.headers, ...h };
        }
    }

    updateConfig(partial) {
        if (!partial || typeof partial !== 'object') return;
        if (partial.baseURL !== undefined) this.setBaseURL(partial.baseURL);
        if (partial.timeout !== undefined) this.setTimeout(partial.timeout);
        if (partial.headers) this.setHeaders(partial.headers);
        if (partial.fetchOptions) {
            this._config.fetchOptions = {
                ...this._config.fetchOptions,
                ...partial.fetchOptions,
            };
        }
    }

    async get(url, options = {}) {
        return this._request('GET', url, null, options);
    }

    async post(url, data, options = {}) {
        return this._request('POST', url, data, options);
    }

    async put(url, data, options = {}) {
        return this._request('PUT', url, data, options);
    }

    async delete(url, options = {}) {
        return this._request('DELETE', url, null, options);
    }

    // --- Internal helper ---
    async _request(method, url, data, options) {
        const cfg = this._mergeOptions(options);
        const finalURL = this._buildURL(url, cfg.baseURL);
        const controller = new AbortController();
        const timeout = cfg.timeout;
        const timer = setTimeout(() => controller.abort(), timeout);

        const headers = { ...cfg.headers };

        const fetchInit = {
            method,
            headers,
            signal: controller.signal,
            ...cfg.fetchOptions,
        };

        if (data != null) {
            if (!this._hasContentType(headers)) {
                headers['Content-Type'] = 'application/json';
            }
            try {
                fetchInit.body = JSON.stringify(data);
            } catch (e) {
                clearTimeout(timer);
                throw new Error('JSON serialization failed');
            }
        }

        let res;
        try {
            res = await fetch(finalURL, fetchInit);
        } catch (err) {
            clearTimeout(timer);
            if (err.name === 'AbortError') {
                throw new Error(
                    `Timeout ${timeout}ms for ${method} ${finalURL}`
                );
            }
            throw new Error(
                `Network error for ${method} ${finalURL}: ${err.message}`
            );
        }

        clearTimeout(timer);

        if (!res.ok) {
            let bodySnippet = '';
            const ct = res.headers.get('Content-Type') || '';
            try {
                if (ct.includes('application/json')) {
                    const json = await res.json();
                    const isEmptyObj =
                        json &&
                        typeof json === 'object' &&
                        !Array.isArray(json) &&
                        Object.keys(json).length === 0;
                    if (!isEmptyObj) {
                        const preview = this._safeJsonPreview(json);
                        if (preview) bodySnippet = ' ' + preview;
                    }
                } else {
                    const text = (await res.text()).trim();
                    if (text) bodySnippet = ' ' + text.slice(0, 120);
                }
            } catch (_) {
                // ignore parsing errors
            }
            throw new Error(
                `HTTP ${res.status} ${res.statusText} for ${method} ${finalURL}.${bodySnippet}`
            );
        }

        if (res.status === 204) return null;

        const contentType = res.headers.get('Content-Type') || '';
        if (contentType.includes('application/json')) {
            try {
                return await res.json();
            } catch (e) {
                throw new Error('Invalid JSON response');
            }
        } else {
            const text = await res.text();
            return { raw: text };
        }
    }

    _mergeOptions(local) {
        const base = this._config;
        return {
            baseURL: local.baseURL !== undefined ? local.baseURL : base.baseURL,
            timeout: local.timeout !== undefined ? local.timeout : base.timeout,
            headers: { ...base.headers, ...(local.headers || {}) },
            fetchOptions: {
                ...base.fetchOptions,
                ...(local.fetchOptions || {}),
            },
        };
    }

    _buildURL(url, baseURL) {
        if (!baseURL) return url;
        if (/^https?:\/\//i.test(url)) return url;
        const base = String(baseURL).replace(/\/+$/, '');
        const path = String(url).replace(/^\/+/, '');
        return base + '/' + path;
    }

    _hasContentType(headers) {
        return Object.keys(headers).some(
            (k) => k.toLowerCase() === 'content-type'
        );
    }

    _safeJsonPreview(obj) {
        try {
            const s = JSON.stringify(obj);
            return s.length > 120 ? s.slice(0, 117) + '...' : s;
        } catch (_) {
            return '';
        }
    }
}

export function createAjax(options) {
    return new Ajax(options);
}
