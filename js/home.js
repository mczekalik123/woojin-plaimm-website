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

            // Karty wjeżdżają lekko po skosie podczas przewijania
            gsap.from(cards, {
                y: 60,
                opacity: 0,
                stagger: 0.08,
                duration: 1,
                ease: 'expo.out',
                scrollTrigger: { trigger: series, start: 'top 75%' }
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
