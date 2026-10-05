// =====================================================================
// INTERAKTYWNY MODEL 3D WTRYSKARKI TE-A5 (index.html, sekcja #te3dSection)
// Model wtryskarki w pełni elektrycznej TE-A5 (TE220A5) zbudowany z brył
// (prostopadłościany, walce, stożki, koła zębate, torusy). Proporcje wg
// widoku z boku z klatek 360°, budowa zespołów i ich ruchy wg animacji
// producenta "TE-A5 Overview" oraz katalogu TE-A5. Rysowany bezpośrednio
// w WebGL - bez zewnętrznych bibliotek (np. three.js), więc nie trzeba
// dogrywać żadnych dodatkowych plików ani polegać na zewnętrznym CDN.
//
// Co potrafi:
//  - obracanie przeciąganiem (mysz / palec - na telefonie tylko w poziomie,
//    żeby pionowy ruch palcem nadal przewijał stronę), przybliżanie
//    przyciskami +/−, Ctrl + kółko myszy lub klawiaturą (strzałki, +/−),
//  - numerowane znaczniki (hotspoty) i zakładki z najważniejszymi cechami -
//    kliknięcie przenosi kamerę do danego zespołu, podświetla go neonowo i
//    wyświetla opis w panelu po prawej (treści: tablica TE3D_FEATURES),
//  - tryb X-RAY: obudowy stają się półprzezroczyste ("hologram" z
//    neonowymi krawędziami), odsłaniając m.in. 5-punktowy układ kolanowy
//    z krzyżulcem i śrubą kulową, napęd zwarcia (serwosilnik, pas, koło
//    pasowe), wieniec zębaty regulacji wysokości formy, płytę Center-Press
//    na prowadnicach L/M z napędem wypychacza, ślimak z zaworem zwrotnym,
//    4 cylindry docisku dyszy, śruby kulowe wtrysku, czujnik siły,
//    skrzynkę serwonapędów agregatu i napędy w szafie,
//  - ciągłą animację cyklu wtrysku, działającą w tle bez przycisku i opisu
//    (zamykanie i ryglowanie formy -> dosunięcie dyszy -> wtrysk -> docisk
//    -> dozowanie + chłodzenie -> odsunięcie dyszy -> otwieranie ->
//    wypychanie); obracają się śruby i koła pasowe, gniazdo formy wypełnia
//    się stopionym tworzywem, które stygnie - wnętrze widać w trybie X-RAY,
//  - automatyczny, powolny obrót w widoku ogólnym.
// Pętla renderowania działa tylko wtedy, gdy sekcja jest widoczna na
// ekranie (IntersectionObserver), żeby nie obciążać komputera/telefonu.
// Gdy przeglądarka nie obsługuje WebGL - zamiast modelu wyświetla się
// zdjęcie przekroju maszyny, a zakładki/panel opisu działają normalnie.
// =====================================================================

