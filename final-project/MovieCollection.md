# Prezentacja – Final Project (My Movie Collection)

> Repo: `piu-labs/final-project/`  
> Aplikacja: statyczna (HTML/CSS/JS), bez bundlera i bez frameworków.

---

## 1. Cel projektu

- Zbudowanie prostej aplikacji do przeglądania filmów na podstawie API OMDb.
- Dać użytkownikowi możliwość:
  - wyszukania filmów,
  - przejścia do szczegółów,
  - prowadzenia własnej „kolekcji” (Loved/Hated/Watched/Watchlist),
  - ustawiania oceny użytkownika,
  - przełączania motywu (jasny/ciemny),
  - zapamiętywania preferencji w `localStorage`.

---

## 2. Struktura projektu

Najważniejsze pliki:

- Strony:
  - `final-project/index.html` – wyszukiwanie i lista wyników
  - `final-project/details.html` – szczegóły filmu
  - `final-project/lists.html` – „My Collection” (listy użytkownika)
- Style:
  - `final-project/style.css` – zmienne CSS + podstawowy layout
- Komponenty (Web Components):
  - `final-project/components/movie-search.js`
  - `final-project/components/movie-card.js`
  - `final-project/components/movie-details.js`
  - `final-project/components/theme-toggle.js`
- Konfiguracja i stan:
  - `final-project/components/config.js` – `DEFAULT_API_KEY`
  - `final-project/components/prefs.js` – zapis/odczyt z `localStorage`

---

## 3. Architektura: moduły ES + Web Components

- Wszystkie skrypty są ładowane jako ES Modules (`<script type="module">`).
- Komponenty to Custom Elements (`customElements.define(...)`) z Shadow DOM.
- Zalety:
  - izolacja CSS i DOM komponentów,
  - brak globalnych zmiennych w `window`,
  - czytelny podział odpowiedzialności: UI w komponentach, logika w ich metodach.

---

## 4. Zewnętrzne API (OMDb)

- API: `https://www.omdbapi.com/`
- Użycia:
  - wyszukiwanie: parametr `s` (search)
  - szczegóły: `i` (imdbID) albo `t` (title)
- Autoryzacja: `apikey`
  - domyślnie z `DEFAULT_API_KEY` (`final-project/components/config.js`)

### Parametry API OMDb

OMDb działa na query stringach. Minimalnie zawsze potrzebujemy `apikey` i jednego z kluczy wyszukiwania (`s` albo `i`/`t`).

**Endpointy**

- Dane o filmach:
  - `http://www.omdbapi.com/?apikey=[yourkey]&...`
- (Opcjonalny) Poster API:
  - `http://img.omdbapi.com/?apikey=[yourkey]&...`
  - W naszym projekcie nie korzystamy bezpośrednio z tego endpointu — używamy URL z pola `Poster`, które zwraca OMDb w JSON.

**Najważniejsze parametry**

- `apikey` – klucz API (w projekcie: przekazywany atrybutem `apikey`, a fallback to `DEFAULT_API_KEY`).

**Tryb „By ID or Title” (szczegóły filmu)**

- `i` – IMDb ID (np. `tt0133093`) → **używamy** na stronie szczegółów i w kartach.
- `t` – tytuł filmu → **używamy** jako fallback, gdy nie mamy `imdbID`.
- `y` – rok wydania → **używamy** opcjonalnie (doprecyzowanie wyszukiwania po tytule).
- `type` – `movie|series|episode` → **nie używamy** w szczegółach (używamy w wyszukiwaniu).
- `plot` – `short|full` (domyślnie `short`) → **używamy `plot=full`** w widoku szczegółów.
- `r` – `json|xml` (domyślnie `json`) → **nie ustawiamy**, korzystamy z domyślnego JSON.
- `callback` – JSONP → **nie używamy**.
- `v` – wersja API (zarezerwowane) → **nie używamy**.

**Tryb „By Search” (lista wyników)**

- `s` – fraza wyszukiwania (tytuł) → **używamy**.
- `y` – rok → **używamy** (opcjonalnie).
- `type` – `movie|series|episode` → **używamy** (opcjonalnie).
- `page` – numer strony `1–100` (domyślnie `1`) → **używamy** w przycisku „Load more” (pobieranie kolejnych paczek po 10 wyników).
- `r`, `callback`, `v` → **nie używamy**.

