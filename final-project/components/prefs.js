export function loadPrefs() {
    try {
        return JSON.parse(localStorage.getItem('final-movie-prefs') || '{}');
    } catch {
        return {};
    }
}

export function savePrefs(store) {
    localStorage.setItem('final-movie-prefs', JSON.stringify(store));
}
