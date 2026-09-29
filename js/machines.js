// =====================================================================
// PODSTRONA "MASZYNY" – widok 360° + podzespoły wybranej serii
// Sekwencja 37 klatek na typ wtryskarki (img/<folder>/1.jpg ... 37.jpg),
// sterowana suwakiem, przeciąganiem, klawiaturą oraz zakładkami typów.
// Typ można wybrać także z adresu, np. maszyny.html#TE-A5 (linki z kart
// serii na stronie głównej).
// =====================================================================

(function initViewer360() {
    const stage = document.getElementById('viewer360Stage');
    const imageEl = document.getElementById('viewer360Image');
    const slider = document.getElementById('viewer360Slider');
    const prevBtn = document.getElementById('viewer360Prev');
    const nextBtn = document.getElementById('viewer360Next');
    const typeList = document.getElementById('machineTypeList');
    const typeItems = Array.from(document.querySelectorAll('.machine-type-item'));
    const indicator = typeList ? typeList.querySelector('.type-indicator') : null;
    const metaBox = document.getElementById('machineMeta');
    const metaModel = document.getElementById('machineMetaModel');
    const metaDesc = document.getElementById('machineMetaDesc');
    const magnifier = document.getElementById('viewer360Magnifier');

    if (!stage || !imageEl || !slider) return;

    const TOTAL_FRAMES = 37;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // folder z klatkami, nazwa/opis modelu; available: false = brak zdjęć 360°
    const MACHINE_TYPES = [
        { name: 'DL-A5',      folder: '360-DL',    available: true,  model: 'DL-A5',             desc: 'Wysokiej klasy dwupłytowa seria z systemem bezpośredniego ryglowania (Dual Lock)' },
        { name: 'TH-A5',      folder: '360-TH',    available: true,  model: 'TH-A5',             desc: 'Wysokiej klasy nowa seria hybrydowa z układem kolankowym' },
        { name: 'TE-A5',      folder: '360-TE',    available: true,  model: 'TE-A5',             desc: 'Wysokiej klasy nowa, w pełni elektryczna seria z układem kolankowym' },
        { name: 'TL-A5',      folder: '360-TL',    available: false, model: 'TL-A5',             desc: 'Wtryskarka bez kolumn (tie-bar-less) – pełna swoboda doboru wielkości formy' },
        { name: 'VHA-RS',     folder: '360-VH',    available: true,  model: 'VHA-RS',            desc: 'Wysokiej klasy, pionowa seria wtryskarek' },
        { name: 'MULTI',      folder: '360-MULTI', available: true,  model: 'NC-G5',             desc: 'Nowoczesna, pozioma, dwukolorowa seria hybrydowa' },
        { name: 'Super-Foam', folder: '360-SF',    available: true,  model: 'DL-A5 (Super-Foam)', desc: 'Wysokiej klasy seria z technologią super spieniania i bezpośrednim ryglowaniem' }
    ];

    let currentTypeIndex = 0;
    let currentFrame = 1;
    const preloadedFolders = {};

    const framePath = (typeIndex, frameIndex) => `img/${MACHINE_TYPES[typeIndex].folder}/${frameIndex}.jpg`;

    function preloadType(typeIndex) {
        const type = MACHINE_TYPES[typeIndex];
        if (!type.available || preloadedFolders[type.folder]) return;
        preloadedFolders[type.folder] = [];
        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            img.decoding = 'async';
            img.src = framePath(typeIndex, i);
            preloadedFolders[type.folder].push(img);
        }
    }

    function updateSliderFill() {
        const p = (currentFrame - 1) / (TOTAL_FRAMES - 1);
        slider.style.setProperty('--fill', (p * 100).toFixed(2) + '%');
    }

    function setFrame(frameIndex) {
        if (!MACHINE_TYPES[currentTypeIndex].available) return;
        const f = ((frameIndex - 1) % TOTAL_FRAMES + TOTAL_FRAMES) % TOTAL_FRAMES + 1;
        currentFrame = f;
        imageEl.src = framePath(currentTypeIndex, f);
        slider.value = f;
        updateSliderFill();
    }

    // Wskaźnik aktywnej zakładki (przesuwane "tło" pod nazwą typu)
    function moveIndicator() {
        if (!indicator) return;
        const active = typeItems[currentTypeIndex];
        if (!active) return;
        indicator.style.width = active.offsetWidth + 'px';
        indicator.style.transform = `translateX(${active.offsetLeft}px)`;
    }

    // Sekcje podzespołów i opis serii przypisane atrybutem data-machine-type
    const componentsSection = document.getElementById('componentsSection');
    const componentItems = Array.from(document.querySelectorAll('.component-item'));
    const machineDescPanels = Array.from(document.querySelectorAll('.machine-description-panel'));
    const componentsTitle = document.getElementById('componentsSeries');
    const componentsHead = document.getElementById('componentsHead');

    function updateComponentsForType(type) {
        let hasComponents = false;
        let hasDesc = false;
        componentItems.forEach((item) => {
            const matches = item.dataset.machineType === type.name;
            item.classList.toggle('is-hidden-type', !matches);
            if (matches) hasComponents = true;
        });
        machineDescPanels.forEach((panel) => {
            const matches = panel.dataset.machineType === type.name;
            panel.classList.toggle('is-hidden-type', !matches);
            if (matches) hasDesc = true;
        });
        if (componentsTitle) componentsTitle.textContent = type.model;
        if (componentsHead) componentsHead.hidden = !hasComponents;
        if (componentsSection) componentsSection.hidden = !hasComponents && !hasDesc;
    }

    let introSpinDone = false;
    let spinTimer = null;

    function stopSpin() {
        if (spinTimer) { clearInterval(spinTimer); spinTimer = null; }
    }

    function setMachineType(typeIndex, opts) {
        opts = opts || {};
        stopSpin();
        currentTypeIndex = ((typeIndex % MACHINE_TYPES.length) + MACHINE_TYPES.length) % MACHINE_TYPES.length;
        const type = MACHINE_TYPES[currentTypeIndex];

        typeItems.forEach((item, i) => {
            const active = i === currentTypeIndex;
            item.classList.toggle('active', active);
            item.classList.toggle('is-unavailable', !MACHINE_TYPES[i].available);
            item.setAttribute('aria-selected', active ? 'true' : 'false');
            item.tabIndex = active ? 0 : -1;
        });
        moveIndicator();
        const activeTab = typeItems[currentTypeIndex];
        if (activeTab && typeList && typeList.scrollWidth > typeList.clientWidth) {
            typeList.scrollTo({ left: activeTab.offsetLeft - typeList.clientWidth / 2 + activeTab.offsetWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
        }

        // Obraz startuje nieco większy i płynnie wraca do skali 1
        if (!reduceMotion) {
            imageEl.style.transition = 'none';
            imageEl.style.transform = 'scale(1.12)';
            imageEl.style.opacity = '0.2';
            void imageEl.offsetWidth;
            imageEl.style.transition = '';
            imageEl.style.transform = '';
            imageEl.style.opacity = '';
        }

        if (metaBox && metaModel && metaDesc) {
            metaModel.textContent = type.model;
            metaDesc.textContent = type.desc || '';
            metaBox.classList.remove('is-switching');
            void metaBox.offsetWidth;
            metaBox.classList.add('is-switching');
        }

        updateComponentsForType(type);

        if (type.available) {
            stage.classList.remove('is-unavailable');
            slider.disabled = false;
            preloadType(currentTypeIndex);
            setFrame(1);
        } else {
            stage.classList.add('is-unavailable');
            slider.disabled = true;
            if (magnifier) magnifier.classList.remove('is-active');
        }

        if (opts.updateHash !== false && history.replaceState) {
            history.replaceState(null, '', '#' + type.name);
        }
    }

    typeItems.forEach((item) => {
        item.addEventListener('click', () => setMachineType(parseInt(item.dataset.index, 10)));
    });

    // Klawiatura w liście zakładek (strzałki lewo/prawo)
    if (typeList) {
        typeList.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            e.preventDefault();
            setMachineType(currentTypeIndex + (e.key === 'ArrowRight' ? 1 : -1));
            typeItems[currentTypeIndex].focus();
        });
    }

    if (prevBtn) prevBtn.addEventListener('click', () => setMachineType(currentTypeIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => setMachineType(currentTypeIndex + 1));

    slider.addEventListener('input', () => {
        stopSpin();
        setFrame(parseInt(slider.value, 10));
        triggerHapticFeedback(8);
    });

    // Obracanie przeciąganiem (Pointer Events: mysz, dotyk, pióro)
    let isDragging = false;
    let startX = 0;
    let startFrame = 1;
    const DRAG_SENSITIVITY = 6; // px na jedną klatkę

    stage.addEventListener('pointerdown', (e) => {
        if (!MACHINE_TYPES[currentTypeIndex].available) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        stopSpin();
        isDragging = true;
        startX = e.clientX;
        startFrame = currentFrame;
        stage.classList.add('is-dragging');
        if (e.pointerType === 'mouse') {
            try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignorujemy */ }
        }
    });

    stage.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const frameDelta = Math.round((e.clientX - startX) / DRAG_SENSITIVITY);
        const target = startFrame - frameDelta;
        const normalized = ((target - 1) % TOTAL_FRAMES + TOTAL_FRAMES) % TOTAL_FRAMES + 1;
        if (normalized !== currentFrame) {
            triggerHapticFeedback(8);
            setFrame(normalized);
        }
    });

    const endDrag = () => {
        isDragging = false;
        stage.classList.remove('is-dragging');
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('lostpointercapture', endDrag);

    // Klawiatura na samym widoku
    stage.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') setFrame(currentFrame - 1);
        else if (e.key === 'ArrowRight') setFrame(currentFrame + 1);
        else return;
        stopSpin();
        e.preventDefault();
    });

    // ---- Lupa (tylko urządzenia z myszką) ----
    const supportsHoverMagnifier = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (magnifier && supportsHoverMagnifier) {
        const MAGNIFIER_ZOOM = 2.2;
        let raf = null;
        let lastEvent = null;

        const updateMagnifier = () => {
            raf = null;
            const e = lastEvent;
            if (!e || !MACHINE_TYPES[currentTypeIndex].available || isDragging) {
                magnifier.classList.remove('is-active');
                return;
            }
            const rect = stage.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const half = (magnifier.offsetWidth || 180) / 2;
            magnifier.style.transform = `translate(${x - half}px, ${y - half}px)`;
            magnifier.style.backgroundImage = `url("${imageEl.currentSrc || imageEl.src}")`;
            magnifier.style.backgroundSize = `${rect.width * MAGNIFIER_ZOOM}px ${rect.height * MAGNIFIER_ZOOM}px`;
            magnifier.style.backgroundPosition = `${-(x * MAGNIFIER_ZOOM - half)}px ${-(y * MAGNIFIER_ZOOM - half)}px`;
            magnifier.classList.add('is-active');
        };

        stage.addEventListener('pointermove', (e) => {
            if (e.pointerType !== 'mouse') return;
            lastEvent = e;
            if (!raf) raf = requestAnimationFrame(updateMagnifier);
        });
        stage.addEventListener('pointerleave', () => {
            lastEvent = null;
            magnifier.classList.remove('is-active');
        });
    }

    // Jednorazowy obrót "na powitanie", gdy widok pierwszy raz pojawi się na ekranie
    function introSpin() {
        if (introSpinDone || reduceMotion || !MACHINE_TYPES[currentTypeIndex].available) return;
        introSpinDone = true;
        let steps = 0;
        spinTimer = setInterval(() => {
            steps++;
            setFrame(currentFrame + 1);
            if (steps >= TOTAL_FRAMES) stopSpin();
        }, 55);
    }

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                const imgs = preloadedFolders[MACHINE_TYPES[currentTypeIndex].folder] || [];
                Promise.all(imgs.map((im) => (im.decode ? im.decode().catch(() => null) : null)))
                    .then(() => setTimeout(introSpin, 300));
                io.disconnect();
            }
        }, { threshold: 0.6 });
        io.observe(stage);
    }

    window.addEventListener('resize', moveIndicator, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);

    // Start: typ z adresu (#TE-A5) albo pierwszy na liście
    const hashName = decodeURIComponent((location.hash || '').slice(1)).toLowerCase();
    const fromHash = MACHINE_TYPES.findIndex((t) => t.name.toLowerCase() === hashName);
    setMachineType(fromHash >= 0 ? fromHash : 0, { updateHash: false });

    window.addEventListener('hashchange', () => {
        const name = decodeURIComponent(location.hash.slice(1)).toLowerCase();
        const idx = MACHINE_TYPES.findIndex((t) => t.name.toLowerCase() === name);
        if (idx >= 0 && idx !== currentTypeIndex) setMachineType(idx, { updateHash: false });
    });
})();

// =====================================================================
// PODZESPOŁY – "wysuwanie się od spodu" przy przewijaniu
// =====================================================================
(function initComponentsReveal() {
    const items = document.querySelectorAll('.component-item');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach((item) => item.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.filter((entry) => entry.isIntersecting).forEach((entry, i) => {
            entry.target.style.transitionDelay = `${Math.min(i * 90, 270)}ms`;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach((item) => observer.observe(item));
})();
