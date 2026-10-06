// =====================================================================
// PORÓWNANIE WTRYSKAREK (konfigurator.html)
// Okno z tabelą parametrów do COMPARE_MAX maszyn - z tej samej serii albo
// z różnych typów. Kolumny to trójki { type, modelName, unitStr }
// (compareItems w js/configurator.js), więc można porównać zarówno maszyny
// z konfiguracji, jak i dowolne inne modele z katalogu. Wartości pochodzą
// z tych samych danych i wierszy co pełna specyfikacja w Kroku 2
// (TECH_SPEC_ROWS) - zawsze w obrębie typu danej kolumny, więc dane
// różnych serii się nie mieszają.
// =====================================================================

let compareLastFocus = null;
let compareNoticeText = '';
let compareDiffOnly = false;
let compareSelectType = null;

// "Dodaj do porównania" / "W porównaniu" na karcie maszyny w Kroku 2
function toggleCompareMachine(uid) {
    const m = getMachine(uid);
    if (!m) return;
    const idx = compareItems.findIndex(c => c.type === m.type && c.modelName === m.modelName && c.unitStr === m.unitStr);
    if (idx !== -1) {
        compareItems.splice(idx, 1);
        onCompareChanged();
        return;
    }
    if (compareItems.length >= COMPARE_MAX) {
        compareNoticeText = `Porównać można maksymalnie ${COMPARE_MAX} maszyny. Usuń jedną z kolumn, aby dodać ${m.modelName}.`;
        openCompare();
        return;
    }
    compareItems.push({ type: m.type, modelName: m.modelName, unitStr: m.unitStr });
    onCompareChanged();
}

function isCompareItemInConfig(item) {
    return cfgMachines.some(m => m.type === item.type && m.modelName === item.modelName && m.unitStr === item.unitStr);
}

