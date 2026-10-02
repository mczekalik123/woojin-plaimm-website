// =====================================================================
// STRONA GŁÓWNA – efekty sterowane przewijaniem (GSAP + ScrollTrigger)
// Paralaksa hero, przypinana karuzela serii maszyn, rozjaśnianie tekstu
// "O nas" słowo po słowie. Gdy GSAP się nie wczyta (brak internetu /
// zablokowany CDN), strona działa normalnie - karuzela serii przewija
// się wtedy natywnie (przyciski / gest przesunięcia).
// =====================================================================

(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasGsap = !!(window.gsap && window.ScrollTrigger);

    // -----------------------------------------------------------------
    // KARUZELA SERII – przyciski, licznik i pasek postępu (tryb natywny)
    // -----------------------------------------------------------------
    const series = document.querySelector('.series');
    const viewport = series && series.querySelector('.series-viewport');
    const track = series && series.querySelector('.series-track');
    const cards = track ? Array.from(track.children) : [];
    const counter = series && series.querySelector('.series-counter b');
    const progress = series && series.querySelector('.series-progress');
    const prevBtn = series && series.querySelector('[data-series-prev]');
    const nextBtn = series && series.querySelector('[data-series-next]');

    function setSeriesProgress(p) {
        p = Math.min(1, Math.max(0, p));
        if (progress) progress.style.setProperty('--p', (1 / cards.length + p * (1 - 1 / cards.length)).toFixed(4));
        if (counter) counter.textContent = String(Math.round(p * (cards.length - 1)) + 1).padStart(2, '0');
        if (prevBtn) prevBtn.disabled = p <= 0.001;
        if (nextBtn) nextBtn.disabled = p >= 0.999;
    }

    if (viewport && cards.length) {
        const nativeProgress = function () {
            const max = viewport.scrollWidth - viewport.clientWidth;
            setSeriesProgress(max > 0 ? viewport.scrollLeft / max : 0);
        };
        viewport.addEventListener('scroll', nativeProgress, { passive: true });

        const step = function (dir) {
            const card = cards[0];
            const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 24;
            viewport.scrollBy({ left: dir * (card.getBoundingClientRect().width + gap), behavior: reduceMotion ? 'auto' : 'smooth' });
        };
        if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); });
        if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });
        nativeProgress();
    }

    // Neony 사출성형기 i "wtryskarkę" - wyrównanie startu animacji, żeby
    // zawsze migały dokładnie w tym samym momencie
    if (document.getAnimations) {
        document.getAnimations()
            .filter(function (a) { return a.animationName === 'neonFlicker'; })
            .forEach(function (a) { a.startTime = 0; });
    }

    // -----------------------------------------------------------------
    // SEKCJA TECHNOLOGII – świetlny promień wokół sylwetek maszyn TE-A5.
    // Promień to kilka nałożonych odcinków tej samej ścieżki (obrysu
    // maszyny): długi turkusowy "ogon", różowy środek, cyjanowa "głowa".
    // Głowy wszystkich warstw biegną razem, więc całość wygląda jak jeden
    // promień w kolorach przycisku konfiguratora. Promień jest krótszy niż
    // obwód, więc jego końce nigdy się ze sobą nie stykają.
    // data-beam="loop" – okrążanie zamkniętego obrysu,
    // data-beam="pass" – przelot wzdłuż otwartego obrysu (maszyna ucięta
    // kadrem zdjęcia), z wygaszeniem na początku i końcu.
    // -----------------------------------------------------------------
    const BEAM_LAYERS = [
        // len – część długości promienia (od głowy), w – grubość w px ekranu, o – krycie
        { len: 1, color: '#0abeb5', w: 10, o: 0.12 },
        { len: 1, color: '#0abeb5', w: 2, o: 0.6 },
        { len: 0.62, color: '#ff2dd2', w: 12, o: 0.18 },
        { len: 0.62, color: '#ff2dd2', w: 2.4, o: 0.9 },
        { len: 0.3, color: '#00fff2', w: 16, o: 0.24 },
        { len: 0.3, color: '#00fff2', w: 3, o: 1 },
        { len: 0.06, color: '#eafffe', w: 3.6, o: 1 }
    ];
    // Czas jednego okrążenia (loop) i jednego przelotu z przerwą (pass)
    const BEAM_LOOP_MS = 3800;
    const BEAM_PASS_MS = 3000;

    (function initTechBeams() {
        const svgs = document.querySelectorAll('svg[data-beam]');
        if (!svgs.length) return;
        const NS = 'http://www.w3.org/2000/svg';
        const canAnimate = !reduceMotion && typeof Element.prototype.animate === 'function';

        svgs.forEach(function (svg) {
            const src = svg.querySelector('.tech-beam-path');
            if (!src || typeof src.getTotalLength !== 'function') return;

            const loop = svg.getAttribute('data-beam') === 'loop';
            const total = src.getTotalLength();
            const beamLen = total * (loop ? 0.24 : 0.3);
            const group = document.createElementNS(NS, 'g');
            group.setAttribute('class', 'tech-beam');
            group.setAttribute('aria-hidden', 'true');

            const layers = BEAM_LAYERS.map(function (cfg) {
                const len = beamLen * cfg.len;
                const path = document.createElementNS(NS, 'path');
                path.setAttribute('d', src.getAttribute('d'));
                path.setAttribute('stroke', cfg.color);
                path.setAttribute('stroke-opacity', cfg.o);
                path.setAttribute('stroke-dasharray', len.toFixed(1) + ' ' + (loop ? total - len : total + beamLen * 2).toFixed(1));
                group.appendChild(path);
                return { el: path, len: len, w: cfg.w };
            });
            svg.appendChild(group);

            // Grubość linii stała w pikselach ekranu, niezależnie od skali zdjęcia
            const setWidths = function () {
                const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
                if (!scale) return;
                layers.forEach(function (l) { l.el.setAttribute('stroke-width', (l.w / scale).toFixed(2)); });
            };
            setWidths();
            if (window.ResizeObserver) new ResizeObserver(setWidths).observe(svg);
            else window.addEventListener('resize', setWidths);

            // Bez animacji (prefers-reduced-motion) - promień stoi w jednym miejscu
            if (!canAnimate) {
                const head = total * (loop ? 0.55 : 0.72);
                layers.forEach(function (l) { l.el.style.strokeDashoffset = (l.len - head) + 'px'; });
                return;
            }

            const anims = layers.map(function (l) {
                const frames = loop
                    ? [{ strokeDashoffset: l.len + 'px' }, { strokeDashoffset: (l.len - total) + 'px' }]
                    : [
                        { offset: 0, strokeDashoffset: l.len + 'px' },
                        { offset: 0.9, strokeDashoffset: (l.len - total - beamLen) + 'px' },
                        { offset: 1, strokeDashoffset: (l.len - total - beamLen) + 'px' }
                    ];
                return l.el.animate(frames, { duration: loop ? BEAM_LOOP_MS : BEAM_PASS_MS, iterations: Infinity, easing: 'linear' });
            });
            if (!loop) {
                anims.push(group.animate([
                    { offset: 0, opacity: 0 },
                    { offset: 0.07, opacity: 1 },
                    { offset: 0.66, opacity: 1 },
                    { offset: 0.84, opacity: 0 },
                    { offset: 1, opacity: 0 }
                ], { duration: BEAM_PASS_MS, iterations: Infinity, easing: 'linear' }));
            }

            // Animacja działa tylko, gdy zdjęcie jest na ekranie
            anims.forEach(function (a) { a.pause(); });
            if ('IntersectionObserver' in window) {
                new IntersectionObserver(function (entries) {
                    const visible = entries[0].isIntersecting;
                    anims.forEach(function (a) { if (visible) a.play(); else a.pause(); });
                }, { rootMargin: '80px 0px' }).observe(svg);
            } else {
                anims.forEach(function (a) { a.play(); });
            }
        });
    })();

    if (!hasGsap || reduceMotion) return;

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('has-gsap');

    // -----------------------------------------------------------------
    // HERO – paralaksa zdjęcia i wygaszanie treści przy przewijaniu
    // -----------------------------------------------------------------
    const hero = document.querySelector('.hero');
    if (hero) {
        gsap.to('.hero-media', {
            yPercent: 16,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
        });
        gsap.to('.hero-inner', {
            y: -90,
            opacity: 0,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 15%', scrub: true }
        });
        gsap.to('.hero-bottom', {
            opacity: 0,
            ease: 'none',
            scrollTrigger: { trigger: hero, start: '20% top', end: '70% top', scrub: true }
        });
    }

    // -----------------------------------------------------------------
    // "O NAS" – tekst rozjaśniany słowo po słowie
    // -----------------------------------------------------------------
    document.querySelectorAll('[data-scrub-text]').forEach(function (el) {
        const words = el.textContent.trim().split(/\s+/);
        el.setAttribute('aria-label', el.textContent.trim());
        el.innerHTML = words.map(function (w) { return '<span class="scrub-word" aria-hidden="true">' + w + '</span>'; }).join(' ');
        gsap.to(el.querySelectorAll('.scrub-word'), {
            opacity: 1,
            stagger: 0.08,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 42%', scrub: 0.4 }
        });
    });

    // -----------------------------------------------------------------
    // SERIE – przypinana, poziomo przewijana karuzela (komputery)
    // -----------------------------------------------------------------
    if (series && viewport && track) {
        const mm = gsap.matchMedia();
        mm.add('(min-width: 1024px) and (min-height: 680px)', function () {
            series.classList.add('is-pinned');
            viewport.scrollLeft = 0;

            const distance = function () {
                const cs = getComputedStyle(viewport);
                const inner = viewport.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
                return Math.max(0, track.scrollWidth - inner);
            };

            gsap.to(track, {
                x: function () { return -distance(); },
                ease: 'none',
                scrollTrigger: {
                    trigger: series,
                    start: 'top top',
                    end: function () { return '+=' + distance(); },
                    pin: true,
                    scrub: 0.7,
                    invalidateOnRefresh: true,
                    onUpdate: function (self) { setSeriesProgress(self.progress); }
                }
            });

            return function () {
                series.classList.remove('is-pinned');
                gsap.set(track, { clearProps: 'transform' });
            };
        });
    }

    // -----------------------------------------------------------------
    // SEKCJA TECHNOLOGII – paralaksa neonowego napisu
    // -----------------------------------------------------------------
    const neon = document.querySelector('.cyber-kr-neon');
    if (neon) {
        gsap.fromTo(neon, { yPercent: 12 }, {
            yPercent: -18,
            ease: 'none',
            scrollTrigger: { trigger: '.cyber-section', start: 'top bottom', end: 'bottom top', scrub: true }
        });
    }

    // Przeliczenie pozycji po wczytaniu fontów i obrazów
    const refresh = function () { ScrollTrigger.refresh(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    window.addEventListener('load', refresh);
})();
