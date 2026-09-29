// =====================================================================
// WOOJIN PLAIMM – wspólny skrypt wszystkich podstron
// Nagłówek, menu mobilne, animacje przy przewijaniu, liczniki, baner
// cookie, drobne interakcje (reflektor na kartach, przyciski
// "magnetyczne", kopiowanie adresów e-mail) oraz funkcje pomocnicze
// używane przez konfigurator i formularz kontaktowy.
// Skrypty stron: js/home.js, js/te3d.js, js/machines.js,
// js/configurator.js, js/contact.js.
// =====================================================================

(function () {
    'use strict';

    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const WJ = window.WJ = window.WJ || {};
    WJ.reducedMotion = prefersReducedMotion;
    WJ.canHover = canHover;

    // -----------------------------------------------------------------
    // WIBRACJA (HAPTYKA) – tylko urządzenia dotykowe z Vibration API
    // -----------------------------------------------------------------
    function triggerHapticFeedback(durationMs) {
        if (!window.matchMedia('(pointer: coarse)').matches) return;
        if (!('vibrate' in navigator)) return;
        // Przeglądarka blokuje wibrację przed pierwszym dotknięciem strony
        if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
        try { navigator.vibrate(durationMs); } catch (e) { /* ignorujemy */ }
    }
    window.triggerHapticFeedback = triggerHapticFeedback;

    document.addEventListener('click', function (e) {
        if (e.target.closest('button, .btn, a.catalog-dl-btn, .main-nav a')) triggerHapticFeedback(10);
    });

    // -----------------------------------------------------------------
    // TOAST (krótki komunikat na dole ekranu)
    // -----------------------------------------------------------------
    let toastEl = null;
    let toastTimer = null;
    WJ.toast = function (message) {
        if (!toastEl) {
            toastEl = document.createElement('div');
            toastEl.className = 'toast';
            toastEl.setAttribute('role', 'status');
            toastEl.setAttribute('aria-live', 'polite');
            document.body.appendChild(toastEl);
        }
        toastEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span></span>';
        toastEl.querySelector('span').textContent = message;
        requestAnimationFrame(function () { toastEl.classList.add('is-visible'); });
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 2400);
    };

    // -----------------------------------------------------------------
    // NAGŁÓWEK: stan po przewinięciu, chowanie przy przewijaniu w dół,
    // kolory nad ciemnymi sekcjami, pasek postępu, przycisk "do góry".
    // Jeden nasłuchiwacz scroll (passive) + requestAnimationFrame.
    // -----------------------------------------------------------------
    const header = document.querySelector('.site-header');
    const progressBar = document.querySelector('.scroll-progress span');
    const darkSections = Array.from(document.querySelectorAll('[data-header-theme="dark"]'));

    let toTop = document.createElement('button');
    toTop.type = 'button';
    toTop.className = 'to-top';
    toTop.setAttribute('aria-label', 'Przewiń na górę strony');
    toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
    toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
    document.body.appendChild(toTop);

    let lastY = window.scrollY;
    let ticking = false;

    function updateOnScroll() {
        ticking = false;
        const y = window.scrollY;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const p = docH > 0 ? Math.min(1, Math.max(0, y / docH)) : 0;

        if (progressBar) progressBar.style.setProperty('--p', p.toFixed(4));
        toTop.style.setProperty('--p', p.toFixed(4));
        toTop.classList.toggle('is-visible', y > window.innerHeight * 0.9);

        if (header) {
            const menuOpen = header.classList.contains('is-menu-open');
            header.classList.toggle('is-scrolled', y > 12);

            if (!menuOpen) {
                const delta = y - lastY;
                if (y > 480 && delta > 6) header.classList.add('is-hidden');
                else if (delta < -6 || y < 480) header.classList.remove('is-hidden');
            }

            // Czy pod nagłówkiem znajduje się ciemna sekcja
            const probe = header.offsetHeight / 2;
            let onDark = false;
            for (let i = 0; i < darkSections.length; i++) {
                const r = darkSections[i].getBoundingClientRect();
                if (r.top <= probe && r.bottom >= probe) { onDark = true; break; }
            }
            header.classList.toggle('is-on-dark', onDark);
        }
        lastY = y;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(updateOnScroll); }
    }, { passive: true });
    window.addEventListener('resize', function () {
        if (!ticking) { ticking = true; requestAnimationFrame(updateOnScroll); }
    }, { passive: true });
    updateOnScroll();

    // -----------------------------------------------------------------
    // MENU MOBILNE
    // -----------------------------------------------------------------
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');

    if (navToggle && mainNav && header) {
        mainNav.querySelectorAll('.nav-list li').forEach(function (li, i) { li.style.setProperty('--i', i); });

        const setMenu = function (open) {
            mainNav.classList.toggle('is-open', open);
            header.classList.toggle('is-menu-open', open);
            header.classList.remove('is-hidden');
            navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            navToggle.setAttribute('aria-label', open ? 'Zamknij menu' : 'Otwórz menu');
            document.body.classList.toggle('is-locked', open);
            if (open) {
                const first = mainNav.querySelector('a');
                if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 350);
            }
        };

        navToggle.addEventListener('click', function () {
            setMenu(!mainNav.classList.contains('is-open'));
        });

        mainNav.addEventListener('click', function (e) {
            if (e.target.closest('a')) setMenu(false);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
                setMenu(false);
                navToggle.focus();
            }
        });

        window.matchMedia('(min-width: 961px)').addEventListener('change', function (mq) {
            if (mq.matches) setMenu(false);
        });
    }

    // -----------------------------------------------------------------
    // ANIMACJE POJAWIANIA SIĘ ([data-reveal]) + liczniki ([data-count-to])
    // -----------------------------------------------------------------
    function revealAll() {
        document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
    }

    document.querySelectorAll('[data-reveal-stagger]').forEach(function (group) {
        const step = parseFloat(group.dataset.revealStagger) || 0.08;
        Array.from(group.querySelectorAll('[data-reveal]')).forEach(function (el, i) {
            if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', (i * step).toFixed(2) + 's');
        });
    });

    function formatNumber(n) {
        return Math.round(n).toLocaleString('pl-PL');
    }

    function runCounter(el) {
        if (el.dataset.counted) return;
        el.dataset.counted = '1';
        const to = parseFloat(el.dataset.countTo);
        const from = parseFloat(el.dataset.countFrom || '0');
        const suffix = el.dataset.suffix || '';
        const finish = function () {
            el.textContent = formatNumber(to);
            if (suffix) {
                const s = document.createElement('span');
                s.className = 'pulse-plus';
                s.textContent = suffix;
                el.appendChild(s);
            }
        };
        if (prefersReducedMotion) { finish(); return; }
        const duration = parseFloat(el.dataset.countDuration || '2400');
        const start = performance.now();
        const tick = function (now) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 4);
            if (t < 1) {
                el.textContent = formatNumber(from + (to - from) * eased);
                requestAnimationFrame(tick);
            } else {
                finish();
            }
        };
        requestAnimationFrame(tick);
    }

    const revealEls = document.querySelectorAll('[data-reveal]');
    const counterEls = document.querySelectorAll('[data-count-to]');

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
        revealAll();
        counterEls.forEach(runCounter);
    } else {
        const io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                io.unobserve(entry.target);
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
        revealEls.forEach(function (el) { io.observe(el); });

        const cio = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                const delay = parseFloat(entry.target.dataset.countDelay || '0');
                setTimeout(function () { runCounter(entry.target); }, delay);
                cio.unobserve(entry.target);
            });
        }, { threshold: 0.4 });
        counterEls.forEach(function (el) { cio.observe(el); });
    }

    // -----------------------------------------------------------------
    // "REFLEKTOR" POD KURSOREM I DELIKATNE POCHYLENIE KART 3D
    // -----------------------------------------------------------------
    if (canHover && !prefersReducedMotion) {
        document.querySelectorAll('[data-spotlight]').forEach(function (card) {
            let raf = null;
            const tilt = card.hasAttribute('data-tilt');
            card.addEventListener('pointermove', function (e) {
                if (raf) return;
                raf = requestAnimationFrame(function () {
                    raf = null;
                    const r = card.getBoundingClientRect();
                    const x = (e.clientX - r.left) / r.width;
                    const y = (e.clientY - r.top) / r.height;
                    card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
                    card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
                    if (tilt) {
                        card.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 6).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 8).toFixed(2) + 'deg) translateY(-4px)';
                    }
                });
            });
            card.addEventListener('pointerleave', function () {
                if (tilt) card.style.transform = '';
            });
        });

        // Przyciski "magnetyczne" - lekko podążają za kursorem
        document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
            const strength = 0.28;
            btn.addEventListener('pointermove', function (e) {
                const r = btn.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width / 2);
                const dy = e.clientY - (r.top + r.height / 2);
                btn.style.transform = 'translate(' + (dx * strength).toFixed(1) + 'px,' + (dy * strength * 1.4).toFixed(1) + 'px)';
            });
            btn.addEventListener('pointerleave', function () {
                btn.style.transform = '';
            });
        });
    }

    // -----------------------------------------------------------------
    // MARQUEE (logotypy klientów) – druga kopia listy dla płynnej pętli
    // -----------------------------------------------------------------
    document.querySelectorAll('[data-marquee]').forEach(function (marquee) {
        const track = marquee.querySelector('.marquee-track');
        if (!track) return;
        const clone = track.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
        marquee.appendChild(clone);
    });

    // Drugi, odwrócony rząd generowany z pierwszego (bez powielania HTML)
    document.querySelectorAll('[data-marquee-mirror]').forEach(function (target) {
        const source = document.getElementById(target.dataset.marqueeMirror);
        if (!source) return;
        const track = document.createElement('ul');
        track.className = 'marquee-track';
        track.setAttribute('role', 'list');
        const items = Array.from(source.querySelectorAll('.marquee-track:first-child > li'));
        const half = Math.floor(items.length / 2);
        items.slice(half).concat(items.slice(0, half)).reverse().forEach(function (li) {
            track.appendChild(li.cloneNode(true));
        });
        track.querySelectorAll('a').forEach(function (a) { a.setAttribute('tabindex', '-1'); });
        target.appendChild(track);
        const clone = track.cloneNode(true);
        target.appendChild(clone);
    });

    // -----------------------------------------------------------------
    // KOPIOWANIE DO SCHOWKA ([data-copy])
    // -----------------------------------------------------------------
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-copy]');
        if (!btn) return;
        e.preventDefault();
        const text = btn.dataset.copy;
        const done = function () { WJ.toast('Skopiowano: ' + text); };
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        } else {
            fallbackCopy(text);
            done();
        }
    });

    function fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); } catch (err) { /* ignorujemy */ }
        ta.remove();
    }

    // -----------------------------------------------------------------
    // SPIS TREŚCI STRON PRAWNYCH ([data-toc]) + podświetlanie sekcji
    // -----------------------------------------------------------------
    const toc = document.querySelector('[data-toc]');
    const tocContent = document.querySelector('.legal-content');
    if (toc && tocContent) {
        const headings = Array.from(tocContent.querySelectorAll('.legal-block h2'));
        const list = document.createElement('ol');
        const links = headings.map(function (h, i) {
            if (!h.id) h.id = 'sekcja-' + (i + 1);
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#' + h.id;
            a.textContent = h.textContent.replace(/^\d+\.\s*/, '');
            li.appendChild(a);
            list.appendChild(li);
            return a;
        });
        toc.appendChild(list);

        // Aktywna jest ostatnia sekcja, której nagłówek minął 35% wysokości okna
        let tocTicking = false;
        const updateToc = function () {
            tocTicking = false;
            const line = window.innerHeight * 0.35;
            let idx = 0;
            headings.forEach(function (h, i) { if (h.getBoundingClientRect().top < line) idx = i; });
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) idx = headings.length - 1;
            links.forEach(function (l, i) { l.classList.toggle('is-active', i === idx); });
        };
        window.addEventListener('scroll', function () {
            if (!tocTicking) { tocTicking = true; requestAnimationFrame(updateToc); }
        }, { passive: true });
        updateToc();
    }

    // Rok w stopce
    document.querySelectorAll('[data-year]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });

    // -----------------------------------------------------------------
    // BANER COOKIE (RODO). Wybór zapisywany w localStorage; zmiana zgody
    // emituje zdarzenie "wj:consent" (np. mapa na podstronie Kontakt).
    // -----------------------------------------------------------------
    const COOKIE_CONSENT_STORAGE_KEY = 'woojinCookieConsent';

    WJ.getConsent = function () {
        try { return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY); } catch (e) { return null; }
    };

    function initCookieConsentBanner() {
        if (WJ.getConsent()) return;

        const banner = document.createElement('div');
        banner.className = 'cookie-consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-live', 'polite');
        banner.setAttribute('aria-labelledby', 'cookieConsentTitle');
        banner.innerHTML =
            '<p class="cookie-consent-title" id="cookieConsentTitle">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a4 4 0 0 0 4.8 4.8 4 4 0 0 0 5 5z"/><circle cx="8.5" cy="11.5" r="1"/><circle cx="12.5" cy="16" r="1"/><circle cx="16.5" cy="13.5" r=".6"/></svg>' +
                'Szanujemy Twoją prywatność' +
            '</p>' +
            '<p class="cookie-consent-text">' +
                'Korzystamy z plików cookie, aby strona działała prawidłowo oraz aby lepiej dopasować ją do potrzeb odwiedzających. ' +
                'Możesz zaakceptować wszystkie pliki cookie albo odrzucić te, które nie są niezbędne. ' +
                'Szczegóły w <a href="cookies.html">Polityce plików cookie</a>.' +
            '</p>' +
            '<div class="cookie-consent-actions">' +
                '<button type="button" class="btn btn--glass btn--sm cookie-consent-reject">Odrzuć niewymagane</button>' +
                '<button type="button" class="btn btn--primary btn--sm cookie-consent-accept">Akceptuj wszystkie</button>' +
            '</div>';

        document.body.appendChild(banner);
        setTimeout(function () { banner.classList.add('is-visible'); }, 900);

        function saveConsentAndHide(value) {
            try { window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value); } catch (e) { /* brak localStorage */ }
            banner.classList.remove('is-visible');
            document.dispatchEvent(new CustomEvent('wj:consent', { detail: value }));
            setTimeout(function () { banner.remove(); }, 500);
        }

        banner.querySelector('.cookie-consent-accept').addEventListener('click', function () { saveConsentAndHide('accepted'); });
        banner.querySelector('.cookie-consent-reject').addEventListener('click', function () { saveConsentAndHide('rejected'); });
    }

    initCookieConsentBanner();

    // Przycisk "Zmień ustawienia plików cookie" (Polityka cookie)
    document.querySelectorAll('[data-cookie-reset]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            try { window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY); } catch (e) { /* brak localStorage */ }
            if (!document.querySelector('.cookie-consent-banner')) initCookieConsentBanner();
        });
    });

    // Znacznik gotowości - wyłącza awaryjne pokazanie treści (patrz <head>)
    root.classList.add('wj-ready');
    WJ.ready = true;
})();

// =====================================================================
// OCHRONA PRZED BOTAMI: przycisk "Nie jestem robotem" + pole honeypot.
// Funkcje globalne - używane przez js/contact.js i js/configurator.js.
// =====================================================================
function initHumanCheckButton(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    btn.addEventListener('click', function () {
        const isVerified = btn.getAttribute('aria-pressed') === 'true';
        btn.setAttribute('aria-pressed', isVerified ? 'false' : 'true');
    });
}

function isHumanCheckVerified(buttonId) {
    const btn = document.getElementById(buttonId);
    return !!btn && btn.getAttribute('aria-pressed') === 'true';
}

function isHoneypotFilled(fieldId) {
    const field = document.getElementById(fieldId);
    return !!field && field.value.trim() !== '';
}

initHumanCheckButton('humanCheckBtnContact');
initHumanCheckButton('humanCheckBtnConfig');