**Przykłady URL (tak jak w kodzie projektu)**

Wyszukiwanie (pierwsza strona):

```text
https://www.omdbapi.com/?apikey=KEY&s=Batman&type=movie&y=2005&page=1
```

Wyszukiwanie (kolejna strona „Load more”):

```text
https://www.omdbapi.com/?apikey=KEY&s=Batman&type=movie&y=2005&page=2
```

Szczegóły po IMDb ID + pełny opis:

```text
https://www.omdbapi.com/?apikey=KEY&i=tt0133093&plot=full
```

---

## 5. Strona główna – wyszukiwanie (`index.html`)

### Co widać w UI

- Pasek wyszukiwania (tytuł, rok, typ, sortowanie)
- Wyniki jako siatka kart
- Link do strony kolekcji: `lists.html`

### Jak to działa

- `movie-search` emituje zdarzenie `movie-search` (CustomEvent) z danymi formularza.
- `index.html` nasłuchuje `document.addEventListener('movie-search', ...)` i wykonuje `fetch()`.
- Wyniki są sortowane po stronie klienta (tytuł/rok).
- Dla każdego wyniku tworzony jest komponent `movie-card` i dostaje atrybuty:
  - `apikey`, `imdb`, opcjonalnie `y`.

---

## 6. Komponent `movie-search` (`components/movie-search.js`)

### Funkcje

- Walidacja tytułu: min. 3 znaki (UI pokazuje komunikat).
- Lista lat (select) generowana dynamicznie od bieżącego roku do 1900.
- Zapamiętywanie ostatniego wyszukiwania:
  - klucz `localStorage`: `final-last-search`
- Auto-start: po wejściu na stronę komponent sam wyzwala zdarzenie wyszukania (domyślnie „Batman”).

### Implementacja

- `connectedCallback()` podpina submit i inicjalizuje pola.
- `dispatchEvent(new CustomEvent('movie-search', { bubbles:true, composed:true, detail }))`.

---

## 7. Komponent `movie-card` (`components/movie-card.js`)

### Funkcje

- Karta filmu z:
  - plakatem,
  - tytułem i rokiem,
  - szybkim panelem akcji (overlay): Loved / Hated / Watched / Watchlist,
  - wyświetleniem oceny użytkownika (jeśli istnieje).
- Kliknięcie karty przenosi do `details.html` (z parametrami w query string).

### Implementacja

- Ładowanie danych filmu:
  - `fetch()` do OMDb na podstawie `imdb` lub `title`.
  - Timeout przez `AbortController` (8s).
- Nawigacja:
  - `#detailsHref` budowane jako `./details.html?apikey=...&imdb=...`
  - `this.addEventListener('click', ...)` i `keydown` (Enter/Spacja) – dostępność.
- Szybkie akcje:
  - przyciski w overlay mają `e.stopPropagation()`, żeby nie uruchamiać nawigacji.
  - stan (active) jest wyliczany z `localStorage`.

---

## 8. Strona szczegółów (`details.html`) + `movie-details`

### Co widać w UI

- Duży plakat, tytuł, meta (rok, rating, czas, gatunek)
- Opis fabuły (plot)
- Sekcja „Details”: Actors / Director / Awards
- „Ratings” (IMDb i źródła zewnętrzne z OMDb)
- Przyciski:
  - Loved / Hated / Watched / Watchlist
  - pole „Your rating” + „Save rating”

### Jak przekazywane są parametry

- `details.html` czyta `location.search` i ustawia atrybuty na `<movie-details>`:
  - `apikey`, `imdb`, albo `title`, opcjonalnie `y`.

---

## 9. Komponent `movie-details` (`components/movie-details.js`)

### Funkcje

- Pobranie pełnych danych filmu (`plot=full`).
- Render podstawowych danych + dodatkowych pól.
- Zarządzanie preferencjami użytkownika:
  - Loved/Hated/Watched/Watchlist (toggle)
  - rating użytkownika (1–10, step 0.5)

### Implementacja

- `#load()` wywoływane w `connectedCallback()` i przy zmianie atrybutów.
- `#render()`:
  - wypełnia elementy w Shadow DOM,
  - odczytuje preferencje z `loadPrefs()` i ustawia klasy `active`.