function initTe3DShowcase() {
    const section = document.getElementById('te3dSection');
    if (!section) return;

    const stage = document.getElementById('te3dStage');
    const canvas = document.getElementById('te3dCanvas');
    const panel = document.getElementById('te3dPanel');
    const tabsEl = document.getElementById('te3dTabs');
    const hotspotsEl = document.getElementById('te3dHotspots');
    const toolbar = document.getElementById('te3dToolbar');
    const readout = document.getElementById('te3dReadout');
    const hint = document.getElementById('te3dHint');
    const fallback = document.getElementById('te3dFallback');
    if (!stage || !canvas || !panel || !tabsEl) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // -----------------------------------------------------------------
    // TREŚCI: najważniejsze cechy TE-A5 (wg katalogu producenta).
    // view: pozycja kamery (target = punkt, na który patrzy; r = odległość;
    // theta = obrót wokół maszyny, 0 = widok z przodu; phi = kąt od pionu).
    // anchor/normal: gdzie w 3D stoi znacznik i w którą stronę "patrzy"
    // (znacznik chowa się, gdy jest po niewidocznej stronie maszyny).
    // xray: czy po wybraniu cechy włączyć tryb X-RAY (zespoły wewnętrzne).
    // -----------------------------------------------------------------
    const TE3D_FEATURES = [
        {
            id: 'overview', num: '00', tab: 'Widok ogólny', kicker: 'WIDOK OGÓLNY',
            title: 'TE-A5 — ultra energooszczędna seria elektryczna',
            lead: 'W pełni elektryczna wtryskarka z układem kolanowym (50–850 t). Każdy zespół napędzany jest niezależnym serwosilnikiem, co skraca cykl i zapewnia wysoką powtarzalność.',
            points: [
                'Klasa zużycia energii 10 wg EUROMAP 60.1',
                'Niezależne sterowanie każdą osią (serwonapędy)',
                'Krótszy czas cyklu dzięki pracy równoległej',
                'Uruchom <strong>X-RAY</strong>, aby zajrzeć pod obudowę, lub <strong>symulację cyklu</strong>, aby zobaczyć maszynę w pracy'
            ],
            media: { type: 'img', src: 'img/opt/series-te.jpg', alt: 'Wtryskarka elektryczna WOOJIN PLAIMM TE-A5', caption: 'TE-A5 · widok ogólny', contain: true },
            view: { target: [0, 1.05, 0], r: 8.6, theta: -0.52, phi: 1.17 },
            xray: false
        },
        {
            id: 'energy', num: '01', tab: 'Energooszczędność', kicker: 'NAPĘD SERWO',
            title: 'Napęd serwo i energooszczędność',
            lead: 'Każdy zespół ma własny serwonapęd — energia pobierana jest tylko wtedy, gdy dana oś faktycznie pracuje.',
            points: [
                'Zużycie energii ≤ 0,24 kWh/kg — klasa 10 wg EUROMAP 60.1',
                'Ponad 60% niższe koszty energii elektrycznej niż w konwencjonalnych wtryskarkach hydraulicznych z silnikami indukcyjnymi',
                'Zintegrowany układ napędowy KEBA — mniej miejsca w szafie sterowniczej, szybsza reakcja napędów',
                'Monitoring energii dla każdego etapu cyklu wtrysku'
            ],
            media: { type: 'energy' },
            anchor: [1.0, 0.52, 0.51], normal: [0, 0, 1],
            view: { target: [1.2, 0.55, 0.1], r: 3.9, theta: 0.3, phi: 1.28 },
            xray: true
        },
        {
            id: 'toggle', num: '02', tab: 'Układ kolanowy', kicker: '5-PUNKTOWY TOGGLE',
            title: '5-punktowy układ kolanowy End-Cut',
            lead: 'Nowa geometria dźwigni kolanowej zwiększa siłę zwarcia przy minimalnym nakładzie energii napędu.',
            points: [
                'Ok. 30% większe wzmocnienie siły zwarcia — wyższa sprawność serwosilnika',
                'Po zamknięciu formy układ przechodzi w stan blokady — utrzymanie siły zwarcia nie pobiera energii',
                'Szybki ruch na początku skoku i zwolnienie w strefie ochrony formy — krótszy cykl i bezpieczna forma',
                'Zaciskowe mocowanie sworzni zwiększa trwałość mechanizmu'
            ],
            media: { type: 'img', src: 'img/TEA5/teclapmping.jpg', alt: 'Zespół zamykający TE-A5 z układem kolanowym', caption: 'Zespół zamykający · układ kolanowy' },
            anchor: [-1.85, 1.86, 0.25], normal: [0, 0.3, 1],
            view: { target: [-1.85, 1.38, 0], r: 3.6, theta: -0.5, phi: 1.1 },
            xray: true
        },
        {
            id: 'clampcomp', num: '03', tab: 'Kompensacja siły zwarcia', kicker: 'AUTO-KOMPENSACJA',
            title: 'Automatyczna kompensacja siły zwarcia',
            lead: 'Czujnik siły zwarcia i silnik regulacji wysokości formy utrzymują ustawioną siłę zwarcia przez całą zmianę.',
            points: [
                'Czujnik na bieżąco wykrywa zmiany siły zwarcia wynikające z rozszerzalności cieplnej formy, płyt i kolumn',
                'Silnik regulacji (wieniec zębaty na płycie tylnej) automatycznie koryguje ustawienie',
                'Stała siła zwarcia bez ręcznej regulacji — mniej wad wyprasek',
                'Monitoring wypływek (Flash Monitoring) na podstawie czujnika siły zwarcia'
            ],
            media: null,
            anchor: [-2.86, 1.66, 0.36], normal: [-0.75, 0.15, 0.65],
            view: { target: [-2.65, 1.38, 0], r: 3.3, theta: -1.15, phi: 1.2 },
            xray: true
        },
        {
            id: 'platen', num: '04', tab: 'Płyta ruchoma L/M', kicker: 'PŁYTY I KOLUMNY',
            title: 'Płyta ruchoma na prowadnicach L/M i czyste kolumny',
            lead: 'Płyta ruchoma prowadzona jest na liniowych prowadnicach tocznych, a nie na tulejach kolumn.',
            points: [
                'Precyzyjne pozycjonowanie płyty i mniejsza siła potrzebna do jej przesuwu — dodatkowa oszczędność energii',
                'Brak tulei na kolumnach: bez wtłaczania smaru, mniejsze tarcie, czyste kolumny',
                'Płyta typu Center-Press (analiza FEA, EUROMAP 9) — równomierny nacisk, mniej wypływek, dłuższa żywotność formy',
                'Powiększona przestrzeń międzykolumnowa, np. TE220A5: 625 × 625 mm'
            ],
            media: null,
            anchor: [-1.05, 0.98, 0.5], normal: [0, 0, 1],
            view: { target: [-0.95, 1.15, 0], r: 3.4, theta: -0.22, phi: 1.2 },
            xray: true
        },
        {
            id: 'injection', num: '05', tab: 'Agregat wtryskowy', kicker: 'ZESPÓŁ WTRYSKU',
            title: 'Zintegrowany agregat wtryskowy',
            lead: 'Sztywny zespół wtrysku z jednolitym odlewem obudowy i precyzyjnym czujnikiem siły zapewnia powtarzalność wypraski co do grama.',
            points: [
                'Obudowa wtrysku i śruba kulowa w jednym odlewie — mniejsze tolerancje montażowe',
                'Śruba kulowa o minimalnym luzie — wysoka powtarzalność pozycjonowania',
                'Czujnik siły (load cell) — dokładna kontrola ciśnienia wtrysku i przeciwciśnienia',
                'Symetryczne, podwójne cylindry docisku dyszy — stabilny docisk i równoległość płyt',
                'Prędkość wtrysku do 350 mm/s (opcjonalnie do 700 mm/s)'
            ],
            media: { type: 'img', src: 'img/TEA5/teinjection.jpg', alt: 'Agregat wtryskowy wtryskarki TE-A5', caption: 'Agregat wtryskowy' },
            anchor: [1.9, 1.8, 0.3], normal: [0, 0.55, 0.85],
            view: { target: [1.6, 1.3, 0], r: 4.2, theta: 0.78, phi: 1.08 },
            xray: true
        },
        {
            id: 'controller', num: '06', tab: 'Sterownik B&R 21″', kicker: 'STEROWANIE',
            title: 'Sterownik B&R z ekranem 21″ Full HD',
            lead: 'Intuicyjny interfejs zaprojektowany specjalnie dla wtryskarek i inteligentne funkcje procesu.',
            points: [
                'Dotykowy ekran 21″ Full HD, wykresy zwarcia i wtrysku na jednej stronie',
                'Smart Sequencer, Weight Control (kontrola masy wypraski), Flash Monitoring',
                'Monitoring energii dla każdego etapu cyklu',
                'OPC-UA (EUROMAP 77), eksport danych SQL/CSV, zdalne wsparcie serwisowe'
            ],
            media: null,
            anchor: [0.2, 1.72, 0.8], normal: [0, 0, 1],
            view: { target: [0.2, 1.4, 0.75], r: 2.1, theta: 0.18, phi: 1.42 },
            xray: false
        }
    ];

    // Długość jednego cyklu wtrysku w sekundach (animacja w pętli; czasy
    // poszczególnych etapów - patrz updateCycle).
    const CYCLE_LENGTH = 7.7;

    let activeFeature = 0;
    let userXray = false;
    let autoRotate = !reduceMotion;
    // Cykl wtrysku animuje się cały czas (bez przycisku i opisu etapów);
    // przy włączonym ograniczeniu ruchu maszyna stoi z otwartą formą.
    const cycleRunning = !reduceMotion;

    // -----------------------------------------------------------------
    // PANEL OPISU + ZAKŁADKI (działają również bez WebGL)
    // -----------------------------------------------------------------
    function mediaHtml(f) {
        if (!f.media) return '';
        if (f.media.type === 'energy') {
            return `
                <div class="te3d-energy">
                    <span class="te3d-energy-badge">EUROMAP 60.1 · KLASA 10 · ≤ 0,24 kWh/kg</span>
                    <div class="te3d-energy-row"><span>Wtryskarka hydrauliczna (silnik indukcyjny)</span><b>100%</b><div class="te3d-energy-bar"><i style="--w:100%"></i></div></div>
                    <div class="te3d-energy-row is-te"><span>TE-A5 (w pełni elektryczna)</span><b>&lt; 40%</b><div class="te3d-energy-bar"><i style="--w:38%"></i></div></div>
                    <p>Koszty energii elektrycznej – porównanie wg katalogu producenta (oszczędność &gt; 60%).</p>
                </div>`;
        }
        return `
            <figure class="te3d-media${f.media.contain ? ' te3d-media--contain' : ''}">
                <img src="${f.media.src}" alt="${f.media.alt}" loading="lazy" decoding="async">
                <figcaption>${f.media.caption}</figcaption>
            </figure>`;
    }

    function renderPanel(idx) {
        const f = TE3D_FEATURES[idx];
        const last = TE3D_FEATURES.length - 1;
        const prevBtn = idx > 0
            ? `<button type="button" class="te3d-panel-arrow" data-dir="-1" aria-label="Poprzednia cecha">‹ ${TE3D_FEATURES[idx - 1].num}</button>` : '';
        const nextBtn = idx < last
            ? `<button type="button" class="te3d-panel-arrow te3d-panel-arrow--next" data-dir="1">${idx === 0 ? 'Poznaj cechy' : 'Dalej'} ›</button>`
            : `<button type="button" class="te3d-panel-arrow te3d-panel-arrow--next" data-dir="reset">Widok ogólny ↺</button>`;

        panel.innerHTML = `
            <div class="te3d-panel-inner">
                <div class="te3d-panel-head"><span class="te3d-panel-index">${f.num}<em> / 0${last}</em></span><span class="te3d-panel-kicker">${f.kicker}</span></div>
                <h3 class="te3d-panel-title">${f.title}</h3>
                <p class="te3d-panel-lead">${f.lead}</p>
                <ul class="te3d-panel-list">${f.points.map(p => `<li>${p}</li>`).join('')}</ul>
                ${mediaHtml(f)}
                <div class="te3d-panel-nav">${prevBtn}${nextBtn}</div>
            </div>`;

        panel.classList.remove('is-switching');
        void panel.offsetWidth;
        panel.classList.add('is-switching');

        const energy = panel.querySelector('.te3d-energy');
        if (energy) requestAnimationFrame(() => requestAnimationFrame(() => energy.classList.add('is-on')));
    }

    panel.addEventListener('click', function (e) {
        const btn = e.target.closest('.te3d-panel-arrow');
        if (!btn) return;
        const dir = btn.dataset.dir;
        if (dir === 'reset') selectFeature(0);
        else selectFeature(Math.max(0, Math.min(TE3D_FEATURES.length - 1, activeFeature + parseInt(dir, 10))));
    });

    TE3D_FEATURES.forEach((f, i) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'te3d-tab';
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        tab.innerHTML = `<span class="te3d-tab-num">${f.num}</span><span>${f.tab}</span>`;
        tab.addEventListener('click', () => selectFeature(i));
        tabsEl.appendChild(tab);
    });

    const hotspotEls = [];
    TE3D_FEATURES.forEach((f, i) => {
        if (!f.anchor || !hotspotsEl) return;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'te3d-hotspot is-hidden';
        b.innerHTML = `${f.num}<span class="te3d-hotspot-label">${f.tab}</span>`;
        b.setAttribute('aria-label', `${f.num}: ${f.title}`);
        b.addEventListener('click', () => selectFeature(i));
        hotspotsEl.appendChild(b);
        hotspotEls.push({ el: b, idx: i, f });
    });

    // Wspólna funkcja wyboru cechy - ustawiana niżej, gdy WebGL jest
    // dostępny, rozszerzana o ruch kamery i podświetlenie zespołu.
    let onSelect3D = null;

    function selectFeature(idx) {
        activeFeature = idx;
        renderPanel(idx);
        tabsEl.querySelectorAll('.te3d-tab').forEach((t, i) => t.setAttribute('aria-selected', i === idx ? 'true' : 'false'));
        hotspotEls.forEach(h => h.el.classList.toggle('is-active', h.idx === idx));
        if (onSelect3D) onSelect3D(idx);
    }

    renderPanel(0);

    // -----------------------------------------------------------------
    // WEBGL
    // -----------------------------------------------------------------
    let gl = null;
    try {
        gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' }) ||
             canvas.getContext('experimental-webgl', { antialias: true, alpha: false });
    } catch (e) {
        gl = null;
    }

    if (!gl) {
        if (fallback) fallback.hidden = false;
        canvas.style.display = 'none';
        if (hint) hint.style.display = 'none';
        if (toolbar) toolbar.style.display = 'none';
        return;
    }

    // ---------- Macierze 4x4 (układ kolumnowy jak w WebGL) ----------
    function m4() { return new Float32Array(16); }
    const TMP = m4();

    function m4Mul(out, a, b) {
        const o = TMP;
        for (let c = 0; c < 4; c++) {
            const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
            o[c * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
            o[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
            o[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
            o[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
        }
        out.set(o);
        return out;
    }

    // Translacja * Rz * Ry * Rx * Skala
    function m4TRS(out, p, r, s) {
        const cx = Math.cos(r[0]), sx = Math.sin(r[0]);
        const cy = Math.cos(r[1]), sy = Math.sin(r[1]);
        const cz = Math.cos(r[2]), sz = Math.sin(r[2]);
        out[0] = cz * cy * s[0];
        out[1] = sz * cy * s[0];
        out[2] = -sy * s[0];
        out[3] = 0;
        out[4] = (cz * sy * sx - sz * cx) * s[1];
        out[5] = (sz * sy * sx + cz * cx) * s[1];
        out[6] = cy * sx * s[1];
        out[7] = 0;
        out[8] = (cz * sy * cx + sz * sx) * s[2];
        out[9] = (sz * sy * cx - cz * sx) * s[2];
        out[10] = cy * cx * s[2];
        out[11] = 0;
        out[12] = p[0]; out[13] = p[1]; out[14] = p[2]; out[15] = 1;
        return out;
    }

    function m4Persp(out, fovy, aspect, near, far) {
        const f = 1 / Math.tan(fovy / 2);
        out.fill(0);
        out[0] = f / aspect;
        out[5] = f;
        out[10] = (far + near) / (near - far);
        out[11] = -1;
        out[14] = (2 * far * near) / (near - far);
        return out;
    }

    function m4LookAt(out, e, t) {
        let zx = e[0] - t[0], zy = e[1] - t[1], zz = e[2] - t[2];
        let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
        let xx = zz, xy = 0, xz = -zx; // cross((0,1,0), z)
        l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
        const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
        out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
        out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
        out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
        out[12] = -(xx * e[0] + xy * e[1] + xz * e[2]);
        out[13] = -(yx * e[0] + yy * e[1] + yz * e[2]);
        out[14] = -(zx * e[0] + zy * e[1] + zz * e[2]);
        out[15] = 1;
        return out;
    }

    // ---------- Shadery ----------
    const MAIN_VS = `
        attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUv;
        uniform mat4 uModel; uniform mat4 uViewProj;
        varying vec3 vN; varying vec3 vW; varying vec2 vUv;
        void main() {
            vec4 w = uModel * vec4(aPos, 1.0);
            vW = w.xyz;
            vN = (uModel * vec4(aNrm, 0.0)).xyz;
            vUv = aUv;
            gl_Position = uViewProj * w;
        }`;

    const MAIN_FS = `
        precision mediump float;
        varying vec3 vN; varying vec3 vW; varying vec2 vUv;
        uniform vec3 uColor; uniform vec3 uEm; uniform vec3 uCam;
        uniform float uOpacity; uniform float uSpec; uniform float uShin; uniform float uRim;
        uniform float uUseTex; uniform float uTexEm; uniform vec2 uUvScale; uniform sampler2D uTex;
        void main() {
            vec3 n = normalize(vN);
            vec3 v = normalize(uCam - vW);
            vec3 base = uColor;
            vec3 texc = vec3(0.0);
            if (uUseTex > 0.5) {
                vec4 t = texture2D(uTex, vUv * uUvScale);
                base = mix(base, t.rgb, t.a);
                texc = t.rgb * t.a;
            }
            vec3 L1 = normalize(vec3(-0.45, 0.85, 0.6));
            vec3 L2 = normalize(vec3(0.7, 0.3, -0.65));
            float hemi = 0.5 + 0.5 * n.y;
            vec3 amb = mix(vec3(0.46, 0.49, 0.53), vec3(0.86, 0.9, 0.93), hemi);
            float d1 = max(dot(n, L1), 0.0);
            float d2 = max(dot(n, L2), 0.0);
            vec3 col = base * (amb * 0.66 + d1 * 0.52 + d2 * 0.2);
            vec3 h = normalize(L1 + v);
            col += uSpec * pow(max(dot(n, h), 0.0), uShin) * vec3(1.0);
            float fr = pow(1.0 - abs(dot(n, v)), 3.0);
            col += uRim * fr * vec3(0.0, 0.95, 0.9);
            col += uEm + texc * uTexEm;
            gl_FragColor = vec4(col, uOpacity);
        }`;

    const LINE_VS = `
        attribute vec3 aPos;
        uniform mat4 uModel; uniform mat4 uViewProj;
        void main() { gl_Position = uViewProj * uModel * vec4(aPos, 1.0); }`;

    const LINE_FS = `
        precision mediump float;
        uniform vec3 uColor; uniform float uAlpha;
        void main() { gl_FragColor = vec4(uColor, uAlpha); }`;

    const BG_VS = `
        attribute vec2 aPos; varying vec2 vUv;
        void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.999, 1.0); }`;

    const BG_FS = `
        precision mediump float; varying vec2 vUv; uniform float uAspect;
        void main() {
            vec2 p = vUv - vec2(0.5, 0.56);
            p.x *= uAspect * 0.62;
            float d = length(p) * 1.5;
            vec3 c = mix(vec3(1.0), vec3(0.906, 0.941, 0.949), smoothstep(0.15, 1.1, d));
            gl_FragColor = vec4(c, 1.0);
        }`;

    const FLOOR_VS = `
        attribute vec3 aPos; uniform mat4 uViewProj; varying vec3 vW;
        void main() { vW = aPos; gl_Position = uViewProj * vec4(aPos, 1.0); }`;

    const FLOOR_FS = `
        precision mediump float; varying vec3 vW; uniform float uTime;
        float boxSdf(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
        void main() {
            vec2 p = vW.xz;
            float fade = exp(-length(p * vec2(0.55, 0.9)) * 0.42);
            vec2 g = abs(fract(p / 0.5 + 0.5) - 0.5) * 0.5;
            float minor = 1.0 - smoothstep(0.004, 0.013, min(g.x, g.y));
            vec2 g2 = abs(fract(p / 2.5 + 0.5) - 0.5) * 2.5;
            float major = 1.0 - smoothstep(0.006, 0.02, min(g2.x, g2.y));
            float r = length(p * vec2(0.62, 1.0));
            float ring = exp(-abs(r - mod(uTime * 1.1, 7.0)) * 10.0) * 0.5;
            float gridA = (minor * 0.22 + major * 0.3 + ring * 0.35) * fade;
            float s = boxSdf(p - vec2(-0.02, 0.0), vec2(3.0, 0.56));
            float sh = (1.0 - smoothstep(-0.35, 0.65, s)) * 0.26 + (1.0 - smoothstep(-0.04, 0.1, s)) * 0.1;
            float a = clamp(gridA + sh, 0.0, 1.0);
            vec3 c = mix(vec3(0.05, 0.07, 0.1), vec3(0.0, 0.78, 0.74), gridA / (gridA + sh + 0.0001));
            gl_FragColor = vec4(c, a);
        }`;

    function compile(type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(sh));
        }
        return sh;
    }

    function program(vs, fs, uniforms, attribs) {
        const p = gl.createProgram();
        gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        const u = {}, a = {};
        uniforms.forEach(n => { u[n] = gl.getUniformLocation(p, n); });
        attribs.forEach(n => { a[n] = gl.getAttribLocation(p, n); });
        return { p, u, a };
    }

    let P_MAIN, P_LINE, P_BG, P_FLOOR;
    try {
        P_MAIN = program(MAIN_VS, MAIN_FS,
            ['uModel', 'uViewProj', 'uColor', 'uEm', 'uCam', 'uOpacity', 'uSpec', 'uShin', 'uRim', 'uUseTex', 'uTexEm', 'uUvScale', 'uTex'],
            ['aPos', 'aNrm', 'aUv']);
        P_LINE = program(LINE_VS, LINE_FS, ['uModel', 'uViewProj', 'uColor', 'uAlpha'], ['aPos']);
        P_BG = program(BG_VS, BG_FS, ['uAspect'], ['aPos']);
        P_FLOOR = program(FLOOR_VS, FLOOR_FS, ['uViewProj', 'uTime'], ['aPos']);
    } catch (err) {
        console.warn('TE-A5 3D: WebGL shader error', err);
        if (fallback) fallback.hidden = false;
        canvas.style.display = 'none';
        if (toolbar) toolbar.style.display = 'none';
        if (hint) hint.style.display = 'none';
        return;
    }

    // ---------- Geometria ----------
    function uploadGeo(g) {
        const buf = (data, target) => {
            const b = gl.createBuffer();
            gl.bindBuffer(target, b);
            gl.bufferData(target, data, gl.STATIC_DRAW);
            return b;
        };
        return {
            pos: buf(new Float32Array(g.pos), gl.ARRAY_BUFFER),
            nrm: buf(new Float32Array(g.nrm), gl.ARRAY_BUFFER),
            uv: buf(new Float32Array(g.uv), gl.ARRAY_BUFFER),
            idx: buf(new Uint16Array(g.idx), gl.ELEMENT_ARRAY_BUFFER),
            count: g.idx.length,
            edges: g.edges.length ? buf(new Uint16Array(g.edges), gl.ELEMENT_ARRAY_BUFFER) : null,
            edgeCount: g.edges.length
        };
    }

    const geoCache = {};

    function geoBox(w, h, d) {
        const key = `b${w.toFixed(4)}_${h.toFixed(4)}_${d.toFixed(4)}`;
        if (geoCache[key]) return geoCache[key];
        const hx = w / 2, hy = h / 2, hz = d / 2;
        const g = { pos: [], nrm: [], uv: [], idx: [], edges: [] };
        const faces = [
            [[1, 0, 0], [0, 0, -1], [0, 1, 0], hz, hy, hx],
            [[-1, 0, 0], [0, 0, 1], [0, 1, 0], hz, hy, hx],
            [[0, 1, 0], [1, 0, 0], [0, 0, -1], hx, hz, hy],
            [[0, -1, 0], [1, 0, 0], [0, 0, 1], hx, hz, hy],
            [[0, 0, 1], [1, 0, 0], [0, 1, 0], hx, hy, hz],
            [[0, 0, -1], [-1, 0, 0], [0, 1, 0], hx, hy, hz]
        ];
        faces.forEach(([n, u, v, hu, hv, hn]) => {
            const base = g.pos.length / 3;
            [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b], k) => {
                g.pos.push(n[0] * hn + u[0] * hu * a + v[0] * hv * b,
                           n[1] * hn + u[1] * hu * a + v[1] * hv * b,
                           n[2] * hn + u[2] * hu * a + v[2] * hv * b);
                g.nrm.push(n[0], n[1], n[2]);
                g.uv.push(k === 1 || k === 2 ? 1 : 0, k >= 2 ? 1 : 0);
            });
            g.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
        });
        // krawędzie: 8 narożników dopisanych na końcu
        const cb = g.pos.length / 3;
        for (let i = 0; i < 8; i++) {
            g.pos.push(i & 1 ? hx : -hx, i & 2 ? hy : -hy, i & 4 ? hz : -hz);
            g.nrm.push(0, 1, 0);
            g.uv.push(0, 0);
        }
        [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]
            .forEach(([a, b]) => g.edges.push(cb + a, cb + b));
        geoCache[key] = uploadGeo(g);
        return geoCache[key];
    }

    // Płaska "naklejka" skierowana w +Z (logo, tabliczka) - jedna ściana,
    // żeby napis nigdy nie był widoczny w lustrzanym odbiciu.
    function geoPlane(w, h) {
        const key = `p${w.toFixed(4)}_${h.toFixed(4)}`;
        if (geoCache[key]) return geoCache[key];
        const hx = w / 2, hy = h / 2;
        geoCache[key] = uploadGeo({
            pos: [-hx, -hy, 0, hx, -hy, 0, hx, hy, 0, -hx, hy, 0],
            nrm: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
            uv: [0, 0, 1, 0, 1, 1, 0, 1],
            idx: [0, 1, 2, 0, 2, 3],
            edges: []
        });
        return geoCache[key];
    }

    // Mapowanie osi: bryła budowana wzdłuż Y, obracana na X lub Z (bez odbicia)
    function axisMap(axis, x, y, z) {
        if (axis === 'x') return [y, -x, z];
        if (axis === 'z') return [x, -z, y];
        return [x, y, z];
    }

    function geoCyl(axis, r, len, seg) {
        seg = seg || 24;
        const key = `c${axis}${r.toFixed(4)}_${len.toFixed(4)}_${seg}`;
        if (geoCache[key]) return geoCache[key];
        const g = { pos: [], nrm: [], uv: [], idx: [], edges: [] };
        const push = (p, n, u, v) => {
            const pp = axisMap(axis, p[0], p[1], p[2]);
            const nn = axisMap(axis, n[0], n[1], n[2]);
            g.pos.push(pp[0], pp[1], pp[2]);
            g.nrm.push(nn[0], nn[1], nn[2]);
            g.uv.push(u, v);
        };
        const h = len / 2;
        for (let i = 0; i <= seg; i++) {
            const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
            push([c * r, -h, s * r], [c, 0, s], i / seg, 0);
            push([c * r, h, s * r], [c, 0, s], i / seg, 1);
        }
        for (let i = 0; i < seg; i++) {
            const b = i * 2;
            g.idx.push(b, b + 1, b + 3, b, b + 3, b + 2);
            g.edges.push(b, b + 2, b + 1, b + 3);
        }
        [-1, 1].forEach(sg => {
            const center = g.pos.length / 3;
            push([0, sg * h, 0], [0, sg, 0], 0.5, 0.5);
            for (let i = 0; i <= seg; i++) {
                const a = (i / seg) * Math.PI * 2;
                push([Math.cos(a) * r, sg * h, Math.sin(a) * r], [0, sg, 0], 0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5);
            }
            for (let i = 0; i < seg; i++) g.idx.push(center, center + 1 + i, center + 2 + i);
        });
        geoCache[key] = uploadGeo(g);
        return geoCache[key];
    }

    function geoTorus(axis, R, r, segR, segr) {
        const key = `t${axis}${R}_${r}_${segR}_${segr}`;
        if (geoCache[key]) return geoCache[key];
        const g = { pos: [], nrm: [], uv: [], idx: [], edges: [] };
        for (let i = 0; i <= segR; i++) {
            const a = (i / segR) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
            for (let j = 0; j <= segr; j++) {
                const b = (j / segr) * Math.PI * 2, cb = Math.cos(b), sb = Math.sin(b);
                const p = axisMap(axis, (R + r * cb) * ca, r * sb, (R + r * cb) * sa);
                const n = axisMap(axis, cb * ca, sb, cb * sa);
                g.pos.push(p[0], p[1], p[2]);
                g.nrm.push(n[0], n[1], n[2]);
                g.uv.push(i / segR, j / segr);
            }
        }
        for (let i = 0; i < segR; i++) {
            for (let j = 0; j < segr; j++) {
                const a = i * (segr + 1) + j, b = a + segr + 1;
                g.idx.push(a, b, a + 1, b, b + 1, a + 1);
            }
            g.edges.push(i * (segr + 1), (i + 1) * (segr + 1));
        }
        geoCache[key] = uploadGeo(g);
        return geoCache[key];
    }

    // Stożek ścięty wzdłuż osi: promień r0 na początku osi, r1 na końcu (dysza, końcówka ślimaka)
    function geoFrustum(axis, r0, r1, len, seg) {
        seg = seg || 24;
        const key = `f${axis}${r0.toFixed(4)}_${r1.toFixed(4)}_${len.toFixed(4)}_${seg}`;
        if (geoCache[key]) return geoCache[key];
        const g = { pos: [], nrm: [], uv: [], idx: [], edges: [] };
        const push = (p, n, u, v) => {
            const pp = axisMap(axis, p[0], p[1], p[2]);
            const nn = axisMap(axis, n[0], n[1], n[2]);
            g.pos.push(pp[0], pp[1], pp[2]);
            g.nrm.push(nn[0], nn[1], nn[2]);
            g.uv.push(u, v);
        };
        const h = len / 2, slope = (r0 - r1) / len, nl = Math.hypot(1, slope);
        for (let i = 0; i <= seg; i++) {
            const a = (i / seg) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
            push([c * r0, -h, s * r0], [c / nl, slope / nl, s / nl], i / seg, 0);
            push([c * r1, h, s * r1], [c / nl, slope / nl, s / nl], i / seg, 1);
        }
        for (let i = 0; i < seg; i++) {
            const b = i * 2;
            g.idx.push(b, b + 1, b + 3, b, b + 3, b + 2);
            g.edges.push(b, b + 2, b + 1, b + 3);
        }
        [[-1, r0], [1, r1]].forEach(([sg, r]) => {
            const center = g.pos.length / 3;
            push([0, sg * h, 0], [0, sg, 0], 0.5, 0.5);
            for (let i = 0; i <= seg; i++) {
                const a = (i / seg) * Math.PI * 2;
                push([Math.cos(a) * r, sg * h, Math.sin(a) * r], [0, sg, 0], 0.5, 0.5);
            }
            for (let i = 0; i < seg; i++) g.idx.push(center, center + 1 + i, center + 2 + i);
        });
        geoCache[key] = uploadGeo(g);
        return geoCache[key];
    }

    // Profil (lista [kąt, promień]) wyciągnięty wzdłuż osi; rIn > 0 = otwór w środku
    function extrudeProfile(axis, prof, len, rIn) {
        const g = { pos: [], nrm: [], uv: [], idx: [], edges: [] };
        const h = len / 2, N = prof.length;
        const P = prof.map(([a, r]) => [Math.cos(a) * r, Math.sin(a) * r]);
        const I = prof.map(([a]) => [Math.cos(a) * rIn, Math.sin(a) * rIn]);
        const v = (x, y, z, nx, ny, nz) => {
            const pp = axisMap(axis, x, y, z), nn = axisMap(axis, nx, ny, nz);
            g.pos.push(pp[0], pp[1], pp[2]);
            g.nrm.push(nn[0], nn[1], nn[2]);
            g.uv.push(0, 0);
            return g.pos.length / 3 - 1;
        };
        const wall = (A, B, inward) => {
            for (let i = 0; i < N; i++) {
                const a = A[i], b = A[(i + 1) % N];
                let nx = b[1] - a[1], nz = -(b[0] - a[0]);
                const l = Math.hypot(nx, nz) || 1;
                nx /= l; nz /= l;
                if (inward) { nx = -nx; nz = -nz; }
                const i0 = v(a[0], -h, a[1], nx, 0, nz), i1 = v(a[0], h, a[1], nx, 0, nz);
                const i2 = v(b[0], h, b[1], nx, 0, nz), i3 = v(b[0], -h, b[1], nx, 0, nz);
                g.idx.push(i0, i1, i2, i0, i2, i3);
                if (!inward) g.edges.push(i0, i3, i1, i2);
            }
        };
        wall(P, false);
        if (rIn > 0) wall(I, true);
        [-1, 1].forEach(sg => {
            if (rIn > 0) {
                for (let i = 0; i < N; i++) {
                    const j = (i + 1) % N;
                    const q0 = v(I[i][0], sg * h, I[i][1], 0, sg, 0), q1 = v(P[i][0], sg * h, P[i][1], 0, sg, 0);
                    const q2 = v(P[j][0], sg * h, P[j][1], 0, sg, 0), q3 = v(I[j][0], sg * h, I[j][1], 0, sg, 0);
                    g.idx.push(q0, q1, q2, q0, q2, q3);
                }
            } else {
                const c = v(0, sg * h, 0, 0, sg, 0);
                const first = g.pos.length / 3;
                P.forEach(p => v(p[0], sg * h, p[1], 0, sg, 0));
                for (let i = 0; i < N; i++) g.idx.push(c, first + i, first + (i + 1) % N);
            }
        });
        return g;
    }

    function gearProfile(rRoot, rTip, teeth) {
        const prof = [], st = Math.PI * 2 / teeth;
        for (let i = 0; i < teeth; i++) {
            const a = i * st;
            prof.push([a - 0.3 * st, rRoot], [a - 0.13 * st, rTip], [a + 0.13 * st, rTip], [a + 0.3 * st, rRoot]);
        }
        return prof;
    }

    // Koło zębate (koła na nakrętkach kolumn, zębnik silnika regulacji)
    function geoGear(axis, rRoot, rTip, teeth, len) {
        const key = `g${axis}${rRoot}_${rTip}_${teeth}_${len}`;
        if (!geoCache[key]) geoCache[key] = uploadGeo(extrudeProfile(axis, gearProfile(rRoot, rTip, teeth), len, 0));
        return geoCache[key];
    }

    // Wieniec zębaty z otworem (regulacja wysokości formy)
    function geoRingGear(axis, rIn, rRoot, rTip, teeth, len) {
        const key = `rg${axis}${rIn}_${rRoot}_${rTip}_${teeth}_${len}`;
        if (!geoCache[key]) geoCache[key] = uploadGeo(extrudeProfile(axis, gearProfile(rRoot, rTip, teeth), len, rIn));
        return geoCache[key];
    }

    // ---------- Tekstury (rysowane na <canvas>) ----------
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    function makeTexture(w, h, draw, repeat) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const ctx = c.getContext('2d');
        draw(ctx, w, h);
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
        if (repeat) {
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return t;
    }

    // Pusta, biała tekstura 1x1 przypięta domyślnie do jednostki 0, żeby
    // bryły bez tekstury nie generowały ostrzeżeń WebGL w konsoli.
    const dummyTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, dummyTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

    const TEX = {
        // ekran sterownika (pionowy, jak na zdjęciu panelu)
        screen: makeTexture(256, 448, (x, w, h) => {
            x.fillStyle = '#f4f7f8'; x.fillRect(0, 0, w, h);
            x.fillStyle = '#5ec8b8'; x.fillRect(0, 0, w, 26);
            x.fillStyle = '#ffffff'; x.font = 'bold 12px Arial'; x.fillText('WOOJIN PLAIMM', 10, 17);
            x.fillStyle = '#d6313a'; x.beginPath(); x.moveTo(118, 44); x.lineTo(128, 60); x.lineTo(138, 44); x.fill();
            x.fillStyle = '#1b2230'; x.font = 'bold 26px Arial'; x.textAlign = 'center';
            x.fillText('WOOJIN', w / 2, 90); x.font = '15px Arial'; x.fillText('PLAIMM', w / 2, 110);
            x.textAlign = 'left';
            x.fillStyle = '#5ec8b8'; x.fillRect(28, 124, 92, 34); x.fillStyle = '#2e353d'; x.fillRect(28, 158, 200, 10);
            x.fillStyle = '#9aa3ad'; x.fillRect(120, 136, 48, 12); x.fillStyle = '#5ec8b8'; x.fillRect(168, 128, 60, 30);
            x.strokeStyle = '#c9d2da'; x.lineWidth = 1; x.strokeRect(16, 182, w - 32, 96);
            const line = (col, pts) => { x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); };
            line('#0abeb5', [[18, 262], [50, 262], [60, 200], [96, 204], [110, 240], [150, 244], [190, 236], [236, 238]]);
            line('#e0b43a', [[18, 270], [70, 268], [90, 226], [130, 222], [170, 250], [236, 252]]);
            line('#d6313a', [[18, 274], [120, 274], [130, 214], [170, 216], [236, 216]]);
            x.fillStyle = '#e9eef2'; x.fillRect(16, 290, w - 32, 22);
            for (let i = 0; i < 6; i++) { x.fillStyle = '#b8c2cc'; x.fillRect(22 + i * 36, 294, 30, 14); }
            x.strokeStyle = '#c9d2da'; x.strokeRect(16, 320, w - 32, 76);
            x.fillStyle = '#2e353d'; x.fillRect(0, h - 40, w, 40);
            for (let i = 0; i < 4; i++) { x.strokeStyle = '#8fd9cf'; x.lineWidth = 2; x.strokeRect(22 + i * 58, h - 32, 26, 24); }
        }),
        // logo na obudowie zespołu zamykającego (przezroczyste tło)
        logo: makeTexture(512, 128, (x, w, h) => {
            x.clearRect(0, 0, w, h);
            x.fillStyle = '#d6313a';
            x.beginPath(); x.moveTo(20, 24); x.lineTo(34, 24); x.lineTo(44, 50); x.lineTo(30, 50); x.fill();
            x.beginPath(); x.moveTo(40, 24); x.lineTo(54, 24); x.lineTo(64, 50); x.lineTo(50, 50); x.fill();
            x.fillStyle = '#2b3b45';
            x.font = 'bold 64px Arial';
            x.fillText('woojin', 76, 66);
            x.font = 'bold 30px Arial';
            x.fillText('P L A I M M', 80, 108);
        }),
        // oznaczenie modelu na osłonie (jak na maszynie: TE220A5)
        plate: makeTexture(256, 64, (x, w, h) => {
            x.clearRect(0, 0, w, h);
            x.font = 'bold 40px Arial';
            x.fillStyle = '#2b3b45'; x.fillText('TE220', 8, 48);
            x.fillStyle = '#3f8f84'; x.fillText('A5', 128, 48);
        }),
        // ciemna, perforowana płyta górna szafy (powtarzalna)
        perfDark: makeTexture(64, 64, (x, w, h) => {
            x.fillStyle = '#4a525b'; x.fillRect(0, 0, w, h);
            x.fillStyle = '#262c33';
            for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
                x.beginPath(); x.arc(8 + i * 16 + (j % 2) * 8, 8 + j * 16, 2.6, 0, Math.PI * 2); x.fill();
            }
        }, true),
        // perforowana osłona cylindra (powtarzalna)
        perf: makeTexture(64, 64, (x, w, h) => {
            x.fillStyle = '#d3d8dd'; x.fillRect(0, 0, w, h);
            x.fillStyle = '#6d7680';
            for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
                x.beginPath(); x.arc(8 + i * 16 + (j % 2) * 8, 8 + j * 16, 3.4, 0, Math.PI * 2); x.fill();
            }
        }, true),
        // kratka wentylacyjna na pokrywie agregatu
        vent: makeTexture(64, 64, (x, w, h) => {
            x.fillStyle = '#a3abb3'; x.fillRect(0, 0, w, h);
            x.fillStyle = '#737b84';
            for (let i = 0; i < 8; i++) x.fillRect(4 + i * 8, 14, 2, 36);
        }, true)
    };

    // ---------- Materiały ----------
    const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
    const mat = (color, o) => Object.assign({ color: hex(color), em: [0, 0, 0], spec: 0.12, shin: 24, rim: 0, tex: null, texEm: 0, opacity: 1 }, o || {});

    const M = {
        teal: mat('#5dc6b5', { spec: 0.1 }),
        tealDoor: mat('#55bfae', { spec: 0.1 }),
        seam: mat('#3f9e90'),
        steel: mat('#2e353d', { spec: 0.18 }),
        steelMid: mat('#535c67', { spec: 0.25, shin: 30 }),
        steelDark: mat('#22282f', { spec: 0.2 }),
        frame: mat('#2b323a', { spec: 0.2 }),
        frameDark: mat('#20262d', { spec: 0.15 }),
        cast: mat('#46505c', { spec: 0.22, shin: 28 }),
        gearSteel: mat('#5d6773', { spec: 0.45, shin: 40 }),
        motor: mat('#cfd5da', { spec: 0.5, shin: 50 }),
        motorBlack: mat('#1e2329', { spec: 0.3 }),
        belt: mat('#111418', { spec: 0.1 }),
        gray: mat('#8e969e', { spec: 0.2 }),
        blue: mat('#1f6fd1', { spec: 0.3 }),
        silver: mat('#a9b1b9', { spec: 0.3, shin: 40 }),
        light: mat('#d4d9de', { spec: 0.25 }),
        white: mat('#e7ebee', { spec: 0.35, shin: 40 }),
        chrome: mat('#dfe5ea', { spec: 0.85, shin: 70 }),
        black: mat('#16191d', { spec: 0.15 }),
        glass: mat('#1d2a45', { spec: 0.7, shin: 90, opacity: 0.3 }),
        mold: mat('#8e99a6', { spec: 0.35, shin: 40 }),
        moldCore: mat('#bcc6cf', { spec: 0.5, shin: 50 }),
        red: mat('#d6313a', { spec: 0.3 }),
        yellow: mat('#f0c22b', { spec: 0.2 }),
        lampR: mat('#d6313a', { spec: 0.4 }),
        lampY: mat('#f0c22b', { spec: 0.4 }),
        lampG: mat('#2fbf62', { spec: 0.4 }),
        drive: mat('#1b2027', { spec: 0.25 }),
        led: mat('#00fff2', { em: [0.0, 0.65, 0.62] }),
        sensor: mat('#ff2dd2', { em: [0.55, 0.05, 0.45] }),
        heater: mat('#3d434b', { spec: 0.3 }),
        barrel: mat('#b9c1c9', { spec: 0.6, shin: 50 }),
        screw: mat('#9aa6b2', { spec: 0.6, shin: 50 }),
        stripe: mat('#00d9cf', { em: [0, 0.45, 0.42] }),
        loadcell: mat('#7fd8d0', { spec: 0.6, shin: 60 }),
        melt: mat('#ff2dd2', { em: [0.85, 0.12, 0.7], opacity: 0.0 }),
        part: mat('#00fff2', { em: [0.0, 0.6, 0.58], opacity: 0.9 }),
        perf: mat('#d3d8dd', { tex: TEX.perf }),
        perfDark: mat('#4a525b', { tex: TEX.perfDark }),
        vent: mat('#8c949d', { tex: TEX.vent }),
        logo: mat('#5dc6b5', { tex: TEX.logo }),
        plate: mat('#5dc6b5', { tex: TEX.plate }),
        screen: mat('#000000', { tex: TEX.screen, texEm: 0.42, spec: 0.5, shin: 90 })
    };
    const XRAY_TINT = [0.62, 0.93, 0.91];

    // ---------- Scena ----------
    const nodes = [];
    const meshes = [];

    function node(pos, parent) {
        const n = { pos: pos || [0, 0, 0], rot: [0, 0, 0], scl: [1, 1, 1], parent: parent || null, world: m4(), local: m4() };
        nodes.push(n);
        return n;
    }

    function add(geo, material, o) {
        o = o || {};
        const m = {
            geo, mat: material,
            parent: o.parent || null,
            pos: o.pos || [0, 0, 0], rot: o.rot || [0, 0, 0], scl: o.scl || [1, 1, 1],
            cover: !!o.cover, glass: !!o.glass, xo: o.xo != null ? o.xo : 0.07,
            feature: o.f || null, edges: o.edges !== false,
            uvScale: o.uv || [1, 1],
            visible: true, hl: 0, alpha: 1, alphaOverride: null,
            world: m4(), local: m4()
        };
        meshes.push(m);
        return m;
    }

    // Prostopadłościan podany zakresami współrzędnych (x0..x1, y0..y1, z0..z1)
    function R(x0, x1, y0, y1, z0, z1, material, o) {
        o = o || {};
        o.pos = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
        return add(geoBox(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0)), material, o);
    }

    // Walec wzdłuż osi: a0..a1 = zakres na tej osi, c1/c2 = pozostałe współrzędne
    // (oś x: c1 = y, c2 = z; oś y: c1 = x, c2 = z; oś z: c1 = x, c2 = y)
    function C(axis, r, a0, a1, c1, c2, material, o) {
        o = o || {};
        const mid = (a0 + a1) / 2;
        if (axis === 'x') o.pos = [mid, c1, c2];
        else if (axis === 'y') o.pos = [c1, mid, c2];
        else o.pos = [c1, c2, mid];
        return add(geoCyl(axis, r, Math.abs(a1 - a0), o.seg), material, o);
    }

    // Stożek ścięty: promień r0 przy a0, r1 przy a1 (a0 < a1)
    function F(axis, r0, r1, a0, a1, c1, c2, material, o) {
        o = o || {};
        const mid = (a0 + a1) / 2;
        if (axis === 'x') o.pos = [mid, c1, c2];
        else if (axis === 'y') o.pos = [c1, mid, c2];
        else o.pos = [c1, c2, mid];
        return add(geoFrustum(axis, r0, r1, Math.abs(a1 - a0), o.seg), material, o);
    }

    // ---------- Wymiary (jednostki sceny; 1 j. ≈ 0,9 m) ----------
    // Proporcje zmierzone na widoku z boku TE220A5 (klatki 360°), układ
    // zespołów i ruchy - wg animacji producenta "TE-A5 Overview".
    const YC = 1.33;                  // oś zespołu zamykającego i agregatu wtryskowego
    const TB = 0.31;                  // połowa rozstawu kolumn (w pionie i poziomie)
    const PL = 0.5;                   // połowa wymiaru płyt
    const RP0 = -2.76, RP1 = -2.46;   // płyta tylna (x: od - do)
    const SP0 = -0.11, SP1 = 0.10;    // płyta stała
    const MOLD = 0.25;                // grubość połówki formy
    const M_CLOSED = SP0 - 2 * MOLD;  // czoło płyty ruchomej przy zamkniętej formie
    const STROKE = 0.4;               // skok otwarcia formy
    const PIV = 0.1;                  // odsunięcie osi przegubów dźwigni od osi maszyny
    const XR = RP1 + 0.12;            // przeguby dźwigni na płycie tylnej
    const FPIV = 0.30;                // przeguby na płycie ruchomej (za jej czołem)
    const LINK = ((M_CLOSED - FPIV) - XR) / 2;  // dźwignie wyprostowane przy zamkniętej formie
    const CX_OPEN = XR + 0.25, CX_CLOSED = XR + 0.75;  // położenia krzyżulca
    const CAR_BACK = 0.12;            // odsunięcie agregatu (dysza odsunięta od formy)
    const SHOT = 0.22;                // skok wtrysku ślimaka
    const TIP0 = 0.17 + SHOT;         // czubek ślimaka po dozowaniu (wtrysk kończy się przy 0.17)

    // Koło pasowe z otworami (żeby było widać obrót) - zwraca węzeł obracany wokół osi x
    function pulley(pos, x0, x1, r, material, holes, f, parent) {
        const n = node(pos.slice(), parent || null);
        C('x', r, x0, x1, 0, 0, material, { parent: n, f, seg: 32 });
        C('x', r * 0.32, x0 - 0.004, x1 + 0.004, 0, 0, M.steelMid, { parent: n, edges: false, seg: 16 });
        for (let k = 0; k < holes; k++) {
            const a = (k / holes) * Math.PI * 2;
            C('x', r * 0.17, x0 - 0.003, x1 + 0.003, Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, M.black, { parent: n, edges: false, seg: 12 });
        }
        return n;
    }

    // Odcinek pasa zębatego między dwoma punktami w płaszczyźnie YZ (stałe x)
    function beltSeg(x, y1, z1, y2, z2, width, parent) {
        const dy = y2 - y1, dz = z2 - z1, len = Math.hypot(dy, dz);
        return add(geoBox(width, len, 0.014), M.belt, {
            parent: parent || null, pos: [x, (y1 + y2) / 2, (z1 + z2) / 2],
            rot: [Math.atan2(dz, dy), 0, 0], edges: false
        });
    }

    // Pas opasujący dwa koła (dwa styczne odcinki + opasanie kół)
    function belt(x, a, ra, b, rb, width, f, parent) {
        const dy = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dy, dz);
        const py = -dz / l, pz = dy / l;
        [1, -1].forEach(s => beltSeg(x, a[0] + py * ra * s, a[1] + pz * ra * s, b[0] + py * rb * s, b[1] + pz * rb * s, width, parent));
        add(geoTorus('x', ra + 0.006, 0.008, 32, 6), M.belt, { parent: parent || null, pos: [x, a[0], a[1]], edges: false, f });
        add(geoTorus('x', rb + 0.006, 0.008, 32, 6), M.belt, { parent: parent || null, pos: [x, b[0], b[1]], edges: false, f });
    }

    function buildMachine() {
        // ===== RAMA / PODSTAWA (otwarta rama pod zespołem zamykającym) =====
        [-0.48, 0.48].forEach(z => {
            R(-2.62, 2.74, 0.06, 0.2, z - 0.05, z + 0.05, M.frame);              // dolne płozy
            R(-2.78, 0.18, 0.62, 0.78, z - 0.05, z + 0.05, M.frame);             // górne belki
            [-2.38, -1.83, -1.27, -0.04].forEach(x => R(x - 0.05, x + 0.05, 0.2, 0.62, z - 0.05, z + 0.05, M.frame));
        });
        [-2.72, -1.83, -1.27, -0.04].forEach(x => R(x - 0.05, x + 0.05, 0.66, 0.76, -0.43, 0.43, M.frame));
        [-2.56, -0.9, 0.24, 1.4, 2.66].forEach(x => R(x - 0.05, x + 0.05, 0.08, 0.18, -0.43, 0.43, M.frame));
        R(-2.25, -1.4, 0.39, 0.61, -0.32, 0.32, M.frameDark);                    // belka nośna
        R(-2.3, -0.1, 0.2, 0.235, -0.44, 0.44, M.light, { edges: false });       // taca / zsyp wyprasek
        R(-2.8, 0.18, 0.76, 0.79, -0.5, 0.5, M.frame);                           // płyta górna ramy
        // uchwyty transportowe z otworami na końcu ramy
        [-0.535, 0.535].forEach(z => {
            R(-2.76, -2.5, 0.48, 0.74, z - 0.012, z + 0.012, M.frame);
            C('z', 0.035, z - 0.016, z + 0.016, -2.63, 0.66, M.black, { edges: false, seg: 16 });
        });
        // stopki poziomujące
        [-2.55, -1.12, 0.0, 1.48, 2.64].forEach(x => [-0.48, 0.48].forEach(z => {
            C('y', 0.075, 0.0, 0.04, x, z, M.steel, { edges: false });
            C('y', 0.022, 0.04, 0.07, x, z, M.chrome, { edges: false });
        }));

        // ===== SZAFA ELEKTRYCZNA POD AGREGATEM =====
        R(0.18, 2.6, 0.2, 0.74, -0.47, 0.47, M.steelDark);
        R(2.6, 2.74, 0.2, 0.815, -0.5, 0.5, M.frame, { cover: true });
        R(0.14, 0.18, 0.2, 0.74, -0.5, 0.5, M.frame, { cover: true });
        R(0.14, 2.74, 0.74, 0.815, -0.52, 0.52, M.perfDark, { cover: true, xo: 0.25, uv: [26, 5] });
        // wyłącznik główny na czole ramy
        R(2.74, 2.78, 0.42, 0.64, 0.12, 0.34, M.steelMid, { edges: false });
        R(2.78, 2.795, 0.5, 0.58, 0.19, 0.27, M.red, { edges: false });
        const doorsX = [[0.182, 0.532], [0.547, 0.896], [0.912, 1.261], [1.277, 1.618], [1.634, 1.789], [1.804, 2.177], [2.192, 2.565]];
        doorsX.forEach(([x0, x1], i) => {
            [1, -1].forEach(s => {
                const z = s * 0.5;
                R(x0, x1, 0.21, 0.73, z - 0.006, z + 0.006, M.tealDoor, { cover: true, f: 'energy' });
                const zf = z + s * 0.008;
                const deco = (xx0, xx1, y0, y1, m) => R(xx0, xx1, y0, y1, zf - 0.003, zf + 0.003, m, { cover: true, xo: 0, edges: false });
                if (i === 1 || i === 3 || i === 6) deco((x0 + x1) / 2 - 0.05, (x0 + x1) / 2 + 0.05, 0.52, 0.62, M.black);
                if (i === 2) deco((x0 + x1) / 2 - 0.05, (x0 + x1) / 2 + 0.05, 0.24, 0.34, M.black);
                if (i === 5 || i === 6) deco(x1 - 0.12, x1 - 0.07, 0.4, 0.45, M.yellow);
                if (i !== 4) deco(x1 - 0.035, x1 - 0.02, 0.43, 0.49, M.light);
                if (i === 0) {
                    C('z', 0.022, zf - 0.003, zf + 0.003, x0 + 0.06, 0.67, M.blue, { cover: true, xo: 0, edges: false, seg: 14 });
                    C('z', 0.022, zf - 0.003, zf + 0.003, x0 + 0.12, 0.67, M.blue, { cover: true, xo: 0, edges: false, seg: 14 });
                }
            });
        });
        // serwonapędy w szafie (widoczne w X-RAY)
        [[0.26, 0.6], [0.66, 1.0], [1.06, 1.4], [1.46, 1.8], [1.86, 2.2], [2.26, 2.52]].forEach(([x0, x1], i) => {
            R(x0, x1, 0.24, i % 2 ? 0.64 : 0.68, -0.26, 0.3, M.drive, { f: 'energy' });
            R(x0 + 0.04, x1 - 0.04, 0.58, 0.6, 0.3, 0.312, M.led, { f: 'energy', edges: false });
            R(x0 + 0.04, x0 + 0.1, 0.3, 0.5, 0.3, 0.312, M.steelMid, { edges: false });
        });

        // ===== ZESPÓŁ ZAMYKAJĄCY =====
        // prowadnice liniowe L/M płyty ruchomej
        [-0.42, 0.42].forEach(z => R(-2.3, -0.16, 0.79, 0.815, z - 0.028, z + 0.028, M.chrome, { f: 'platen' }));
        // płyta tylna (odlew) + podpora
        R(RP0, RP1, YC - PL, YC + PL, -PL, PL, M.cast, { f: 'clampcomp' });
        R(RP0 + 0.04, RP1 - 0.04, 0.79, YC - PL, -0.42, 0.42, M.cast);
        [-1, 1].forEach(sy => [-0.2, 0.2].forEach(z => {
            R(RP1, XR + 0.07, YC + sy * PIV - 0.075, YC + sy * PIV + 0.075, z - 0.045, z + 0.045, M.cast, { f: 'toggle' });
        }));
        // regulacja wysokości formy: wieniec zębaty + koła na nakrętkach kolumn + silnik
        add(geoRingGear('x', 0.24, 0.31, 0.335, 72, 0.05), M.gearSteel, { pos: [-2.8, YC, 0], f: 'clampcomp' });
        [-1, 1].forEach(sy => [-1, 1].forEach(sz => {
            add(geoGear('x', 0.095, 0.115, 22, 0.08), M.gearSteel, { pos: [-2.81, YC + sy * TB, sz * TB], f: 'clampcomp' });
            C('x', 0.07, -2.9, -2.85, YC + sy * TB, sz * TB, M.cast, { f: 'clampcomp', edges: false });
        }));
        R(-2.92, -2.78, YC + 0.36, YC + 0.48, -0.42, -0.24, M.motorBlack, { f: 'clampcomp' });
        add(geoGear('x', 0.04, 0.052, 12, 0.05), M.gearSteel, { pos: [-2.8, YC + 0.36, -0.25], f: 'clampcomp' });
        // czujnik siły zwarcia na kolumnie
        R(-2.44, -2.34, YC + TB + 0.045, YC + TB + 0.085, TB - 0.03, TB + 0.03, M.sensor, { f: 'clampcomp' });

        // kolumny + nakrętki od strony agregatu
        [-1, 1].forEach(sy => [-1, 1].forEach(sz => {
            C('x', 0.05, -2.9, SP1 + 0.14, YC + sy * TB, sz * TB, M.chrome, { f: 'platen', seg: 20 });
            C('x', 0.085, SP1, SP1 + 0.14, YC + sy * TB, sz * TB, M.cast, { edges: false });
        }));

        // napęd zwarcia: serwosilnik -> pas zębaty -> koło pasowe na śrubie kulowej
        const MOT_Y = YC - 0.42;
        C('x', 0.1, -2.97, -2.83, MOT_Y, 0, M.motor, { f: 'toggle' });
        R(-2.86, -2.78, MOT_Y - 0.1, MOT_Y + 0.1, -0.1, 0.1, M.cast, { f: 'toggle' });
        const nClampPulley = pulley([0, YC, 0], -3.04, -2.98, 0.19, M.gearSteel, 5, 'toggle');
        const nClampMotorPulley = pulley([0, MOT_Y, 0], -3.04, -2.98, 0.07, M.gearSteel, 3, 'toggle');
        belt(-3.01, [YC, 0], 0.19, [MOT_Y, 0], 0.07, 0.05, 'toggle');
        C('x', 0.09, -2.98, RP0, YC, 0, M.cast, { f: 'toggle' });    // łożyskowanie śruby
        // śruba kulowa (obraca się) z prowadnicami krzyżulca
        const nBS = node([0, YC, 0]);
        C('x', 0.045, -2.98, -1.45, 0, 0, M.chrome, { parent: nBS, f: 'toggle', seg: 18 });
        R(-2.4, -1.5, 0.038, 0.05, -0.008, 0.008, M.stripe, { parent: nBS, edges: false });
        [-0.26, 0.26].forEach(z => C('x', 0.022, RP1, -1.47, YC, z, M.chrome, { f: 'toggle', seg: 12 }));

        // krzyżulec (nakrętka śruby kulowej) - pozycja liczona w updateToggle
        const nCH = node([CX_OPEN, YC, 0]);
        R(-0.07, 0.07, -0.15, 0.15, -0.09, 0.09, M.cast, { parent: nCH, f: 'toggle' });
        C('x', 0.08, -0.15, -0.07, 0, 0, M.steelMid, { parent: nCH, f: 'toggle' });
        [-0.26, 0.26].forEach(z => R(-0.06, 0.06, -0.045, 0.045, z - 0.03, z + 0.03, M.cast, { parent: nCH, f: 'toggle' }));
        [-1, 1].forEach(sy => C('z', 0.03, -0.3, 0.3, 0, sy * 0.12, M.chrome, { parent: nCH, edges: false, seg: 12 }));

        // płyta ruchoma Center-Press (węzeł animowany = jej czoło)
        const nMP = node([M_CLOSED - STROKE, 0, 0]);
        R(-0.12, 0, YC - PL, YC + PL, -PL, PL, M.cast, { parent: nMP, f: 'platen' });
        R(-0.24, -0.12, YC - 0.3, YC + 0.3, -0.3, 0.3, M.cast, { parent: nMP, f: 'platen' });
        [-1, 1].forEach(sy => [-0.07, 0.07].forEach(z => {
            R(-FPIV - 0.06, -0.22, YC + sy * PIV - 0.065, YC + sy * PIV + 0.065, z - 0.035, z + 0.035, M.cast, { parent: nMP, f: 'toggle' });
        }));
        [-0.42, 0.42].forEach(z => {
            R(-0.11, -0.01, 0.815, 0.85, z - 0.06, z + 0.06, M.steelMid, { parent: nMP, f: 'platen' });   // wózki L/M
        });
        // napęd wypychacza: serwosilnik + pas + koło śruby wypychacza
        const EJ_Z = 0.4;
        C('x', 0.065, -0.46, -0.24, YC - 0.2, EJ_Z, M.motor, { parent: nMP, f: 'platen' });
        R(-0.26, -0.12, YC - 0.08, YC + 0.2, EJ_Z - 0.07, EJ_Z + 0.07, M.cast, { parent: nMP });
        const nEjPulley = pulley([0, YC + 0.08, EJ_Z], -0.5, -0.46, 0.075, M.gearSteel, 4, 'platen', nMP);
        const nEjMotorPulley = pulley([0, YC - 0.2, EJ_Z], -0.5, -0.46, 0.04, M.gearSteel, 3, 'platen', nMP);
        belt(-0.48, [YC + 0.08, EJ_Z], 0.075, [YC - 0.2, EJ_Z], 0.04, 0.035, 'platen', nMP);
        // połówka ruchoma formy (półprzezroczysta w X-RAY - widać wypełnianie gniazda)
        R(0, MOLD, YC - 0.3, YC + 0.3, -0.28, 0.28, M.mold, { parent: nMP, cover: true, xo: 0.2 });
        [-0.18, -0.06, 0.06, 0.18].forEach(dy => R(0.02, MOLD - 0.02, YC + dy - 0.006, YC + dy + 0.006, 0.28, 0.284, M.steelDark, { parent: nMP, cover: true, xo: 0, edges: false }));
        [-1, 1].forEach(sy => [-1, 1].forEach(sz => C('x', 0.022, MOLD, MOLD + 0.11, YC + sy * 0.22, sz * 0.2, M.chrome, { parent: nMP, edges: false, seg: 12 })));
        // wypychacz: płyta + kołki (wysuwają się przy wypychaniu)
        const nEj = node([0, 0, 0], nMP);
        R(0.04, 0.07, YC - 0.2, YC + 0.2, -0.2, 0.2, M.steelMid, { parent: nEj, edges: false });
        C('x', 0.03, -0.3, 0.04, YC, 0, M.chrome, { parent: nEj, edges: false });
        [[-0.08, -0.1], [-0.08, 0.1], [0.08, -0.1], [0.08, 0.1]].forEach(([dy, dz]) => C('x', 0.012, 0.07, MOLD - 0.012, YC + dy, dz, M.chrome, { parent: nEj, edges: false, seg: 10 }));

        // płyta stała z otworem na dyszę + podpora
        R(SP0, SP1, YC + 0.12, YC + PL, -PL, PL, M.cast, { f: 'platen' });
        R(SP0, SP1, YC - PL, YC - 0.12, -PL, PL, M.cast, { f: 'platen' });
        R(SP0, SP1, YC - 0.12, YC + 0.12, 0.12, PL, M.cast, { edges: false });
        R(SP0, SP1, YC - 0.12, YC + 0.12, -PL, -0.12, M.cast, { edges: false });
        R(SP0 + 0.02, SP1 - 0.02, 0.79, YC - PL, -0.44, 0.44, M.cast);
        // połówka stała formy + tuleja wlewowa + tuleje prowadzące
        R(SP0 - MOLD, SP0, YC - 0.3, YC + 0.3, -0.28, 0.28, M.mold, { cover: true, xo: 0.2 });
        [-0.18, -0.06, 0.06, 0.18].forEach(dy => R(SP0 - MOLD + 0.02, SP0 - 0.02, YC + dy - 0.006, YC + dy + 0.006, 0.28, 0.284, M.steelDark, { cover: true, xo: 0, edges: false }));
        C('x', 0.035, SP0 - MOLD + 0.03, SP0, YC, 0, M.chrome, { edges: false, seg: 14 });
        C('x', 0.09, SP0 - 0.012, SP0, YC, 0, M.steelMid, { edges: false });

        // mechanizm kolanowy - 5-punktowy, podwójny (pozycje w updateToggle)
        const linkA = geoBox(1, 0.13, 0.05), linkB = geoBox(1, 0.11, 0.05), linkS = geoBox(1, 0.06, 0.035);
        const toggle = [];
        [-1, 1].forEach(sy => {
            const t = { sy, a: [], b: [], s: [] };
            [-0.2, 0.2].forEach(z => t.a.push({ z, m: add(linkA, M.cast, { f: 'toggle' }) }));
            [-0.12, 0.12].forEach(z => t.b.push({ z, m: add(linkB, M.cast, { f: 'toggle' }) }));
            [-0.27, 0.27].forEach(z => t.s.push({ z, m: add(linkS, M.steelMid, { f: 'toggle' }) }));
            t.pinR = C('z', 0.045, -0.26, 0.26, XR, YC + sy * PIV, M.chrome, { f: 'toggle', seg: 16 });
            t.pinJ = add(geoCyl('z', 0.05, 0.5, 16), M.chrome, { f: 'toggle' });
            t.pinF = add(geoCyl('z', 0.04, 0.32, 16), M.chrome, { f: 'toggle' });
            t.pinK = add(geoCyl('z', 0.03, 0.6, 12), M.chrome, { f: 'toggle', edges: false });
            toggle.push(t);
        });

        // ===== OSŁONY ZESPOŁU ZAMYKAJĄCEGO (półprzezroczyste w X-RAY) =====
        const CZ = 0.7;
        R(-3.1, -1.34, 0.76, 1.98, CZ - 0.02, CZ, M.teal, { cover: true });
        R(-3.1, -1.34, 0.76, 1.98, -CZ, -CZ + 0.02, M.teal, { cover: true });
        R(-3.1, -1.34, 1.96, 1.98, -CZ, CZ, M.teal, { cover: true });
        R(-3.12, -3.1, 0.76, 1.98, -CZ, CZ, M.teal, { cover: true });
        [1, -1].forEach(s => {
            const z = s * (CZ + 0.002);
            const seam = (x0, x1, y0, y1) => R(x0, x1, y0, y1, z - 0.002, z + 0.002, M.seam, { cover: true, xo: 0, edges: false });
            seam(-2.563, -2.557, 0.8, 1.94);
            seam(-1.943, -1.937, 0.8, 1.94);
            [1.5, 1.15].forEach(y => { seam(-2.45, -2.05, y - 0.003, y + 0.003); seam(-1.84, -1.44, y - 0.003, y + 0.003); });
            seam(-2.5, -1.4, 0.875, 0.888);
        });
        add(geoPlane(0.4, 0.11), M.logo, { pos: [-2.86, 1.88, CZ + 0.003], cover: true, xo: 0, edges: false });
        add(geoPlane(0.38, 0.075), M.plate, { pos: [-2.82, 1.0, CZ + 0.003], cover: true, xo: 0, edges: false });
        R(-1.46, -1.4, 0.94, 1.0, CZ + 0.001, CZ + 0.004, M.yellow, { cover: true, xo: 0, edges: false });

        // sygnalizator świetlny
        C('y', 0.014, 1.98, 2.1, -3.0, 0.52, M.steelDark, { edges: false });
        const lamps = {
            g: C('y', 0.034, 2.1, 2.16, -3.0, 0.52, M.lampG, { seg: 16 }),
            y: C('y', 0.034, 2.16, 2.22, -3.0, 0.52, M.lampY, { seg: 16 }),
            r: C('y', 0.034, 2.22, 2.28, -3.0, 0.52, M.lampR, { seg: 16 })
        };
        C('y', 0.03, 2.28, 2.31, -3.0, 0.52, M.white, { seg: 16, edges: false });

        // ===== DRZWI OCHRONNE STREFY FORMY =====
        [1, -1].forEach(s => {
            const z = s * CZ;
            R(-1.34, -0.11, 1.92, 1.98, z - 0.02, z + 0.02, M.frame, { cover: true });
            R(-1.34, -0.11, 0.79, 0.86, z - 0.02, z + 0.02, M.frame, { cover: true });
            R(-1.34, -1.28, 0.86, 1.92, z - 0.02, z + 0.02, M.frame, { cover: true });
            R(-1.09, -1.05, 0.86, 1.92, z - 0.015, z + 0.015, M.frame, { cover: true });
            R(-1.28, -1.09, 0.86, 1.92, z - 0.004, z + 0.004, M.glass, { glass: true, edges: false });
            R(-1.05, -0.11, 0.86, 1.92, z - 0.004, z + 0.004, M.glass, { glass: true, edges: false });
        });
        R(-1.34, -0.11, 1.965, 1.975, -CZ, CZ, M.glass, { glass: true, edges: false });
        C('y', 0.016, 1.22, 1.6, -0.24, CZ + 0.045, M.chrome, { cover: true, xo: 0, edges: false });

        // ===== SŁUPKI OSŁONY + STEROWNIK (pionowy ekran na wsporniku) =====
        [1, -1].forEach(s => R(-0.11, 0.02, 0.79, 1.98, s * 0.62, s * 0.72, M.silver, { cover: true, xo: 0.1 }));
        R(0.02, 0.1, 1.36, 1.44, 0.66, 0.75, M.steelDark, { f: 'controller' });
        R(0.03, 0.38, 1.13, 1.67, 0.75, 0.8, M.black, { f: 'controller' });
        R(0.055, 0.355, 1.16, 1.64, 0.8, 0.805, M.screen, { f: 'controller', edges: false });
        R(-0.1, -0.035, 0.81, 0.9, 0.72, 0.73, M.yellow, { cover: true, xo: 0, edges: false });
        C('z', 0.026, 0.73, 0.76, -0.068, 0.855, M.red, { f: 'controller', seg: 16 });
        [1.2, 1.28, 1.36].forEach(y => C('z', 0.012, 0.72, 0.73, -0.045, y, M.light, { cover: true, xo: 0, edges: false, seg: 12 }));

        // ===== AGREGAT WTRYSKOWY (węzeł sań - dosunięcie dyszy) =====
        // szyny sań na płycie szafy
        [-0.3, 0.3].forEach(z => R(0.3, 3.0, 0.815, 0.845, z - 0.035, z + 0.035, M.steelMid));
        // cylindry docisku dyszy (4, symetryczne): tłoczyska w płycie stałej, korpusy na saniach
        const nozzleRods = [[0.21, 0.11], [0.21, -0.11], [-0.21, 0.11], [-0.21, -0.11]];
        nozzleRods.forEach(([dy, dz]) => {
            C('x', 0.02, SP1, 1.2, YC + dy, dz, M.chrome, { f: 'injection', seg: 12 });
            R(SP1, SP1 + 0.05, YC + dy - 0.04, YC + dy + 0.04, dz - 0.04, dz + 0.04, M.cast, { edges: false });
        });

        const nCar = node([CAR_BACK, 0, 0]);
        nozzleRods.forEach(([dy, dz]) => C('x', 0.045, 0.82, 1.09, YC + dy, dz, M.cast, { parent: nCar, f: 'injection' }));
        R(1.1, 3.0, 0.845, 0.885, -0.36, 0.36, M.frame, { parent: nCar });
        [1.42, 1.56, 2.5, 2.64].forEach(x => [-0.3, 0.3].forEach(z => R(x - 0.04, x + 0.04, 0.885, 1.07, z - 0.04, z + 0.04, M.frame, { parent: nCar })));
        // płyta czołowa - zintegrowany odlew obudowy wtrysku
        R(1.09, 1.31, 1.05, 1.61, -0.32, 0.32, M.cast, { parent: nCar, f: 'injection' });
        // cylinder z grzałkami, dysza, gardziel zasypowa, osłona perforowana
        C('x', 0.065, 0.16, 1.09, YC, 0, M.barrel, { parent: nCar, cover: true, xo: 0.2, f: 'injection' });
        const heaters = [0.3, 0.46, 0.62, 0.78, 0.94].map(x =>
            C('x', 0.082, x - 0.06, x + 0.06, YC, 0, M.heater, { parent: nCar, cover: true, xo: 0.3 }));
        F('x', 0.022, 0.05, -0.1, 0.16, YC, 0, M.chrome, { parent: nCar, f: 'injection' });
        R(1.12, 1.28, YC + 0.065, YC + 0.24, -0.09, 0.09, M.steelMid, { parent: nCar });
        R(0.37, 1.09, YC - 0.1, YC + 0.09, -0.12, 0.12, M.perf, { parent: nCar, cover: true, uv: [9, 2], xo: 0.12, f: 'injection' });
        // obudowa agregatu
        R(1.31, 3.07, 1.07, 1.61, -0.36, 0.36, M.teal, { parent: nCar, cover: true, f: 'injection' });
        add(geoPlane(0.28, 0.075), M.logo, { parent: nCar, pos: [2.86, 1.51, 0.362], cover: true, xo: 0, edges: false });
        add(geoPlane(0.13, 0.17), M.vent, { parent: nCar, pos: [2.93, 1.31, 0.362], cover: true, xo: 0, edges: false, uv: [2, 1] });
        R(2.14, 2.26, 1.16, 1.34, 0.36, 0.364, M.white, { parent: nCar, cover: true, xo: 0, edges: false });
        R(2.27, 2.36, 1.2, 1.3, 0.36, 0.364, M.yellow, { parent: nCar, cover: true, xo: 0, edges: false });
        R(1.66, 1.76, 1.44, 1.48, 0.36, 0.364, M.black, { parent: nCar, cover: true, xo: 0, edges: false });
        // skrzynka serwonapędów w osi agregatu (szara pokrywa) + radiator
        R(1.38, 2.42, 1.61, 1.79, -0.3, 0.3, M.gray, { parent: nCar, cover: true });
        add(geoBox(0.24, 0.2, 0.6), M.gray, { parent: nCar, pos: [2.42, 1.64, 0], rot: [0, 0, -0.75], cover: true });
        add(geoPlane(0.3, 0.06), M.vent, { parent: nCar, pos: [1.62, 1.7, 0.302], cover: true, xo: 0, edges: false, uv: [4, 1] });
        R(1.46, 2.34, 1.62, 1.65, -0.24, 0.24, M.drive, { parent: nCar, f: 'injection' });
        for (let x = 1.5; x < 2.32; x += 0.07) R(x, x + 0.012, 1.65, 1.76, -0.22, 0.22, M.steelMid, { parent: nCar, edges: false });
        R(1.5, 1.9, 1.62, 1.64, 0.24, 0.252, M.led, { parent: nCar, edges: false });

        // wnętrze: dwie śruby kulowe wtrysku z kołami pasowymi, serwosilnik wtrysku
        R(2.66, 2.78, 1.1, 1.58, -0.32, 0.32, M.cast, { parent: nCar });
        const injScrews = [-0.2, 0.2].map(z => {
            const n = node([0, YC, z], nCar);
            C('x', 0.035, 1.31, 2.7, 0, 0, M.chrome, { parent: n, f: 'injection', seg: 16 });
            R(1.4, 2.6, 0.03, 0.04, -0.007, 0.007, M.stripe, { parent: n, edges: false });
            return n;
        });
        const injPulleys = [-0.2, 0.2].map(z => pulley([0, YC, z], 2.8, 2.86, 0.12, M.gearSteel, 4, 'injection', nCar));
        const IM_Y = YC - 0.14;
        C('x', 0.1, 2.3, 2.78, IM_Y, 0, M.motor, { parent: nCar, f: 'injection' });
        const injMotorPulley = pulley([0, IM_Y, 0], 2.8, 2.86, 0.06, M.gearSteel, 3, 'injection', nCar);
        belt(2.83, [IM_Y, 0], 0.06, [YC, -0.2], 0.12, 0.05, 'injection', nCar);
        belt(2.83, [IM_Y, 0], 0.06, [YC, 0.2], 0.12, 0.05, 'injection', nCar);

        // ślimak: końcówka z zaworem zwrotnym, zwoje (obraca się przy dozowaniu, przesuwa przy wtrysku)
        const nScrew = node([0, YC, 0], nCar);
        F('x', 0.012, 0.045, TIP0, TIP0 + 0.06, 0, 0, M.screw, { parent: nScrew, f: 'injection', seg: 16 });
        C('x', 0.058, TIP0 + 0.06, TIP0 + 0.1, 0, 0, M.chrome, { parent: nScrew, f: 'injection', seg: 18 });
        C('x', 0.04, TIP0 + 0.1, 1.86, 0, 0, M.screw, { parent: nScrew, seg: 16 });
        for (let x = TIP0 + 0.13; x < 1.06; x += 0.055) {
            C('x', 0.06, x, x + 0.012, 0, 0, M.screw, { parent: nScrew, edges: false, seg: 18 });
        }
        R(TIP0 + 0.12, 1.06, 0.04, 0.052, -0.007, 0.007, M.stripe, { parent: nScrew, edges: false });
        // stopiony materiał przed ślimakiem (długość = objętość dozy)
        const melt = add(geoCyl('x', 0.05, 1, 16), M.melt, { parent: nCar, pos: [0.3, YC, 0], edges: false });
        // płyta dociskowa + czujnik siły (load cell) + silnik dozowania (przesuwają się ze ślimakiem)
        const nPush = node([0, 0, 0], nCar);
        R(1.86, 1.96, 1.14, 1.54, -0.3, 0.3, M.cast, { parent: nPush, f: 'injection' });
        [-0.2, 0.2].forEach(z => C('x', 0.06, 1.8, 1.98, YC, z, M.steelMid, { parent: nPush, edges: false, seg: 16 }));
        C('x', 0.09, 1.82, 1.86, YC, 0, M.loadcell, { parent: nPush, f: 'injection', seg: 20 });
        C('x', 0.1, 1.96, 2.26, YC, 0, M.motor, { parent: nPush, f: 'injection' });
        const nPlastCap = node([0, YC, 0], nPush);
        C('x', 0.07, 2.26, 2.29, 0, 0, M.steelMid, { parent: nPlastCap, edges: false });
        R(2.29, 2.295, -0.06, 0.06, -0.012, 0.012, M.stripe, { parent: nPlastCap, edges: false });

        // wypraska (pojawia się w gnieździe przy wtrysku, wypychana i spada)
        const part = add(geoBox(0.024, 0.22, 0.28), M.part, { edges: true });
        part.visible = false;

        return {
            nMP, nEj, nCH, nBS, nCar, nScrew, nPush, nPlastCap, toggle, lamps, heaters, melt, part,
            nClampPulley, nClampMotorPulley, nEjPulley, nEjMotorPulley, injScrews, injPulleys, injMotorPulley
        };
    }

    const rig = buildMachine();

    // Kinematyka układu kolanowego dla danego otwarcia formy (0 = zamknięta, 1 = otwarta)
    function setLink(m, x1, y1, x2, y2, z) {
        const dx = x2 - x1, dy = y2 - y1;
        m.pos = [(x1 + x2) / 2, (y1 + y2) / 2, z];
        m.rot = [0, 0, Math.atan2(dy, dx)];
        m.scl = [Math.hypot(dx, dy), 1, 1];
    }

    function updateToggle(open) {
        const face = M_CLOSED - STROKE * open;
        rig.nMP.pos[0] = face;
        const xf = face - FPIV;
        const half = (xf - XR) / 2;
        const off = Math.sqrt(Math.max(LINK * LINK - half * half, 0));
        const jx = XR + half;
        const cx = CX_OPEN + (CX_CLOSED - CX_OPEN) * (1 - open);
        rig.nCH.pos[0] = cx;
        rig.toggle.forEach(t => {
            const yR = YC + t.sy * PIV, yJ = YC + t.sy * (PIV + off);
            t.a.forEach(l => setLink(l.m, XR, yR, jx, yJ, l.z));
            t.b.forEach(l => setLink(l.m, jx, yJ, xf, yR, l.z));
            t.pinJ.pos = [jx, yJ, 0];
            t.pinF.pos = [xf, yR, 0];
            const kx = XR + 0.62 * (jx - XR), ky = yR + 0.62 * (yJ - yR);
            t.s.forEach(l => setLink(l.m, cx, YC + t.sy * 0.12, kx, ky, l.z));
            t.pinK.pos = [kx, ky, 0];
        });
        return cx;
    }

    // ---------- Stan kamery ----------
    const cam = { theta: 0, phi: 1.2, r: 9, t: [0, 1.05, 0] };
    const goal = { theta: 0, phi: 1.2, r: 9, t: [0, 1.05, 0] };
    let fitK = 1;

    function applyView(v, instant) {
        goal.t = v.target.slice();
        goal.r = v.r * fitK;
        // wybierz najkrótszą drogę obrotu do docelowego kąta
        let th = v.theta;
        while (th - cam.theta > Math.PI) th -= Math.PI * 2;
        while (th - cam.theta < -Math.PI) th += Math.PI * 2;
        goal.theta = th;
        goal.phi = v.phi;
        if (instant) {
            cam.theta = goal.theta; cam.phi = goal.phi; cam.r = goal.r; cam.t = goal.t.slice();
        }
    }

    // ---------- Rozmiar płótna ----------
    let W = 1, H = 1, dpr = 1;
    // Rozmiar sceny w px CSS - zapamiętany przy zmianie rozmiaru, żeby pętla
    // renderowania nie odczytywała układu strony w każdej klatce.
    let stageW = 1, stageH = 1;
    function resize() {
        const rect = stage.getBoundingClientRect();
        stageW = rect.width;
        stageH = rect.height;
        dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        W = Math.max(1, Math.round(rect.width * dpr));
        H = Math.max(1, Math.round(rect.height * dpr));
        canvas.width = W;
        canvas.height = H;
        const aspect = rect.width / Math.max(1, rect.height);
        const newK = Math.min(2.2, Math.max(1, 1.55 / aspect));
        if (Math.abs(newK - fitK) > 0.001) {
            goal.r *= newK / fitK;
            cam.r *= newK / fitK;
            fitK = newK;
        }
        requestRender();
    }

    // ---------- Stan animacji ----------
    let xrayMix = 0;
    let time = 0;
    let lastInteraction = -10;
    let cycleT = 0;
    const anim = { open: 1, car: CAR_BACK, screwX: 0, screwRot: 0, eject: 0, heat: 0, fill: 0, cool: 0 };

    function ease(t) { t = Math.min(1, Math.max(0, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function easeOut(t) { t = Math.min(1, Math.max(0, t)); return 1 - Math.pow(1 - t, 3); }
    function seg(t, a, b) { return ease((t - a) / (b - a)); }

    // Kolory wypraski: stopiony materiał (róż) -> zastygnięta wypraska (cyjan)
    const PART_HOT = [1.0, 0.18, 0.82], PART_COLD = [0.0, 1.0, 0.95];

    function updateCycle(dt) {
        const k = 1 - Math.exp(-dt * 5);
        const p = rig.part;
        if (cycleRunning) {
            cycleT = (cycleT + dt) % CYCLE_LENGTH;
            const t = cycleT;
            // forma: szybkie zamykanie, potem ryglowanie (dźwignie prostują się do końca)
            let open;
            if (t < 1.0) open = 1 - 0.96 * seg(t, 0, 1.0);
            else if (t < 1.35) open = 0.04 * (1 - seg(t, 1.0, 1.35));
            else if (t < 5.35) open = 0;
            else if (t < 6.35) open = seg(t, 5.35, 6.35);
            else open = 1;
            // agregat: dosunięcie dyszy przed wtryskiem, odsunięcie po dozowaniu
            let car;
            if (t < 1.35) car = CAR_BACK;
            else if (t < 1.75) car = CAR_BACK * (1 - seg(t, 1.35, 1.75));
            else if (t < 5.0) car = 0;
            else if (t < 5.35) car = CAR_BACK * seg(t, 5.0, 5.35);
            else car = CAR_BACK;
            // ślimak: wtrysk (szybko do przodu) -> docisk -> dozowanie (obrót + cofanie)
            let sx;
            if (t < 1.75) sx = 0;
            else if (t < 2.45) sx = -SHOT * easeOut((t - 1.75) / 0.7);
            else if (t < 3.15) sx = -SHOT - 0.012 * seg(t, 2.45, 3.15);
            else if (t < 4.75) sx = -(SHOT + 0.012) * (1 - (t - 3.15) / 1.6);
            else sx = 0;
            if (t >= 3.15 && t < 4.75) anim.screwRot += dt * 16;
            anim.open = open;
            anim.car = car;
            anim.screwX = sx;
            anim.eject = (t >= 6.35 && t < 7.25) ? Math.sin(Math.PI * (t - 6.35) / 0.9) : 0;
            anim.heat += (1 - anim.heat) * k;
            anim.fill = t < 1.75 ? 0 : easeOut((t - 1.75) / 0.7);
            anim.cool = seg(t, 2.45, 5.35);

            // wypraska: wypełnianie gniazda przy wtrysku, stygnięcie, wypchnięcie i upadek
            if (t >= 1.75 && t < 7.65) {
                p.visible = true;
                const face = M_CLOSED - STROKE * open;
                const push = 0.07 * seg(t, 6.35, 6.7);
                const fall = t > 6.75 ? t - 6.75 : 0;
                const s = 0.25 + 0.75 * anim.fill;
                p.pos = [face + MOLD - 0.014 + push, YC - 4.9 * fall * fall, 0];
                p.rot = [0, 0, -fall * 2.2];
                p.scl = [1, s, s];
                const c = anim.cool;
                p.colorOverride = [PART_HOT[0] + (PART_COLD[0] - PART_HOT[0]) * c, PART_HOT[1] + (PART_COLD[1] - PART_HOT[1]) * c, PART_HOT[2] + (PART_COLD[2] - PART_HOT[2]) * c];
                p.emOverride = [1.0 * (1 - c), 0.16 * (1 - c) + 0.7 * c, 0.85 * (1 - c) + 0.68 * c];
                p.alphaOverride = 0.92 * (t > 7.1 ? 1 - seg(t, 7.1, 7.6) : 1);
            } else {
                p.visible = false;
            }
        } else {
            anim.open += (1 - anim.open) * k;
            anim.car += (CAR_BACK - anim.car) * k;
            anim.screwX += (0 - anim.screwX) * k;
            anim.eject += (0 - anim.eject) * k;
            anim.heat += (0 - anim.heat) * k;
            p.visible = false;
        }

        // zespół zamykający: dźwignie, krzyżulec, obrót śruby kulowej i kół pasowych
        const cx = updateToggle(anim.open);
        const bs = (cx - CX_OPEN) * 46;
        rig.nBS.rot[0] = bs;
        rig.nClampPulley.rot[0] = bs;
        rig.nClampMotorPulley.rot[0] = bs * (0.19 / 0.07);
        // wypychacz (napęd pasowy na płycie ruchomej)
        rig.nEj.pos[0] = 0.06 * anim.eject;
        const ej = anim.eject * 9;
        rig.nEjPulley.rot[0] = ej;
        rig.nEjMotorPulley.rot[0] = ej * (0.075 / 0.04);
        // agregat: sanie, ślimak, płyta dociskowa, śruby kulowe wtrysku z kołami
        rig.nCar.pos[0] = anim.car;
        rig.nScrew.pos[0] = anim.screwX;
        rig.nScrew.rot[0] = anim.screwRot;
        rig.nPush.pos[0] = anim.screwX;
        rig.nPlastCap.rot[0] = anim.screwRot;
        const is = -anim.screwX * 70;
        rig.injScrews.forEach(n => { n.rot[0] = is; });
        rig.injPulleys.forEach(n => { n.rot[0] = is; });
        rig.injMotorPulley.rot[0] = is * 2;

        // stopiony materiał przed ślimakiem (ilość = przygotowana dawka)
        const len = Math.max(0.001, TIP0 + anim.screwX - 0.16);
        rig.melt.pos[0] = 0.16 + len / 2;
        rig.melt.scl = [len, 1, 1];
        rig.melt.alphaOverride = anim.heat * (0.35 + 0.55 * xrayMix);
        rig.melt.visible = anim.heat > 0.05 && len > 0.004;

        const pulse = 0.75 + 0.25 * Math.sin(time * 6);
        rig.heaters.forEach(h => { h.emOverride = [0.5 * anim.heat * pulse, 0.04 * anim.heat, 0.42 * anim.heat * pulse]; });
        rig.lamps.g.emOverride = cycleRunning ? [0.1, 0.55, 0.22] : [0, 0, 0];
        rig.lamps.y.emOverride = !cycleRunning ? [0.35, 0.26, 0.02] : [0, 0, 0];
    }

    // ---------- Aktualizacja sceny ----------
    const view = m4(), proj = m4(), viewProj = m4();
    const eye = [0, 0, 0];

    function update(dt) {
        time += dt;
        const idle = time - lastInteraction > 4 && !dragging;
        if (autoRotate && idle && activeFeature === 0) {
            goal.theta += dt * 0.16;
        }

        const kc = 1 - Math.exp(-dt * (reduceMotion ? 14 : 4.2));
        cam.theta += (goal.theta - cam.theta) * kc;
        cam.phi += (goal.phi - cam.phi) * kc;
        cam.r += (goal.r - cam.r) * kc;
        for (let i = 0; i < 3; i++) cam.t[i] += (goal.t[i] - cam.t[i]) * kc;

        const wantX = userXray ? 1 : 0;
        xrayMix += (wantX - xrayMix) * (1 - Math.exp(-dt * 5));
        if (Math.abs(wantX - xrayMix) < 0.002) xrayMix = wantX;

        updateCycle(dt);

        const activeId = TE3D_FEATURES[activeFeature].id;
        meshes.forEach(m => {
            const target = m.feature && m.feature === activeId ? 1 : 0;
            m.hl += (target - m.hl) * (1 - Math.exp(-dt * 6));
        });

        nodes.forEach(n => {
            m4TRS(n.local, n.pos, n.rot, n.scl);
            if (n.parent) m4Mul(n.world, n.parent.world, n.local); else n.world.set(n.local);
        });
        meshes.forEach(m => {
            m4TRS(m.local, m.pos, m.rot, m.scl);
            if (m.parent) m4Mul(m.world, m.parent.world, m.local); else m.world.set(m.local);
            if (m.alphaOverride != null) m.alpha = m.alphaOverride;
            else if (m.glass) m.alpha = m.mat.opacity * (1 - xrayMix) + 0.06 * xrayMix;
            else if (m.cover) m.alpha = 1 - (1 - m.xo) * xrayMix;
            else m.alpha = m.mat.opacity;
        });

        const sp = Math.sin(cam.phi);
        eye[0] = cam.t[0] + cam.r * sp * Math.sin(cam.theta);
        eye[1] = cam.t[1] + cam.r * Math.cos(cam.phi);
        eye[2] = cam.t[2] + cam.r * sp * Math.cos(cam.theta);
        m4Persp(proj, 32 * Math.PI / 180, W / H, 0.05, 80);
        m4LookAt(view, eye, cam.t);
        m4Mul(viewProj, proj, view);
    }

    // ---------- Rysowanie ----------
    const bgBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bgBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const floorBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, floorBuf);
    const FS = 16;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-FS, 0, -FS, FS, 0, -FS, FS, 0, FS, -FS, 0, -FS, FS, 0, FS, -FS, 0, FS]), gl.STATIC_DRAW);

    function bindAttr(loc, buf, size) {
        if (loc < 0) return;
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }

    function disableAttrs() {
        for (let i = 0; i < 4; i++) gl.disableVertexAttribArray(i);
    }

    const HL_EM = [0.0, 0.42, 0.4];

    function drawMesh(m) {
        const u = P_MAIN.u, mt = m.mat;
        const x = m.cover || m.glass ? xrayMix : 0;
        const base = m.colorOverride || mt.color;
        let r = base[0], g = base[1], b = base[2];
        if (x > 0 && !m.glass) {
            r += (XRAY_TINT[0] - r) * x * 0.7; g += (XRAY_TINT[1] - g) * x * 0.7; b += (XRAY_TINT[2] - b) * x * 0.7;
        }
        gl.uniformMatrix4fv(u.uModel, false, m.world);
        gl.uniform3f(u.uColor, r, g, b);
        const em = m.emOverride || mt.em;
        const hp = m.hl * (0.55 + 0.45 * Math.sin(time * 4.5)) * (m.cover ? 0.45 : 1);
        gl.uniform3f(u.uEm, em[0] + HL_EM[0] * hp, em[1] + HL_EM[1] * hp, em[2] + HL_EM[2] * hp);
        gl.uniform1f(u.uOpacity, m.alpha);
        gl.uniform1f(u.uSpec, mt.spec);
        gl.uniform1f(u.uShin, mt.shin);
        gl.uniform1f(u.uRim, mt.rim + x * 0.9 + m.hl * 0.5);
        gl.uniform2f(u.uUvScale, m.uvScale[0], m.uvScale[1]);
        if (mt.tex) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, mt.tex);
            gl.uniform1i(u.uTex, 0);
            gl.uniform1f(u.uUseTex, 1);
            gl.uniform1f(u.uTexEm, mt.texEm);
        } else {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, dummyTex);
            gl.uniform1i(u.uTex, 0);
            gl.uniform1f(u.uUseTex, 0);
            gl.uniform1f(u.uTexEm, 0);
        }
        bindAttr(P_MAIN.a.aPos, m.geo.pos, 3);
        bindAttr(P_MAIN.a.aNrm, m.geo.nrm, 3);
        bindAttr(P_MAIN.a.aUv, m.geo.uv, 2);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.geo.idx);
        gl.drawElements(gl.TRIANGLES, m.geo.count, gl.UNSIGNED_SHORT, 0);
    }

    function drawEdges(m, color, alpha) {
        if (!m.geo.edges || alpha <= 0.01) return;
        gl.uniformMatrix4fv(P_LINE.u.uModel, false, m.world);
        gl.uniform3f(P_LINE.u.uColor, color[0], color[1], color[2]);
        gl.uniform1f(P_LINE.u.uAlpha, alpha);
        bindAttr(P_LINE.a.aPos, m.geo.pos, 3);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.geo.edges);
        gl.drawElements(gl.LINES, m.geo.edgeCount, gl.UNSIGNED_SHORT, 0);
    }

    const EDGE_CYAN = [0.0, 0.78, 0.74];
    const EDGE_HL = [0.0, 0.95, 0.9];

    function render() {
        gl.viewport(0, 0, W, H);
        gl.clearColor(0.906, 0.941, 0.949, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.CULL_FACE);

        // tło
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.useProgram(P_BG.p);
        disableAttrs();
        gl.uniform1f(P_BG.u.uAspect, W / H);
        bindAttr(P_BG.a.aPos, bgBuf, 2);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // podłoga z siatką i cieniem
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(P_FLOOR.p);
        disableAttrs();
        gl.uniformMatrix4fv(P_FLOOR.u.uViewProj, false, viewProj);
        gl.uniform1f(P_FLOOR.u.uTime, time);
        bindAttr(P_FLOOR.a.aPos, floorBuf, 3);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // bryły nieprzezroczyste
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1, 1);
        gl.useProgram(P_MAIN.p);
        disableAttrs();
        gl.uniformMatrix4fv(P_MAIN.u.uViewProj, false, viewProj);
        gl.uniform3f(P_MAIN.u.uCam, eye[0], eye[1], eye[2]);
        const transparent = [];
        meshes.forEach(m => {
            if (!m.visible) return;
            if (m.alpha < 0.995) { if (m.alpha > 0.005) transparent.push(m); return; }
            drawMesh(m);
        });

        // neonowe krawędzie (X-RAY / podświetlony zespół)
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        gl.useProgram(P_LINE.p);
        disableAttrs();
        gl.uniformMatrix4fv(P_LINE.u.uViewProj, false, viewProj);
        meshes.forEach(m => {
            if (!m.visible || !m.edges || m.alpha < 0.995) return;
            const a = Math.max(xrayMix * 0.2, m.hl * 0.85);
            drawEdges(m, m.hl > 0.05 ? EDGE_HL : EDGE_CYAN, a);
        });

        // bryły przezroczyste (od najdalszej)
        gl.useProgram(P_MAIN.p);
        disableAttrs();
        gl.uniformMatrix4fv(P_MAIN.u.uViewProj, false, viewProj);
        gl.uniform3f(P_MAIN.u.uCam, eye[0], eye[1], eye[2]);
        transparent.forEach(m => {
            const dx = m.world[12] - eye[0], dy = m.world[13] - eye[1], dz = m.world[14] - eye[2];
            m._d = dx * dx + dy * dy + dz * dz;
        });
        transparent.sort((a, b) => b._d - a._d);
        transparent.forEach(drawMesh);

        gl.useProgram(P_LINE.p);
        disableAttrs();
        gl.uniformMatrix4fv(P_LINE.u.uViewProj, false, viewProj);
        transparent.forEach(m => {
            if (!m.edges) return;
            const a = Math.max((m.cover ? 0.5 : 0.25) * xrayMix, m.hl * 0.85);
            drawEdges(m, m.hl > 0.05 ? EDGE_HL : EDGE_CYAN, a);
        });

        gl.depthMask(true);
        gl.disable(gl.POLYGON_OFFSET_FILL);
    }

    // ---------- Znaczniki (projekcja 3D -> ekran) ----------
    let readoutTimer = 0;
    function updateOverlay(dt) {
        const cw = stageW, ch = stageH;
        hotspotEls.forEach(h => {
            const a = h.f.anchor;
            const ax = a[0] + (h.f.id === 'injection' ? anim.car : 0);
            const x = viewProj[0] * ax + viewProj[4] * a[1] + viewProj[8] * a[2] + viewProj[12];
            const y = viewProj[1] * ax + viewProj[5] * a[1] + viewProj[9] * a[2] + viewProj[13];
            const w = viewProj[3] * ax + viewProj[7] * a[1] + viewProj[11] * a[2] + viewProj[15];
            let visible = w > 0.05;
            let sx = 0, sy = 0;
            if (visible) {
                sx = (x / w * 0.5 + 0.5) * cw;
                sy = (1 - (y / w * 0.5 + 0.5)) * ch;
                const vx = ax - eye[0], vy = a[1] - eye[1], vz = a[2] - eye[2];
                const vl = Math.hypot(vx, vy, vz) || 1;
                const n = h.f.normal;
                const facing = -(vx * n[0] + vy * n[1] + vz * n[2]) / vl;
                visible = facing > -0.15 && sx > 10 && sx < cw - 10 && sy > 40 && sy < ch - 70;
            }
            h.el.classList.toggle('is-hidden', !visible);
            if (visible) {
                h.el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
                h.el.classList.toggle('is-left', sx > cw - 200);
            }
        });

        readoutTimer += dt;
        if (readout && readoutTimer > 0.12) {
            readoutTimer = 0;
            let az = Math.round(((cam.theta * 180 / Math.PI) % 360 + 360) % 360);
            const el = Math.round(90 - cam.phi * 180 / Math.PI);
            const zoom = (8.6 * fitK / cam.r).toFixed(1);
            readout.textContent = `AZ ${String(az).padStart(3, '0')}° · EL ${String(el).padStart(2, '0')}° · ZOOM ${zoom}×`;
        }
    }

    // ---------- Pętla ----------
    let rafId = null;
    let inView = false;
    let lastTs = 0;

    function frame(ts) {
        rafId = null;
        const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0.016;
        lastTs = ts;
        update(dt);
        render();
        updateOverlay(dt);
        if (inView && !document.hidden) rafId = requestAnimationFrame(frame);
        else lastTs = 0;
    }

    function requestRender() {
        if (rafId == null) rafId = requestAnimationFrame(frame);
    }

    // ---------- Interakcja ----------
    let dragging = false, dragId = null, dragX = 0, dragY = 0, dragType = 'mouse';

    function markInteraction() {
        lastInteraction = time;
        if (hint) hint.classList.add('is-gone');
    }

    canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true;
        dragId = e.pointerId;
        dragX = e.clientX;
        dragY = e.clientY;
        dragType = e.pointerType;
        canvas.classList.add('is-dragging');
        if (e.pointerType === 'mouse') {
            try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignorujemy */ }
        }
        markInteraction();
    });

    window.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== dragId) return;
        const dx = e.clientX - dragX, dy = e.clientY - dragY;
        dragX = e.clientX;
        dragY = e.clientY;
        goal.theta -= dx * 0.0068;
        if (dragType !== 'touch') goal.phi = Math.min(1.5, Math.max(0.35, goal.phi - dy * 0.005));
        markInteraction();
        requestRender();
    });

    function endDrag(e) {
        if (!dragging || (e && e.pointerId !== dragId)) return;
        dragging = false;
        dragId = null;
        canvas.classList.remove('is-dragging');
    }
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    function zoom(f) {
        goal.r = Math.min(13 * fitK, Math.max(1.5, goal.r * f));
        markInteraction();
        requestRender();
    }

    canvas.addEventListener('wheel', (e) => {
        // Kółko myszy przewija stronę; przybliżanie tylko z Ctrl/Cmd
        // (oraz gestem "szczypania" na touchpadzie, który przeglądarka
        // zgłasza jako wheel + ctrlKey).
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        zoom(e.deltaY > 0 ? 1.08 : 1 / 1.08);
    }, { passive: false });

    canvas.addEventListener('keydown', (e) => {
        const k = e.key;
        if (k === 'ArrowLeft') goal.theta += 0.12;
        else if (k === 'ArrowRight') goal.theta -= 0.12;
        else if (k === 'ArrowUp') goal.phi = Math.max(0.35, goal.phi - 0.08);
        else if (k === 'ArrowDown') goal.phi = Math.min(1.5, goal.phi + 0.08);
        else if (k === '+' || k === '=') zoom(1 / 1.15);
        else if (k === '-' || k === '_') zoom(1.15);
        else return;
        e.preventDefault();
        markInteraction();
        requestRender();
    });

    function setPressed(action, on) {
        const b = toolbar && toolbar.querySelector(`[data-action="${action}"]`);
        if (b) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    if (toolbar) {
        toolbar.addEventListener('click', (e) => {
            const b = e.target.closest('[data-action]');
            if (!b) return;
            const a = b.dataset.action;
            markInteraction();
            if (a === 'reset') {
                selectFeature(0);
            } else if (a === 'xray') {
                userXray = !userXray;
                setPressed('xray', userXray);
            } else if (a === 'zoom-in') {
                zoom(1 / 1.2);
            } else if (a === 'zoom-out') {
                zoom(1.2);
            } else if (a === 'rotate') {
                autoRotate = !autoRotate;
                setPressed('rotate', autoRotate);
                lastInteraction = -10;
            }
            requestRender();
        });
    }
    setPressed('rotate', autoRotate);

    onSelect3D = function (idx) {
        const f = TE3D_FEATURES[idx];
        applyView(f.view);
        userXray = f.xray;
        setPressed('xray', userXray);
        lastInteraction = time;
        if (hint) hint.classList.add('is-gone');
        requestRender();
    };

    // ---------- Start ----------
    resize();
    applyView(TE3D_FEATURES[0].view, true);
    updateToggle(1);

    if ('ResizeObserver' in window) {
        new ResizeObserver(resize).observe(stage);
    } else {
        window.addEventListener('resize', resize);
    }

    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            inView = entries[0].isIntersecting;
            if (inView) requestRender();
        }, { rootMargin: '120px 0px' }).observe(stage);
    } else {
        inView = true;
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && inView) requestRender();
    });

    canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        if (fallback) fallback.hidden = false;
        canvas.style.display = 'none';
        if (toolbar) toolbar.style.display = 'none';
    });

    requestRender();
}

// Leniwa inicjalizacja: model (WebGL, geometria, tekstury) budowany jest
// dopiero, gdy sekcja zbliża się do widoku - nie obciąża startu strony.
(function lazyInitTe3D() {
    const section = document.getElementById('te3dSection');
    if (!section) return;
    if (!('IntersectionObserver' in window)) { initTe3DShowcase(); return; }
    const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        initTe3DShowcase();
    }, { rootMargin: '600px 0px' });
    io.observe(section);
})();