// Okno tworzone raz, przy pierwszym otwarciu, bezpośrednio w <body>
function ensureCompareModal() {
    let modal = document.getElementById('cfgCompare');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'cfg-compare';
    modal.id = 'cfgCompare';
    modal.hidden = true;
    modal.innerHTML = `
        <div class="cfg-compare-backdrop" data-compare-close></div>
        <div class="cfg-compare-panel" role="dialog" aria-modal="true" aria-labelledby="cfgCompareTitle">
            <div class="cfg-compare-head">
                <div>
                    <p class="cfg-compare-eyebrow">Konfigurator · porównanie</p>
                    <h2 class="cfg-compare-title" id="cfgCompareTitle">Porównanie wtryskarek</h2>
                </div>
                <button type="button" class="cfg-compare-close" data-compare-close aria-label="Zamknij porównanie">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                </button>
            </div>
            <div class="cfg-compare-toolbar">
                <button type="button" class="cfg-compare-add-toggle" aria-expanded="false" aria-controls="cmpAddGroup">+ Dodaj maszynę do porównania</button>
                <div class="cfg-compare-add" id="cmpAddGroup" role="group" aria-label="Dodaj maszynę do porównania">
                    <label class="cfg-compare-field"><span>Typ</span><select id="cmpType"></select></label>
                    <label class="cfg-compare-field"><span>Model</span><select id="cmpModel"></select></label>
                    <label class="cfg-compare-field"><span>Agregat wtryskowy</span><select id="cmpUnit"></select></label>
                    <button type="button" class="cfg-compare-add-btn" id="cmpAddBtn">+ Dodaj do porównania</button>
                </div>
                <label class="cfg-compare-diff"><input type="checkbox" id="cmpDiffOnly"> Pokaż tylko różnice</label>
            </div>
            <p class="cfg-compare-notice" id="cmpNotice" role="status" hidden></p>
            <div class="cfg-compare-body" id="cmpBody"></div>
            <p class="cfg-compare-foot">Dane wg katalogów producenta WOOJIN PLAIMM, w obrębie typu każdej maszyny. Porównać można do ${COMPARE_MAX} maszyn — z tej samej serii albo różnych typów. Podświetlone wiersze różnią się między maszynami; „—” oznacza parametr, którego dana seria nie ma.</p>
        </div>`;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target.closest('[data-compare-close]')) { closeCompare(); return; }
        const removeBtn = e.target.closest('[data-compare-remove]');
        if (removeBtn) { removeCompareItem(parseInt(removeBtn.dataset.compareRemove, 10)); return; }
        const addBtn = e.target.closest('[data-compare-add-config]');
        if (addBtn) addCompareItemToConfig(parseInt(addBtn.dataset.compareAddConfig, 10));
    });

    // Esc zamyka okno, Tab nie wychodzi poza nie
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { e.preventDefault(); closeCompare(); return; }
        if (e.key !== 'Tab') return;
        const focusables = Array.from(modal.querySelectorAll('button, select, input, [href]')).filter(el => !el.disabled && el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Telefon: pola dodawania maszyny schowane pod przyciskiem (patrz CSS),
    // żeby tabela miała jak najwięcej miejsca
    modal.querySelector('.cfg-compare-add-toggle').addEventListener('click', (e) => {
        const toolbar = modal.querySelector('.cfg-compare-toolbar');
        const open = toolbar.classList.toggle('is-adding');
        e.currentTarget.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    modal.querySelector('#cmpType').addEventListener('change', (e) => {
        compareSelectType = e.target.value;
        fillCompareModelSelect();
    });
    modal.querySelector('#cmpModel').addEventListener('change', () => {
        fillCompareUnitSelect();
    });
    modal.querySelector('#cmpUnit').addEventListener('change', updateCompareAddButton);
    modal.querySelector('#cmpAddBtn').addEventListener('click', addCompareItemFromSelects);
    modal.querySelector('#cmpDiffOnly').addEventListener('change', (e) => {
        compareDiffOnly = e.target.checked;
        renderCompareTable();
    });

    return modal;
}

// -------------------- Wybór maszyny do dodania (typ -> model -> agregat) --------------------

function fillCompareTypeSelect() {
    const sel = document.getElementById('cmpType');
    if (!sel) return;
    if (!machineData[compareSelectType]) compareSelectType = selectedMachineType;
    sel.innerHTML = Object.keys(machineData).map(type =>
        `<option value="${type}"${type === compareSelectType ? ' selected' : ''}>${getTypeLabel(type)}</option>`).join('');
    fillCompareModelSelect();
}

function fillCompareModelSelect() {
    const sel = document.getElementById('cmpModel');
    const typeData = machineData[compareSelectType];
    if (!sel || !typeData) return;
    sel.innerHTML = typeData.models.map(m => `<option value="${m.name}">${m.name} — ${m.force} t</option>`).join('');
    fillCompareUnitSelect();
}

function fillCompareUnitSelect() {
    const sel = document.getElementById('cmpUnit');
    const modelSel = document.getElementById('cmpModel');
    const model = modelSel && findModel(compareSelectType, modelSel.value);
    if (!sel || !model) return;
    sel.innerHTML = model.units.map(u => `<option value="${u}">${formatStep2AgregatLabel(u)} (Ø${getScrewDiameter(u)})</option>`).join('');
    updateCompareAddButton();
}

function getCompareSelection() {
    const modelSel = document.getElementById('cmpModel');
    const unitSel = document.getElementById('cmpUnit');
    if (!modelSel || !unitSel) return null;
    const item = { type: compareSelectType, modelName: modelSel.value, unitStr: unitSel.value };
    return isValidCompareItem(item) ? item : null;
}

function updateCompareAddButton() {
    const btn = document.getElementById('cmpAddBtn');
    if (!btn) return;
    const item = getCompareSelection();
    const full = compareItems.length >= COMPARE_MAX;
    const present = item && isInCompare(item.type, item.modelName, item.unitStr);
    btn.disabled = !item || full || present;
    btn.textContent = present ? 'Już w porównaniu' : full ? `Maks. ${COMPARE_MAX} maszyny` : '+ Dodaj do porównania';
}

function addCompareItemFromSelects() {
    const item = getCompareSelection();
    if (!item || compareItems.length >= COMPARE_MAX || isInCompare(item.type, item.modelName, item.unitStr)) return;
    compareItems.push(item);
    compareNoticeText = '';
    onCompareChanged();
    renderCompare();
}

function removeCompareItem(index) {
    if (!compareItems[index]) return;
    compareItems.splice(index, 1);
    compareNoticeText = '';
    onCompareChanged();
    renderCompare();
    const close = document.querySelector('#cfgCompare .cfg-compare-close');
    if (close) close.focus();
}

// "+ Do konfiguracji" przy kolumnie maszyny spoza konfiguracji - dodaje ją
// (z jej własnym typem) tak, jak wybór z listy w Kroku 2
function addCompareItemToConfig(index) {
    const item = compareItems[index];
    if (!item || !isValidCompareItem(item) || isCompareItemInConfig(item)) return;
    cfgMachines.push(createMachine(item.type, item.modelName, item.unitStr, 'list'));
    if (currentStep === 2) renderStep2Specs();
    if (currentStep === 3) populateStep3();
    if (currentStep === 4) populateStep4Summary();
    onConfigurationChanged();
    renderCompare();
}

// -------------------- Otwieranie / zamykanie i tabela --------------------

function openCompare() {
    // Pierwsze otwarcie bez wybranych kolumn: maszyny z konfiguracji (maks. COMPARE_MAX)
    if (!compareItems.length) {
        getConfiguredMachines().forEach(m => {
            if (compareItems.length < COMPARE_MAX && !isInCompare(m.type, m.modelName, m.unitStr)) {
                compareItems.push({ type: m.type, modelName: m.modelName, unitStr: m.unitStr });
            }
        });
        if (compareItems.length) onCompareChanged();
    }

    const modal = ensureCompareModal();
    if (modal.hidden) compareLastFocus = document.activeElement;
    if (!compareSelectType) compareSelectType = selectedMachineType;
    fillCompareTypeSelect();
    renderCompare();

    modal.hidden = false;
    document.documentElement.classList.add('cfg-modal-open');
    requestAnimationFrame(() => modal.classList.add('is-open'));
    const closeBtn = modal.querySelector('.cfg-compare-close');
    if (closeBtn) closeBtn.focus();
}

function closeCompare() {
    const modal = document.getElementById('cfgCompare');
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-open');
    modal.hidden = true;
    document.documentElement.classList.remove('cfg-modal-open');
    compareNoticeText = '';
    if (compareLastFocus && compareLastFocus.isConnected) compareLastFocus.focus();
    compareLastFocus = null;
}

function renderCompare() {
    const notice = document.getElementById('cmpNotice');
    if (notice) {
        notice.textContent = compareNoticeText;
        notice.hidden = !compareNoticeText;
    }
    const diffToggle = document.getElementById('cmpDiffOnly');
    if (diffToggle) diffToggle.checked = compareDiffOnly;
    updateCompareAddButton();
    renderCompareTable();
}

function renderCompareTable() {
    const body = document.getElementById('cmpBody');
    if (!body) return;

    const items = compareItems.filter(isValidCompareItem);
    if (!items.length) {
        body.innerHTML = `
            <div class="cfg-compare-empty">
                <p><strong>Brak maszyn do porównania.</strong></p>
                <p>Wybierz powyżej typ, model i agregat wtryskowy, a następnie kliknij „Dodaj do porównania”. Możesz zestawić maszyny z tej samej serii albo różnych typów.</p>
            </div>`;
        return;
    }

    const headCells = items.map((it, i) => {
        const inConfig = isCompareItemInConfig(it);
        return `
            <th scope="col" class="cfg-compare-col">
                <span class="cfg-type-badge">${it.type}</span>
                <strong class="cfg-compare-model">${it.modelName}</strong>
                <span class="cfg-compare-unit">${formatStep2AgregatLabel(it.unitStr)} · Ø${getScrewDiameter(it.unitStr)}</span>
                <span class="cfg-compare-col-actions">
                    ${inConfig
                        ? '<span class="cfg-compare-in-config">✓ W konfiguracji</span>'
                        : `<button type="button" class="cfg-compare-mini" data-compare-add-config="${i}">+ Do konfiguracji</button>`}
                    <button type="button" class="cfg-compare-mini cfg-compare-mini--remove" data-compare-remove="${i}" aria-label="Usuń ${it.modelName} z porównania">Usuń</button>
                </span>
            </th>`;
    }).join('');

    const valueRow = (label, values) => {
        const shown = values.map(v => (v == null ? '—' : v));
        const differs = items.length > 1 && new Set(shown).size > 1;
        return `
            <tr class="cfg-compare-row${differs ? ' is-diff' : ''}">
                <th scope="row">${label}</th>
                ${shown.map(v => `<td${v === '—' ? ' class="is-empty"' : ''}>${v}</td>`).join('')}
            </tr>`;
    };

    let rowsHtml = valueRow('Typ wtryskarki', items.map(it => getTypeLabel(it.type)));
    TECH_SPEC_SECTIONS.forEach(([section, title]) => {
        const sectionRows = TECH_SPEC_ROWS
            .filter(row => row.section === section)
            .map(row => ({ row, values: items.map(it => getTechRowValue(row, it.type, it.modelName, it.unitStr)) }))
            .filter(({ values }) => values.some(v => v != null));
        if (!sectionRows.length) return;
        rowsHtml += `
            <tr class="cfg-compare-section"><th scope="rowgroup" colspan="${items.length + 1}"><span>${title}</span></th></tr>
            ${sectionRows.map(({ row, values }) => valueRow(row.label, values)).join('')}`;
    });

    body.innerHTML = `
        <table class="cfg-compare-table${compareDiffOnly ? ' is-diff-only' : ''}" style="--cmp-cols:${items.length}">
            <thead>
                <tr>
                    <th scope="col" class="cfg-compare-corner">Parametr</th>
                    ${headCells}
                </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
        </table>`;

    // Sekcje bez żadnej różnicy znikają w trybie "tylko różnice"
    if (compareDiffOnly) {
        body.querySelectorAll('.cfg-compare-section').forEach(sectionRow => {
            let next = sectionRow.nextElementSibling;
            let hasDiff = false;
            while (next && !next.classList.contains('cfg-compare-section')) {
                if (next.classList.contains('is-diff')) hasDiff = true;
                next = next.nextElementSibling;
            }
            sectionRow.hidden = !hasDiff;
        });
        if (!body.querySelector('.cfg-compare-row.is-diff')) {
            body.insertAdjacentHTML('beforeend', `<p class="cfg-compare-empty-diff">${items.length > 1 ? 'Wybrane maszyny nie różnią się w żadnym parametrze.' : 'Dodaj co najmniej dwie maszyny, aby zobaczyć różnice.'}</p>`);
        }
    }
}