- Obsługa przycisków:
  - preferencje są przechowywane w `localStorage` pod kluczem `final-movie-prefs`.
  - rating walidowany: `1 <= value <= 10`.

---

## 10. Stan i persistencja (localStorage)

### Klucze używane w projekcie

- `final-movie-prefs` – stan kolekcji użytkownika:
  - `loved: string[]`
  - `hated: string[]`
  - `watched: string[]`
  - `watchlist: string[]`
  - `ratings: Record<string, number>`
- `final-last-search` – ostatnie parametry wyszukiwania
- `final-list-view` – ustawienia widoku list (Only rated, sort)
- `final-theme` – motyw `light` / `dark`

### Moduł pomocniczy

- `components/prefs.js`:
  - `loadPrefs()` – bezpieczny parse JSON
  - `savePrefs(store)` – zapis JSON

---

## 11. „My Collection” (`lists.html`)

### Co widać w UI

- Cztery sekcje:
  - Loved, Hated, Watched, Watchlist
- Filtry widoku:
  - `Only rated`
  - Sortowanie po ocenie (High→Low, Low→High)

### Implementacja

- Strona czyta `final-movie-prefs` i renderuje listy jako `movie-card`.
- Filtrowanie po ratingach:
  - `Only rated` filtruje, jeśli `ratings[id] != null`.
- Sortowanie:
  - sortuje ID po liczbie (rating) i zawsze „unrated” na końcu.

---

## 12. Auto-aktualizacja list po kliknięciu (Observer / eventy)

### Problem

- Klikając przyciski na kartach (np. „Loved”), element powinien zniknąć z sekcji, jeśli przestaje spełniać warunki listy.

### Rozwiązanie

- Po każdej zmianie preferencji komponenty emitują event:
  - `window.dispatchEvent(new CustomEvent('final-prefs-changed', ...))`
- `lists.html` nasłuchuje `final-prefs-changed` i woła `renderAll()`.

To jest praktyczna odmiana wzorca Obserwator:

- źródło zmian = komponenty,
- obserwator = strona list,
- kanał = zdarzenia w przeglądarce.

---

## 13. Motyw jasny/ciemny (`theme-toggle`)

### Funkcje

- Przełączanie `dark` / `light`.
- Zapamiętanie wyboru w `localStorage` (`final-theme`).
- Jeżeli brak ustawienia: start z preferencji systemowej (`prefers-color-scheme`).

### Implementacja

- `theme-toggle` ustawia `document.documentElement.setAttribute('data-theme', theme)`.
- CSS w `style.css` bazuje na zmiennych w `:root` i nadpisaniu w `html[data-theme='dark']`.

---

## 14. Styl i UX

- Układ siatki kart: `.grid` w `style.css`.
- Komponenty mają własny Shadow DOM + CSS.
- Dostępność:
  - `movie-card` ma `tabindex="0"` i obsługę Enter/Spacji.
  - `aria-live="polite"` na kontenerach wyników/list.

---

## 15. Demo – scenariusz prezentacji (na żywo)

1. Otwórz `final-project/index.html`.
2. Wyszukaj tytuł (np. Batman), ustaw rok/typ/sort.
3. Kliknij kartę → przejście do `details.html`.
4. Ustaw Loved/Hated/Watched/Watchlist.
5. Zapisz ocenę (np. 8.5).
6. Przejdź do `lists.html` i pokaż:
   - obecność filmu w odpowiednich sekcjach,
   - filtr „Only rated”,
   - sortowanie po rating.
7. Kliknij overlay na karcie w `lists.html` i pokaż, że element znika natychmiast.
8. Przełącz motyw w prawym górnym rogu.

---

## 16. Możliwe rozszerzenia

- Cache wyników (np. Map w module) i ograniczenie liczby fetchy.
- „Usuń ocenę” (wyczyszczenie ratingu).
- Eksport/import preferencji (JSON) dla backupu.
- Lepsza paginacja wyników wyszukiwania (OMDb wspiera `page`).

---

## 17. Podsumowanie

- Projekt pokazuje:
  - moduły ES + komponenty Web Components,
  - pracę z API przez `fetch()`,
  - prosty „store” oparty o `localStorage`,
  - wzorzec Obserwator (eventy) do live-update UI,
  - spójny design przez CSS variables i theme toggle.
