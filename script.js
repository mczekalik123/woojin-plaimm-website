// =====================================================================
// WIBRACJA (HAPTYKA) NA URZĄDZENIACH MOBILNYCH
// Krótkie wibracje przy interakcjach: naciśnięcie przycisku (na każdej
// podstronie - ten plik jest wspólny dla całego serwisu), zaznaczenie
// (dodanie) opcji dodatkowej w Kroku 3 konfiguratora oraz przesuwanie
// paska widoku 360° (patrz initViewer360 / initConfiguratorViewer360
// niżej). Działa wyłącznie na urządzeniach dotykowych - na komputerze
// z myszką wibracja i tak nie miałaby żadnego efektu. Tam, gdzie
// przeglądarka w ogóle nie obsługuje Vibration API (np. iPhone/Safari,
// które nie wspiera go wcale), funkcja po prostu nic nie robi, bez
// żadnego błędu - stąd "jeśli to możliwe" w treści prośby klienta.
function triggerHapticFeedback(durationMs) {
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    if (!('vibrate' in navigator)) return;
    try {
        navigator.vibrate(durationMs);
    } catch (e) {
        // Ignorujemy - część przeglądarek może zgłosić wyjątek mimo
        // formalnej obecności API (np. gdy strona nie jest aktywną kartą).
    }
}

// Delegowany nasłuchiwacz na całym dokumencie zamiast podpinania go
// osobno pod każdy przycisk z osobna - obejmuje automatycznie wszystkie
// przyciski nawigacji, kroków konfiguratora, pobierania katalogów/PDF,
// wysyłki formularzy itd. na każdej podstronie serwisu. ".main-nav a"
// obejmuje też linki rozwijanego menu (ikonka hamburgera na telefonie):
// O NAS, MASZYNY, KONFIGURATOR, KARIERA, KONTAKT oraz WOOJIN GLOBAL.
document.addEventListener('click', function (e) {
    const target = e.target.closest('button, a.apply-btn, a.catalog-row, a.catalog-dl-btn, .main-nav a');
    if (target) triggerHapticFeedback(10);
});

// =====================================================================
// BANER COOKIE (RODO) - WYŚWIETLANY PRZY PIERWSZYM WEJŚCIU NA STRONĘ
// Plik jest wspólny dla całego serwisu, więc baner pojawia się identycznie
// na każdej podstronie. Wybór użytkownika (akceptacja / odrzucenie
// niewymaganych plików cookie) jest zapisywany w localStorage, dzięki
// czemu baner pokazuje się tylko przy pierwszej wizycie - do czasu, gdy
// użytkownik sam wyczyści dane przeglądarki. Szczegóły dotyczące
// wykorzystywanych plików cookie znajdują się na podstronie cookies.html.
// =====================================================================
const COOKIE_CONSENT_STORAGE_KEY = 'woojinCookieConsent';

function initCookieConsentBanner() {
    let storedConsent = null;
    try {
        storedConsent = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    } catch (e) {
        // Prywatne okno przeglądarki / zablokowany localStorage - baner
        // pojawi się przy każdej wizycie, ale strona ma działać bez błędów.
    }
    if (storedConsent) return;

    const banner = document.createElement('div');
    banner.className = 'cookie-consent-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Ustawienia plików cookie');
    banner.innerHTML =
        '<div class="cookie-consent-inner">' +
            '<p class="cookie-consent-text">' +
                'Korzystamy z plików cookie, aby strona działała prawidłowo oraz aby lepiej dopasować ją do potrzeb odwiedzających. ' +
                'Możesz zaakceptować wszystkie pliki cookie albo odrzucić te, które nie są niezbędne do działania serwisu. ' +
                'Więcej informacji znajdziesz w <a href="cookies.html">Polityce plików cookie</a>.' +
            '</p>' +
            '<div class="cookie-consent-actions">' +
                '<button type="button" class="cookie-consent-btn cookie-consent-reject">Odrzuć niewymagane</button>' +
                '<button type="button" class="cookie-consent-btn cookie-consent-accept">Akceptuj wszystkie</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(banner);

    // Wymuszenie odczytu stylu przed dodaniem klasy "is-visible", aby
    // przejście (transition) wjazdu banera z dołu ekranu faktycznie się odtworzyło.
    requestAnimationFrame(function () {
        banner.classList.add('is-visible');
    });

    function saveConsentAndHide(value) {
        try {
            window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
        } catch (e) {
            // Brak dostępu do localStorage - baner po prostu zniknie do końca bieżącej wizyty.
        }
        banner.classList.remove('is-visible');
        window.setTimeout(function () {
            banner.remove();
        }, 350);
    }

    const acceptBtn = banner.querySelector('.cookie-consent-accept');
    const rejectBtn = banner.querySelector('.cookie-consent-reject');
    if (acceptBtn) acceptBtn.addEventListener('click', function () { saveConsentAndHide('accepted'); });
    if (rejectBtn) rejectBtn.addEventListener('click', function () { saveConsentAndHide('rejected'); });
}

document.addEventListener('DOMContentLoaded', initCookieConsentBanner);

// =====================================================================
// OCHRONA PRZED BOTAMI: PRZYCISK "NIE JESTEM ROBOTEM"
// Prosta, w pełni client-side weryfikacja antyspamowa używana na
// formularzu kontaktowym (kontakt.html) oraz przy wysyłce konfiguracji
// z konfiguratora (konfigurator.html, Krok 4). Przycisk działa jak
// checkbox: kliknięcie przełącza go w stan "potwierdzony" (aria-pressed
// + klasa wizualna), a wysyłka jest blokowana, dopóki użytkownik go nie
// zaznaczy - patrz initContactForm oraz requestSendEmail niżej w tym
// pliku, które wywołują isHumanCheckVerified() przed wysłaniem.
// Dodatkowo każdy z dwóch formularzy ma niewidoczne dla człowieka pole
// "honeypot" (patrz .hp-field-wrap w style.css) - jego wypełnienie
// zdradza prostego bota wypełniającego automatycznie każde pole
// formularza, więc taką wysyłkę odrzucamy po cichu (bez informowania
// bota, że został wykryty).
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

document.addEventListener('DOMContentLoaded', function () {
    initHumanCheckButton('humanCheckBtnContact');
    initHumanCheckButton('humanCheckBtnConfig');
});

document.addEventListener("DOMContentLoaded", function () {

    const section = document.querySelector("#woojinStats");

    const counters = document.querySelectorAll(
        ".woojin-stat-number"
    );

    let animationStarted = false;


    function animateCounter(element, start, end, duration) {

        const startTime = performance.now();


        function update(currentTime) {

            const elapsed = currentTime - startTime;

            const progress = Math.min(
                elapsed / duration,
                1
            );


            /*
             * Ease-in-out (Quad):
             * Na samym początku idzie bardzo powoli, w środku przyspiesza,
             * a pod koniec ponownie łagodnie i powoli zwalnia.
             */
            const easedProgress = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;


            const currentValue = Math.floor(
                start +
                (end - start) *
                easedProgress
            );


            if (progress < 1) {

                /* Podczas odliczania wyświetlamy samą liczbę bez suffixu */
                element.textContent = currentValue.toLocaleString("pl-PL");

                requestAnimationFrame(update);

            } else {

                /* Suffix (+) dodajemy na końcu jako osobny element z animacją pulsowania */
                const hasSuffix = element.dataset.suffix;
                element.textContent = end.toLocaleString("pl-PL");
                
                if (hasSuffix) {
                    element.innerHTML += `<span class="pulse-plus">${hasSuffix}</span>`;
                }

            }
        }


        requestAnimationFrame(update);
    }


    function startAnimations() {

        if (animationStarted) {
            return;
        }

        animationStarted = true;


        /*
         * Uruchomienie animacji CSS dla sekcji.
         */
        if (section) {
            section.classList.add("is-visible");
        }


        /*
         * Uruchomienie liczników z opóźnieniem.
         */
        counters.forEach(function (counter, index) {

            const start = parseInt(counter.dataset.start);
            const end = parseInt(counter.dataset.end);

            setTimeout(function () {

                animateCounter(
                    counter,
                    start,
                    end,
                    5000 // Czas trwania odliczania: 5000 ms (5 sekund)
                );

            }, index * 250); // Opóźnienie startu kolejnych liczników (0.25s)

        });
    }


    /*
     * Obserwator widoczności sekcji w okienku przeglądarki (viewport).
     */
    if (section) {
        const observer = new IntersectionObserver(
            function (entries) {

                entries.forEach(function (entry) {

                    if (entry.isIntersecting) {

                        startAnimations();
                        observer.unobserve(section);
                    }

                });

            },
            {
                threshold: 0.25
            }
        );

        observer.observe(section);
    }

});


// =====================================================================
// KONFIGURATOR DOBORU WTRYSKARKI WOOJIN PLAIMM A5
// Dane techniczne (modele, siły zwarcia, prześwity, agregaty wtryskowe,
// wyposażenie standardowe i opcje) opracowane na podstawie katalogu
// "WOOJIN PLAIMM A5 Series Catalog" oraz materiału "Lista opcji".
// Wzory obliczeniowe oparte na materiale szkoleniowym "Dobór Wtryskarek".
//
// UWAGA DLA WDRAŻAJĄCEGO (Mateusz):
// Aby aktywować wysyłkę e-mail bez pośrednictwa klienta pocztowego,
// należy założyć darmowe konto na https://www.emailjs.com, skonfigurować
// tam "Service" (np. połączony ze skrzynką mczekalik@wjpim.com) oraz
// "Email Template" (treść wklejona z pliku emailjs_szablon.html), a
// następnie podstawić właściwe identyfikatory poniżej, w sekcji
// EMAILJS_CONFIG. Bez tego przycisk "WYŚLIJ KONFIGURACJĘ" pokaże
// czytelny komunikat o braku konfiguracji zamiast realnej wysyłki.
//
// WAŻNE - kopia dla klienta (CC): treść e-maila zawiera zmienną
// {{client_copy_email}} (adres podany przez klienta w formularzu), ale samo
// jej użycie w TREŚCI szablonu nic nie wysyła - to tylko wyświetlana
// informacja. Żeby klient faktycznie dostał kopię, w panelu EmailJS, w
// ustawieniach danego szablonu (zakładka "Settings", nie "Content"), w polu
// "Cc" (lub "Bcc") trzeba wpisać dokładnie: {{client_copy_email}} - dopiero
// to sprawia, że EmailJS realnie wysyła kopię pod ten adres. Pole "To Email"
// w tych samych ustawieniach powinno mieć wartość {{to_email}}.
//
// Zmienne przekazywane teraz do szablonu (patrz confirmSendEmail() poniżej):
// machines_html - gotowy HTML z osobną "kartą" dla KAŻDEJ wybranej
// wtryskarki (model, średnica ślimaka, ilość, jej własne opcje dodatkowe) -
// obsługuje dowolną liczbę maszyn, nie tylko jedną. tech_details_html -
// gotowy HTML z danymi technologicznymi (wymiary formy, materiał, masy,
// wymagana siła zwarcia itd.), albo krótką informacją o wyborze z listy,
// gdy dane technologiczne nie zostały wprowadzone - dokładnie to samo, co
// widać w Kroku 4 na stronie. Aby zmiany w wyglądzie tych fragmentów były
// widoczne w e-mailu, edytuje się je w script.js (funkcje
// buildMachineEmailCardHtml i buildTechDetailsEmailHtml), a NIE w treści
// szablonu w panelu EmailJS - tam wystarczy, że w odpowiednim miejscu
// zostają tokeny {{{machines_html}}} i {{{tech_details_html}}} (patrz
// emailjs_szablon.html). WAŻNE: koniecznie POTRÓJNE nawiasy klamrowe
// {{{ }}}, nie zwykłe {{ }} - EmailJS domyślnie eskejpuje HTML w zwykłych
// {{ }} (podobnie jak Handlebars), więc zamiast wyrenderowanych "kart" w
// mailu pojawiłby się surowy kod HTML jako zwykły tekst.
// =====================================================================

const EMAILJS_CONFIG = {
    publicKey: 'byBOR_lP37-lDcIkR',
    serviceId: 'service_z0egkga',
    templateId: 'template_5b1i1p7',
    recipient: 'mczekalik@wjpim.com'
};

if (window.emailjs && EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.publicKey.indexOf('YOUR_') !== 0) {
    try { emailjs.init({ publicKey: EMAILJS_CONFIG.publicKey }); } catch (e) { /* biblioteka niedostępna offline - ignorujemy */ }
}

// Gęstości popularnych tworzyw sztucznych [g/cm3] - wartości robocze
// wg tablicy gęstości tworzyw sztucznych (kalkulatorxxl.pl)
const materialsData = [
    { code: 'PP', label: 'PP – polipropylen', density: 0.90 },
    { code: 'PE-LD', label: 'PE-LD / LDPE – polietylen małej gęstości', density: 0.92 },
    { code: 'LLDPE', label: 'LLDPE – liniowy polietylen małej gęstości', density: 0.93 },
    { code: 'PE-HD', label: 'PE-HD / HDPE – polietylen dużej gęstości', density: 0.95 },
    { code: 'PE-UHMW', label: 'PE-UHMW – polietylen ultrawysokocząsteczkowy', density: 0.93 },
    { code: 'PS', label: 'PS – polistyren', density: 1.05 },
    { code: 'HIPS', label: 'HIPS – polistyren wysokoudarowy', density: 1.04 },
    { code: 'ABS', label: 'ABS – akrylonitryl-butadien-styren', density: 1.05 },
    { code: 'SAN', label: 'SAN – styren-akrylonitryl', density: 1.08 },
    { code: 'PA6', label: 'PA6 – poliamid 6', density: 1.14 },
    { code: 'PA66', label: 'PA66 – poliamid 66', density: 1.14 },
    { code: 'PMMA', label: 'PMMA – polimetakrylan metylu (plexi)', density: 1.19 },
    { code: 'PC', label: 'PC – poliwęglan', density: 1.20 },
    { code: 'PLA', label: 'PLA – polilaktyd', density: 1.24 },
    { code: 'PETG', label: 'PETG – kopoliester PETG', density: 1.27 },
    { code: 'PBT', label: 'PBT – politereftalan butylenu', density: 1.31 },
    { code: 'PEEK', label: 'PEEK – polieteroeteroketon', density: 1.31 },
    { code: 'PET', label: 'PET – politereftalan etylenu', density: 1.39 },
    { code: 'PPS', label: 'PPS – polisiarczek fenylenu', density: 1.35 },
    { code: 'PVC-U', label: 'PVC-U – twardy PVC', density: 1.42 },
    { code: 'POM', label: 'POM – polioksymetylen (poliacetal)', density: 1.41 },
    { code: 'PVDF', label: 'PVDF – polifluorek winylidenu', density: 1.78 },
    { code: 'PTFE', label: 'PTFE – politetrafluoroetylen', density: 2.17 }
];

// -------------------- Wyposażenie standardowe i opcje (wg pliku "Lista opcji") --------------------

// Numeracja pozycji dokładnie wg katalogu "Option List" (Lista opcji) — DL-A5 wyłącznie w wersji (ver.1),
// strona ver.2 (str. 71) została pominięta zgodnie z ustaleniami.
const optionSets = {
    'DL-A5': {
        std: {
            injection: ['01. Automatic Injection unit swiveling (Below IH 11900)', '02. Single Flight Screw', '03. Injection valve gate circuit (AC 1 + DC 1)', '04. Back-Pressure Closed-loop system', '05. PID Heating Control', '06. Weekly Heating Timer', '07. Cold screw start protection mode', '08. Temperature display & Alarm in abnormal Temp.', '09. Auto Purging', '10. Injection Speed & Pressure step (10 step)', '11. Holding Speed & Pressure step (5 step)', '12. Charging Speed & Pressure step (3 step)', '13. Back Pressure control step (3 step)', '14. Injection Pressure Graph Display', '15. Injection Speed Graph Display', '16. Screw RPM Display', '17. Cushion Display & Alarm', '18. Charging time count & alarm', '19. Screw & Barrel (Anti Wear)'],
            clamping: ['01. Safety Foot-board (Above 1050ton)', '02. Automatic safety Door open/close (Above 450ton)', '03. Clamping area Curtain sensor (Above 550ton)', '04. Hydraulic Core puller (Moving platen side, 1 stage)', '05. Air blow-off unit (Fixed side 1 + Moving side 1)', '06. Safety device (for electric & hydraulic)', '07. Spring mold mode', '08. Automatic Mold thickness adjust mode', '09. Mold-Open Speed & Pressure step (5 step)', '10. Ejector Speed & Pressure step (3 step)'],
            general: ['01. Standard Maintenance tools', '02. Standard spare part', '03. Leveling pad', '04. Cooling water distributor', '05. Automatic grease lubrication (Clamping)', '06. Robot interface (Standard)', '07. 3 Phase electric outlet (2 ea)', '08. Single Phase electric outlet (1 ea)', '09. Steel tray for resin leakage', '10. Hopper throat temperature control device', '11. Hydraulic oil purification device', '12. Hydraulic oil temperature control device', '13. Hydraulic oil level alarm', '14. Hydraulic oil temperature check & alarm', '15. Hydraulic oil heating mode', '16. 3 color alarm light', '17. Shot data saving by external way', '18. Production data statistics', '19. Alarming & History save', '20. Log history save', '21. I/O circuit display', '22. Shot data save (Internal 1,000 / External device)']
        },
        opt: {
            injection: ['01. Heater Disconnection check device', '02. Hopper Slide (L/M)', '03. Hopper Ladder & Stand', '04. Screw & Barrel (Nitrided barrel)', '05. Screw & Barrel (Anti Wear & Corrosive)', '06. Valve Gate Circuit & Connector (Interior type)', '07. Hydraulic Valve Gate Block (Interior type)', '08. Pneumatic Valve Gate Block (Interior type)', '09. Hydraulic Valve Gate Device (External device)', '10. Nozzle cylinders equipped with Potentiometers', '11. Charging on Fly (Pump type)', '12. Charging on Fly (AC Motor)', '13. Shut-off Nozzle (Pneumatic, Hydraulic, Spring)', '14. Customized Design Screw (SB, Mixing, Coating)'],
            clamping: ['01. Rotating Core Circuit', '02. Safety Foot-board (Below 850ton)', '03. Core & Ejector on Fly', '04. Daylight Extension', '05. Core-Back Mode', '06. Core Pressure release Circuit (Automatic)', '07. Core Pressure release Circuit (Manual)', '08. Product Chute', '09. Hydraulic Core Check Valve', '10. Hydraulic Core Interlock Connector (EM13, WJ Standard)', '11. Hydraulic Core Puller (2~8 Stages)', '12. Mold ring on Moving-Platen', '13. Spring type Ejector retraction', '14. Ejector Check Valve', '15. Ejector Interlock Connector (WJ Standard, EM13)', '16. Ejector Forward/Backward External switch', '17. Mold Insulation Platen', '18. Pneumatic Core Puller (1~7 Stages)'],
            general: ['01. Hydraulic Auto-Clamp unit', '02. Anchor-bolt set (Clamping unit)', '03. Heater Insulation Band', '04. Automatic Grease Lubrication (Injection unit)', '05. Robot Interface (EM12, EM67, EM67.1, SPI)', '06. CMS (Central Monitoring System)', '07. AVR (Automatic Voltage Regulator) on Electric Panel', '08. UPS (Uninterruptible Power Supply) on Electric Panel', '09. Dosing unit Interface (for Masterbatch)', '10. Gas Injection Interface', '11. Steam Injection Interface', '12. External Temperature Display (F/P)', '13. Interior type Hot Runner Controller (EM13, WJ Standard)']
        }
    },
    'TH-A5': {
        std: {
            injection: ['01. Single Flight Screw', '02. Injection valve gate circuit (AC 1 + DC 1)', '03. Back-Pressure Closed-loop system', '04. PID Heating Control', '05. Weekly Heating Timer', '06. Cold screw start protection mode', '07. Temperature display & Alarm in abnormal Temp.', '08. Auto Purging', '09. Injection Speed & Pressure step (10 step)', '10. Holding Speed & Pressure step (5 step)', '11. Charging Speed & Pressure step (3 step)', '12. Back Pressure control step (3 step)', '13. Injection Pressure Graph Display', '14. Injection Speed Graph Display', '15. Screw RPM Display', '16. Cushion Display & Alarm', '17. Charging time count & alarm', '18. Screw & Barrel (Anti Wear)'],
            clamping: ['01. Mold thickness adjusting break unit', '02. Hydraulic Core puller (Moving platen side, 1 stage)', '03. Air blow-off unit (Fixed side 1 + Moving side 1)', '04. Safety device (for electric & hydraulic)', '05. Automatic Mold thickness adjust mode', '06. Mold-Open Speed & Pressure step (4 step)', '07. Mold-Close Speed & Pressure step (5 step)', '08. Ejector Speed & Pressure step (2 step)'],
            general: ['01. Standard Maintenance tools', '02. Standard spare part', '03. Leveling pad', '04. Cooling water distributor', '05. Automatic oil lubrication (Toggle)', '06. Robot interface (Standard)', '07. 3 Phase electric outlet (2 ea)', '08. Single Phase electric outlet (1 ea)', '09. Hopper throat temperature control device', '10. Hydraulic oil purification device', '11. Hydraulic oil temperature control device', '12. Hydraulic oil level alarm', '13. Hydraulic oil temperature check & alarm', '14. Hydraulic oil heating mode', '15. 3 color alarm light', '16. Shot data saving by external way', '17. Production data statistics', '18. Alarming & History save', '19. Log history save', '20. I/O circuit display', '21. Shot data save (Internal 1,000 / External device)']
        },
        opt: {
            injection: ['01. Heater Disconnection check device', '02. Hopper Slide (L/M)', '03. Screw & Barrel (Nitrided barrel)', '04. Screw & Barrel (Anti Wear & Corrosive)', '05. Fast Injection Circuit (ACC)', '06. Valve Gate Circuit & Connector (Interior type)', '07. Hydraulic Valve Gate Block (Interior type)', '08. Pneumatic Valve Gate Block (Interior type)', '09. Hydraulic Valve Gate Device (External device)', '10. Charging on Fly (AC Motor)', '11. Shut-off Nozzle (Hydraulic)', '12. Customized Design Screw (SB, Mixing, Coating)'],
            clamping: ['01. Rotating Core Circuit', '02. Core & Ejector on Fly', '03. Daylight Extension', '04. Automatic safety Door open/close', '05. Core Pressure release Circuit (Automatic)', '06. Product Chute', '07. Hydraulic Core Check Valve', '08. Hydraulic Core Interlock Connector (EM13, WJ Standard)', '09. Hydraulic Core Puller (Fixed, 1~4 Stages)', '10. Hydraulic Core Puller (Moving 2~4 Stages)', '11. Mold ring on Moving-Platen', '12. Ejector Check Valve', '13. Ejector Interlock Connector (WJ Standard, EM13)', '14. Ejector Forward/Backward External switch', '15. Mold Insulation Platen', '16. Pneumatic Core Puller (1-3 Stages)'],
            general: ['01. Lubricating oil Recycling device', '02. Product drop check device', '03. Product quality sorting device (Below 280ton)', '04. Hydraulic Auto-Clamp unit', '05. Steel tray for resin leakage', '06. Heater Insulation Band', '07. Automatic Grease Lubrication (Clamping unit)', '08. Robot Interface (EM12, EM67, EM67.1, SPI)', '09. CMS (Central Monitoring System)', '10. AVR (Automatic Voltage Regulator) on Electric Panel', '11. UPS (Uninterruptible Power Supply) on Electric Panel', '12. Dosing unit Interface (for Masterbatch)', '13. Gas Injection Interface', '14. Steam Injection Interface', '15. External Temperature Display (F/P)', '16. Interior type Hot Runner Controller (EM13, WJ Standard)']
        }
    },
    'TE-A5': {
        std: {
            injection: ['01. Single Flight Screw', '02. Injection valve gate circuit (AC 1 + DC 1)', '03. Back-Pressure Closed-loop system', '04. PID Heating Control', '05. Weekly Heating Timer', '06. Cold screw protection mode', '07. Temperature display & Alarm in abnormal Temp.', '08. Auto Purging', '09. Injection Speed & Pressure step (10 step)', '10. Holding Speed & Pressure step (5 step)', '11. Charging Speed & Pressure step (3 step)', '12. Back Pressure control step (3 step)', '13. Injection Pressure Graph Display', '14. Injection Speed Graph Display', '15. Screw RPM Display', '16. Cushion Display & Alarm', '17. Charging time count & alarm', '18. Screw & Barrel (Anti Wear)'],
            clamping: ['01. Ejecting on fly', '02. Air blow-off unit (Fixed side 1 + Moving side 1)', '03. Safety device (for electric & hydraulic)', '04. Automatic clamp force measurement mode', '05. Automatic Mold thickness adjust mode', '06. Mold-Open Speed & Pressure step (5 step)', '07. Mold-Close Speed & Pressure step (5 step)', '08. Ejector Speed & Pressure step (3 step)'],
            general: ['01. Standard Maintenance tools', '02. Standard spare part', '03. Leveling pad', '04. Cooling water distributor', '05. Automatic Ball-screw grease lubrication (All parts)', '06. Automatic oil lubrication (Toggle)', '07. Robot interface (Standard)', '08. 3 Phase electric outlet (2 ea)', '09. Single Phase electric outlet (1 ea)', '10. Hopper throat temperature control device', '11. 3 color alarm light', '12. Shot data saving by external way', '13. Production data statistics', '14. Alarming & History save', '15. Log history save', '16. I/O circuit display', '17. Shot data save (Internal 1,000 / External device)']
        },
        opt: {
            injection: ['01. Heater Disconnection check device', '02. Hopper Slide (L/M)', '03. Long-holding pressure type upgrade', '04. Screw & Barrel (Nitrided barrel)', '05. Screw & Barrel (Anti Wear & Corrosive)', '06. Valve Gate Circuit & Connector (Interior type)', '07. Pneumatic Valve Gate Block (Interior type)', '08. Nozzle cylinders equipped with Potentiometers', '09. Shut-off Nozzle (Pneumatic, Hydraulic, Spring)', '10. Customized Design Screw (SB, Mixing, Coating)'],
            clamping: ['01. Rotating Core Circuit', '02. Safety Foot-board (Above 650ton)', '03. Core on Fly', '04. Daylight Extension', '05. Automatic safety Door open/close', '06. Product Chute', '07. Hydraulic Core Interlock Connector (EM13, WJ Standard)', '08. Hydraulic Core Device (Fixed: 170~400ton / Moving: 1or2 stage)', '09. Mold ring on Moving-Platen', '10. Ejector Interlock Connector (WJ Standard, EM13)', '11. Ejector Forward/Backward External switch', '12. Mold Insulation Platen', '13. Pneumatic Core Puller (1-3 Stages)'],
            general: ['01. Lubricating oil Recycling device', '02. Product drop check device', '03. Product quality sorting device (Below 280ton)', '04. Hydraulic Auto-Clamp unit', '05. Steel tray for resin leakage', '06. Heater Insulation Band', '07. Robot Interface (EM12, EM67, EM67.1, SPI)', '08. CMS (Central Monitoring System)', '09. AVR (Automatic Voltage Regulator) on Electric Panel', '10. UPS (Uninterruptible Power Supply) on Electric Panel', '11. Dosing unit Interface (for Masterbatch)', '12. Gas Injection Interface', '13. Steam Injection Interface', '14. External Temperature Display (F/P)', '15. Interior type Hot Runner Controller (EM13, WJ Standard)']
        }
    },
    'TL-A5': {
        std: {
            injection: ['01. Single Flight Screw', '02. Injection valve gate circuit (AC 1 + DC 1)', '03. Back-Pressure Closed-loop system', '04. PID Heating Control', '05. Weekly Heating Timer', '06. Cold screw start protection mode', '07. Temperature display & Alarm in abnormal Temp.', '08. Auto Purging', '09. Injection Speed & Pressure step (10 step)', '10. Holding Speed & Pressure step (5 step)', '11. Charging Speed & Pressure step (3 step)', '12. Back Pressure control step (3 step)', '13. Injection Pressure Graph Display', '14. Injection Speed Graph Display', '15. Screw RPM Display', '16. Cushion Display & Alarm', '17. Charging time count & alarm', '18. Screw & Barrel (Anti Wear)'],
            clamping: ['01. Mold thickness adjusting break unit', '02. Hydraulic Core puller (Moving platen side, 1 stage)', '03. Air blow-off unit (Fixed side 1 + Moving side 1)', '04. Safety device (for electric & hydraulic)', '05. Automatic Mold thickness adjust mode', '06. Mold-Open Speed & Pressure step (4 step)', '07. Mold-Close Speed & Pressure step (5 step)', '08. Ejector Speed & Pressure step (2 step)'],
            general: ['01. Standard Maintenance tools', '02. Standard spare part', '03. Leveling pad', '04. Cooling water distributor', '05. Automatic oil lubrication (Toggle)', '06. Robot interface (Standard)', '07. 3 Phase electric outlet (2 ea)', '08. Single Phase electric outlet (1 ea)', '09. Hopper throat temperature control device', '10. Hydraulic oil purification device', '11. Hydraulic oil temperature control device', '12. Hydraulic oil level alarm', '13. Hydraulic oil temperature check & alarm', '14. Hydraulic oil heating mode', '15. 3 color alarm light', '16. Shot data saving by external way', '17. Production data statistics', '18. Alarming & History save', '19. Log history save', '20. I/O circuit display', '21. Shot data save (Internal 1,000 / External device)', '22. Steel tray for resin leakage']
        },
        opt: {
            injection: ['01. Heater Disconnection check device', '02. Hopper Slide (L/M)', '03. Screw & Barrel (Nitrided barrel)', '04. Screw & Barrel (Anti Wear & Corrosive)', '05. Fast Injection Circuit (ACC)', '06. Valve Gate Circuit & Connector (Interior type)', '07. Hydraulic Valve Gate Block (Interior type)', '08. Pneumatic Valve Gate Block (Interior type)', '09. Hydraulic Valve Gate Device (External device)', '10. Charging on Fly (AC Motor)', '11. Shut-off Nozzle', '12. Customized Design Screw (SB, Mixing, Coating)'],
            clamping: ['01. Rotating Core Circuit', '02. Core & Ejector on Fly', '03. Daylight Extension', '04. Automatic safety Door open/close', '05. Core Pressure release Circuit (Automatic)', '06. Product Chute', '07. Hydraulic Core Check Valve', '08. Hydraulic Core Interlock Connector (EM13, WJ Standard)', '09. Hydraulic Core Puller (Fixed, 1~4 Stages)', '10. Hydraulic Core Puller (Moving 2~4 Stages)', '11. Mold ring on Moving-Platen', '12. Ejector Check Valve', '13. Ejector Interlock Connector (WJ Standard, EM13)', '14. Ejector Forward/Backward External switch', '15. Mold Insulation Platen', '16. Pneumatic Core Puller (1-3 Stages)'],
            general: ['01. Lubricating oil Recycling device', '02. Product drop check device', '03. Product quality sorting device (Below 280ton)', '04. Hydraulic Auto-Clamp unit', '05. Heater Insulation Band', '06. Automatic Grease Lubrication (Clamping unit)', '07. Robot Interface (EM12, EM67, EM67.1, SPI)', '08. CMS (Central Monitoring System)', '09. AVR (Automatic Voltage Regulator) on Electric Panel', '10. UPS (Uninterruptible Power Supply) on Electric Panel', '11. Dosing unit Interface (for Masterbatch)', '12. Gas Injection Interface', '13. Steam Injection Interface', '14. External Temperature Display (F/P)', '15. Interior type Hot Runner Controller (EM13, WJ Standard)']
        }
    }
};

// Tlumaczenia PL poszczegolnych pozycji wyposazenia/opcji z powyzszej listy
// (uzywane WYLACZNIE do dymka podpowiedzi po najechaniu myszka w Kroku 3 -
// patrz showStep3OptionTooltip nizej; nazwy w samej liscie zostaja po
// angielsku, zgodnie z oryginalnym katalogiem). Klucz = dokladny tekst opisu
// BEZ numeru porzadkowego (np. 'Single Flight Screw'), bo ten sam opis moze
// wystapic pod roznymi numerami w roznych seriach/sekcjach.
const OPTION_TRANSLATIONS = {
    '3 Phase electric outlet (2 ea)': 'Gniazdo elektryczne 3-fazowe (2 szt.)',
    '3 color alarm light': 'Trójkolorowa lampa sygnalizacyjna (alarmowa)',
    'AVR (Automatic Voltage Regulator) on Electric Panel': 'AVR (automatyczny regulator napięcia) w szafie elektrycznej',
    'Air blow-off unit (Fixed side 1 + Moving side 1)': 'Zespół przedmuchu powietrznego (1 x strona stała + 1 x strona ruchoma)',
    'Alarming & History save': 'Zapis alarmów i historii zdarzeń',
    'Anchor-bolt set (Clamping unit)': 'Zestaw śrub kotwiących (zespół zamykający)',
    'Auto Purging': 'Automatyczne przedmuchiwanie (czyszczenie ślimaka)',
    'Automatic Ball-screw grease lubrication (All parts)': 'Automatyczne smarowanie śrub kulowych (wszystkie punkty)',
    'Automatic Grease Lubrication (Clamping unit)': 'Automatyczne smarowanie smarem stałym (zespół zamykający)',
    'Automatic Grease Lubrication (Injection unit)': 'Automatyczne smarowanie smarem stałym (agregat wtryskowy)',
    'Automatic Injection unit swiveling (Below IH 11900)': 'Automatyczny obrót boczny agregatu wtryskowego (dla IH poniżej 11900)',
    'Automatic Mold thickness adjust mode': 'Tryb automatycznej regulacji grubości formy',
    'Automatic clamp force measurement mode': 'Tryb automatycznego pomiaru siły zwarcia',
    'Automatic grease lubrication (Clamping)': 'Automatyczne smarowanie smarem stałym (zwarcie)',
    'Automatic oil lubrication (Toggle)': 'Automatyczne smarowanie olejowe (mechanizm kolankowy)',
    'Automatic safety Door open/close': 'Automatyczne otwieranie/zamykanie drzwi bezpieczeństwa',
    'Automatic safety Door open/close (Above 450ton)': 'Automatyczne otwieranie/zamykanie drzwi bezpieczeństwa (powyżej 450 ton)',
    'Back Pressure control step (3 step)': 'Skokowa regulacja ciśnienia wstecznego (3 stopnie)',
    'Back-Pressure Closed-loop system': 'System regulacji ciśnienia wstecznego w pętli zamkniętej',
    'CMS (Central Monitoring System)': 'CMS (centralny system monitorowania)',
    'Charging Speed & Pressure step (3 step)': 'Skokowa regulacja prędkości i ciśnienia dozowania (3 stopnie)',
    'Charging on Fly (AC Motor)': 'Dozowanie w ruchu (napęd silnikiem AC)',
    'Charging on Fly (Pump type)': 'Dozowanie w ruchu (typ pompowy)',
    'Charging time count & alarm': 'Pomiar czasu dozowania i alarm',
    'Clamping area Curtain sensor (Above 550ton)': 'Kurtyna świetlna strefy zwarcia (powyżej 550 ton)',
    'Cold screw protection mode': 'Tryb zabezpieczenia przed pracą zimnego ślimaka',
    'Cold screw start protection mode': 'Tryb zabezpieczenia przed rozruchem zimnego ślimaka',
    'Cooling water distributor': 'Rozdzielacz wody chłodzącej',
    'Core & Ejector on Fly': 'Rdzeń i wypychacz w ruchu',
    'Core Pressure release Circuit (Automatic)': 'Układ zwalniania nacisku rdzenia (automatyczny)',
    'Core Pressure release Circuit (Manual)': 'Układ zwalniania nacisku rdzenia (ręczny)',
    'Core on Fly': 'Rdzeń w ruchu',
    'Core-Back Mode': 'Tryb cofania rdzenia (core-back)',
    'Cushion Display & Alarm': 'Wskazanie poduszki wtrysku (cushion) i alarm',
    'Customized Design Screw (SB, Mixing, Coating)': 'Ślimak w wykonaniu specjalnym (SB, mieszający, z powłoką)',
    'Daylight Extension': 'Zwiększenie prześwitu (daylight)',
    'Dosing unit Interface (for Masterbatch)': 'Interfejs dozownika (do masterbatchu)',
    'Ejecting on fly': 'Wypychanie w ruchu',
    'Ejector Check Valve': 'Zawór zwrotny wypychacza',
    'Ejector Forward/Backward External switch': 'Zewnętrzny przełącznik wysuwu/cofania wypychacza',
    'Ejector Interlock Connector (WJ Standard, EM13)': 'Złącze blokady wypychacza (standard WJ, EM13)',
    'Ejector Speed & Pressure step (2 step)': 'Skokowa regulacja prędkości i ciśnienia wypychacza (2 stopnie)',
    'Ejector Speed & Pressure step (3 step)': 'Skokowa regulacja prędkości i ciśnienia wypychacza (3 stopnie)',
    'External Temperature Display (F/P)': 'Zewnętrzny wyświetlacz temperatury (F/P)',
    'Fast Injection Circuit (ACC)': 'Układ szybkiego wtrysku (ACC)',
    'Gas Injection Interface': 'Interfejs wtrysku gazu',
    'Heater Disconnection check device': 'Urządzenie kontroli przerwania obwodu grzałki',
    'Heater Insulation Band': 'Osłona izolacyjna grzałek',
    'Holding Speed & Pressure step (5 step)': 'Skokowa regulacja prędkości i ciśnienia docisku (5 stopni)',
    'Hopper Ladder & Stand': 'Drabinka i podest zasypowy',
    'Hopper Slide (L/M)': 'Przesuwny lej zasypowy (L/M)',
    'Hopper throat temperature control device': 'Regulacja temperatury gardła leja zasypowego',
    'Hydraulic Auto-Clamp unit': 'Hydrauliczny zespół automatycznego mocowania formy',
    'Hydraulic Core Check Valve': 'Hydrauliczny zawór zwrotny rdzenia',
    'Hydraulic Core Device (Fixed: 170~400ton / Moving: 1or2 stage)': 'Hydrauliczny mechanizm rdzenia (strona stała: 170–400 t / strona ruchoma: 1 lub 2 stopnie)',
    'Hydraulic Core Interlock Connector (EM13, WJ Standard)': 'Złącze blokady rdzenia (EM13, standard WJ)',
    'Hydraulic Core Puller (2~8 Stages)': 'Hydrauliczny wyciągacz rdzenia (2–8 stopni)',
    'Hydraulic Core Puller (Fixed, 1~4 Stages)': 'Hydrauliczny wyciągacz rdzenia (strona stała, 1–4 stopnie)',
    'Hydraulic Core Puller (Moving 2~4 Stages)': 'Hydrauliczny wyciągacz rdzenia (strona ruchoma, 2–4 stopnie)',
    'Hydraulic Core puller (Moving platen side, 1 stage)': 'Hydrauliczny wyciągacz rdzenia (strona płyty ruchomej, 1 stopień)',
    'Hydraulic Valve Gate Block (Interior type)': 'Hydrauliczny blok zaworu iglicowego (typ wewnętrzny)',
    'Hydraulic Valve Gate Device (External device)': 'Hydrauliczne urządzenie zaworu iglicowego (zewnętrzne)',
    'Hydraulic oil heating mode': 'Tryb podgrzewania oleju hydraulicznego',
    'Hydraulic oil level alarm': 'Alarm poziomu oleju hydraulicznego',
    'Hydraulic oil purification device': 'Urządzenie oczyszczania oleju hydraulicznego',
    'Hydraulic oil temperature check & alarm': 'Kontrola i alarm temperatury oleju hydraulicznego',
    'Hydraulic oil temperature control device': 'Urządzenie regulacji temperatury oleju hydraulicznego',
    'I/O circuit display': 'Wyświetlacz stanu wejść/wyjść (I/O)',
    'Injection Pressure Graph Display': 'Wykres ciśnienia wtrysku',
    'Injection Speed & Pressure step (10 step)': 'Skokowa regulacja prędkości i ciśnienia wtrysku (10 stopni)',
    'Injection Speed Graph Display': 'Wykres prędkości wtrysku',
    'Injection valve gate circuit (AC 1 + DC 1)': 'Obwód zaworu iglicowego wtrysku (1 x AC + 1 x DC)',
    'Interior type Hot Runner Controller (EM13, WJ Standard)': 'Wbudowany sterownik gorącokanałowy (EM13, standard WJ)',
    'Leveling pad': 'Podkładka niwelacyjna (poziomująca)',
    'Log history save': 'Zapis historii zdarzeń (logów)',
    'Long-holding pressure type upgrade': 'Rozszerzenie do długiego czasu docisku',
    'Lubricating oil Recycling device': 'Urządzenie do recyklingu oleju smarującego',
    'Mold Insulation Platen': 'Płyta izolacyjna formy',
    'Mold ring on Moving-Platen': 'Pierścień centrujący na płycie ruchomej',
    'Mold thickness adjusting break unit': 'Hamulec regulacji grubości formy',
    'Mold-Close Speed & Pressure step (5 step)': 'Skokowa regulacja prędkości i ciśnienia zamykania formy (5 stopni)',
    'Mold-Open Speed & Pressure step (4 step)': 'Skokowa regulacja prędkości i ciśnienia otwierania formy (4 stopnie)',
    'Mold-Open Speed & Pressure step (5 step)': 'Skokowa regulacja prędkości i ciśnienia otwierania formy (5 stopni)',
    'Nozzle cylinders equipped with Potentiometers': 'Cylindry dyszy wyposażone w potencjometry',
    'PID Heating Control': 'Regulacja grzania PID',
    'Pneumatic Core Puller (1-3 Stages)': 'Pneumatyczny wyciągacz rdzenia (1–3 stopnie)',
    'Pneumatic Core Puller (1~7 Stages)': 'Pneumatyczny wyciągacz rdzenia (1–7 stopni)',
    'Pneumatic Valve Gate Block (Interior type)': 'Pneumatyczny blok zaworu iglicowego (typ wewnętrzny)',
    'Product Chute': 'Zsyp na wyroby',
    'Product drop check device': 'Czujnik kontroli zrzutu wyrobu',
    'Product quality sorting device (Below 280ton)': 'Urządzenie do sortowania jakości wyrobów (dla maszyn poniżej 280 ton)',
    'Production data statistics': 'Statystyki danych produkcyjnych',
    'Robot Interface (EM12, EM67, EM67.1, SPI)': 'Interfejs robota (EM12, EM67, EM67.1, SPI)',
    'Robot interface (Standard)': 'Interfejs robota (standardowy)',
    'Rotating Core Circuit': 'Układ obrotowego rdzenia',
    'Safety Foot-board (Above 1050ton)': 'Podest bezpieczeństwa (powyżej 1050 ton)',
    'Safety Foot-board (Above 650ton)': 'Podest bezpieczeństwa (powyżej 650 ton)',
    'Safety Foot-board (Below 850ton)': 'Podest bezpieczeństwa (poniżej 850 ton)',
    'Safety device (for electric & hydraulic)': 'Urządzenie zabezpieczające (dla napędu elektrycznego i hydraulicznego)',
    'Screw & Barrel (Anti Wear & Corrosive)': 'Ślimak i cylinder (odporne na zużycie i korozję)',
    'Screw & Barrel (Anti Wear)': 'Ślimak i cylinder (odporne na zużycie)',
    'Screw & Barrel (Nitrided barrel)': 'Ślimak i cylinder (cylinder azotowany)',
    'Screw RPM Display': 'Wskazanie obrotów ślimaka',
    'Shot data save (Internal 1,000 / External device)': 'Zapis danych wtrysku (1000 wewnętrznie / urządzenie zewnętrzne)',
    'Shot data saving by external way': 'Zapis danych wtrysku na urządzeniu zewnętrznym',
    'Shut-off Nozzle': 'Dysza zamykająca (odcinająca)',
    'Shut-off Nozzle (Hydraulic)': 'Dysza zamykająca (hydrauliczna)',
    'Shut-off Nozzle (Pneumatic, Hydraulic, Spring)': 'Dysza zamykająca (pneumatyczna, hydrauliczna, sprężynowa)',
    'Single Flight Screw': 'Ślimak jednozwojowy',
    'Single Phase electric outlet (1 ea)': 'Gniazdo elektryczne jednofazowe (1 szt.)',
    'Spring mold mode': 'Tryb formy sprężynowej',
    'Spring type Ejector retraction': 'Cofanie wypychacza typu sprężynowego',
    'Standard Maintenance tools': 'Standardowy zestaw narzędzi serwisowych',
    'Standard spare part': 'Standardowy zestaw części zamiennych',
    'Steam Injection Interface': 'Interfejs wtrysku pary',
    'Steel tray for resin leakage': 'Stalowa taca na wyciek tworzywa',
    'Temperature display & Alarm in abnormal Temp.': 'Wskazanie temperatury i alarm przy nieprawidłowej temperaturze',
    'UPS (Uninterruptible Power Supply) on Electric Panel': 'UPS (zasilacz awaryjny) w szafie elektrycznej',
    'Valve Gate Circuit & Connector (Interior type)': 'Obwód i złącze zaworu iglicowego (typ wewnętrzny)',
    'Weekly Heating Timer': 'Tygodniowy zegar sterowania grzaniem',
};

// -------------------- Modele maszyn (na podstawie specyfikacji katalogowej A5) --------------------
// force: siła zwarcia [ton], tieBar: prześwit między kolumnami [mm] (null = brak kolumn, TL-A5),
// minH/maxH: min./maks. wysokość formy [mm], units: dostępne agregaty wtryskowe (nazwa + średnica ślimaka)

const machineData = {
    'DL-A5': {
        label: 'DL-A5 (system Dual Lock)',
        hasTieBar: true,
        models: [
            { name: 'DL450A5', force: 450, tieBar: 860, minH: 350, maxH: 800, units: ['IH2800 O(65mm)', 'IH2800 A(70mm)', 'IH2800 B(80mm)'] },
            { name: 'DL500A5', force: 500, tieBar: 920, minH: 350, maxH: 900, units: ['IH2800 O(65mm)', 'IH2800 A(70mm)', 'IH2800 B(80mm)'] },
            { name: 'DL600A5', force: 600, tieBar: 1040, minH: 400, maxH: 950, units: ['IH4200 O(70mm)', 'IH4200 A(80mm)', 'IH4200 B(90mm)'] },
            { name: 'DL700A5', force: 700, tieBar: 1110, minH: 450, maxH: 950, units: ['IH5900 O(80mm)', 'IH5900 A(90mm)', 'IH5900 B(105mm)'] },
            { name: 'DL900A5', force: 900, tieBar: 1200, minH: 500, maxH: 1100, units: ['IH8800 O(95mm)', 'IH8800 A(105mm)', 'IH8800 B(115mm)'] },
            { name: 'DL1100A5', force: 1100, tieBar: 1420, minH: 600, maxH: 1200, units: ['IH8800 O(95mm)', 'IH8800 A(105mm)', 'IH8800 B(115mm)'] },
            { name: 'DL1300A5', force: 1300, tieBar: 1580, minH: 700, maxH: 1400, units: ['IH11900 A(115mm)', 'IH11900 B(125mm)'] },
            { name: 'DL1800A5', force: 1800, tieBar: 1850, minH: 700, maxH: 1600, units: ['IH15300 A(125mm)', 'IH15300 B(140mm)'] },
            { name: 'DL2000A5', force: 2000, tieBar: 2020, minH: 800, maxH: 1700, units: ['IH15300 A(125mm)', 'IH15300 B(140mm)'] },
            { name: 'DL2300A5', force: 2300, tieBar: 2020, minH: 800, maxH: 1700, units: ['IH15300 A(125mm)', 'IH15300 B(140mm)'] },
            { name: 'DL2500A5', force: 2500, tieBar: 2180, minH: 900, maxH: 2000, units: ['IH21500 A(140mm)', 'IH21500 B(160mm)'] },
            { name: 'DL2700A5', force: 2700, tieBar: 2180, minH: 900, maxH: 2000, units: ['IH21500 A(140mm)', 'IH21500 B(160mm)'] },
            { name: 'DL3000A5', force: 3000, tieBar: 2260, minH: 1100, maxH: 2000, units: ['IH33000 A(160mm)', 'IH33000 B(180mm)', 'IH48000 O(180mm)', 'IH48000 A(190mm)', 'IH48000 B(200mm)'] },
            { name: 'DL3300A5', force: 3300, tieBar: 2260, minH: 1100, maxH: 2000, units: ['IH33000 A(160mm)', 'IH33000 B(180mm)', 'IH48000 O(180mm)', 'IH48000 A(190mm)', 'IH48000 B(200mm)', 'IH66500 O(200mm)', 'IH66500 A(215mm)', 'IH66500 B(230mm)'] },
            { name: 'DL4000A5', force: 4000, tieBar: 2350, minH: 1100, maxH: 2200, units: ['IH66500 O(200mm)', 'IH66500 A(215mm)', 'IH66500 B(230mm)', 'IH100000 O(230mm)', 'IH100000 A(245mm)', 'IH100000 B(260mm)'] },
            { name: 'DL4300A5', force: 4300, tieBar: 2350, minH: 1100, maxH: 2200, units: ['IH66500 O(200mm)', 'IH66500 A(215mm)', 'IH66500 B(230mm)', 'IH100000 O(230mm)', 'IH100000 A(245mm)', 'IH100000 B(260mm)'] }
        ]
    },
    'TH-A5': {
        label: 'TH-A5 (maszyna hydrauliczna)',
        hasTieBar: true,
        models: [
            { name: 'TH130A5', force: 130, tieBar: 470, minH: 150, maxH: 450, units: ['IH190 O(25mm)', 'IH190 A(28mm)', 'IH190 B(32mm)', 'IH300 O(28mm)', 'IH300 A(32mm)', 'IH300 B(36mm)', 'IH600 O(36mm)', 'IH600 A(40mm)', 'IH600 B(45mm)'] },
            { name: 'TH190A5', force: 190, tieBar: 570, minH: 180, maxH: 500, units: ['IH300 O(28mm)', 'IH300 A(32mm)', 'IH300 B(36mm)', 'IH600 O(36mm)', 'IH600 A(40mm)', 'IH600 B(45mm)', 'IH1000 O(45mm)', 'IH1000 A(50mm)', 'IH1000 B(55mm)'] },
            { name: 'TH240A5', force: 240, tieBar: 625, minH: 200, maxH: 600, units: ['IH600 O(36mm)', 'IH600 A(40mm)', 'IH600 B(45mm)', 'IH1000 O(45mm)', 'IH1000 A(50mm)', 'IH1000 B(55mm)', 'IH1250 O(50mm)', 'IH1250 A(55mm)', 'IH1250 B(60mm)'] },
            { name: 'TH280A5', force: 280, tieBar: 670, minH: 250, maxH: 650, units: ['IH1000 O(45mm)', 'IH1000 A(50mm)', 'IH1000 B(55mm)', 'IH1250 O(50mm)', 'IH1250 A(55mm)', 'IH1250 B(60mm)', 'IH1800 O(55mm)', 'IH1800 A(60mm)', 'IH1800 B(65mm)'] },
            { name: 'TH380A5', force: 380, tieBar: 770, minH: 300, maxH: 750, units: ['IH1250 O(50mm)', 'IH1250 A(55mm)', 'IH1250 B(60mm)', 'IH1800 O(55mm)', 'IH1800 A(60mm)', 'IH1800 B(65mm)', 'IH2800 O(65mm)', 'IH2800 A(70mm)', 'IH2800 B(80mm)'] },
            { name: 'TH420A5', force: 420, tieBar: 820, minH: 350, maxH: 800, units: ['IH1250 O(50mm)', 'IH1250 A(55mm)', 'IH1250 B(60mm)', 'IH1800 O(55mm)', 'IH1800 A(60mm)', 'IH1800 B(65mm)', 'IH2800 O(65mm)', 'IH2800 A(70mm)', 'IH2800 B(80mm)'] },
            { name: 'TH480A5', force: 480, tieBar: 870, minH: 350, maxH: 800, units: ['IH1800 O(55mm)', 'IH1800 A(60mm)', 'IH1800 B(65mm)', 'IH2800 O(65mm)', 'IH2800 A(70mm)', 'IH2800 B(80mm)'] }
        ]
    },
    'TE-A5': {
        label: 'TE-A5 (maszyna elektryczna)',
        hasTieBar: true,
        models: [
            { name: 'TE50A5', force: 50, tieBar: 370, minH: 140, maxH: 400, units: ['IE70 S(16mm)', 'IE70 O(18mm)', 'IE70 A(20mm)', 'IE70 B(22mm)', 'IE125 O(22mm)', 'IE125 A(25mm)', 'IE125 B(28mm)', 'IE260 O(28mm)', 'IE260 A(32mm)', 'IE260 B(36mm)'] },
            { name: 'TE110A5', force: 110, tieBar: 470, minH: 150, maxH: 450, units: ['IE125 O(22mm)', 'IE125 A(25mm)', 'IE125 B(28mm)', 'IE260 O(28mm)', 'IE260 A(32mm)', 'IE260 B(36mm)', 'IE370 O(32mm)', 'IE370 A(36mm)', 'IE370 B(40mm)'] },
            { name: 'TE170A5', force: 170, tieBar: 570, minH: 180, maxH: 500, units: ['IE260 O(28mm)', 'IE260 A(32mm)', 'IE260 B(36mm)', 'IE370 O(32mm)', 'IE370 A(36mm)', 'IE370 B(40mm)', 'IE520 O(36mm)', 'IE520 A(40mm)', 'IE520 B(45mm)'] },
            { name: 'TE220A5', force: 220, tieBar: 625, minH: 200, maxH: 600, units: ['IE370 O(32mm)', 'IE370 A(36mm)', 'IE370 B(40mm)', 'IE520 O(36mm)', 'IE520 A(40mm)', 'IE520 B(45mm)', 'IE720 O(40mm)', 'IE720 A(45mm)', 'IE720 B(50mm)'] },
            { name: 'TE280A5', force: 280, tieBar: 670, minH: 250, maxH: 650, units: ['IE520 O(36mm)', 'IE520 A(40mm)', 'IE520 B(45mm)', 'IE720 O(40mm)', 'IE720 A(45mm)', 'IE720 B(50mm)', 'IE1000 O(45mm)', 'IE1000 A(50mm)', 'IE1000 B(55mm)'] },
            { name: 'TE280WA5', force: 280, tieBar: 720, minH: 300, maxH: 700, units: ['IE720 O(40mm)', 'IE720 A(45mm)', 'IE720 B(50mm)', 'IE1000 O(45mm)', 'IE1000 A(50mm)', 'IE1000 B(55mm)', 'IE1360 O(50mm)', 'IE1360 A(55mm)', 'IE1360 B(60mm)'] },
            { name: 'TE350A5', force: 350, tieBar: 770, minH: 300, maxH: 750, units: ['IE1000 O(45mm)', 'IE1000 A(50mm)', 'IE1000 B(55mm)', 'IE1360 O(50mm)', 'IE1360 A(55mm)', 'IE1360 B(60mm)', 'IE1700 O(55mm)', 'IE1700 A(60mm)', 'IE1700 B(65mm)'] },
            { name: 'TE400A5', force: 400, tieBar: 820, minH: 350, maxH: 800, units: ['IE1360 O(50mm)', 'IE1360 A(55mm)', 'IE1360 B(60mm)', 'IE1700 O(55mm)', 'IE1700 A(60mm)', 'IE1700 B(65mm)', 'IE2800 O(65mm)', 'IE2800 A(70mm)', 'IE2800 B(80mm)'] },
            { name: 'TE450A5', force: 450, tieBar: 870, minH: 350, maxH: 800, units: ['IE1700 O(55mm)', 'IE1700 A(60mm)', 'IE1700 B(65mm)', 'IE2800 O(65mm)', 'IE2800 A(70mm)', 'IE2800 B(80mm)', 'IE4000 O(70mm)', 'IE4000 A(80mm)', 'IE4000 B(90mm)'] },
            { name: 'TE550A5', force: 550, tieBar: 980, minH: 400, maxH: 950, units: ['IE2800 O(65mm)', 'IE2800 A(70mm)', 'IE2800 B(80mm)', 'IE4000 O(70mm)', 'IE4000 A(80mm)', 'IE4000 B(90mm)', 'IE5700 O(80mm)', 'IE5700 A(90mm)', 'IE5700 B(105mm)'] },
            { name: 'TE650A5', force: 650, tieBar: 1080, minH: 450, maxH: 1100, units: ['IE4000 O(70mm)', 'IE4000 A(80mm)', 'IE4000 B(90mm)', 'IE5700 O(80mm)', 'IE5700 A(90mm)', 'IE5700 B(105mm)', 'IE8000 O(95mm)', 'IE8000 A(105mm)'] },
            { name: 'TE850A5', force: 850, tieBar: 1180, minH: 500, maxH: 1200, units: ['IE5700 O(80mm)', 'IE5700 A(90mm)', 'IE5700 B(105mm)', 'IE8000 O(95mm)', 'IE8000 A(105mm)'] }
        ]
    },
    'TL-A5': {
        label: 'TL-A5 (bezkolumnowy układ zwarcia)',
        hasTieBar: false,
        models: [
            { name: 'TL220A5', force: 220, tieBar: null, minH: 300, maxH: 800, units: ['IH1000 O(45mm)', 'IH1000 A(50mm)', 'IH1000 B(55mm)'] },
            { name: 'TL300A5', force: 300, tieBar: null, minH: 400, maxH: 900, units: ['IH1800 O(55mm)', 'IH1800 A(60mm)', 'IH1800 B(65mm)'] },
            { name: 'TL400A5', force: 400, tieBar: null, minH: 450, maxH: 1000, units: ['IH2800 O(65mm)', 'IH2800 A(70mm)', 'IH2800 B(80mm)'] }
        ]
    }
};

// =====================================================================
// SZCZEGOLOWE DANE TECHNOLOGICZNE WTRYSKAREK (Krok 2: "Wybierz z listy")
// =====================================================================
// Pelne dane techniczne z katalogow producenta (DL-A5, TH-A5, TE-A5,
// TL-A5), w podziale na 3 kolumny zgodnie z ukladem katalogow: Agregat
// wtryskowy / Zespol zamykajacy / Ogolne. Klucze najwyzszego poziomu = dokladne
// nazwy modeli z machineData.models[].name, a klucze w "units" = dokladne
// stringi z machineData.models[].units[] (zeby dobor po liscie mogl
// bezposrednio odpytac te dane bez dodatkowego parsowania).
//
// Pole `null` oznacza, ze dany parametr nie wystepuje w katalogu dla tej
// serii maszyn (np. TE-A5 - maszyna elektryczna - nie ma zbiornika oleju
// hydraulicznego; DL-A5 nie ma osobnego wiersza "Max. Daylight"; TL-A5,
// jako konstrukcja bezkolumnowa, nie ma "tie bar distance" itd.) -
// renderStep2Specs() pomija wiersze z wartoscia null.

const machineTechSpecs = {
    "DL450A5": {
        clamping: { clampingForce: "450(4413)", moldOpeningForce: "34(331)", tieBarDistance: "860x810", platenDimension: "1240x1190", daylight: 1450, maxDaylight: null, minMoldHeight: 350, maxMoldHeight: 800, ejectorForce: "11.1(108.9)", ejectorStroke: 200, dryCycleTime: 3.3, maxMoldWeight: "3.5/3.5/5.0" },
        units: {
            "IH2800 O(65mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 65, injPressureKgcm2: 2191, injPressureMpa: 215, theoInjVolume: 1278, shotWeight: 1177, injRate: 407, screwStroke: 385, injSpeed: 123, plasticizingCapacity: 207, screwRotationSpeed: 180 }, general: { motorCapacity: 65.2, motorCapacityOptional: null, heaterCapacity: 18.4, totalElectricPower: 83.6, totalElectricPowerHigh: null, hydraulicOilTank: 600, coolingWater: 130, machineWeight: "19(13.5+5.5)", machineDimension: "7.6x2.4x2.2" } },
            "IH2800 A(70mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 70, injPressureKgcm2: 1889, injPressureMpa: 185, theoInjVolume: 1482, shotWeight: 1365, injRate: 472, screwStroke: 385, injSpeed: 123, plasticizingCapacity: 252, screwRotationSpeed: 180 }, general: { motorCapacity: 65.2, motorCapacityOptional: null, heaterCapacity: 20.6, totalElectricPower: 85.8, totalElectricPowerHigh: null, hydraulicOilTank: 600, coolingWater: 130, machineWeight: "19(13.5+5.5)", machineDimension: "7.6x2.4x2.2" } },
            "IH2800 B(80mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 80, injPressureKgcm2: 1446, injPressureMpa: 142, theoInjVolume: 1935, shotWeight: 1783, injRate: 617, screwStroke: 385, injSpeed: 123, plasticizingCapacity: 358, screwRotationSpeed: 180 }, general: { motorCapacity: 65.2, motorCapacityOptional: null, heaterCapacity: 24.1, totalElectricPower: 89.3, totalElectricPowerHigh: null, hydraulicOilTank: 600, coolingWater: 130, machineWeight: "19(13.5+5.5)", machineDimension: "7.6x2.4x2.2" } }
        }
    },

    "DL500A5": {
        clamping: { clampingForce: "500(4903)", moldOpeningForce: "38(368)", tieBarDistance: "920x830", platenDimension: "1280x1260", daylight: 1650, maxDaylight: null, minMoldHeight: 350, maxMoldHeight: 900, ejectorForce: "11.1(108.9)", ejectorStroke: 200, dryCycleTime: 3.3, maxMoldWeight: "5.3/5.3/8.0" },
        units: {
            "IH2800 O(65mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 65, injPressureKgcm2: 2191, injPressureMpa: 215, theoInjVolume: 1278, shotWeight: 1177, injRate: 407, screwStroke: 385, injSpeed: 123, plasticizingCapacity: 207, screwRotationSpeed: 180 }, general: { motorCapacity: 65.2, motorCapacityOptional: null, heaterCapacity: 18.4, totalElectricPower: 83.6, totalElectricPowerHigh: null, hydraulicOilTank: 600, coolingWater: 130, machineWeight: "19(13.5+5.5)", machineDimension: "7.9x2.7x2.2" } },
            "IH2800 A(70mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 70, injPressureKgcm2: 1889, injPressureMpa: 185, theoInjVolume: 1482, shotWeight: 1365, injRate: 472, screwStroke: 385, injSpeed: 123, plasticizingCapacity: 252, screwRotationSpeed: 180 }, general: { motorCapacity: 65.2, motorCapacityOptional: null, heaterCapacity: 20.6, totalElectricPower: 85.8, totalElectricPowerHigh: null, hydraulicOilTank: 600, coolingWater: 130, machineWeight: "19(13.5+5.5)", machineDimension: "7.9x2.7x2.2" } },
            "IH2800 B(80mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 80, injPressureKgcm2: 1446, injPressureMpa: 142, theoInjVolume: 1935, shotWeight: 1783, injRate: 617, screwStroke: 385, injSpeed: 123, plasticizingCapacity: 358, screwRotationSpeed: 180 }, general: { motorCapacity: 65.2, motorCapacityOptional: null, heaterCapacity: 24.1, totalElectricPower: 89.3, totalElectricPowerHigh: null, hydraulicOilTank: 600, coolingWater: 130, machineWeight: "19(13.5+5.5)", machineDimension: "7.9x2.7x2.2" } }
        }
    },

    "DL600A5": {
        clamping: { clampingForce: "600(5884)", moldOpeningForce: "45(441)", tieBarDistance: "1040x910", platenDimension: "1420x1370", daylight: 1750, maxDaylight: null, minMoldHeight: 400, maxMoldHeight: 950, ejectorForce: "16.6(162.8)", ejectorStroke: 220, dryCycleTime: 3.3, maxMoldWeight: "6.7/6.7/10.0" },
        units: {
            "IH4200 O(70mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 70, injPressureKgcm2: 2465, injPressureMpa: 242, theoInjVolume: 1693, shotWeight: 1560, injRate: 461, screwStroke: 440, injSpeed: 120, plasticizingCapacity: 231, screwRotationSpeed: 165 }, general: { motorCapacity: 87.6, motorCapacityOptional: null, heaterCapacity: 23, totalElectricPower: 110.6, totalElectricPowerHigh: null, hydraulicOilTank: 800, coolingWater: 130, machineWeight: "26(17+9)", machineDimension: "8.1x2.9x2.2" } },
            "IH4200 A(80mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 80, injPressureKgcm2: 1887, injPressureMpa: 185, theoInjVolume: 2212, shotWeight: 2038, injRate: 602, screwStroke: 440, injSpeed: 120, plasticizingCapacity: 328, screwRotationSpeed: 165 }, general: { motorCapacity: 87.6, motorCapacityOptional: null, heaterCapacity: 26.7, totalElectricPower: 114.3, totalElectricPowerHigh: null, hydraulicOilTank: 800, coolingWater: 130, machineWeight: "26(17+9)", machineDimension: "8.1x2.9x2.2" } },
            "IH4200 B(90mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 90, injPressureKgcm2: 1491, injPressureMpa: 146, theoInjVolume: 2799, shotWeight: 2579, injRate: 762, screwStroke: 440, injSpeed: 120, plasticizingCapacity: 449, screwRotationSpeed: 165 }, general: { motorCapacity: 87.6, motorCapacityOptional: null, heaterCapacity: 30.7, totalElectricPower: 118.3, totalElectricPowerHigh: null, hydraulicOilTank: 800, coolingWater: 130, machineWeight: "26(17+9)", machineDimension: "8.1x2.9x2.2" } }
        }
    },

    "DL700A5": {
        clamping: { clampingForce: "700(6865)", moldOpeningForce: "53(515)", tieBarDistance: "1110x1010", platenDimension: "1520x1490", daylight: 1850, maxDaylight: null, minMoldHeight: 450, maxMoldHeight: 950, ejectorForce: "19.8(194.2)", ejectorStroke: 250, dryCycleTime: 3.3, maxMoldWeight: "7.3/7.3/11.0" },
        units: {
            "IH5900 O(80mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 80, injPressureKgcm2: 2386, injPressureMpa: 234, theoInjVolume: 2488, shotWeight: 2293, injRate: 603, screwStroke: 495, injSpeed: 120, plasticizingCapacity: 298, screwRotationSpeed: 150 }, general: { motorCapacity: 87.6, motorCapacityOptional: null, heaterCapacity: 29.4, totalElectricPower: 117, totalElectricPowerHigh: null, hydraulicOilTank: 800, coolingWater: 130, machineWeight: "32(21.5+10.5)", machineDimension: "8.4x3.1x2.4" } },
            "IH5900 A(90mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 90, injPressureKgcm2: 1885, injPressureMpa: 185, theoInjVolume: 3149, shotWeight: 2902, injRate: 763, screwStroke: 495, injSpeed: 120, plasticizingCapacity: 408, screwRotationSpeed: 150 }, general: { motorCapacity: 87.6, motorCapacityOptional: null, heaterCapacity: 33.6, totalElectricPower: 121.2, totalElectricPowerHigh: null, hydraulicOilTank: 800, coolingWater: 130, machineWeight: "32(21.5+10.5)", machineDimension: "8.4x3.1x2.4" } },
            "IH5900 B(105mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 105, injPressureKgcm2: 1385, injPressureMpa: 136, theoInjVolume: 4286, shotWeight: 3950, injRate: 1039, screwStroke: 495, injSpeed: 120, plasticizingCapacity: 619, screwRotationSpeed: 150 }, general: { motorCapacity: 87.6, motorCapacityOptional: null, heaterCapacity: 39.3, totalElectricPower: 126.9, totalElectricPowerHigh: null, hydraulicOilTank: 800, coolingWater: 130, machineWeight: "32(21.5+10.5)", machineDimension: "8.4x3.1x2.4" } }
        }
    },

    "DL900A5": {
        clamping: { clampingForce: "900(8826)", moldOpeningForce: "68(662)", tieBarDistance: "1200x1120", platenDimension: "1720x1610", daylight: 2100, maxDaylight: null, minMoldHeight: 500, maxMoldHeight: 1100, ejectorForce: "26.9(263.8)", ejectorStroke: 250, dryCycleTime: 4, maxMoldWeight: "8.6/8.6/13.0" },
        units: {
            "IH8800 O(95mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 95, injPressureKgcm2: 2145, injPressureMpa: 210, theoInjVolume: 4111, shotWeight: 3788, injRate: 852, screwStroke: 580, injSpeed: 120, plasticizingCapacity: 393, screwRotationSpeed: 125 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 39.7, totalElectricPower: 149.7, totalElectricPowerHigh: null, hydraulicOilTank: 920, coolingWater: 180, machineWeight: "41(29+12)", machineDimension: "9.7x3.4x2.5" } },
            "IH8800 A(105mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 105, injPressureKgcm2: 1756, injPressureMpa: 172, theoInjVolume: 5022, shotWeight: 4628, injRate: 1041, screwStroke: 580, injSpeed: 120, plasticizingCapacity: 515, screwRotationSpeed: 125 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 44.7, totalElectricPower: 154.7, totalElectricPowerHigh: null, hydraulicOilTank: 920, coolingWater: 180, machineWeight: "41(29+12)", machineDimension: "9.7x3.4x2.5" } },
            "IH8800 B(115mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 115, injPressureKgcm2: 1464, injPressureMpa: 144, theoInjVolume: 6024, shotWeight: 5551, injRate: 1248, screwStroke: 580, injSpeed: 120, plasticizingCapacity: 660, screwRotationSpeed: 125 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 49.4, totalElectricPower: 159.4, totalElectricPowerHigh: null, hydraulicOilTank: 920, coolingWater: 180, machineWeight: "41(29+12)", machineDimension: "9.7x3.4x2.5" } }
        }
    },

    "DL1100A5": {
        clamping: { clampingForce: "1100(10787)", moldOpeningForce: "83(809)", tieBarDistance: "1420x1170", platenDimension: "1870x1820", daylight: 2400, maxDaylight: null, minMoldHeight: 600, maxMoldHeight: 1200, ejectorForce: "26.9(263.8)", ejectorStroke: 250, dryCycleTime: 4.4, maxMoldWeight: "14.0/14.0/21.0" },
        units: {
            "IH8800 O(95mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 95, injPressureKgcm2: 2145, injPressureMpa: 210, theoInjVolume: 4111, shotWeight: 3788, injRate: 852, screwStroke: 580, injSpeed: 120, plasticizingCapacity: 393, screwRotationSpeed: 125 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 39.7, totalElectricPower: 149.7, totalElectricPowerHigh: null, hydraulicOilTank: 920, coolingWater: 180, machineWeight: "50(37.5+12.5)", machineDimension: "9.9x3.6x2.7" } },
            "IH8800 A(105mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 105, injPressureKgcm2: 1756, injPressureMpa: 172, theoInjVolume: 5022, shotWeight: 4628, injRate: 1041, screwStroke: 580, injSpeed: 120, plasticizingCapacity: 515, screwRotationSpeed: 125 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 44.7, totalElectricPower: 154.7, totalElectricPowerHigh: null, hydraulicOilTank: 920, coolingWater: 180, machineWeight: "50(37.5+12.5)", machineDimension: "9.9x3.6x2.7" } },
            "IH8800 B(115mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 115, injPressureKgcm2: 1464, injPressureMpa: 144, theoInjVolume: 6024, shotWeight: 5551, injRate: 1248, screwStroke: 580, injSpeed: 120, plasticizingCapacity: 660, screwRotationSpeed: 125 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 49.4, totalElectricPower: 159.4, totalElectricPowerHigh: null, hydraulicOilTank: 920, coolingWater: 180, machineWeight: "50(37.5+12.5)", machineDimension: "9.9x3.6x2.7" } }
        }
    },

    "DL1300A5": {
        clamping: { clampingForce: "1300(12749)", moldOpeningForce: "98(956)", tieBarDistance: "1580x1280", platenDimension: "2230x1990", daylight: 3050, maxDaylight: null, minMoldHeight: 700, maxMoldHeight: 1400, ejectorForce: "34.4(337.3)", ejectorStroke: 300, dryCycleTime: 5, maxMoldWeight: "20.0/20.0/30.0" },
        units: {
            "IH11900 A(115mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 115, injPressureKgcm2: 1809, injPressureMpa: 177, theoInjVolume: 6544, shotWeight: 6030, injRate: 1249, screwStroke: 630, injSpeed: 120, plasticizingCapacity: 607, screwRotationSpeed: 115 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 54.7, totalElectricPower: 197.3, totalElectricPowerHigh: null, hydraulicOilTank: 1150, coolingWater: 180, machineWeight: "72(55+17)", machineDimension: "11.3x3.9x2.9" } },
            "IH11900 B(125mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 125, injPressureKgcm2: 1531, injPressureMpa: 150, theoInjVolume: 7731, shotWeight: 7124, injRate: 1475, screwStroke: 630, injSpeed: 120, plasticizingCapacity: 757, screwRotationSpeed: 115 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 58.1, totalElectricPower: 200.7, totalElectricPowerHigh: null, hydraulicOilTank: 1150, coolingWater: 180, machineWeight: "72(55+17)", machineDimension: "11.3x3.9x2.9" } }
        }
    },

    "DL1800A5": {
        clamping: { clampingForce: "1800(17652)", moldOpeningForce: "135(1324)", tieBarDistance: "1850x1610", platenDimension: "2450x2200", daylight: 3400, maxDaylight: null, minMoldHeight: 700, maxMoldHeight: 1600, ejectorForce: "44.5(436.4)", ejectorStroke: 300, dryCycleTime: 5.8, maxMoldWeight: "30.0/30.0/45.0" },
        units: {
            "IH15300 A(125mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 125, injPressureKgcm2: 1814, injPressureMpa: 178, theoInjVolume: 8406, shotWeight: 7746, injRate: 1296, screwStroke: 685, injSpeed: 106, plasticizingCapacity: 692, screwRotationSpeed: 105 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 61.6, totalElectricPower: 204.2, totalElectricPowerHigh: null, hydraulicOilTank: 1450, coolingWater: 180, machineWeight: "89(70+19)", machineDimension: "12.8x4.2x3.4" } },
            "IH15300 B(140mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 140, injPressureKgcm2: 1446, injPressureMpa: 142, theoInjVolume: 10545, shotWeight: 9717, injRate: 1626, screwStroke: 685, injSpeed: 106, plasticizingCapacity: 939, screwRotationSpeed: 105 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 70.8, totalElectricPower: 213.4, totalElectricPowerHigh: null, hydraulicOilTank: 1450, coolingWater: 180, machineWeight: "89(70+19)", machineDimension: "12.8x4.2x3.4" } }
        }
    },

    "DL2000A5": {
        clamping: { clampingForce: "2000(19613)", moldOpeningForce: "150(1471)", tieBarDistance: "2020x1610", platenDimension: "2600x2250", daylight: 3600, maxDaylight: null, minMoldHeight: 800, maxMoldHeight: 1700, ejectorForce: "44.5(436.4)", ejectorStroke: 300, dryCycleTime: 5.8, maxMoldWeight: "41.0/41.0/62.0" },
        units: {
            "IH15300 A(125mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 125, injPressureKgcm2: 1814, injPressureMpa: 178, theoInjVolume: 8406, shotWeight: 7746, injRate: 1296, screwStroke: 685, injSpeed: 106, plasticizingCapacity: 692, screwRotationSpeed: 105 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 61.6, totalElectricPower: 204.2, totalElectricPowerHigh: null, hydraulicOilTank: 1450, coolingWater: 180, machineWeight: "115(96+19)", machineDimension: "13.1x4.5x3.4" } },
            "IH15300 B(140mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 140, injPressureKgcm2: 1446, injPressureMpa: 142, theoInjVolume: 10545, shotWeight: 9717, injRate: 1626, screwStroke: 685, injSpeed: 106, plasticizingCapacity: 939, screwRotationSpeed: 105 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 70.8, totalElectricPower: 213.4, totalElectricPowerHigh: null, hydraulicOilTank: 1450, coolingWater: 180, machineWeight: "115(96+19)", machineDimension: "13.1x4.5x3.4" } }
        }
    },

    "DL2300A5": {
        clamping: { clampingForce: "2300(22555)", moldOpeningForce: "173(1692)", tieBarDistance: "2020x1610", platenDimension: "2600x2250", daylight: 3600, maxDaylight: null, minMoldHeight: 800, maxMoldHeight: 1700, ejectorForce: "44.5(436.4)", ejectorStroke: 300, dryCycleTime: 5.8, maxMoldWeight: "41.0/41.0/62.0" },
        units: {
            "IH15300 A(125mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 125, injPressureKgcm2: 1814, injPressureMpa: 178, theoInjVolume: 8406, shotWeight: 7746, injRate: 1296, screwStroke: 685, injSpeed: 106, plasticizingCapacity: 692, screwRotationSpeed: 105 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 61.6, totalElectricPower: 204.2, totalElectricPowerHigh: null, hydraulicOilTank: 1450, coolingWater: 180, machineWeight: "115(96+19)", machineDimension: "13.1x4.5x3.4" } },
            "IH15300 B(140mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 140, injPressureKgcm2: 1446, injPressureMpa: 142, theoInjVolume: 10545, shotWeight: 9717, injRate: 1626, screwStroke: 685, injSpeed: 106, plasticizingCapacity: 939, screwRotationSpeed: 105 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 70.8, totalElectricPower: 213.4, totalElectricPowerHigh: null, hydraulicOilTank: 1450, coolingWater: 180, machineWeight: "115(96+19)", machineDimension: "13.1x4.5x3.4" } }
        }
    },

    "DL2500A5": {
        clamping: { clampingForce: "2500(24517)", moldOpeningForce: "188(1839)", tieBarDistance: "2180x1760", platenDimension: "3020x2610", daylight: 3900, maxDaylight: null, minMoldHeight: 900, maxMoldHeight: 2000, ejectorForce: "67.8(664.9)", ejectorStroke: 350, dryCycleTime: 8.2, maxMoldWeight: "50.0/50.0/75.0" },
        units: {
            "IH21500 A(140mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 140, injPressureKgcm2: 1816, injPressureMpa: 178, theoInjVolume: 11853, shotWeight: 10923, injRate: 1537, screwStroke: 770, injSpeed: 100, plasticizingCapacity: 850, screwRotationSpeed: 95 }, general: { motorCapacity: 165, motorCapacityOptional: null, heaterCapacity: 78.4, totalElectricPower: 243.4, totalElectricPowerHigh: null, hydraulicOilTank: 1650, coolingWater: 240, machineWeight: "143(121+22)", machineDimension: "14.9x4.7x3.7" } },
            "IH21500 B(160mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 160, injPressureKgcm2: 1391, injPressureMpa: 136, theoInjVolume: 15482, shotWeight: 14266, injRate: 2007, screwStroke: 770, injSpeed: 100, plasticizingCapacity: 1218, screwRotationSpeed: 95 }, general: { motorCapacity: 165, motorCapacityOptional: null, heaterCapacity: 93.1, totalElectricPower: 258.1, totalElectricPowerHigh: null, hydraulicOilTank: 1650, coolingWater: 240, machineWeight: "143(121+22)", machineDimension: "14.9x4.7x3.7" } }
        }
    },

    "DL2700A5": {
        clamping: { clampingForce: "2700(26478)", moldOpeningForce: "203(1986)", tieBarDistance: "2180x1760", platenDimension: "3020x2610", daylight: 3900, maxDaylight: null, minMoldHeight: 900, maxMoldHeight: 2000, ejectorForce: "67.8(664.9)", ejectorStroke: 350, dryCycleTime: 8.2, maxMoldWeight: "50.0/50.0/75.0" },
        units: {
            "IH21500 A(140mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 140, injPressureKgcm2: 1816, injPressureMpa: 178, theoInjVolume: 11853, shotWeight: 10923, injRate: 1537, screwStroke: 770, injSpeed: 100, plasticizingCapacity: 850, screwRotationSpeed: 95 }, general: { motorCapacity: 165, motorCapacityOptional: null, heaterCapacity: 78.4, totalElectricPower: 243.4, totalElectricPowerHigh: null, hydraulicOilTank: 1650, coolingWater: 240, machineWeight: "143(121+22)", machineDimension: "14.9x4.7x3.7" } },
            "IH21500 B(160mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 160, injPressureKgcm2: 1391, injPressureMpa: 136, theoInjVolume: 15482, shotWeight: 14266, injRate: 2007, screwStroke: 770, injSpeed: 100, plasticizingCapacity: 1218, screwRotationSpeed: 95 }, general: { motorCapacity: 165, motorCapacityOptional: null, heaterCapacity: 93.1, totalElectricPower: 258.1, totalElectricPowerHigh: null, hydraulicOilTank: 1650, coolingWater: 240, machineWeight: "143(121+22)", machineDimension: "14.9x4.7x3.7" } }
        }
    },

    "DL3000A5": {
        clamping: { clampingForce: "3000(29420)", moldOpeningForce: "225(2206)", tieBarDistance: "2260x1810", platenDimension: "3140x2660", daylight: 4000, maxDaylight: null, minMoldHeight: 1100, maxMoldHeight: 2000, ejectorForce: "67.8(664.9)", ejectorStroke: 350, dryCycleTime: 8.2, maxMoldWeight: "56.0/56.0/85.0" },
        units: {
            "IH33000 A(160mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 160, injPressureKgcm2: 1800, injPressureMpa: 177, theoInjVolume: 16085, shotWeight: 14822, injRate: 1719, screwStroke: 800, injSpeed: 85, plasticizingCapacity: 1000, screwRotationSpeed: 78 }, general: { motorCapacity: 220, motorCapacityOptional: null, heaterCapacity: 149.1, totalElectricPower: 369.1, totalElectricPowerHigh: null, hydraulicOilTank: 2650, coolingWater: 240, machineWeight: "180(149+31)", machineDimension: "16.5x5.0x4.0" } },
            "IH33000 B(180mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 180, injPressureKgcm2: 1400, injPressureMpa: 137, theoInjVolume: 20358, shotWeight: 18759, injRate: 2176, screwStroke: 800, injSpeed: 85, plasticizingCapacity: 1378, screwRotationSpeed: 78 }, general: { motorCapacity: 220, motorCapacityOptional: null, heaterCapacity: 167.1, totalElectricPower: 387.1, totalElectricPowerHigh: null, hydraulicOilTank: 2650, coolingWater: 240, machineWeight: "180(149+31)", machineDimension: "16.5x5.0x4.0" } },
            "IH48000 O(180mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 180, injPressureKgcm2: 1800, injPressureMpa: 177, theoInjVolume: 22902, shotWeight: 21104, injRate: 2127, screwStroke: 900, injSpeed: 84, plasticizingCapacity: 1325, screwRotationSpeed: 75 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 178.4, totalElectricPower: 453.4, totalElectricPowerHigh: null, hydraulicOilTank: 3200, coolingWater: 240, machineWeight: "194(149+45)", machineDimension: "18.0x5.0x4.0" } },
            "IH48000 A(190mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 190, injPressureKgcm2: 1600, injPressureMpa: 157, theoInjVolume: 25518, shotWeight: 23514, injRate: 2370, screwStroke: 900, injSpeed: 84, plasticizingCapacity: 1528, screwRotationSpeed: 75 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 183.6, totalElectricPower: 458.6, totalElectricPowerHigh: null, hydraulicOilTank: 3200, coolingWater: 240, machineWeight: "194(149+45)", machineDimension: "18.0x5.0x4.0" } },
            "IH48000 B(200mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 200, injPressureKgcm2: 1450, injPressureMpa: 142, theoInjVolume: 28274, shotWeight: 26055, injRate: 2626, screwStroke: 900, injSpeed: 84, plasticizingCapacity: 1533, screwRotationSpeed: 65 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 194.3, totalElectricPower: 469.3, totalElectricPowerHigh: null, hydraulicOilTank: 3200, coolingWater: 240, machineWeight: "194(149+45)", machineDimension: "18.0x5.0x4.0" } }
        }
    },

    "DL3300A5": {
        clamping: { clampingForce: "3300(32362)", moldOpeningForce: "248(2427)", tieBarDistance: "2260x1810", platenDimension: "3140x2660", daylight: 4000, maxDaylight: null, minMoldHeight: 1100, maxMoldHeight: 2000, ejectorForce: "67.8(664.9)", ejectorStroke: 350, dryCycleTime: 8.2, maxMoldWeight: "56.0/56.0/85.0" },
        units: {
            "IH33000 A(160mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 160, injPressureKgcm2: 1800, injPressureMpa: 177, theoInjVolume: 16085, shotWeight: 14822, injRate: 1719, screwStroke: 800, injSpeed: 85, plasticizingCapacity: 1000, screwRotationSpeed: 78 }, general: { motorCapacity: 220, motorCapacityOptional: null, heaterCapacity: 149.1, totalElectricPower: 369.1, totalElectricPowerHigh: null, hydraulicOilTank: 2650, coolingWater: 240, machineWeight: "180(149+31)", machineDimension: "16.5x5.0x4.0" } },
            "IH33000 B(180mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 180, injPressureKgcm2: 1400, injPressureMpa: 137, theoInjVolume: 20358, shotWeight: 18759, injRate: 2176, screwStroke: 800, injSpeed: 85, plasticizingCapacity: 1378, screwRotationSpeed: 78 }, general: { motorCapacity: 220, motorCapacityOptional: null, heaterCapacity: 167.1, totalElectricPower: 387.1, totalElectricPowerHigh: null, hydraulicOilTank: 2650, coolingWater: 240, machineWeight: "180(149+31)", machineDimension: "16.5x5.0x4.0" } },
            "IH48000 O(180mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 180, injPressureKgcm2: 1800, injPressureMpa: 177, theoInjVolume: 22902, shotWeight: 21104, injRate: 2127, screwStroke: 900, injSpeed: 84, plasticizingCapacity: 1325, screwRotationSpeed: 75 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 178.4, totalElectricPower: 453.4, totalElectricPowerHigh: null, hydraulicOilTank: 3200, coolingWater: 240, machineWeight: "194(149+45)", machineDimension: "18.0x5.0x4.0" } },
            "IH48000 A(190mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 190, injPressureKgcm2: 1600, injPressureMpa: 157, theoInjVolume: 25518, shotWeight: 23514, injRate: 2370, screwStroke: 900, injSpeed: 84, plasticizingCapacity: 1528, screwRotationSpeed: 75 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 183.6, totalElectricPower: 458.6, totalElectricPowerHigh: null, hydraulicOilTank: 3200, coolingWater: 240, machineWeight: "194(149+45)", machineDimension: "18.0x5.0x4.0" } },
            "IH48000 B(200mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 200, injPressureKgcm2: 1450, injPressureMpa: 142, theoInjVolume: 28274, shotWeight: 26055, injRate: 2626, screwStroke: 900, injSpeed: 84, plasticizingCapacity: 1533, screwRotationSpeed: 65 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 194.3, totalElectricPower: 469.3, totalElectricPowerHigh: null, hydraulicOilTank: 3200, coolingWater: 240, machineWeight: "194(149+45)", machineDimension: "18.0x5.0x4.0" } },
            "IH66500 O(200mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 200, injPressureKgcm2: 1800, injPressureMpa: 177, theoInjVolume: 34558, shotWeight: 31845, injRate: 2117, screwStroke: 1100, injSpeed: 67, plasticizingCapacity: 1415, screwRotationSpeed: 60 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 217.1, totalElectricPower: 492.1, totalElectricPowerHigh: null, hydraulicOilTank: 3400, coolingWater: 240, machineWeight: "204(149+55)", machineDimension: "19.1x5.0x4.0" } },
            "IH66500 A(215mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 215, injPressureKgcm2: 1550, injPressureMpa: 152, theoInjVolume: 39936, shotWeight: 36801, injRate: 2447, screwStroke: 1100, injSpeed: 67, plasticizingCapacity: 1705, screwRotationSpeed: 60 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 231.9, totalElectricPower: 506.9, totalElectricPowerHigh: null, hydraulicOilTank: 3400, coolingWater: 240, machineWeight: "204(149+55)", machineDimension: "19.1x5.0x4.0" } },
            "IH66500 B(230mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 230, injPressureKgcm2: 1360, injPressureMpa: 133, theoInjVolume: 45702, shotWeight: 42115, injRate: 2800, screwStroke: 1100, injSpeed: 67, plasticizingCapacity: 1693, screwRotationSpeed: 50 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 249.8, totalElectricPower: 524.8, totalElectricPowerHigh: null, hydraulicOilTank: 3400, coolingWater: 240, machineWeight: "204(149+55)", machineDimension: "19.1x5.0x4.0" } }
        }
    },

    "DL4000A5": {
        clamping: { clampingForce: "4000(39227)", moldOpeningForce: "300(2942)", tieBarDistance: "2350x2050", platenDimension: "3400x3100", daylight: 4400, maxDaylight: null, minMoldHeight: 1100, maxMoldHeight: 2200, ejectorForce: "67.8(664.9)", ejectorStroke: 400, dryCycleTime: 9.2, maxMoldWeight: "66.0/66.0/100.0" },
        units: {
            "IH66500 O(200mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 200, injPressureKgcm2: 1800, injPressureMpa: 177, theoInjVolume: 34558, shotWeight: 31845, injRate: 2117, screwStroke: 1100, injSpeed: 67, plasticizingCapacity: 1415, screwRotationSpeed: 60 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 217.1, totalElectricPower: 492.1, totalElectricPowerHigh: null, hydraulicOilTank: 3400, coolingWater: 240, machineWeight: "246(191+55)", machineDimension: "19.8x5.8x4.5" } },
            "IH66500 A(215mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 215, injPressureKgcm2: 1550, injPressureMpa: 152, theoInjVolume: 39936, shotWeight: 36801, injRate: 2447, screwStroke: 1100, injSpeed: 67, plasticizingCapacity: 1705, screwRotationSpeed: 60 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 231.9, totalElectricPower: 506.9, totalElectricPowerHigh: null, hydraulicOilTank: 3400, coolingWater: 240, machineWeight: "246(191+55)", machineDimension: "19.8x5.8x4.5" } },
            "IH66500 B(230mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 230, injPressureKgcm2: 1360, injPressureMpa: 133, theoInjVolume: 45702, shotWeight: 42115, injRate: 2800, screwStroke: 1100, injSpeed: 67, plasticizingCapacity: 1693, screwRotationSpeed: 50 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 249.8, totalElectricPower: 524.8, totalElectricPowerHigh: null, hydraulicOilTank: 3400, coolingWater: 240, machineWeight: "246(191+55)", machineDimension: "19.8x5.8x4.5" } },
            "IH100000 O(230mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 230, injPressureKgcm2: 1600, injPressureMpa: 157, theoInjVolume: 56089, shotWeight: 51686, injRate: 2925, screwStroke: 1350, injSpeed: 70, plasticizingCapacity: 1693, screwRotationSpeed: 50 }, general: { motorCapacity: 330, motorCapacityOptional: null, heaterCapacity: 340.2, totalElectricPower: 670.2, totalElectricPowerHigh: null, hydraulicOilTank: 3500, coolingWater: 240, machineWeight: "263(191+72)", machineDimension: "20.6x5.8x4.5" } },
            "IH100000 A(245mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 245, injPressureKgcm2: 1400, injPressureMpa: 137, theoInjVolume: 63644, shotWeight: 58648, injRate: 3319, screwStroke: 1350, injSpeed: 70, plasticizingCapacity: 1998, screwRotationSpeed: 50 }, general: { motorCapacity: 330, motorCapacityOptional: null, heaterCapacity: 357.4, totalElectricPower: 687.4, totalElectricPowerHigh: null, hydraulicOilTank: 3500, coolingWater: 240, machineWeight: "263(191+72)", machineDimension: "20.6x5.8x4.5" } },
            "IH100000 B(260mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 260, injPressureKgcm2: 1220, injPressureMpa: 120, theoInjVolume: 71675, shotWeight: 66049, injRate: 3738, screwStroke: 1350, injSpeed: 70, plasticizingCapacity: 2102, screwRotationSpeed: 45 }, general: { motorCapacity: 330, motorCapacityOptional: null, heaterCapacity: 378, totalElectricPower: 708, totalElectricPowerHigh: null, hydraulicOilTank: 3500, coolingWater: 240, machineWeight: "263(191+72)", machineDimension: "20.6x5.8x4.5" } }
        }
    },

    "DL4300A5": {
        clamping: { clampingForce: "4300(42169)", moldOpeningForce: "323(3163)", tieBarDistance: "2350x2050", platenDimension: "3400x3100", daylight: 4400, maxDaylight: null, minMoldHeight: 1100, maxMoldHeight: 2200, ejectorForce: "67.8(664.9)", ejectorStroke: 400, dryCycleTime: 9.2, maxMoldWeight: "66.0/66.0/100.0" },
        units: {
            "IH66500 O(200mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 200, injPressureKgcm2: 1800, injPressureMpa: 177, theoInjVolume: 34558, shotWeight: 31845, injRate: 2117, screwStroke: 1100, injSpeed: 67, plasticizingCapacity: 1415, screwRotationSpeed: 60 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 217.1, totalElectricPower: 492.1, totalElectricPowerHigh: null, hydraulicOilTank: 3400, coolingWater: 240, machineWeight: "246(191+55)", machineDimension: "19.8x5.8x4.5" } },
            "IH66500 A(215mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 215, injPressureKgcm2: 1550, injPressureMpa: 152, theoInjVolume: 39936, shotWeight: 36801, injRate: 2447, screwStroke: 1100, injSpeed: 67, plasticizingCapacity: 1705, screwRotationSpeed: 60 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 231.9, totalElectricPower: 506.9, totalElectricPowerHigh: null, hydraulicOilTank: 3400, coolingWater: 240, machineWeight: "246(191+55)", machineDimension: "19.8x5.8x4.5" } },
            "IH66500 B(230mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 230, injPressureKgcm2: 1360, injPressureMpa: 133, theoInjVolume: 45702, shotWeight: 42115, injRate: 2800, screwStroke: 1100, injSpeed: 67, plasticizingCapacity: 1693, screwRotationSpeed: 50 }, general: { motorCapacity: 275, motorCapacityOptional: null, heaterCapacity: 249.8, totalElectricPower: 524.8, totalElectricPowerHigh: null, hydraulicOilTank: 3400, coolingWater: 240, machineWeight: "246(191+55)", machineDimension: "19.8x5.8x4.5" } },
            "IH100000 O(230mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 230, injPressureKgcm2: 1600, injPressureMpa: 157, theoInjVolume: 56089, shotWeight: 51686, injRate: 2925, screwStroke: 1350, injSpeed: 70, plasticizingCapacity: 1693, screwRotationSpeed: 50 }, general: { motorCapacity: 330, motorCapacityOptional: null, heaterCapacity: 340.2, totalElectricPower: 670.2, totalElectricPowerHigh: null, hydraulicOilTank: 3500, coolingWater: 240, machineWeight: "263(191+72)", machineDimension: "20.6x5.8x4.5" } },
            "IH100000 A(245mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 245, injPressureKgcm2: 1400, injPressureMpa: 137, theoInjVolume: 63644, shotWeight: 58648, injRate: 3319, screwStroke: 1350, injSpeed: 70, plasticizingCapacity: 1998, screwRotationSpeed: 50 }, general: { motorCapacity: 330, motorCapacityOptional: null, heaterCapacity: 357.4, totalElectricPower: 687.4, totalElectricPowerHigh: null, hydraulicOilTank: 3500, coolingWater: 240, machineWeight: "263(191+72)", machineDimension: "20.6x5.8x4.5" } },
            "IH100000 B(260mm)": { injection: { injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, injRateOptional: null, injSpeedOptional: null, screwDiameter: 260, injPressureKgcm2: 1220, injPressureMpa: 120, theoInjVolume: 71675, shotWeight: 66049, injRate: 3738, screwStroke: 1350, injSpeed: 70, plasticizingCapacity: 2102, screwRotationSpeed: 45 }, general: { motorCapacity: 330, motorCapacityOptional: null, heaterCapacity: 378, totalElectricPower: 708, totalElectricPowerHigh: null, hydraulicOilTank: 3500, coolingWater: 240, machineWeight: "263(191+72)", machineDimension: "20.6x5.8x4.5" } }
        }
    },

    "TH130A5": {
        clamping: { clampingForce: "130(1275)", moldOpeningForce: null, tieBarDistance: "470 x 470", platenDimension: "680 x 680", daylight: 400, maxDaylight: 850, minMoldHeight: 150, maxMoldHeight: 450, ejectorForce: "3.7(36.3)", ejectorStroke: 130, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH190 O(25mm)": { injection: { screwDiameter: 25, injPressureKgcm2: 2688, injPressureMpa: 264, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 64, shotWeight: 59, injRate: 62, injRateOptional: null, screwStroke: 130, injSpeed: 125, injSpeedOptional: null, plasticizingCapacity: 31, screwRotationSpeed: 360 }, general: { motorCapacity: 9.1, motorCapacityOptional: null, heaterCapacity: 6.1, totalElectricPower: 15.2, totalElectricPowerHigh: null, hydraulicOilTank: 190, coolingWater: 40, machineWeight: 4.5, machineDimension: null } },
            "IH190 A(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 2363, injPressureMpa: 232, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 80, shotWeight: 74, injRate: 77, injRateOptional: null, screwStroke: 130, injSpeed: 125, injSpeedOptional: null, plasticizingCapacity: 41, screwRotationSpeed: 360 }, general: { motorCapacity: 9.1, motorCapacityOptional: null, heaterCapacity: 7, totalElectricPower: 16.1, totalElectricPowerHigh: null, hydraulicOilTank: 190, coolingWater: 40, machineWeight: 4.5, machineDimension: null } },
            "IH190 B(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 1809, injPressureMpa: 177, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 105, shotWeight: 96, injRate: 101, injRateOptional: null, screwStroke: 130, injSpeed: 125, injSpeedOptional: null, plasticizingCapacity: 58, screwRotationSpeed: 360 }, general: { motorCapacity: 9.1, motorCapacityOptional: null, heaterCapacity: 7.8, totalElectricPower: 16.9, totalElectricPowerHigh: null, hydraulicOilTank: 190, coolingWater: 40, machineWeight: 4.5, machineDimension: null } },
            "IH300 O(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 2686, injPressureMpa: 263, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 92, shotWeight: 85, injRate: 74, injRateOptional: null, screwStroke: 150, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 41, screwRotationSpeed: 360 }, general: { motorCapacity: 9.1, motorCapacityOptional: null, heaterCapacity: 7, totalElectricPower: 16.1, totalElectricPowerHigh: null, hydraulicOilTank: 190, coolingWater: 40, machineWeight: 5, machineDimension: "4.9 x 1.5 x 1.7" } },
            "IH300 A(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 2450, injPressureMpa: 240, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 121, shotWeight: 111, injRate: 97, injRateOptional: null, screwStroke: 150, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 58, screwRotationSpeed: 360 }, general: { motorCapacity: 9.1, motorCapacityOptional: null, heaterCapacity: 7.8, totalElectricPower: 16.9, totalElectricPowerHigh: null, hydraulicOilTank: 190, coolingWater: 40, machineWeight: 5, machineDimension: null } },
            "IH300 B(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 1936, injPressureMpa: 190, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 153, shotWeight: 141, injRate: 122, injRateOptional: null, screwStroke: 150, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 82, screwRotationSpeed: 360 }, general: { motorCapacity: 9.1, motorCapacityOptional: null, heaterCapacity: 9.1, totalElectricPower: 18.2, totalElectricPowerHigh: null, hydraulicOilTank: 190, coolingWater: 40, machineWeight: 5, machineDimension: null } },
            "IH600 O(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 2690, injPressureMpa: 264, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 204, shotWeight: 188, injRate: 122, injRateOptional: null, screwStroke: 200, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 69, screwRotationSpeed: 300 }, general: { motorCapacity: 15.7, motorCapacityOptional: null, heaterCapacity: 9.9, totalElectricPower: 25.6, totalElectricPowerHigh: null, hydraulicOilTank: 190, coolingWater: 40, machineWeight: 5.5, machineDimension: null } },
            "IH600 A(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 2431, injPressureMpa: 238, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 251, shotWeight: 232, injRate: 151, injRateOptional: null, screwStroke: 200, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 94, screwRotationSpeed: 300 }, general: { motorCapacity: 15.7, motorCapacityOptional: null, heaterCapacity: 11.2, totalElectricPower: 26.9, totalElectricPowerHigh: null, hydraulicOilTank: 190, coolingWater: 40, machineWeight: 5.5, machineDimension: null } },
            "IH600 B(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 1920, injPressureMpa: 188, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 318, shotWeight: 293, injRate: 191, injRateOptional: null, screwStroke: 200, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 127, screwRotationSpeed: 300 }, general: { motorCapacity: 15.7, motorCapacityOptional: null, heaterCapacity: 12.6, totalElectricPower: 28.3, totalElectricPowerHigh: null, hydraulicOilTank: 190, coolingWater: 40, machineWeight: 5.5, machineDimension: null } }
        }
    },

    "TH190A5": {
        clamping: { clampingForce: "190(1863)", moldOpeningForce: null, tieBarDistance: "570 x 570", platenDimension: "840 x 790", daylight: 500, maxDaylight: 1000, minMoldHeight: 180, maxMoldHeight: 500, ejectorForce: "4.5(44.1)", ejectorStroke: 160, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH300 O(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 2686, injPressureMpa: 263, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 92, shotWeight: 85, injRate: 74, injRateOptional: null, screwStroke: 150, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 41, screwRotationSpeed: 360 }, general: { motorCapacity: 15.7, motorCapacityOptional: null, heaterCapacity: 7, totalElectricPower: 22.7, totalElectricPowerHigh: null, hydraulicOilTank: 300, coolingWater: 40, machineWeight: 6.5, machineDimension: null } },
            "IH300 A(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 2450, injPressureMpa: 240, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 121, shotWeight: 111, injRate: 97, injRateOptional: null, screwStroke: 150, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 58, screwRotationSpeed: 360 }, general: { motorCapacity: 15.7, motorCapacityOptional: null, heaterCapacity: 7.8, totalElectricPower: 23.5, totalElectricPowerHigh: null, hydraulicOilTank: 300, coolingWater: 40, machineWeight: 6.5, machineDimension: null } },
            "IH300 B(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 1936, injPressureMpa: 190, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 153, shotWeight: 141, injRate: 122, injRateOptional: null, screwStroke: 150, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 82, screwRotationSpeed: 360 }, general: { motorCapacity: 15.7, motorCapacityOptional: null, heaterCapacity: 9.1, totalElectricPower: 24.8, totalElectricPowerHigh: null, hydraulicOilTank: 300, coolingWater: 40, machineWeight: 6.5, machineDimension: null } },
            "IH600 O(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 2690, injPressureMpa: 264, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 204, shotWeight: 188, injRate: 122, injRateOptional: null, screwStroke: 200, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 69, screwRotationSpeed: 300 }, general: { motorCapacity: 15.7, motorCapacityOptional: null, heaterCapacity: 9.9, totalElectricPower: 25.6, totalElectricPowerHigh: null, hydraulicOilTank: 300, coolingWater: 40, machineWeight: 7, machineDimension: "5.8 x 1.6 x 1.9" } },
            "IH600 A(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 2431, injPressureMpa: 238, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 251, shotWeight: 232, injRate: 151, injRateOptional: null, screwStroke: 200, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 94, screwRotationSpeed: 300 }, general: { motorCapacity: 15.7, motorCapacityOptional: null, heaterCapacity: 11.2, totalElectricPower: 26.9, totalElectricPowerHigh: null, hydraulicOilTank: 300, coolingWater: 40, machineWeight: 7, machineDimension: null } },
            "IH600 B(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 1920, injPressureMpa: 188, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 318, shotWeight: 293, injRate: 191, injRateOptional: null, screwStroke: 200, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 127, screwRotationSpeed: 300 }, general: { motorCapacity: 15.7, motorCapacityOptional: null, heaterCapacity: 12.6, totalElectricPower: 28.3, totalElectricPowerHigh: null, hydraulicOilTank: 300, coolingWater: 40, machineWeight: 7, machineDimension: null } },
            "IH1000 O(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 2600, injPressureMpa: 255, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 366, shotWeight: 337, injRate: 175, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 110, screwRotationSpeed: 260 }, general: { motorCapacity: 19.8, motorCapacityOptional: null, heaterCapacity: 14.6, totalElectricPower: 34.4, totalElectricPowerHigh: null, hydraulicOilTank: 300, coolingWater: 40, machineWeight: 7.5, machineDimension: null } },
            "IH1000 A(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2258, injPressureMpa: 221, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 452, shotWeight: 416, injRate: 217, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 148, screwRotationSpeed: 260 }, general: { motorCapacity: 19.8, motorCapacityOptional: null, heaterCapacity: 17.1, totalElectricPower: 36.9, totalElectricPowerHigh: null, hydraulicOilTank: 300, coolingWater: 40, machineWeight: 7.5, machineDimension: null } },
            "IH1000 B(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 1866, injPressureMpa: 183, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 546, shotWeight: 504, injRate: 262, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 189, screwRotationSpeed: 260 }, general: { motorCapacity: 19.8, motorCapacityOptional: null, heaterCapacity: 18.7, totalElectricPower: 38.5, totalElectricPowerHigh: null, hydraulicOilTank: 300, coolingWater: 40, machineWeight: 7.5, machineDimension: null } }
        }
    },

    "TH240A5": {
        clamping: { clampingForce: "240(2354)", moldOpeningForce: null, tieBarDistance: "625 x 625", platenDimension: "900 x 870", daylight: 550, maxDaylight: 1150, minMoldHeight: 200, maxMoldHeight: 600, ejectorForce: "6.3(61.8)", ejectorStroke: 180, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH600 O(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 2690, injPressureMpa: 264, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 204, shotWeight: 188, injRate: 122, injRateOptional: null, screwStroke: 200, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 69, screwRotationSpeed: 300 }, general: { motorCapacity: 19.8, motorCapacityOptional: null, heaterCapacity: 9.9, totalElectricPower: 29.7, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 9.3, machineDimension: null } },
            "IH600 A(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 2431, injPressureMpa: 238, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 251, shotWeight: 232, injRate: 151, injRateOptional: null, screwStroke: 200, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 94, screwRotationSpeed: 300 }, general: { motorCapacity: 19.8, motorCapacityOptional: null, heaterCapacity: 11.2, totalElectricPower: 31, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 9.3, machineDimension: null } },
            "IH600 B(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 1920, injPressureMpa: 188, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 318, shotWeight: 293, injRate: 191, injRateOptional: null, screwStroke: 200, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 127, screwRotationSpeed: 300 }, general: { motorCapacity: 19.8, motorCapacityOptional: null, heaterCapacity: 12.6, totalElectricPower: 32.4, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 9.3, machineDimension: null } },
            "IH1000 O(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 2600, injPressureMpa: 255, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 366, shotWeight: 337, injRate: 175, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 110, screwRotationSpeed: 260 }, general: { motorCapacity: 19.8, motorCapacityOptional: null, heaterCapacity: 14.6, totalElectricPower: 34.4, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 9.8, machineDimension: "6.5 x 1.7 x 2.1" } },
            "IH1000 A(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2258, injPressureMpa: 221, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 452, shotWeight: 416, injRate: 217, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 148, screwRotationSpeed: 260 }, general: { motorCapacity: 19.8, motorCapacityOptional: null, heaterCapacity: 17.1, totalElectricPower: 36.9, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 9.8, machineDimension: null } },
            "IH1000 B(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 1866, injPressureMpa: 183, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 546, shotWeight: 504, injRate: 262, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 189, screwRotationSpeed: 260 }, general: { motorCapacity: 19.8, motorCapacityOptional: null, heaterCapacity: 18.7, totalElectricPower: 38.5, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 9.8, machineDimension: null } },
            "IH1250 O(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2594, injPressureMpa: 254, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 481, shotWeight: 443, injRate: 217, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 142, screwRotationSpeed: 250 }, general: { motorCapacity: 25.1, motorCapacityOptional: null, heaterCapacity: 19.1, totalElectricPower: 44.2, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 10.3, machineDimension: null } },
            "IH1250 A(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2144, injPressureMpa: 210, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 582, shotWeight: 536, injRate: 262, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 182, screwRotationSpeed: 250 }, general: { motorCapacity: 25.1, motorCapacityOptional: null, heaterCapacity: 21, totalElectricPower: 46.1, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 10.3, machineDimension: null } },
            "IH1250 B(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 1801, injPressureMpa: 177, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 693, shotWeight: 638, injRate: 312, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 233, screwRotationSpeed: 250 }, general: { motorCapacity: 25.1, motorCapacityOptional: null, heaterCapacity: 23.8, totalElectricPower: 48.9, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 10.3, machineDimension: null } }
        }
    },

    "TH280A5": {
        clamping: { clampingForce: "280(2746)", moldOpeningForce: null, tieBarDistance: "670 x 670", platenDimension: "970 x 980", daylight: 600, maxDaylight: 1250, minMoldHeight: 250, maxMoldHeight: 650, ejectorForce: "6.3(61.8)", ejectorStroke: 200, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH1000 O(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 2600, injPressureMpa: 255, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 366, shotWeight: 337, injRate: 175, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 110, screwRotationSpeed: 260 }, general: { motorCapacity: 25.1, motorCapacityOptional: null, heaterCapacity: 14.6, totalElectricPower: 39.7, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 11.8, machineDimension: null } },
            "IH1000 A(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2258, injPressureMpa: 221, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 452, shotWeight: 416, injRate: 217, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 148, screwRotationSpeed: 260 }, general: { motorCapacity: 25.1, motorCapacityOptional: null, heaterCapacity: 17.1, totalElectricPower: 42.2, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 11.8, machineDimension: null } },
            "IH1000 B(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 1866, injPressureMpa: 183, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 546, shotWeight: 504, injRate: 262, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 189, screwRotationSpeed: 260 }, general: { motorCapacity: 25.1, motorCapacityOptional: null, heaterCapacity: 18.7, totalElectricPower: 43.8, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 11.8, machineDimension: null } },
            "IH1250 O(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2594, injPressureMpa: 254, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 481, shotWeight: 443, injRate: 217, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 142, screwRotationSpeed: 250 }, general: { motorCapacity: 25.1, motorCapacityOptional: null, heaterCapacity: 19.1, totalElectricPower: 44.2, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 12.3, machineDimension: "6.8 x 1.8 x 2.1" } },
            "IH1250 A(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2144, injPressureMpa: 210, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 582, shotWeight: 536, injRate: 262, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 182, screwRotationSpeed: 250 }, general: { motorCapacity: 25.1, motorCapacityOptional: null, heaterCapacity: 21, totalElectricPower: 46.1, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 12.3, machineDimension: null } },
            "IH1250 B(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 1801, injPressureMpa: 177, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 693, shotWeight: 638, injRate: 312, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 233, screwRotationSpeed: 250 }, general: { motorCapacity: 25.1, motorCapacityOptional: null, heaterCapacity: 23.8, totalElectricPower: 48.9, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 12.3, machineDimension: null } },
            "IH1800 O(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2494, injPressureMpa: 245, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 677, shotWeight: 624, injRate: 249, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 160, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 21, totalElectricPower: 53.7, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 12.8, machineDimension: null } },
            "IH1800 A(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 2257, injPressureMpa: 221, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 806, shotWeight: 743, injRate: 296, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 205, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 23.8, totalElectricPower: 56.5, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 12.8, machineDimension: null } },
            "IH1800 B(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2008, injPressureMpa: 197, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 946, shotWeight: 871, injRate: 347, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 253, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 25.7, totalElectricPower: 58.4, totalElectricPowerHigh: null, hydraulicOilTank: 340, coolingWater: 40, machineWeight: 12.8, machineDimension: null } }
        }
    },

    "TH380A5": {
        clamping: { clampingForce: "380(3727)", moldOpeningForce: null, tieBarDistance: "770 x 770", platenDimension: "1160 x 1090", daylight: 700, maxDaylight: 1450, minMoldHeight: 300, maxMoldHeight: 750, ejectorForce: "9.6(94.2)", ejectorStroke: 210, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH1250 O(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2594, injPressureMpa: 254, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 481, shotWeight: 443, injRate: 217, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 142, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 19.1, totalElectricPower: 51.8, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 15.5, machineDimension: null } },
            "IH1250 A(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2144, injPressureMpa: 210, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 582, shotWeight: 536, injRate: 262, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 182, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 21, totalElectricPower: 53.7, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 15.5, machineDimension: null } },
            "IH1250 B(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 1801, injPressureMpa: 177, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 693, shotWeight: 638, injRate: 312, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 233, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 23.8, totalElectricPower: 56.5, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 15.5, machineDimension: null } },
            "IH1800 O(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2494, injPressureMpa: 245, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 677, shotWeight: 624, injRate: 249, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 160, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 21, totalElectricPower: 53.7, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 16, machineDimension: "7.6 x 1.9 x 2.1" } },
            "IH1800 A(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 2257, injPressureMpa: 221, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 806, shotWeight: 743, injRate: 296, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 205, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 23.8, totalElectricPower: 56.5, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 16, machineDimension: null } },
            "IH1800 B(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2008, injPressureMpa: 197, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 946, shotWeight: 871, injRate: 347, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 253, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 25.7, totalElectricPower: 58.4, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 16, machineDimension: null } },
            "IH2800 O(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2375, injPressureMpa: 233, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1161, shotWeight: 1070, injRate: 313, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 201, screwRotationSpeed: 175 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 18.4, totalElectricPower: 51.1, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 17, machineDimension: null } },
            "IH2800 A(70mm)": { injection: { screwDiameter: 70, injPressureKgcm2: 2048, injPressureMpa: 201, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1347, shotWeight: 1241, injRate: 363, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 244, screwRotationSpeed: 175 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 20.6, totalElectricPower: 53.3, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 17, machineDimension: null } },
            "IH2800 B(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 1568, injPressureMpa: 154, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1759, shotWeight: 1621, injRate: 474, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 347, screwRotationSpeed: 175 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 24.1, totalElectricPower: 56.8, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 17, machineDimension: null } }
        }
    },

    "TH420A5": {
        clamping: { clampingForce: "420(4119)", moldOpeningForce: null, tieBarDistance: "820 x 820", platenDimension: "1210 x 1140", daylight: 750, maxDaylight: 1550, minMoldHeight: 350, maxMoldHeight: 800, ejectorForce: "9.6(94.2)", ejectorStroke: 210, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH1250 O(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2594, injPressureMpa: 254, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 481, shotWeight: 443, injRate: 217, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 142, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 19.1, totalElectricPower: 51.8, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 16.5, machineDimension: null } },
            "IH1250 A(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2144, injPressureMpa: 210, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 582, shotWeight: 536, injRate: 262, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 182, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 21, totalElectricPower: 53.7, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 16.5, machineDimension: null } },
            "IH1250 B(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 1801, injPressureMpa: 177, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 693, shotWeight: 638, injRate: 312, injRateOptional: null, screwStroke: 245, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 233, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 23.8, totalElectricPower: 56.5, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 16.5, machineDimension: null } },
            "IH1800 O(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2494, injPressureMpa: 245, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 677, shotWeight: 624, injRate: 249, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 160, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 21, totalElectricPower: 53.7, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 17, machineDimension: "7.8 x 2.0 x 2.1" } },
            "IH1800 A(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 2257, injPressureMpa: 221, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 806, shotWeight: 743, injRate: 296, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 205, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 23.8, totalElectricPower: 56.5, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 17, machineDimension: null } },
            "IH1800 B(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2008, injPressureMpa: 197, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 946, shotWeight: 871, injRate: 347, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 253, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 25.7, totalElectricPower: 58.4, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 17, machineDimension: null } },
            "IH2800 O(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2375, injPressureMpa: 233, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1161, shotWeight: 1070, injRate: 313, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 201, screwRotationSpeed: 175 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 18.4, totalElectricPower: 51.1, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 18, machineDimension: null } },
            "IH2800 A(70mm)": { injection: { screwDiameter: 70, injPressureKgcm2: 2048, injPressureMpa: 201, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1347, shotWeight: 1241, injRate: 363, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 244, screwRotationSpeed: 175 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 20.6, totalElectricPower: 53.3, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 18, machineDimension: null } },
            "IH2800 B(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 1568, injPressureMpa: 154, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1759, shotWeight: 1621, injRate: 474, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 347, screwRotationSpeed: 175 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 24.1, totalElectricPower: 56.8, totalElectricPowerHigh: null, hydraulicOilTank: 450, coolingWater: 65, machineWeight: 18, machineDimension: null } }
        }
    },

    "TH480A5": {
        clamping: { clampingForce: "480(4707)", moldOpeningForce: null, tieBarDistance: "870 x 870", platenDimension: "1270 x 1190", daylight: 800, maxDaylight: 1600, minMoldHeight: 350, maxMoldHeight: 800, ejectorForce: "14.9(146.2)", ejectorStroke: 230, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH1800 O(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2494, injPressureMpa: 245, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 677, shotWeight: 624, injRate: 249, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 160, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 21, totalElectricPower: 53.7, totalElectricPowerHigh: null, hydraulicOilTank: 500, coolingWater: 65, machineWeight: 24, machineDimension: null } },
            "IH1800 A(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 2257, injPressureMpa: 221, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 806, shotWeight: 743, injRate: 296, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 205, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 23.8, totalElectricPower: 56.5, totalElectricPowerHigh: null, hydraulicOilTank: 500, coolingWater: 65, machineWeight: 24, machineDimension: null } },
            "IH1800 B(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2008, injPressureMpa: 197, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 946, shotWeight: 871, injRate: 347, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 253, screwRotationSpeed: 220 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 25.7, totalElectricPower: 58.4, totalElectricPowerHigh: null, hydraulicOilTank: 500, coolingWater: 65, machineWeight: 24, machineDimension: null } },
            "IH2800 O(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2375, injPressureMpa: 233, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1161, shotWeight: 1070, injRate: 313, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 201, screwRotationSpeed: 175 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 18.4, totalElectricPower: 51.1, totalElectricPowerHigh: null, hydraulicOilTank: 500, coolingWater: 65, machineWeight: 25, machineDimension: "8.7 x 2.1 x 2.2" } },
            "IH2800 A(70mm)": { injection: { screwDiameter: 70, injPressureKgcm2: 2048, injPressureMpa: 201, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1347, shotWeight: 1241, injRate: 363, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 244, screwRotationSpeed: 175 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 20.6, totalElectricPower: 53.3, totalElectricPowerHigh: null, hydraulicOilTank: 500, coolingWater: 65, machineWeight: 25, machineDimension: null } },
            "IH2800 B(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 1568, injPressureMpa: 154, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1759, shotWeight: 1621, injRate: 474, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 347, screwRotationSpeed: 175 }, general: { motorCapacity: 32.7, motorCapacityOptional: null, heaterCapacity: 24.1, totalElectricPower: 56.8, totalElectricPowerHigh: null, hydraulicOilTank: 500, coolingWater: 65, machineWeight: 25, machineDimension: null } }
        }
    },

    "TE50A5": {
        clamping: { clampingForce: "50(490)", moldOpeningForce: null, tieBarDistance: "370x370", platenDimension: "550x550", daylight: 300, maxDaylight: 700, minMoldHeight: 140, maxMoldHeight: 400, ejectorForce: "1.9(19)", ejectorStroke: 80, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE70 S(16mm)": { injection: { screwDiameter: 16, injPressureKgcm2: 2800, injPressureMpa: 275, injHoldingPressureKgcm2: 2520, injHoldingPressureMpa: 247, theoInjVolume: 20, shotWeight: 18, injRate: 70, injRateOptional: 141, screwStroke: 100, injSpeed: 350, injSpeedOptional: 700, plasticizingCapacity: 12, screwRotationSpeed: 470 }, general: { motorCapacity: 11, motorCapacityOptional: 22, heaterCapacity: 3.6, totalElectricPower: 14.6, totalElectricPowerHigh: 25.6, machineWeight: 3.9, machineDimension: "4.2x1.3x1.7", hydraulicOilTank: null, coolingWater: null } },
            "IE70 O(18mm)": { injection: { screwDiameter: 18, injPressureKgcm2: 2597, injPressureMpa: 255, injHoldingPressureKgcm2: 2337, injHoldingPressureMpa: 229, theoInjVolume: 25, shotWeight: 23, injRate: 89, injRateOptional: 178, screwStroke: 100, injSpeed: 350, injSpeedOptional: 700, plasticizingCapacity: 17, screwRotationSpeed: 470 }, general: { motorCapacity: 11, motorCapacityOptional: 22, heaterCapacity: 3.9, totalElectricPower: 14.9, totalElectricPowerHigh: 25.9, machineWeight: 3.9, machineDimension: "4.2x1.3x1.7", hydraulicOilTank: null, coolingWater: null } },
            "IE70 A(20mm)": { injection: { screwDiameter: 20, injPressureKgcm2: 2103, injPressureMpa: 206, injHoldingPressureKgcm2: 1893, injHoldingPressureMpa: 186, theoInjVolume: 31, shotWeight: 28, injRate: 110, injRateOptional: 220, screwStroke: 100, injSpeed: 350, injSpeedOptional: 700, plasticizingCapacity: 24, screwRotationSpeed: 470 }, general: { motorCapacity: 11, motorCapacityOptional: 22, heaterCapacity: 4.3, totalElectricPower: 15.3, totalElectricPowerHigh: 26.3, machineWeight: 3.9, machineDimension: "4.2x1.3x1.7", hydraulicOilTank: null, coolingWater: null } },
            "IE70 B(22mm)": { injection: { screwDiameter: 22, injPressureKgcm2: 1738, injPressureMpa: 170, injHoldingPressureKgcm2: 1564, injHoldingPressureMpa: 153, theoInjVolume: 38, shotWeight: 35, injRate: 133, injRateOptional: 266, screwStroke: 100, injSpeed: 350, injSpeedOptional: 700, plasticizingCapacity: 29, screwRotationSpeed: 470 }, general: { motorCapacity: 11, motorCapacityOptional: 22, heaterCapacity: 4.7, totalElectricPower: 15.7, totalElectricPowerHigh: 26.7, machineWeight: 3.9, machineDimension: "4.2x1.3x1.7", hydraulicOilTank: null, coolingWater: null } },
            "IE125 O(22mm)": { injection: { screwDiameter: 22, injPressureKgcm2: 2610, injPressureMpa: 256, injHoldingPressureKgcm2: 2349, injHoldingPressureMpa: 230, theoInjVolume: 48, shotWeight: 44, injRate: 95, injRateOptional: 190, screwStroke: 125, injSpeed: 250, injSpeedOptional: 500, plasticizingCapacity: 29, screwRotationSpeed: 470 }, general: { motorCapacity: 11, motorCapacityOptional: 22, heaterCapacity: 4.5, totalElectricPower: 15.5, totalElectricPowerHigh: 26.5, machineWeight: 3.9, machineDimension: "4.2x1.3x1.7", hydraulicOilTank: null, coolingWater: null } },
            "IE125 A(25mm)": { injection: { screwDiameter: 25, injPressureKgcm2: 2021, injPressureMpa: 198, injHoldingPressureKgcm2: 1819, injHoldingPressureMpa: 178, theoInjVolume: 61, shotWeight: 56, injRate: 123, injRateOptional: 245, screwStroke: 125, injSpeed: 250, injSpeedOptional: 500, plasticizingCapacity: 41, screwRotationSpeed: 470 }, general: { motorCapacity: 11, motorCapacityOptional: 22, heaterCapacity: 5.1, totalElectricPower: 16.1, totalElectricPowerHigh: 27.1, machineWeight: 3.9, machineDimension: "4.2x1.3x1.7", hydraulicOilTank: null, coolingWater: null } },
            "IE125 B(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 1612, injPressureMpa: 158, injHoldingPressureKgcm2: 1451, injHoldingPressureMpa: 142, theoInjVolume: 77, shotWeight: 70, injRate: 154, injRateOptional: 308, screwStroke: 125, injSpeed: 250, injSpeedOptional: 500, plasticizingCapacity: 54, screwRotationSpeed: 470 }, general: { motorCapacity: 11, motorCapacityOptional: 22, heaterCapacity: 5.9, totalElectricPower: 16.9, totalElectricPowerHigh: 27.9, machineWeight: 3.9, machineDimension: "4.2x1.3x1.7", hydraulicOilTank: null, coolingWater: null } },
            "IE260 O(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 2644, injPressureMpa: 259, injHoldingPressureKgcm2: 2380, injHoldingPressureMpa: 233, theoInjVolume: 99, shotWeight: 90, injRate: 132, injRateOptional: 265, screwStroke: 160, injSpeed: 215, injSpeedOptional: 430, plasticizingCapacity: 45, screwRotationSpeed: 400 }, general: { motorCapacity: 15.1, motorCapacityOptional: 30.2, heaterCapacity: 7, totalElectricPower: 22.1, totalElectricPowerHigh: 37.2, machineWeight: 4.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE260 A(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 2024, injPressureMpa: 198, injHoldingPressureKgcm2: 1822, injHoldingPressureMpa: 179, theoInjVolume: 129, shotWeight: 117, injRate: 173, injRateOptional: 346, screwStroke: 160, injSpeed: 215, injSpeedOptional: 430, plasticizingCapacity: 64, screwRotationSpeed: 400 }, general: { motorCapacity: 15.1, motorCapacityOptional: 30.2, heaterCapacity: 7.8, totalElectricPower: 22.9, totalElectricPowerHigh: 38, machineWeight: 4.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE260 B(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 1599, injPressureMpa: 157, injHoldingPressureKgcm2: 1439, injHoldingPressureMpa: 141, theoInjVolume: 163, shotWeight: 148, injRate: 219, injRateOptional: 438, screwStroke: 160, injSpeed: 215, injSpeedOptional: 430, plasticizingCapacity: 92, screwRotationSpeed: 400 }, general: { motorCapacity: 15.1, motorCapacityOptional: 30.2, heaterCapacity: 9.1, totalElectricPower: 24.2, totalElectricPowerHigh: 39.3, machineWeight: 4.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TE110A5": {
        clamping: { clampingForce: "110(1078)", moldOpeningForce: null, tieBarDistance: "470x470", platenDimension: "680x680", daylight: 400, maxDaylight: 850, minMoldHeight: 150, maxMoldHeight: 450, ejectorForce: "3.1(31)", ejectorStroke: 120, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE125 O(22mm)": { injection: { screwDiameter: 22, injPressureKgcm2: 2610, injPressureMpa: 256, injHoldingPressureKgcm2: 2349, injHoldingPressureMpa: 230, theoInjVolume: 48, shotWeight: 44, injRate: 95, injRateOptional: 190, screwStroke: 125, injSpeed: 250, injSpeedOptional: 500, plasticizingCapacity: 29, screwRotationSpeed: 470 }, general: { motorCapacity: 11, motorCapacityOptional: 22, heaterCapacity: 4.5, totalElectricPower: 15.5, totalElectricPowerHigh: 26.5, machineWeight: 4.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE125 A(25mm)": { injection: { screwDiameter: 25, injPressureKgcm2: 2021, injPressureMpa: 198, injHoldingPressureKgcm2: 1819, injHoldingPressureMpa: 178, theoInjVolume: 61, shotWeight: 56, injRate: 123, injRateOptional: 245, screwStroke: 125, injSpeed: 250, injSpeedOptional: 500, plasticizingCapacity: 41, screwRotationSpeed: 470 }, general: { motorCapacity: 11, motorCapacityOptional: 22, heaterCapacity: 5.1, totalElectricPower: 16.1, totalElectricPowerHigh: 27.1, machineWeight: 4.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE125 B(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 1612, injPressureMpa: 158, injHoldingPressureKgcm2: 1451, injHoldingPressureMpa: 142, theoInjVolume: 77, shotWeight: 70, injRate: 154, injRateOptional: 308, screwStroke: 125, injSpeed: 250, injSpeedOptional: 500, plasticizingCapacity: 54, screwRotationSpeed: 470 }, general: { motorCapacity: 11, motorCapacityOptional: 22, heaterCapacity: 5.9, totalElectricPower: 16.9, totalElectricPowerHigh: 27.9, machineWeight: 4.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE260 O(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 2644, injPressureMpa: 259, injHoldingPressureKgcm2: 2380, injHoldingPressureMpa: 233, theoInjVolume: 99, shotWeight: 90, injRate: 132, injRateOptional: 265, screwStroke: 160, injSpeed: 215, injSpeedOptional: 430, plasticizingCapacity: 45, screwRotationSpeed: 400 }, general: { motorCapacity: 15.1, motorCapacityOptional: 30.2, heaterCapacity: 7, totalElectricPower: 22.1, totalElectricPowerHigh: 37.2, machineWeight: 4.7, machineDimension: "5.0 x 1.3 x 1.8", hydraulicOilTank: null, coolingWater: null } },
            "IE260 A(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 2024, injPressureMpa: 198, injHoldingPressureKgcm2: 1822, injHoldingPressureMpa: 179, theoInjVolume: 129, shotWeight: 117, injRate: 173, injRateOptional: 346, screwStroke: 160, injSpeed: 215, injSpeedOptional: 430, plasticizingCapacity: 64, screwRotationSpeed: 400 }, general: { motorCapacity: 15.1, motorCapacityOptional: 30.2, heaterCapacity: 7.8, totalElectricPower: 22.9, totalElectricPowerHigh: 38, machineWeight: 4.7, machineDimension: "5.0 x 1.3 x 1.8", hydraulicOilTank: null, coolingWater: null } },
            "IE260 B(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 1599, injPressureMpa: 157, injHoldingPressureKgcm2: 1439, injHoldingPressureMpa: 141, theoInjVolume: 163, shotWeight: 148, injRate: 219, injRateOptional: 438, screwStroke: 160, injSpeed: 215, injSpeedOptional: 430, plasticizingCapacity: 92, screwRotationSpeed: 400 }, general: { motorCapacity: 15.1, motorCapacityOptional: 30.2, heaterCapacity: 9.1, totalElectricPower: 24.2, totalElectricPowerHigh: 39.3, machineWeight: 4.7, machineDimension: "5.0 x 1.3 x 1.8", hydraulicOilTank: null, coolingWater: null } },
            "IE370 O(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 2573, injPressureMpa: 252, injHoldingPressureKgcm2: 2316, injHoldingPressureMpa: 227, theoInjVolume: 145, shotWeight: 132, injRate: 161, injRateOptional: 322, screwStroke: 180, injSpeed: 200, injSpeedOptional: 400, plasticizingCapacity: 60, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 8.5, totalElectricPower: 26.3, totalElectricPowerHigh: 44.1, machineWeight: 5.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE370 A(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 2033, injPressureMpa: 199, injHoldingPressureKgcm2: 1830, injHoldingPressureMpa: 179, theoInjVolume: 183, shotWeight: 167, injRate: 204, injRateOptional: 407, screwStroke: 180, injSpeed: 200, injSpeedOptional: 400, plasticizingCapacity: 86, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 9.9, totalElectricPower: 27.7, totalElectricPowerHigh: 45.5, machineWeight: 5.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE370 B(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 1647, injPressureMpa: 162, injHoldingPressureKgcm2: 1482, injHoldingPressureMpa: 145, theoInjVolume: 226, shotWeight: 206, injRate: 251, injRateOptional: 503, screwStroke: 180, injSpeed: 200, injSpeedOptional: 400, plasticizingCapacity: 117, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 11.2, totalElectricPower: 29, totalElectricPowerHigh: 46.8, machineWeight: 5.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TE170A5": {
        clamping: { clampingForce: "170(1667)", moldOpeningForce: null, tieBarDistance: "570x570", platenDimension: "840x790", daylight: 500, maxDaylight: 1000, minMoldHeight: 180, maxMoldHeight: 500, ejectorForce: "3.4(34)", ejectorStroke: 150, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE260 O(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 2644, injPressureMpa: 259, injHoldingPressureKgcm2: 2380, injHoldingPressureMpa: 233, theoInjVolume: 99, shotWeight: 90, injRate: 132, injRateOptional: 265, screwStroke: 160, injSpeed: 215, injSpeedOptional: 430, plasticizingCapacity: 45, screwRotationSpeed: 400 }, general: { motorCapacity: 15.1, motorCapacityOptional: 30.2, heaterCapacity: 7, totalElectricPower: 22.1, totalElectricPowerHigh: 37.2, machineWeight: 7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE260 A(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 2024, injPressureMpa: 198, injHoldingPressureKgcm2: 1822, injHoldingPressureMpa: 179, theoInjVolume: 129, shotWeight: 117, injRate: 173, injRateOptional: 346, screwStroke: 160, injSpeed: 215, injSpeedOptional: 430, plasticizingCapacity: 64, screwRotationSpeed: 400 }, general: { motorCapacity: 15.1, motorCapacityOptional: 30.2, heaterCapacity: 7.8, totalElectricPower: 22.9, totalElectricPowerHigh: 38, machineWeight: 7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE260 B(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 1599, injPressureMpa: 157, injHoldingPressureKgcm2: 1439, injHoldingPressureMpa: 141, theoInjVolume: 163, shotWeight: 148, injRate: 219, injRateOptional: 438, screwStroke: 160, injSpeed: 215, injSpeedOptional: 430, plasticizingCapacity: 92, screwRotationSpeed: 400 }, general: { motorCapacity: 15.1, motorCapacityOptional: 30.2, heaterCapacity: 9.1, totalElectricPower: 24.2, totalElectricPowerHigh: 39.3, machineWeight: 7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE370 O(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 2573, injPressureMpa: 252, injHoldingPressureKgcm2: 2316, injHoldingPressureMpa: 227, theoInjVolume: 145, shotWeight: 132, injRate: 161, injRateOptional: 322, screwStroke: 180, injSpeed: 200, injSpeedOptional: 400, plasticizingCapacity: 60, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 8.5, totalElectricPower: 26.3, totalElectricPowerHigh: 44.1, machineWeight: 7.5, machineDimension: "5.7 x 1.6 x 2.0", hydraulicOilTank: null, coolingWater: null } },
            "IE370 A(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 2033, injPressureMpa: 199, injHoldingPressureKgcm2: 1830, injHoldingPressureMpa: 179, theoInjVolume: 183, shotWeight: 167, injRate: 204, injRateOptional: 407, screwStroke: 180, injSpeed: 200, injSpeedOptional: 400, plasticizingCapacity: 86, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 9.9, totalElectricPower: 27.7, totalElectricPowerHigh: 45.5, machineWeight: 7.5, machineDimension: "5.7 x 1.6 x 2.0", hydraulicOilTank: null, coolingWater: null } },
            "IE370 B(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 1647, injPressureMpa: 162, injHoldingPressureKgcm2: 1482, injHoldingPressureMpa: 145, theoInjVolume: 226, shotWeight: 206, injRate: 251, injRateOptional: 503, screwStroke: 180, injSpeed: 200, injSpeedOptional: 400, plasticizingCapacity: 117, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 11.2, totalElectricPower: 29, totalElectricPowerHigh: 46.8, machineWeight: 7.5, machineDimension: "5.7 x 1.6 x 2.0", hydraulicOilTank: null, coolingWater: null } },
            "IE520 O(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 2541, injPressureMpa: 249, injHoldingPressureKgcm2: 2287, injHoldingPressureMpa: 224, theoInjVolume: 204, shotWeight: 186, injRate: 163, injRateOptional: 326, screwStroke: 200, injSpeed: 160, injSpeedOptional: 320, plasticizingCapacity: 86, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 9.9, totalElectricPower: 27.7, totalElectricPowerHigh: 45.5, machineWeight: 8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE520 A(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 2059, injPressureMpa: 202, injHoldingPressureKgcm2: 1853, injHoldingPressureMpa: 182, theoInjVolume: 251, shotWeight: 228, injRate: 201, injRateOptional: 402, screwStroke: 200, injSpeed: 160, injSpeedOptional: 320, plasticizingCapacity: 117, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 11.2, totalElectricPower: 29, totalElectricPowerHigh: 46.8, machineWeight: 8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE520 B(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 1627, injPressureMpa: 160, injHoldingPressureKgcm2: 1464, injHoldingPressureMpa: 144, theoInjVolume: 318, shotWeight: 289, injRate: 254, injRateOptional: 509, screwStroke: 200, injSpeed: 160, injSpeedOptional: 320, plasticizingCapacity: 158, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 12.6, totalElectricPower: 30.4, totalElectricPowerHigh: 48.2, machineWeight: 8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TE220A5": {
        clamping: { clampingForce: "220(2157)", moldOpeningForce: null, tieBarDistance: "625x625", platenDimension: "900x870", daylight: 550, maxDaylight: 1150, minMoldHeight: 200, maxMoldHeight: 600, ejectorForce: "3.4(34)", ejectorStroke: 180, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE370 O(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 2573, injPressureMpa: 252, injHoldingPressureKgcm2: 2316, injHoldingPressureMpa: 227, theoInjVolume: 145, shotWeight: 132, injRate: 161, injRateOptional: 322, screwStroke: 180, injSpeed: 200, injSpeedOptional: 400, plasticizingCapacity: 60, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 8.5, totalElectricPower: 26.3, totalElectricPowerHigh: 44.1, machineWeight: 9.7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE370 A(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 2033, injPressureMpa: 199, injHoldingPressureKgcm2: 1830, injHoldingPressureMpa: 179, theoInjVolume: 183, shotWeight: 167, injRate: 204, injRateOptional: 407, screwStroke: 180, injSpeed: 200, injSpeedOptional: 400, plasticizingCapacity: 86, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 9.9, totalElectricPower: 27.7, totalElectricPowerHigh: 45.5, machineWeight: 9.7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE370 B(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 1647, injPressureMpa: 162, injHoldingPressureKgcm2: 1482, injHoldingPressureMpa: 145, theoInjVolume: 226, shotWeight: 206, injRate: 251, injRateOptional: 503, screwStroke: 180, injSpeed: 200, injSpeedOptional: 400, plasticizingCapacity: 117, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 11.2, totalElectricPower: 29, totalElectricPowerHigh: 46.8, machineWeight: 9.7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE520 O(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 2541, injPressureMpa: 249, injHoldingPressureKgcm2: 2287, injHoldingPressureMpa: 224, theoInjVolume: 204, shotWeight: 186, injRate: 163, injRateOptional: 326, screwStroke: 200, injSpeed: 160, injSpeedOptional: 320, plasticizingCapacity: 86, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 9.9, totalElectricPower: 27.7, totalElectricPowerHigh: 45.5, machineWeight: 10.3, machineDimension: "6.2 x 1.7 x 2.1", hydraulicOilTank: null, coolingWater: null } },
            "IE520 A(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 2059, injPressureMpa: 202, injHoldingPressureKgcm2: 1853, injHoldingPressureMpa: 182, theoInjVolume: 251, shotWeight: 228, injRate: 201, injRateOptional: 402, screwStroke: 200, injSpeed: 160, injSpeedOptional: 320, plasticizingCapacity: 117, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 11.2, totalElectricPower: 29, totalElectricPowerHigh: 46.8, machineWeight: 10.3, machineDimension: "6.2 x 1.7 x 2.1", hydraulicOilTank: null, coolingWater: null } },
            "IE520 B(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 1627, injPressureMpa: 160, injHoldingPressureKgcm2: 1464, injHoldingPressureMpa: 144, theoInjVolume: 318, shotWeight: 289, injRate: 254, injRateOptional: 509, screwStroke: 200, injSpeed: 160, injSpeedOptional: 320, plasticizingCapacity: 158, screwRotationSpeed: 375 }, general: { motorCapacity: 17.8, motorCapacityOptional: 35.6, heaterCapacity: 12.6, totalElectricPower: 30.4, totalElectricPowerHigh: 48.2, machineWeight: 10.3, machineDimension: "6.2 x 1.7 x 2.1", hydraulicOilTank: null, coolingWater: null } },
            "IE720 O(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 2605, injPressureMpa: 255, injHoldingPressureKgcm2: 2345, injHoldingPressureMpa: 230, theoInjVolume: 276, shotWeight: 251, injRate: 188, injRateOptional: 377, screwStroke: 220, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 117, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 46.2, heaterCapacity: 13.6, totalElectricPower: 36.7, totalElectricPowerHigh: 59.8, machineWeight: 10.8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE720 A(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 2058, injPressureMpa: 202, injHoldingPressureKgcm2: 1852, injHoldingPressureMpa: 182, theoInjVolume: 350, shotWeight: 319, injRate: 239, injRateOptional: 477, screwStroke: 220, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 158, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 46.2, heaterCapacity: 14.6, totalElectricPower: 37.7, totalElectricPowerHigh: 60.8, machineWeight: 10.8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE720 B(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 1667, injPressureMpa: 163, injHoldingPressureKgcm2: 1500, injHoldingPressureMpa: 147, theoInjVolume: 432, shotWeight: 393, injRate: 295, injRateOptional: 589, screwStroke: 220, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 213, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 46.2, heaterCapacity: 17.1, totalElectricPower: 40.2, totalElectricPowerHigh: 63.3, machineWeight: 10.8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TE280A5": {
        clamping: { clampingForce: "280(2745)", moldOpeningForce: null, tieBarDistance: "670x670", platenDimension: "970x980", daylight: 600, maxDaylight: 1250, minMoldHeight: 250, maxMoldHeight: 650, ejectorForce: "4.3(43)", ejectorStroke: 200, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE520 O(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 2541, injPressureMpa: 249, injHoldingPressureKgcm2: 2287, injHoldingPressureMpa: 224, theoInjVolume: 204, shotWeight: 186, injRate: 163, injRateOptional: 326, screwStroke: 200, injSpeed: 160, injSpeedOptional: 320, plasticizingCapacity: 86, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 35.6, heaterCapacity: 9.9, totalElectricPower: 33, totalElectricPowerHigh: 45.5, machineWeight: 14, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE520 A(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 2059, injPressureMpa: 202, injHoldingPressureKgcm2: 1853, injHoldingPressureMpa: 182, theoInjVolume: 251, shotWeight: 228, injRate: 201, injRateOptional: 402, screwStroke: 200, injSpeed: 160, injSpeedOptional: 320, plasticizingCapacity: 117, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 35.6, heaterCapacity: 11.2, totalElectricPower: 34.3, totalElectricPowerHigh: 46.8, machineWeight: 14, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE520 B(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 1627, injPressureMpa: 160, injHoldingPressureKgcm2: 1464, injHoldingPressureMpa: 144, theoInjVolume: 318, shotWeight: 289, injRate: 254, injRateOptional: 509, screwStroke: 200, injSpeed: 160, injSpeedOptional: 320, plasticizingCapacity: 158, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 35.6, heaterCapacity: 12.6, totalElectricPower: 35.7, totalElectricPowerHigh: 48.2, machineWeight: 14, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE720 O(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 2605, injPressureMpa: 255, injHoldingPressureKgcm2: 2345, injHoldingPressureMpa: 230, theoInjVolume: 276, shotWeight: 251, injRate: 188, injRateOptional: 377, screwStroke: 220, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 117, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 46.2, heaterCapacity: 13.6, totalElectricPower: 36.7, totalElectricPowerHigh: 59.8, machineWeight: 14.5, machineDimension: "6.9 x 1.8 x 2.1", hydraulicOilTank: null, coolingWater: null } },
            "IE720 A(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 2058, injPressureMpa: 202, injHoldingPressureKgcm2: 1852, injHoldingPressureMpa: 182, theoInjVolume: 350, shotWeight: 319, injRate: 239, injRateOptional: 477, screwStroke: 220, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 158, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 46.2, heaterCapacity: 14.6, totalElectricPower: 37.7, totalElectricPowerHigh: 60.8, machineWeight: 14.5, machineDimension: "6.9 x 1.8 x 2.1", hydraulicOilTank: null, coolingWater: null } },
            "IE720 B(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 1667, injPressureMpa: 163, injHoldingPressureKgcm2: 1500, injHoldingPressureMpa: 147, theoInjVolume: 432, shotWeight: 393, injRate: 295, injRateOptional: 589, screwStroke: 220, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 213, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 46.2, heaterCapacity: 17.1, totalElectricPower: 40.2, totalElectricPowerHigh: 63.3, machineWeight: 14.5, machineDimension: "6.9 x 1.8 x 2.1", hydraulicOilTank: null, coolingWater: null } },
            "IE1000 O(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 2525, injPressureMpa: 248, injHoldingPressureKgcm2: 2273, injHoldingPressureMpa: 223, theoInjVolume: 398, shotWeight: 362, injRate: 239, injRateOptional: 477, screwStroke: 250, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 158, screwRotationSpeed: 300 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 14.6, totalElectricPower: 47.3, totalElectricPowerHigh: 80, machineWeight: 15, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1000 A(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2045, injPressureMpa: 201, injHoldingPressureKgcm2: 1841, injHoldingPressureMpa: 180, theoInjVolume: 491, shotWeight: 447, injRate: 295, injRateOptional: 589, screwStroke: 250, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 213, screwRotationSpeed: 300 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 17.1, totalElectricPower: 49.8, totalElectricPowerHigh: 82.5, machineWeight: 15, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1000 B(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 1690, injPressureMpa: 166, injHoldingPressureKgcm2: 1521, injHoldingPressureMpa: 149, theoInjVolume: 594, shotWeight: 541, injRate: 356, injRateOptional: 713, screwStroke: 250, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 273, screwRotationSpeed: 300 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 18.7, totalElectricPower: 51.4, totalElectricPowerHigh: 84.1, machineWeight: 15, machineDimension: null, hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TE280WA5": {
        clamping: { clampingForce: "280(2745)", moldOpeningForce: null, tieBarDistance: "720x720", platenDimension: "1020x1020", daylight: 650, maxDaylight: 1350, minMoldHeight: 300, maxMoldHeight: 700, ejectorForce: "4.3(43)", ejectorStroke: 200, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE720 O(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 2605, injPressureMpa: 255, injHoldingPressureKgcm2: 2345, injHoldingPressureMpa: 230, theoInjVolume: 276, shotWeight: 251, injRate: 188, injRateOptional: 377, screwStroke: 220, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 117, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 46.2, heaterCapacity: 13.6, totalElectricPower: 36.7, totalElectricPowerHigh: 59.8, machineWeight: 15.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE720 A(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 2058, injPressureMpa: 202, injHoldingPressureKgcm2: 1852, injHoldingPressureMpa: 182, theoInjVolume: 350, shotWeight: 319, injRate: 239, injRateOptional: 477, screwStroke: 220, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 158, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 46.2, heaterCapacity: 14.6, totalElectricPower: 37.7, totalElectricPowerHigh: 60.8, machineWeight: 15.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE720 B(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 1667, injPressureMpa: 163, injHoldingPressureKgcm2: 1500, injHoldingPressureMpa: 147, theoInjVolume: 432, shotWeight: 393, injRate: 295, injRateOptional: 589, screwStroke: 220, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 213, screwRotationSpeed: 375 }, general: { motorCapacity: 23.1, motorCapacityOptional: 46.2, heaterCapacity: 17.1, totalElectricPower: 40.2, totalElectricPowerHigh: 63.3, machineWeight: 15.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1000 O(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 2525, injPressureMpa: 248, injHoldingPressureKgcm2: 2273, injHoldingPressureMpa: 223, theoInjVolume: 398, shotWeight: 362, injRate: 239, injRateOptional: 477, screwStroke: 250, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 158, screwRotationSpeed: 300 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 14.6, totalElectricPower: 47.3, totalElectricPowerHigh: 80, machineWeight: 16, machineDimension: "7.4 x 1.8 x 2.1", hydraulicOilTank: null, coolingWater: null } },
            "IE1000 A(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2045, injPressureMpa: 201, injHoldingPressureKgcm2: 1841, injHoldingPressureMpa: 180, theoInjVolume: 491, shotWeight: 447, injRate: 295, injRateOptional: 589, screwStroke: 250, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 213, screwRotationSpeed: 300 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 17.1, totalElectricPower: 49.8, totalElectricPowerHigh: 82.5, machineWeight: 16, machineDimension: "7.4 x 1.8 x 2.1", hydraulicOilTank: null, coolingWater: null } },
            "IE1000 B(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 1690, injPressureMpa: 166, injHoldingPressureKgcm2: 1521, injHoldingPressureMpa: 149, theoInjVolume: 594, shotWeight: 541, injRate: 356, injRateOptional: 713, screwStroke: 250, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 273, screwRotationSpeed: 300 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 18.7, totalElectricPower: 51.4, totalElectricPowerHigh: 84.1, machineWeight: 16, machineDimension: "7.4 x 1.8 x 2.1", hydraulicOilTank: null, coolingWater: null } },
            "IE1360 O(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2472, injPressureMpa: 242, injHoldingPressureKgcm2: 2225, injHoldingPressureMpa: 218, theoInjVolume: 530, shotWeight: 482, injRate: 295, injRateOptional: 589, screwStroke: 270, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 142, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 19.1, totalElectricPower: 51.8, totalElectricPowerHigh: 84.5, machineWeight: 16.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1360 A(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2043, injPressureMpa: 200, injHoldingPressureKgcm2: 1839, injHoldingPressureMpa: 180, theoInjVolume: 641, shotWeight: 583, injRate: 356, injRateOptional: 713, screwStroke: 270, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 182, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 21, totalElectricPower: 53.7, totalElectricPowerHigh: 86.4, machineWeight: 16.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1360 B(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 1716, injPressureMpa: 168, injHoldingPressureKgcm2: 1544, injHoldingPressureMpa: 151, theoInjVolume: 763, shotWeight: 694, injRate: 424, injRateOptional: 848, screwStroke: 270, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 233, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 23.8, totalElectricPower: 56.5, totalElectricPowerHigh: 89.2, machineWeight: 16.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TE350A5": {
        clamping: { clampingForce: "350(3432)", moldOpeningForce: null, tieBarDistance: "770x770", platenDimension: "1160x1090", daylight: 700, maxDaylight: 1450, minMoldHeight: 300, maxMoldHeight: 750, ejectorForce: "5.7(57)", ejectorStroke: 210, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE1000 O(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 2525, injPressureMpa: 248, injHoldingPressureKgcm2: 2273, injHoldingPressureMpa: 223, theoInjVolume: 398, shotWeight: 362, injRate: 239, injRateOptional: 477, screwStroke: 250, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 158, screwRotationSpeed: 300 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 14.6, totalElectricPower: 47.3, totalElectricPowerHigh: 80, machineWeight: 16.8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1000 A(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2045, injPressureMpa: 201, injHoldingPressureKgcm2: 1841, injHoldingPressureMpa: 180, theoInjVolume: 491, shotWeight: 447, injRate: 295, injRateOptional: 589, screwStroke: 250, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 213, screwRotationSpeed: 300 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 17.1, totalElectricPower: 49.8, totalElectricPowerHigh: 82.5, machineWeight: 16.8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1000 B(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 1690, injPressureMpa: 166, injHoldingPressureKgcm2: 1521, injHoldingPressureMpa: 149, theoInjVolume: 594, shotWeight: 541, injRate: 356, injRateOptional: 713, screwStroke: 250, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 273, screwRotationSpeed: 300 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 18.7, totalElectricPower: 51.4, totalElectricPowerHigh: 84.1, machineWeight: 16.8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1360 O(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2472, injPressureMpa: 242, injHoldingPressureKgcm2: 2225, injHoldingPressureMpa: 218, theoInjVolume: 530, shotWeight: 482, injRate: 295, injRateOptional: 589, screwStroke: 270, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 142, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 19.1, totalElectricPower: 51.8, totalElectricPowerHigh: 84.5, machineWeight: 17.3, machineDimension: "8.0 x 1.9 x 2.3", hydraulicOilTank: null, coolingWater: null } },
            "IE1360 A(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2043, injPressureMpa: 200, injHoldingPressureKgcm2: 1839, injHoldingPressureMpa: 180, theoInjVolume: 641, shotWeight: 583, injRate: 356, injRateOptional: 713, screwStroke: 270, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 182, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 21, totalElectricPower: 53.7, totalElectricPowerHigh: 86.4, machineWeight: 17.3, machineDimension: "8.0 x 1.9 x 2.3", hydraulicOilTank: null, coolingWater: null } },
            "IE1360 B(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 1716, injPressureMpa: 168, injHoldingPressureKgcm2: 1544, injHoldingPressureMpa: 151, theoInjVolume: 763, shotWeight: 694, injRate: 424, injRateOptional: 848, screwStroke: 270, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 233, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 23.8, totalElectricPower: 56.5, totalElectricPowerHigh: 89.2, machineWeight: 17.3, machineDimension: "8.0 x 1.9 x 2.3", hydraulicOilTank: null, coolingWater: null } },
            "IE1700 O(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2391, injPressureMpa: 234, injHoldingPressureKgcm2: 2152, injHoldingPressureMpa: 211, theoInjVolume: 713, shotWeight: 649, injRate: 356, injRateOptional: 713, screwStroke: 300, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 163, screwRotationSpeed: 225 }, general: { motorCapacity: 44, motorCapacityOptional: 88, heaterCapacity: 21, totalElectricPower: 65, totalElectricPowerHigh: 109, machineWeight: 17.8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1700 A(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 2017, injPressureMpa: 198, injHoldingPressureKgcm2: 1815, injHoldingPressureMpa: 178, theoInjVolume: 848, shotWeight: 772, injRate: 424, injRateOptional: 848, screwStroke: 300, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 210, screwRotationSpeed: 225 }, general: { motorCapacity: 44, motorCapacityOptional: 88, heaterCapacity: 23.8, totalElectricPower: 67.8, totalElectricPowerHigh: 111.8, machineWeight: 17.8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1700 B(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 1712, injPressureMpa: 168, injHoldingPressureKgcm2: 1541, injHoldingPressureMpa: 151, theoInjVolume: 995, shotWeight: 905, injRate: 498, injRateOptional: 995, screwStroke: 300, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 259, screwRotationSpeed: 225 }, general: { motorCapacity: 44, motorCapacityOptional: 88, heaterCapacity: 25.7, totalElectricPower: 69.7, totalElectricPowerHigh: 113.7, machineWeight: 17.8, machineDimension: null, hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TE400A5": {
        clamping: { clampingForce: "400(3922)", moldOpeningForce: null, tieBarDistance: "820x820", platenDimension: "1210x1140", daylight: 750, maxDaylight: 1550, minMoldHeight: 350, maxMoldHeight: 800, ejectorForce: "5.7(57)", ejectorStroke: 210, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE1360 O(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2472, injPressureMpa: 242, injHoldingPressureKgcm2: 2225, injHoldingPressureMpa: 218, theoInjVolume: 530, shotWeight: 482, injRate: 295, injRateOptional: 589, screwStroke: 270, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 142, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 19.1, totalElectricPower: 51.8, totalElectricPowerHigh: 84.5, machineWeight: 21.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1360 A(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2043, injPressureMpa: 200, injHoldingPressureKgcm2: 1839, injHoldingPressureMpa: 180, theoInjVolume: 641, shotWeight: 583, injRate: 356, injRateOptional: 713, screwStroke: 270, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 182, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 21, totalElectricPower: 53.7, totalElectricPowerHigh: 86.4, machineWeight: 21.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1360 B(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 1716, injPressureMpa: 168, injHoldingPressureKgcm2: 1544, injHoldingPressureMpa: 151, theoInjVolume: 763, shotWeight: 694, injRate: 424, injRateOptional: 848, screwStroke: 270, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 233, screwRotationSpeed: 250 }, general: { motorCapacity: 32.7, motorCapacityOptional: 65.4, heaterCapacity: 23.8, totalElectricPower: 56.5, totalElectricPowerHigh: 89.2, machineWeight: 21.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1700 O(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2391, injPressureMpa: 234, injHoldingPressureKgcm2: 2152, injHoldingPressureMpa: 211, theoInjVolume: 713, shotWeight: 649, injRate: 356, injRateOptional: 713, screwStroke: 300, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 163, screwRotationSpeed: 225 }, general: { motorCapacity: 44, motorCapacityOptional: 88, heaterCapacity: 21, totalElectricPower: 65, totalElectricPowerHigh: 109, machineWeight: 22, machineDimension: "8.3 x 2.0 x 2.3", hydraulicOilTank: null, coolingWater: null } },
            "IE1700 A(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 2017, injPressureMpa: 198, injHoldingPressureKgcm2: 1815, injHoldingPressureMpa: 178, theoInjVolume: 848, shotWeight: 772, injRate: 424, injRateOptional: 848, screwStroke: 300, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 210, screwRotationSpeed: 225 }, general: { motorCapacity: 44, motorCapacityOptional: 88, heaterCapacity: 23.8, totalElectricPower: 67.8, totalElectricPowerHigh: 111.8, machineWeight: 22, machineDimension: "8.3 x 2.0 x 2.3", hydraulicOilTank: null, coolingWater: null } },
            "IE1700 B(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 1712, injPressureMpa: 168, injHoldingPressureKgcm2: 1541, injHoldingPressureMpa: 151, theoInjVolume: 995, shotWeight: 905, injRate: 498, injRateOptional: 995, screwStroke: 300, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 259, screwRotationSpeed: 225 }, general: { motorCapacity: 44, motorCapacityOptional: 88, heaterCapacity: 25.7, totalElectricPower: 69.7, totalElectricPowerHigh: 113.7, machineWeight: 22, machineDimension: "8.3 x 2.0 x 2.3", hydraulicOilTank: null, coolingWater: null } },
            "IE2800 O(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2416, injPressureMpa: 237, injHoldingPressureKgcm2: 2174, injHoldingPressureMpa: 213, theoInjVolume: 1161, shotWeight: 1057, injRate: 498, injRateOptional: null, screwStroke: 350, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 230, screwRotationSpeed: 200 }, general: { motorCapacity: 65.4, motorCapacityOptional: null, heaterCapacity: 18.4, totalElectricPower: 83.8, totalElectricPowerHigh: null, machineWeight: 22.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE2800 A(70mm)": { injection: { screwDiameter: 70, injPressureKgcm2: 2083, injPressureMpa: 204, injHoldingPressureKgcm2: 1875, injHoldingPressureMpa: 184, theoInjVolume: 1347, shotWeight: 1226, injRate: 577, injRateOptional: null, screwStroke: 350, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 279, screwRotationSpeed: 200 }, general: { motorCapacity: 65.4, motorCapacityOptional: null, heaterCapacity: 20.6, totalElectricPower: 86, totalElectricPowerHigh: null, machineWeight: 22.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE2800 B(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 1595, injPressureMpa: 156, injHoldingPressureKgcm2: 1436, injHoldingPressureMpa: 141, theoInjVolume: 1759, shotWeight: 1601, injRate: 754, injRateOptional: null, screwStroke: 350, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 397, screwRotationSpeed: 200 }, general: { motorCapacity: 65.4, motorCapacityOptional: null, heaterCapacity: 24.1, totalElectricPower: 89.5, totalElectricPowerHigh: null, machineWeight: 22.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TE450A5": {
        clamping: { clampingForce: "450(4413)", moldOpeningForce: null, tieBarDistance: "870x870", platenDimension: "1270x1190", daylight: 800, maxDaylight: 1600, minMoldHeight: 350, maxMoldHeight: 800, ejectorForce: "10(100)", ejectorStroke: 220, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE1700 O(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2391, injPressureMpa: 234, injHoldingPressureKgcm2: 2152, injHoldingPressureMpa: 211, theoInjVolume: 713, shotWeight: 649, injRate: 356, injRateOptional: 713, screwStroke: 300, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 163, screwRotationSpeed: 225 }, general: { motorCapacity: 44, motorCapacityOptional: 88, heaterCapacity: 21, totalElectricPower: 65, totalElectricPowerHigh: 109, machineWeight: 26.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1700 A(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 2017, injPressureMpa: 198, injHoldingPressureKgcm2: 1815, injHoldingPressureMpa: 178, theoInjVolume: 848, shotWeight: 772, injRate: 424, injRateOptional: 848, screwStroke: 300, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 210, screwRotationSpeed: 225 }, general: { motorCapacity: 44, motorCapacityOptional: 88, heaterCapacity: 23.8, totalElectricPower: 67.8, totalElectricPowerHigh: 111.8, machineWeight: 26.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE1700 B(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 1712, injPressureMpa: 168, injHoldingPressureKgcm2: 1541, injHoldingPressureMpa: 151, theoInjVolume: 995, shotWeight: 905, injRate: 498, injRateOptional: 995, screwStroke: 300, injSpeed: 150, injSpeedOptional: 300, plasticizingCapacity: 259, screwRotationSpeed: 225 }, general: { motorCapacity: 44, motorCapacityOptional: 88, heaterCapacity: 25.7, totalElectricPower: 69.7, totalElectricPowerHigh: 113.7, machineWeight: 26.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE2800 O(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2416, injPressureMpa: 237, injHoldingPressureKgcm2: 2174, injHoldingPressureMpa: 213, theoInjVolume: 1161, shotWeight: 1057, injRate: 498, injRateOptional: null, screwStroke: 350, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 230, screwRotationSpeed: 200 }, general: { motorCapacity: 65.4, motorCapacityOptional: null, heaterCapacity: 18.4, totalElectricPower: 83.8, totalElectricPowerHigh: null, machineWeight: 26.7, machineDimension: "9.0 x 2.1 x 2.4", hydraulicOilTank: null, coolingWater: null } },
            "IE2800 A(70mm)": { injection: { screwDiameter: 70, injPressureKgcm2: 2083, injPressureMpa: 204, injHoldingPressureKgcm2: 1875, injHoldingPressureMpa: 184, theoInjVolume: 1347, shotWeight: 1226, injRate: 577, injRateOptional: null, screwStroke: 350, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 279, screwRotationSpeed: 200 }, general: { motorCapacity: 65.4, motorCapacityOptional: null, heaterCapacity: 20.6, totalElectricPower: 86, totalElectricPowerHigh: null, machineWeight: 26.7, machineDimension: "9.0 x 2.1 x 2.4", hydraulicOilTank: null, coolingWater: null } },
            "IE2800 B(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 1595, injPressureMpa: 156, injHoldingPressureKgcm2: 1436, injHoldingPressureMpa: 141, theoInjVolume: 1759, shotWeight: 1601, injRate: 754, injRateOptional: null, screwStroke: 350, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 397, screwRotationSpeed: 200 }, general: { motorCapacity: 65.4, motorCapacityOptional: null, heaterCapacity: 24.1, totalElectricPower: 89.5, totalElectricPowerHigh: null, machineWeight: 26.7, machineDimension: "9.0 x 2.1 x 2.4", hydraulicOilTank: null, coolingWater: null } },
            "IE4000 O(70mm)": { injection: { screwDiameter: 70, injPressureKgcm2: 2657, injPressureMpa: 261, injHoldingPressureKgcm2: 2391, injHoldingPressureMpa: 235, theoInjVolume: 1539, shotWeight: 1400, injRate: 577, injRateOptional: null, screwStroke: 400, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 244, screwRotationSpeed: 175 }, general: { motorCapacity: 88, motorCapacityOptional: null, heaterCapacity: 23, totalElectricPower: 111, totalElectricPowerHigh: null, machineWeight: 27.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE4000 A(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 2034, injPressureMpa: 199, injHoldingPressureKgcm2: 1831, injHoldingPressureMpa: 180, theoInjVolume: 2011, shotWeight: 1830, injRate: 754, injRateOptional: null, screwStroke: 400, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 347, screwRotationSpeed: 175 }, general: { motorCapacity: 88, motorCapacityOptional: null, heaterCapacity: 26.7, totalElectricPower: 114.7, totalElectricPowerHigh: null, machineWeight: 27.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE4000 B(90mm)": { injection: { screwDiameter: 90, injPressureKgcm2: 1607, injPressureMpa: 158, injHoldingPressureKgcm2: 1446, injHoldingPressureMpa: 142, theoInjVolume: 2545, shotWeight: 2316, injRate: 954, injRateOptional: null, screwStroke: 400, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 458, screwRotationSpeed: 175 }, general: { motorCapacity: 88, motorCapacityOptional: null, heaterCapacity: 30.7, totalElectricPower: 118.7, totalElectricPowerHigh: null, machineWeight: 27.2, machineDimension: null, hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TE550A5": {
        clamping: { clampingForce: "550(5394)", moldOpeningForce: null, tieBarDistance: "980x980", platenDimension: "1445x1365", daylight: 900, maxDaylight: 1850, minMoldHeight: 400, maxMoldHeight: 950, ejectorForce: "14.6(145)", ejectorStroke: 220, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE2800 O(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2416, injPressureMpa: 237, injHoldingPressureKgcm2: 2174, injHoldingPressureMpa: 213, theoInjVolume: 1161, shotWeight: 1057, injRate: 498, injRateOptional: null, screwStroke: 350, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 230, screwRotationSpeed: 200 }, general: { motorCapacity: 65.4, motorCapacityOptional: null, heaterCapacity: 18.4, totalElectricPower: 83.8, totalElectricPowerHigh: null, machineWeight: 35.7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE2800 A(70mm)": { injection: { screwDiameter: 70, injPressureKgcm2: 2083, injPressureMpa: 204, injHoldingPressureKgcm2: 1875, injHoldingPressureMpa: 184, theoInjVolume: 1347, shotWeight: 1226, injRate: 577, injRateOptional: null, screwStroke: 350, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 279, screwRotationSpeed: 200 }, general: { motorCapacity: 65.4, motorCapacityOptional: null, heaterCapacity: 20.6, totalElectricPower: 86, totalElectricPowerHigh: null, machineWeight: 35.7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE2800 B(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 1595, injPressureMpa: 156, injHoldingPressureKgcm2: 1436, injHoldingPressureMpa: 141, theoInjVolume: 1759, shotWeight: 1601, injRate: 754, injRateOptional: null, screwStroke: 350, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 397, screwRotationSpeed: 200 }, general: { motorCapacity: 65.4, motorCapacityOptional: null, heaterCapacity: 24.1, totalElectricPower: 89.5, totalElectricPowerHigh: null, machineWeight: 35.7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE4000 O(70mm)": { injection: { screwDiameter: 70, injPressureKgcm2: 2657, injPressureMpa: 261, injHoldingPressureKgcm2: 2391, injHoldingPressureMpa: 235, theoInjVolume: 1539, shotWeight: 1400, injRate: 577, injRateOptional: null, screwStroke: 400, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 244, screwRotationSpeed: 175 }, general: { motorCapacity: 88, motorCapacityOptional: null, heaterCapacity: 23, totalElectricPower: 111, totalElectricPowerHigh: null, machineWeight: 36.2, machineDimension: "9.9 x 2.5 x 2.2", hydraulicOilTank: null, coolingWater: null } },
            "IE4000 A(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 2034, injPressureMpa: 199, injHoldingPressureKgcm2: 1831, injHoldingPressureMpa: 180, theoInjVolume: 2011, shotWeight: 1830, injRate: 754, injRateOptional: null, screwStroke: 400, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 347, screwRotationSpeed: 175 }, general: { motorCapacity: 88, motorCapacityOptional: null, heaterCapacity: 26.7, totalElectricPower: 114.7, totalElectricPowerHigh: null, machineWeight: 36.2, machineDimension: "9.9 x 2.5 x 2.2", hydraulicOilTank: null, coolingWater: null } },
            "IE4000 B(90mm)": { injection: { screwDiameter: 90, injPressureKgcm2: 1607, injPressureMpa: 158, injHoldingPressureKgcm2: 1446, injHoldingPressureMpa: 142, theoInjVolume: 2545, shotWeight: 2316, injRate: 954, injRateOptional: null, screwStroke: 400, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 458, screwRotationSpeed: 175 }, general: { motorCapacity: 88, motorCapacityOptional: null, heaterCapacity: 30.7, totalElectricPower: 118.7, totalElectricPowerHigh: null, machineWeight: 36.2, machineDimension: "9.9 x 2.5 x 2.2", hydraulicOilTank: null, coolingWater: null } },
            "IE5700 O(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 2543, injPressureMpa: 249, injHoldingPressureKgcm2: 2289, injHoldingPressureMpa: 224, theoInjVolume: 2262, shotWeight: 2058, injRate: 754, injRateOptional: null, screwStroke: 450, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 298, screwRotationSpeed: 150 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 29.4, totalElectricPower: 139.4, totalElectricPowerHigh: null, machineWeight: 36.7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE5700 A(90mm)": { injection: { screwDiameter: 90, injPressureKgcm2: 2009, injPressureMpa: 197, injHoldingPressureKgcm2: 1808, injHoldingPressureMpa: 177, theoInjVolume: 2863, shotWeight: 2605, injRate: 954, injRateOptional: null, screwStroke: 450, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 408, screwRotationSpeed: 150 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 33.6, totalElectricPower: 143.6, totalElectricPowerHigh: null, machineWeight: 36.7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE5700 B(105mm)": { injection: { screwDiameter: 105, injPressureKgcm2: 1476, injPressureMpa: 145, injHoldingPressureKgcm2: 1328, injHoldingPressureMpa: 130, theoInjVolume: 3897, shotWeight: 3546, injRate: 1299, injRateOptional: null, screwStroke: 450, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 618, screwRotationSpeed: 150 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 39.3, totalElectricPower: 149.3, totalElectricPowerHigh: null, machineWeight: 36.7, machineDimension: null, hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TE650A5": {
        clamping: { clampingForce: "650(6374)", moldOpeningForce: null, tieBarDistance: "1080x1080", platenDimension: "1560x1480", daylight: 1000, maxDaylight: 2100, minMoldHeight: 450, maxMoldHeight: 1100, ejectorForce: "14.6(145)", ejectorStroke: 230, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE4000 O(70mm)": { injection: { screwDiameter: 70, injPressureKgcm2: 2657, injPressureMpa: 261, injHoldingPressureKgcm2: 2391, injHoldingPressureMpa: 235, theoInjVolume: 1539, shotWeight: 1400, injRate: 577, injRateOptional: null, screwStroke: 400, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 244, screwRotationSpeed: 175 }, general: { motorCapacity: 88, motorCapacityOptional: null, heaterCapacity: 23, totalElectricPower: 111, totalElectricPowerHigh: null, machineWeight: 44, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE4000 A(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 2034, injPressureMpa: 199, injHoldingPressureKgcm2: 1831, injHoldingPressureMpa: 180, theoInjVolume: 2011, shotWeight: 1830, injRate: 754, injRateOptional: null, screwStroke: 400, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 347, screwRotationSpeed: 175 }, general: { motorCapacity: 88, motorCapacityOptional: null, heaterCapacity: 26.7, totalElectricPower: 114.7, totalElectricPowerHigh: null, machineWeight: 44, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE4000 B(90mm)": { injection: { screwDiameter: 90, injPressureKgcm2: 1607, injPressureMpa: 158, injHoldingPressureKgcm2: 1446, injHoldingPressureMpa: 142, theoInjVolume: 2545, shotWeight: 2316, injRate: 954, injRateOptional: null, screwStroke: 400, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 458, screwRotationSpeed: 175 }, general: { motorCapacity: 88, motorCapacityOptional: null, heaterCapacity: 30.7, totalElectricPower: 118.7, totalElectricPowerHigh: null, machineWeight: 44, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE5700 O(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 2543, injPressureMpa: 249, injHoldingPressureKgcm2: 2289, injHoldingPressureMpa: 224, theoInjVolume: 2262, shotWeight: 2058, injRate: 754, injRateOptional: null, screwStroke: 450, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 298, screwRotationSpeed: 150 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 29.4, totalElectricPower: 139.4, totalElectricPowerHigh: null, machineWeight: 44.5, machineDimension: "10.5 x 2.5 x 2.4", hydraulicOilTank: null, coolingWater: null } },
            "IE5700 A(90mm)": { injection: { screwDiameter: 90, injPressureKgcm2: 2009, injPressureMpa: 197, injHoldingPressureKgcm2: 1808, injHoldingPressureMpa: 177, theoInjVolume: 2863, shotWeight: 2605, injRate: 954, injRateOptional: null, screwStroke: 450, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 408, screwRotationSpeed: 150 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 33.6, totalElectricPower: 143.6, totalElectricPowerHigh: null, machineWeight: 44.5, machineDimension: "10.5 x 2.5 x 2.4", hydraulicOilTank: null, coolingWater: null } },
            "IE5700 B(105mm)": { injection: { screwDiameter: 105, injPressureKgcm2: 1476, injPressureMpa: 145, injHoldingPressureKgcm2: 1328, injHoldingPressureMpa: 130, theoInjVolume: 3897, shotWeight: 3546, injRate: 1299, injRateOptional: null, screwStroke: 450, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 618, screwRotationSpeed: 150 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 39.3, totalElectricPower: 149.3, totalElectricPowerHigh: null, machineWeight: 44.5, machineDimension: "10.5 x 2.5 x 2.4", hydraulicOilTank: null, coolingWater: null } },
            "IE8000 O(95mm)": { injection: { screwDiameter: 95, injPressureKgcm2: 2118, injPressureMpa: 208, injHoldingPressureKgcm2: 1906, injHoldingPressureMpa: 187, theoInjVolume: 3509, shotWeight: 3193, injRate: 1063, injRateOptional: null, screwStroke: 495, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 393, screwRotationSpeed: 125 }, general: { motorCapacity: 125.6, motorCapacityOptional: null, heaterCapacity: 52.7, totalElectricPower: 178.3, totalElectricPowerHigh: null, machineWeight: 45, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE8000 A(105mm)": { injection: { screwDiameter: 105, injPressureKgcm2: 1734, injPressureMpa: 170, injHoldingPressureKgcm2: 1561, injHoldingPressureMpa: 153, theoInjVolume: 4286, shotWeight: 3900, injRate: 1299, injRateOptional: null, screwStroke: 495, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 515, screwRotationSpeed: 125 }, general: { motorCapacity: 125.6, motorCapacityOptional: null, heaterCapacity: 55.9, totalElectricPower: 181.5, totalElectricPowerHigh: null, machineWeight: 45, machineDimension: null, hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TE850A5": {
        clamping: { clampingForce: "850(8336)", moldOpeningForce: null, tieBarDistance: "1180x1180", platenDimension: "1710x1650", daylight: 1200, maxDaylight: 2400, minMoldHeight: 500, maxMoldHeight: 1200, ejectorForce: "20(199)", ejectorStroke: 230, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IE5700 O(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 2543, injPressureMpa: 249, injHoldingPressureKgcm2: 2289, injHoldingPressureMpa: 224, theoInjVolume: 2262, shotWeight: 2058, injRate: 754, injRateOptional: null, screwStroke: 450, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 298, screwRotationSpeed: 150 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 29.4, totalElectricPower: 139.4, totalElectricPowerHigh: null, machineWeight: 64.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE5700 A(90mm)": { injection: { screwDiameter: 90, injPressureKgcm2: 2009, injPressureMpa: 197, injHoldingPressureKgcm2: 1808, injHoldingPressureMpa: 177, theoInjVolume: 2863, shotWeight: 2605, injRate: 954, injRateOptional: null, screwStroke: 450, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 408, screwRotationSpeed: 150 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 33.6, totalElectricPower: 143.6, totalElectricPowerHigh: null, machineWeight: 64.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE5700 B(105mm)": { injection: { screwDiameter: 105, injPressureKgcm2: 1476, injPressureMpa: 145, injHoldingPressureKgcm2: 1328, injHoldingPressureMpa: 130, theoInjVolume: 3897, shotWeight: 3546, injRate: 1299, injRateOptional: null, screwStroke: 450, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 618, screwRotationSpeed: 150 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 39.3, totalElectricPower: 149.3, totalElectricPowerHigh: null, machineWeight: 64.5, machineDimension: null, hydraulicOilTank: null, coolingWater: null } },
            "IE8000 O(95mm)": { injection: { screwDiameter: 95, injPressureKgcm2: 2118, injPressureMpa: 208, injHoldingPressureKgcm2: 1906, injHoldingPressureMpa: 187, theoInjVolume: 3509, shotWeight: 3193, injRate: 1063, injRateOptional: null, screwStroke: 495, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 393, screwRotationSpeed: 125 }, general: { motorCapacity: 125.6, motorCapacityOptional: null, heaterCapacity: 52.7, totalElectricPower: 178.3, totalElectricPowerHigh: null, machineWeight: 65, machineDimension: "11.6 x 2.8 x 2.5", hydraulicOilTank: null, coolingWater: null } },
            "IE8000 A(105mm)": { injection: { screwDiameter: 105, injPressureKgcm2: 1734, injPressureMpa: 170, injHoldingPressureKgcm2: 1561, injHoldingPressureMpa: 153, theoInjVolume: 4286, shotWeight: 3900, injRate: 1299, injRateOptional: null, screwStroke: 495, injSpeed: 150, injSpeedOptional: null, plasticizingCapacity: 515, screwRotationSpeed: 125 }, general: { motorCapacity: 125.6, motorCapacityOptional: null, heaterCapacity: 55.9, totalElectricPower: 181.5, totalElectricPowerHigh: null, machineWeight: 65, machineDimension: "11.6 x 2.8 x 2.5", hydraulicOilTank: null, coolingWater: null } }
        }
    },

    "TL220A5": {
        clamping: { clampingForce: "220(2157)", moldOpeningForce: null, tieBarDistance: null, platenDimension: "960 x 880", daylight: 800, maxDaylight: 1100, minMoldHeight: 300, maxMoldHeight: null, ejectorForce: "7.6(74.5)", ejectorStroke: 180, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH1000 O(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 2600, injPressureMpa: 255, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 366, shotWeight: 337, injRate: 175, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 110, screwRotationSpeed: 260 }, general: { motorCapacity: 30, motorCapacityOptional: null, heaterCapacity: 14.6, totalElectricPower: 44.6, totalElectricPowerHigh: null, hydraulicOilTank: 595, coolingWater: 40, machineWeight: 14, machineDimension: "7.1 x 1.8 x 2.2" } },
            "IH1000 A(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 2258, injPressureMpa: 221, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 452, shotWeight: 416, injRate: 217, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 148, screwRotationSpeed: 260 }, general: { motorCapacity: 30, motorCapacityOptional: null, heaterCapacity: 17.1, totalElectricPower: 47.1, totalElectricPowerHigh: null, hydraulicOilTank: 595, coolingWater: 40, machineWeight: 14, machineDimension: "7.1 x 1.8 x 2.2" } },
            "IH1000 B(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 1866, injPressureMpa: 183, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 546, shotWeight: 504, injRate: 262, injRateOptional: null, screwStroke: 230, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 189, screwRotationSpeed: 260 }, general: { motorCapacity: 30, motorCapacityOptional: null, heaterCapacity: 18.7, totalElectricPower: 48.7, totalElectricPowerHigh: null, hydraulicOilTank: 595, coolingWater: 40, machineWeight: 14, machineDimension: "7.1 x 1.8 x 2.2" } }
        }
    },

    "TL300A5": {
        clamping: { clampingForce: "300(2941)", moldOpeningForce: null, tieBarDistance: null, platenDimension: "1120 x 1000", daylight: 900, maxDaylight: 1300, minMoldHeight: 400, maxMoldHeight: null, ejectorForce: "9.1(89.2)", ejectorStroke: 200, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH1800 O(55mm)": { injection: { screwDiameter: 55, injPressureKgcm2: 2494, injPressureMpa: 245, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 677, shotWeight: 624, injRate: 249, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 160, screwRotationSpeed: 220 }, general: { motorCapacity: 55, motorCapacityOptional: null, heaterCapacity: 21, totalElectricPower: 76, totalElectricPowerHigh: null, hydraulicOilTank: 860, coolingWater: 65, machineWeight: 19.5, machineDimension: "7.9 x 2.0 x 2.3" } },
            "IH1800 A(60mm)": { injection: { screwDiameter: 60, injPressureKgcm2: 2257, injPressureMpa: 221, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 806, shotWeight: 743, injRate: 296, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 205, screwRotationSpeed: 220 }, general: { motorCapacity: 55, motorCapacityOptional: null, heaterCapacity: 23.8, totalElectricPower: 78.8, totalElectricPowerHigh: null, hydraulicOilTank: 860, coolingWater: 65, machineWeight: 19.5, machineDimension: "7.9 x 2.0 x 2.3" } },
            "IH1800 B(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2008, injPressureMpa: 197, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 946, shotWeight: 871, injRate: 347, injRateOptional: null, screwStroke: 285, injSpeed: 105, injSpeedOptional: null, plasticizingCapacity: 253, screwRotationSpeed: 220 }, general: { motorCapacity: 55, motorCapacityOptional: null, heaterCapacity: 25.7, totalElectricPower: 80.7, totalElectricPowerHigh: null, hydraulicOilTank: 860, coolingWater: 65, machineWeight: 19.5, machineDimension: "7.9 x 2.0 x 2.3" } }
        }
    },

    "TL400A5": {
        clamping: { clampingForce: "400(3922)", moldOpeningForce: null, tieBarDistance: null, platenDimension: "1250 x 1100", daylight: 1000, maxDaylight: 1450, minMoldHeight: 450, maxMoldHeight: null, ejectorForce: "11.3(110.8)", ejectorStroke: 250, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH2800 O(65mm)": { injection: { screwDiameter: 65, injPressureKgcm2: 2375, injPressureMpa: 233, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1161, shotWeight: 1070, injRate: 313, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 201, screwRotationSpeed: 175 }, general: { motorCapacity: 55, motorCapacityOptional: null, heaterCapacity: 18.4, totalElectricPower: 73.4, totalElectricPowerHigh: null, hydraulicOilTank: 965, coolingWater: 65, machineWeight: 25.5, machineDimension: "8.6 x 2.2 x 2.3" } },
            "IH2800 A(70mm)": { injection: { screwDiameter: 70, injPressureKgcm2: 2048, injPressureMpa: 201, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1347, shotWeight: 1241, injRate: 363, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 244, screwRotationSpeed: 175 }, general: { motorCapacity: 55, motorCapacityOptional: null, heaterCapacity: 20.6, totalElectricPower: 75.6, totalElectricPowerHigh: null, hydraulicOilTank: 965, coolingWater: 65, machineWeight: 25.5, machineDimension: "8.6 x 2.2 x 2.3" } },
            "IH2800 B(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 1568, injPressureMpa: 154, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1759, shotWeight: 1621, injRate: 474, injRateOptional: null, screwStroke: 350, injSpeed: 94, injSpeedOptional: null, plasticizingCapacity: 347, screwRotationSpeed: 175 }, general: { motorCapacity: 55, motorCapacityOptional: null, heaterCapacity: 24.1, totalElectricPower: 79.1, totalElectricPowerHigh: null, hydraulicOilTank: 965, coolingWater: 65, machineWeight: 25.5, machineDimension: "8.6 x 2.2 x 2.3" } }
        }
    }
};

// =====================================================================
// STAN KONFIGURATORA
// =====================================================================

let currentStep = 1;
let selectedMachineType = 'DL-A5';

// Aktualnie widoczny "pod-widok" Kroku 2: 'tech' (jedno lub więcej "okien"
// kalkulatora danych technologicznych) albo 'list' (wybór z listy). Wybór
// sposobu doboru odbywa się już w Kroku 1 (przyciski "Kalkulator" / "Wybierz
// z listy"). Obie ścieżki zapisują wybrane maszyny do WSPÓLNEJ tablicy
// step2Selections (patrz niżej), dzięki czemu Krok 3, Krok 4 i panel
// "najważniejszych danych" po prawej stronie Kroku 2 działają identycznie,
// niezależnie od wybranej ścieżki.
let step2SubView = 'tech';

// Typy maszyn dodane do Kroku 1 (widok 360° + krótki opis), dla których
// dalsze kroki konfiguratora (dobór wtryskarki na podstawie danych
// technologicznych) nie zostały jeszcze opracowane. Dla tych typów
// przycisk "Dalej" w Kroku 1 celowo nic nie robi - pozostałe typy
// (DL-A5, TH-A5, TE-A5, TL-A5) działają dokładnie tak jak wcześniej.
const CONFIGURATOR_STEP1_ONLY_TYPES = ['VHA-RS', 'MULTI', 'Super-Foam'];

// Lista materiałów jest wypełniana per "okno kalkulatora" dopiero przy jego
// utworzeniu (patrz populateMaterialSelect/addStep2TechBlock) - przy starcie
// strony żadne okno jeszcze nie istnieje (Krok 2 pokazuje się dopiero po
// wyborze sposobu doboru w Kroku 1).
document.addEventListener('DOMContentLoaded', function () {
    initMachineCardSelection();
});

// Podświetlenie wybranej karty maszyny (Krok 1) - niezależnie od wsparcia CSS :has()
function initMachineCardSelection() {
    const radios = document.querySelectorAll('.machine-card input[name="machine_type"]');
    if (!radios.length) return;

    const updateSelection = () => {
        radios.forEach(r => {
            r.closest('.machine-card').classList.toggle('is-selected', r.checked);
        });
    };

    radios.forEach(r => r.addEventListener('change', () => {
        updateSelection();
        // Wibracja przy wyborze rodzaju wtryskarki w Kroku 1 (patrz
        // triggerHapticFeedback na górze pliku).
        triggerHapticFeedback(10);
    }));
    updateSelection();
}

// -------------------- Krok 2: dobór wtryskarki (tech / lista) --------------------

// Pokazuje jeden z dwóch "pod-widoków" Kroku 2: formularz danych
// technologicznych ('tech') albo listę modeli ('list'). Sposób doboru
// wybierany jest już w Kroku 1.
function showStep2SubView(view) {
    step2SubView = view;
    document.getElementById('step2TechPath').style.display = view === 'tech' ? '' : 'none';
    document.getElementById('step2ListPath').style.display = view === 'list' ? '' : 'none';

    if (view === 'list') buildStep2List();
    if (view === 'tech') buildStep2TechPath();

    const container = document.querySelector('.configurator-container');
    if (container) window.scrollTo({ top: container.offsetTop - 100, behavior: 'smooth' });
}

// Reset Kroku 2 przy każdorazowym wejściu z Kroku 1 (nowo wybrany typ maszyny
// mógł unieważnić poprzednio wybrany model / wprowadzone dane technologiczne).
// `view` to sposób doboru wybrany przyciskiem w Kroku 1 ('tech' albo 'list').
function resetStep2ForType(view) {
    clearCalcError();

    const listErr = document.getElementById('step2ListError');
    if (listErr) { listErr.style.display = 'none'; listErr.textContent = ''; }

    const techNavErr = document.getElementById('step2TechNavError');
    if (techNavErr) { techNavErr.style.display = 'none'; techNavErr.textContent = ''; }

    showStep2SubView(view === 'list' ? 'list' : 'tech');
}

// Lista wybranych w Kroku 2 konfiguracji - WSPÓLNA dla obu ścieżek doboru
// ("wybierz z listy" i "dane technologiczne"/kalkulator). Każdy wpis to
// jeden "slot": wybrany model + agregat wtryskowy + liczba maszyn, a dla
// slotów pochodzących z kalkulatora dodatkowo snapshot obliczeń
// technologicznych (pole techResults - patrz applyTechSelection). W ścieżce
// "z listy" zawsze istnieje przynajmniej jeden (pusty) slot - kolejne dodaje
// się przyciskiem "+ Dodaj kolejny model" (patrz addAnotherStep2Model), a
// nowe wybory z listy modeli trafiają zawsze do pierwszego wolnego slotu
// (patrz onStep2ListSelect). W ścieżce "dane technologiczne" każdy slot
// odpowiada jednemu "oknu kalkulatora" - ten sam indeks w step2Selections i
// w step2TechBlockIds (patrz niżej).
let step2Selections = [];

// Stabilny numer porządkowy każdego "okna kalkulatora" w ścieżce "dane
// technologiczne" (step2TechBlockIds[i] odpowiada step2Selections[i], ten
// sam indeks, przez cały czas życia obu tablic) - nadawany raz, przy
// utworzeniu okna, i już niezmienny, nawet gdy wcześniejsze okno zostanie
// usunięte. Dzięki temu pola formularza danego okna (z id zawierającym ten
// numer, np. "mold_length_t3") zawsze odnoszą się do właściwego okna, bez
// potrzeby przenumerowywania/odtwarzania DOM pozostałych okien przy usuwaniu
// jednego z nich (co skasowałoby wpisane już w nich dane).
let step2TechNextId = 0;
let step2TechBlockIds = [];

// Element wysuwanego menu agregatów jest jeden, współdzielony przez wszystkie
// wiersze listy - jego zawartość i pozycja są ustawiane dynamicznie przez
// openStep2UnitsFlyout(), w zależności od tego, nad którym paskiem modelu
// znajduje się aktualnie kursor / który pasek został kliknięty. Menu NIE
// znika samo przy zjechaniu kursorem - zamyka je dopiero wybór konkretnego
// agregatu (onStep2ListSelect) albo kliknięcie poza listą i poza menu.
let step2FlyoutOpenRow = null;

// Buduje listę wszystkich wtryskarek (model + średnica ślimaka) dla aktualnie
// wybranego typu (Krok 1), na podstawie tych samych danych (machineData), z
// których korzysta ścieżka "dane technologiczne". Każdy model (np. DL450A5)
// to jeden pasek - wszystkie jego agregaty wtryskowe są ukryte wewnątrz
// wspólnego, wysuwanego menu (patrz #step2UnitsFlyout / openStep2UnitsFlyout)
// i pokazują się po najechaniu myszką / kliknięciu paska.
function buildStep2List() {
    const itemsContainer = document.getElementById('step2ListItems');
    const specsContainer = document.getElementById('step2ListSpecs');
    if (!itemsContainer || !specsContainer) return;

    const typeData = machineData[selectedMachineType];
    if (!typeData) { itemsContainer.innerHTML = ''; return; }

    closeStep2UnitsFlyout();
    step2Selections = [null];

    let rowsHtml = '';
    typeData.models.forEach(m => {
        rowsHtml += `
            <div class="step2-list-model-row" data-model="${m.name}">
                <button type="button" class="step2-list-model-bar"
                    onmouseenter="openStep2UnitsFlyout(this)"
                    onclick="openStep2UnitsFlyout(this)">
                    <span class="step2-list-model-name">${m.name}</span>
                    <span class="step2-list-model-arrow">›</span>
                </button>
            </div>`;
    });
    itemsContainer.innerHTML = rowsHtml;

    renderStep2Specs();
}

// Znajduje dane modelu (siła zwarcia, agregaty, itd.) dla aktualnie
// wybranego typu maszyny (Krok 1) po nazwie modelu.
function getStep2Model(modelName) {
    const typeData = machineData[selectedMachineType];
    if (!typeData) return null;
    return typeData.models.find(m => m.name === modelName) || null;
}

// Formatuje etykietę agregatu wtryskowego z wariantem ślimaka, np. z
// "IH190 O(25mm)" robi "IH190:O" - ten sam agregat (korpus) może
// występować z kilkoma średnicami ślimaka (oznaczonymi literami wg
// katalogu, np. O/A/B - od najmniejszej do największej), dlatego litera
// musi być widoczna obok nazwy agregatu, a nie tylko sama średnica.
function formatStep2AgregatLabel(unit) {
    const m = unit.match(/^(\S+)\s+([A-Za-z]*)\(/);
    if (!m) return unit.split(' ')[0];
    return m[2] ? `${m[1]}:${m[2]}` : m[1];
}

// Otwiera (i pozycjonuje) wspólne wysuwane menu agregatów wtryskowych tuż
// obok paska modelu, nad którym znajduje się kursor. Menu jest rodzeństwem
// (a nie potomkiem) przewijanej listy #step2ListItems, więc może swobodnie
// nachodzić na panel najważniejszych danych po prawej stronie, zamiast być
// przycinane przez jej "overflow-y: auto". Jeśli przy naturalnej pozycji
// (na wysokości najechanego paska) menu wystawałoby poza dolną krawędź
// widocznego okna przeglądarki, zostaje podciągnięte tak, aby zmieściło się
// w całości na ekranie (bez konieczności przewijania strony) - patrz sekcja
// "dopasowanie do wysokości okna" poniżej.
function openStep2UnitsFlyout(barEl) {
    const row = barEl.closest('.step2-list-model-row');
    const flyout = document.getElementById('step2UnitsFlyout');
    const layout = document.querySelector('.step2-list-layout');
    if (!row || !flyout || !layout) return;

    const modelName = row.dataset.model;
    const model = getStep2Model(modelName);
    if (!model) return;

    let unitsHtml = '';
    model.units.forEach(unit => {
        const agregat = formatStep2AgregatLabel(unit);
        const screwMatch = unit.match(/\((\d+)\s*mm\)/i);
        const screwDiameter = screwMatch ? screwMatch[1] : '–';
        const isSelected = step2Selections.some(s => s && s.modelName === modelName && s.unitStr === unit);
        const tieBarAttr = model.tieBar !== null ? model.tieBar : '';
        unitsHtml += `
            <button type="button" class="step2-list-unit-item${isSelected ? ' is-selected' : ''}"
                onclick="onStep2ListSelect('${modelName}', '${unit}', '${model.force}', '${tieBarAttr}', '${model.minH}', '${model.maxH}')">
                <span class="step2-list-unit-name">${agregat}</span>
                <span class="step2-list-unit-screw">Ø${screwDiameter} mm</span>
            </button>`;
    });
    flyout.innerHTML = unitsHtml;

    const barRect = barEl.getBoundingClientRect();
    const layoutRect = layout.getBoundingClientRect();

    // W widoku mobilnym (@media (max-width: 860px) - patrz .step2-list-layout
    // w CSS) lista modeli i panel danych są ułożone jedna kolumna pod drugą,
    // a pasek modelu zajmuje całą szerokość - menu agregatów pojawia się
    // wtedy POD najechanym/klikniętym paskiem (pełna jego szerokość), a nie
    // OBOK niego jak na desktopie, bo inaczej wystawałoby poza ekran.
    const isMobileList = window.matchMedia('(max-width: 860px)').matches;

    if (isMobileList) {
        flyout.style.width = barRect.width + 'px';
        flyout.style.left = (barRect.left - layoutRect.left) + 'px';
        flyout.style.top = (barRect.bottom - layoutRect.top + 8) + 'px';
    } else {
        flyout.style.width = '';

        // Dopasowanie do wysokości okna: domyślnie górna krawędź menu
        // wyrównana jest z górną krawędzią najechanego paska. Gdy przy tej
        // pozycji menu nie zmieściłoby się w całości nad dolną krawędzią
        // widocznego okna, zostaje podciągnięte w górę - w skrajnym
        // przypadku aż do tuż pod stały nagłówek strony - tak, aby
        // wszystkie pozycje były widoczne bez przewijania.
        const viewportBottomMargin = 16;
        const viewportTopMargin = 100; // wysokość stałego nagłówka + odstęp
        const flyoutHeight = flyout.offsetHeight;
        let desiredViewportTop = barRect.top;
        if (desiredViewportTop + flyoutHeight > window.innerHeight - viewportBottomMargin) {
            desiredViewportTop = Math.max(viewportTopMargin, window.innerHeight - viewportBottomMargin - flyoutHeight);
        }

        flyout.style.top = Math.max(0, desiredViewportTop - layoutRect.top) + 'px';
        flyout.style.left = (barRect.right - layoutRect.left + 10) + 'px';
    }

    flyout.classList.add('is-open');

    document.querySelectorAll('.step2-list-model-row.is-expanded').forEach(r => r.classList.remove('is-expanded'));
    row.classList.add('is-expanded');
    step2FlyoutOpenRow = row;
}

// Zamyka wspólne menu agregatów - wywoływane po wybraniu konkretnego
// agregatu (patrz onStep2ListSelect) albo po kliknięciu poza listą modeli
// i poza samym menu (patrz nasłuchiwacz "click" na document poniżej).
function closeStep2UnitsFlyout() {
    const flyout = document.getElementById('step2UnitsFlyout');
    if (flyout) { flyout.classList.remove('is-open'); flyout.innerHTML = ''; }
    if (step2FlyoutOpenRow) step2FlyoutOpenRow.classList.remove('is-expanded');
    step2FlyoutOpenRow = null;
}

// Kliknięcie gdziekolwiek poza listą modeli i poza samym menu agregatów
// zamyka je (np. dotknięcie ekranu obok, na urządzeniach dotykowych).
document.addEventListener('click', function (e) {
    const flyout = document.getElementById('step2UnitsFlyout');
    if (!flyout || !flyout.classList.contains('is-open')) return;
    if (flyout.contains(e.target)) return;
    const itemsContainer = document.getElementById('step2ListItems');
    if (itemsContainer && itemsContainer.contains(e.target)) return;
    closeStep2UnitsFlyout();
});

// Po kliknięciu konkretnego agregatu w wysuwanym menu: zapisuje wybór w
// pierwszym wolnym slocie z step2Selections, natychmiast zamyka menu
// agregatów (nawet jeśli kursor wciąż znajduje się nad paskiem/menu) i
// odświeża panel najważniejszych danych.
function onStep2ListSelect(modelName, unitStr, force, tieBar, minH, maxH) {
    // Wypełniamy pierwszy WOLNY (pusty) slot, a nie zawsze ostatni - dzięki
    // temu, jeśli użytkownik naciśnie "+ Dodaj kolejny model" kilka razy z
    // rzędu (tworząc kilka pustych placeholderów naraz), kolejne wybierane
    // konfiguracje trafiają po kolei do pierwszego wolnego pola, a nie zawsze
    // do ostatniego, pomijając wcześniejsze puste placeholdery.
    let idx = step2Selections.findIndex(s => !s);
    if (idx === -1) idx = Math.max(step2Selections.length - 1, 0);
    const existingQty = (step2Selections[idx] && step2Selections[idx].qty) || 1;
    const existingOptions = (step2Selections[idx] && step2Selections[idx].selectedOptions) || [];
    step2Selections[idx] = { modelName, unitStr, force, tieBar, minH, maxH, qty: existingQty, detailsExpanded: false, selectedOptions: existingOptions, optionsExpanded: false };

    closeStep2UnitsFlyout();
    renderStep2Specs();

    const errEl = document.getElementById('step2ListError');
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
}

// Zmiana liczby maszyn (+/-) dla danego slotu, z dolnym limitem 1.
function changeStep2Qty(slotIndex, delta) {
    const slot = step2Selections[slotIndex];
    if (!slot) return;
    const current = parseInt(slot.qty, 10) || 1;
    slot.qty = Math.max(1, current + delta);
    renderStep2Specs();
}

// Ręczna edycja liczby maszyn w polu tekstowym - również z dolnym limitem 1.
function setStep2Qty(slotIndex, value) {
    const slot = step2Selections[slotIndex];
    if (!slot) return;
    let n = parseInt(value, 10);
    if (isNaN(n) || n < 1) n = 1;
    slot.qty = n;
    renderStep2Specs();
}

// Przycisk "+ Dodaj kolejny model" - dodaje kolejny, pusty slot na dole listy
// wybranych konfiguracji; kolejny wybór z listy modeli wypełni właśnie jego.
function addAnotherStep2Model() {
    step2Selections.push(null);
    renderStep2Specs();
}

// Przycisk kosza - usuwa cały typ maszyny (dany slot) z listy wybranych
// konfiguracji. Jeśli był to ostatni pozostały slot, zostawiamy jeden pusty
// placeholder (tak jak na starcie), żeby panel po prawej nigdy nie zniknął
// całkowicie.
function removeStep2Model(slotIndex) {
    step2Selections.splice(slotIndex, 1);
    if (step2Selections.length === 0) {
        step2Selections.push(null);
    }
    renderStep2Specs();
}

// Rozwija/zwija pełną specyfikację techniczną (3 kolumny: Wtrysk/Zwarcie/
// Ogólne) pod podstawowymi danymi danego slotu. Domyślnie zwinięta - widoczne
// jest tylko te kilka podstawowych pól, tak jak przed dodaniem pełnych danych
// katalogowych; pulsujący trójkąt na dole karty rozwija resztę na życzenie.
function toggleStep2Details(slotIndex) {
    const slot = step2Selections[slotIndex];
    if (!slot) return;
    slot.detailsExpanded = !slot.detailsExpanded;
    renderStep2Specs();
}

// -------------------- Krok 2 (lista): pełne dane technologiczne --------------------
//
// Formatuje wartości zapisane w machineTechSpecs w formacie "450(4413)"
// (wartość_główna(wartość_w_nawiasie), tak jak drukowane są w katalogach
// producenta w układzie ton(kN)) na czytelny string "450 T (4413 kN)".
// Zwraca oryginalny string bez zmian, jeśli nie pasuje do wzorca (np. gdy
// to już gotowy tekst typu "3.5/3.5/5.0").
function formatTonKn(value) {
    if (value === null || value === undefined) return null;
    const m = String(value).match(/^([\d.]+)\(([\d.]+)\)$/);
    if (!m) return value;
    return `${m[1]} T (${m[2]} kN)`;
}

// Odczytuje jedno pole z machineTechSpecs dla danego modelu/agregatu. Dla
// "machineDimension" (które w katalogach bywa wydrukowane tylko raz na całą
// grupę korpusów wtryskowych, a nie dla każdej dokładnej średnicy ślimaka)
// szuka wartości u "siostrzanego" wariantu tego samego korpusu (ten sam
// prefiks przed spacją, np. "IH2800"), a w ostateczności u jakiegokolwiek
// wariantu w obrębie tego samego modelu - dzięki temu wymiar maszyny nie
// znika tylko dlatego, że akurat ta konkretna litera (O/A/B) go nie ma
// wydrukowanego osobno.
function getTechField(modelName, unitStr, section, field) {
    const spec = machineTechSpecs[modelName];
    if (!spec) return null;

    // "clamping" to dane wspólne dla całego modelu (jeden wiersz w katalogu
    // na cały model), zapisane bezpośrednio w spec.clamping - w
    // przeciwieństwie do "injection"/"general", które są per-agregat i
    // siedzą w spec.units[unitStr].
    if (section === 'clamping') {
        const val = spec.clamping ? spec.clamping[field] : null;
        return (val !== null && val !== undefined) ? val : null;
    }

    const unit = spec.units[unitStr];
    if (!unit || !unit[section]) return null;
    const val = unit[section][field];
    if (val !== null && val !== undefined) return val;

    if (field === 'machineDimension') {
        const bodyPrefix = unitStr.split(' ')[0];
        const entries = Object.entries(spec.units);
        const sameBody = entries.find(([k, v]) => k.split(' ')[0] === bodyPrefix && v.general.machineDimension);
        if (sameBody) return sameBody[1].general.machineDimension;
        const anyWithDim = entries.find(([, v]) => v.general.machineDimension);
        if (anyWithDim) return anyWithDim[1].general.machineDimension;
    }
    return null;
}

// Buduje znacznik 3 kolumn (Wtrysk / Zwarcie / Ogólne) z pełnymi danymi
// technologicznymi dla wybranej pary model+agregat, pomijając wiersze,
// których dana seria maszyn nie posiada (wartość null w machineTechSpecs).
// Jeśli danych brak (nie powinno się zdarzyć - patrz walidacja przy
// budowie machineTechSpecs), zwraca null, a wywołujący spada na starą,
// płaską listę jako zabezpieczenie.
function renderStep2TechColumns(modelName, unitStr) {
    if (!machineTechSpecs[modelName] || !machineTechSpecs[modelName].units[unitStr]) return null;
    const g = (section, field) => getTechField(modelName, unitStr, section, field);

    const injectionRows = [];
    const screwD = g('injection', 'screwDiameter');
    if (screwD != null) injectionRows.push(['Średnica ślimaka', `${screwD} mm`]);
    const pMpa = g('injection', 'injPressureMpa');
    if (pMpa != null) injectionRows.push(['Ciśnienie wtrysku', `${pMpa} MPa`]);
    const pHoldMpa = g('injection', 'injHoldingPressureMpa');
    if (pHoldMpa != null) injectionRows.push(['Ciśnienie docisku', `${pHoldMpa} MPa`]);
    const theoVol = g('injection', 'theoInjVolume');
    if (theoVol != null) injectionRows.push(['Teoret. objętość wtrysku', `${theoVol} cm³`]);
    const shotW = g('injection', 'shotWeight');
    if (shotW != null) injectionRows.push(['Masa wtrysku (PS)', `${shotW} g`]);
    const injRate = g('injection', 'injRate');
    const injRateOpt = g('injection', 'injRateOptional');
    if (injRate != null) injectionRows.push(['Prędkość wtrysku', `${injRate}${injRateOpt != null ? ` / ${injRateOpt} (opc.)` : ''} cm³/s`]);
    const screwStroke = g('injection', 'screwStroke');
    if (screwStroke != null) injectionRows.push(['Skok ślimaka', `${screwStroke} mm`]);
    const injSpeed = g('injection', 'injSpeed');
    const injSpeedOpt = g('injection', 'injSpeedOptional');
    if (injSpeed != null) injectionRows.push(['Prędkość wtrysku (liniowa)', `${injSpeed}${injSpeedOpt != null ? ` / ${injSpeedOpt} (opc.)` : ''} mm/s`]);
    const plastCap = g('injection', 'plasticizingCapacity');
    if (plastCap != null) injectionRows.push(['Wydajność plastyfikacji', `${plastCap} kg/h`]);
    const screwRpm = g('injection', 'screwRotationSpeed');
    if (screwRpm != null) injectionRows.push(['Obroty ślimaka', `${screwRpm} obr/min`]);

    const clampingRows = [];
    const clampForce = g('clamping', 'clampingForce');
    if (clampForce != null) clampingRows.push(['Siła zwarcia', formatTonKn(clampForce)]);
    const moldOpenForce = g('clamping', 'moldOpeningForce');
    if (moldOpenForce != null) clampingRows.push(['Siła otwierania formy', formatTonKn(moldOpenForce)]);
    const tieBarD = g('clamping', 'tieBarDistance');
    if (tieBarD != null) clampingRows.push(['Prześwit między kolumnami', `${tieBarD} mm`]);
    const platenDim = g('clamping', 'platenDimension');
    if (platenDim != null) clampingRows.push(['Wymiar płyty', `${platenDim} mm`]);
    const daylight = g('clamping', 'daylight');
    if (daylight != null) clampingRows.push(['Prześwit', `${daylight} mm`]);
    const maxDaylight = g('clamping', 'maxDaylight');
    if (maxDaylight != null) clampingRows.push(['Maks. prześwit', `${maxDaylight} mm`]);
    const minMoldH = g('clamping', 'minMoldHeight');
    if (minMoldH != null) clampingRows.push(['Min. wysokość formy', `${minMoldH} mm`]);
    const maxMoldH = g('clamping', 'maxMoldHeight');
    if (maxMoldH != null) clampingRows.push(['Maks. wysokość formy', `${maxMoldH} mm`]);
    const ejectForce = g('clamping', 'ejectorForce');
    if (ejectForce != null) clampingRows.push(['Siła wypychacza', formatTonKn(ejectForce)]);
    const ejectStroke = g('clamping', 'ejectorStroke');
    if (ejectStroke != null) clampingRows.push(['Skok wypychacza', `${ejectStroke} mm`]);
    const dryCycle = g('clamping', 'dryCycleTime');
    if (dryCycle != null) clampingRows.push(['Czas cyklu suchego', `${dryCycle} s`]);
    const maxMoldW = g('clamping', 'maxMoldWeight');
    if (maxMoldW != null) clampingRows.push(['Maks. masa formy', `${maxMoldW} t`]);

    const generalRows = [];
    const motorCap = g('general', 'motorCapacity');
    const motorCapOpt = g('general', 'motorCapacityOptional');
    if (motorCap != null) generalRows.push(['Moc silnika', `${motorCap}${motorCapOpt != null ? ` / ${motorCapOpt} (opc.)` : ''} kW`]);
    const heaterCap = g('general', 'heaterCapacity');
    if (heaterCap != null) generalRows.push(['Moc grzałek', `${heaterCap} kW`]);
    const totalPower = g('general', 'totalElectricPower');
    const totalPowerHigh = g('general', 'totalElectricPowerHigh');
    if (totalPower != null) generalRows.push(['Całkowita moc elektryczna', `${totalPower}${totalPowerHigh != null ? ` / ${totalPowerHigh} (High)` : ''} kW`]);
    const oilTank = g('general', 'hydraulicOilTank');
    if (oilTank != null) generalRows.push(['Zbiornik oleju hydraulicznego', `${oilTank} l`]);
    const coolingW = g('general', 'coolingWater');
    if (coolingW != null) generalRows.push(['Zużycie wody chłodzącej', `${coolingW} l/min`]);
    const machineW = g('general', 'machineWeight');
    if (machineW != null) generalRows.push(['Masa maszyny', `${machineW} t`]);
    const machineDim = g('general', 'machineDimension');
    if (machineDim != null) generalRows.push(['Wymiary maszyny', `${machineDim} m`]);

    const col = (title, rows) => `
                    <div class="step2-tech-col">
                        <h4 class="step2-tech-col-title">${title}</h4>
                        <ul class="step2-tech-list">
                            ${rows.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join('')}
                        </ul>
                    </div>`;

    return `
                <div class="step2-tech-grid">
                    ${col('Wtrysk', injectionRows)}
                    ${col('Zwarcie', clampingRows)}
                    ${col('Ogólne', generalRows)}
                </div>`;
}

// Odtwarza panel "najważniejszych danych" po prawej stronie na podstawie
// step2Selections - jedna karta na slot (placeholder, jeśli jeszcze pusty).
// Używana WYŁĄCZNIE przez ścieżkę "wybierz z listy" (wpisuje się do
// #step2ListSpecs) - pod kartami dodatkowo pojawia się pulsujący przycisk
// "+ Dodaj kolejny model". Ścieżka "dane technologiczne" ma od teraz własny,
// analogiczny mechanizm (patrz renderStep2TechInlineSpec niżej) - karta z
// danymi każdej maszyny jest tam renderowana bezpośrednio w jej oknie
// kalkulatora, obok wyników, a nie w osobnym panelu po prawej stronie strony.
function renderStep2Specs() {
    if (step2SubView === 'tech') {
        step2TechBlockIds.forEach(techId => renderStep2TechInlineSpec(techId));
        return;
    }

    const specsContainer = document.getElementById('step2ListSpecs');
    if (!specsContainer) return;

    const typeData = machineData[selectedMachineType];
    const placeholderText = 'Wybierz wtryskarkę z listy<span class="step2-desktop-only-text"> po lewej</span>, aby zobaczyć jej najważniejsze dane.';
    let html = '';

    step2Selections.forEach((slot, i) => {
        if (!slot) {
            // Kosz pojawia się na pustym placeholderze wszędzie poza pierwszym
            // polem, dopóki użytkownik nie wybrał jeszcze żadnej konfiguracji
            // (czyli slot 0) - tamto pole zawsze zostaje, dodatkowe puste
            // placeholdery (powstałe np. z kilkukrotnego kliknięcia "+ Dodaj
            // kolejny model") można natomiast usunąć tym samym przyciskiem,
            // w tym samym miejscu co w wypełnionych kartach.
            // Przycisk pozycjonowany bezwzględnie w rogu karty (position:
            // absolute we CSS), a nie w normalnym przepływie dokumentu -
            // dzięki temu jego obecność nie dokłada dodatkowej wysokości do
            // karty (patrz .step2-placeholder-header) i puste pole zawsze ma
            // ten sam, standardowy rozmiar, niezależnie od tego, czy kosz
            // jest pokazany.
            const removeBtn = i > 0 ? `
                    <div class="step2-placeholder-header">
                        <button type="button" class="step2-remove-btn" onclick="removeStep2Model(${i})" aria-label="Usuń to pole" title="Usuń to pole">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 20 7"></polyline><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"></path><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path></svg>
                        </button>
                    </div>` : '';
            html += `
                <div class="step2-spec-card is-placeholder" data-slot="${i}">
                    ${removeBtn}
                    <p class="step2-list-specs-placeholder">${placeholderText}</p>
                </div>`;
            return;
        }

        const screwMatch = slot.unitStr.match(/\((\d+)\s*mm\)/i);
        const screwDiameter = screwMatch ? `${screwMatch[1]} mm` : '–';
        const agregat = formatStep2AgregatLabel(slot.unitStr);

        html += `
            <div class="step2-spec-card" data-slot="${i}">
                <div class="step2-spec-card-header">
                    <div class="step2-spec-card-titles">
                        <h3>${slot.modelName}</h3>
                        <p class="step2-list-specs-sub">${typeData ? typeData.label : ''} — ${agregat}</p>
                    </div>
                    <div class="step2-qty-stepper">
                        <button type="button" class="step2-qty-btn" onclick="changeStep2Qty(${i}, -1)" aria-label="Zmniejsz liczbę maszyn">−</button>
                        <input type="text" inputmode="numeric" class="step2-qty-input" value="${slot.qty}" onchange="setStep2Qty(${i}, this.value)">
                        <button type="button" class="step2-qty-btn" onclick="changeStep2Qty(${i}, 1)" aria-label="Zwiększ liczbę maszyn">+</button>
                        <button type="button" class="step2-remove-btn" onclick="removeStep2Model(${i})" aria-label="Usuń ten typ maszyny" title="Usuń ten typ maszyny">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 20 7"></polyline><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"></path><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path></svg>
                        </button>
                    </div>
                </div>
                <ul class="step2-list-specs-table">
                    <li><span>Siła zwarcia</span><strong>${slot.force} ton</strong></li>
                    <li><span>Agregat wtryskowy</span><strong>${agregat}</strong></li>
                    <li><span>Średnica ślimaka</span><strong>${screwDiameter}</strong></li>
                    ${slot.tieBar ? `<li><span>Prześwit między kolumnami</span><strong>${slot.tieBar} mm</strong></li>` : ''}
                    <li><span>Min. wysokość formy</span><strong>${slot.minH} mm</strong></li>
                    <li><span>Maks. wysokość formy</span><strong>${slot.maxH} mm</strong></li>
                </ul>
                ${machineTechSpecs[slot.modelName] && machineTechSpecs[slot.modelName].units[slot.unitStr] ? `
                <button type="button" class="step2-details-toggle${slot.detailsExpanded ? ' is-expanded' : ''}" onclick="toggleStep2Details(${i})" aria-expanded="${slot.detailsExpanded ? 'true' : 'false'}">
                    <span>${slot.detailsExpanded ? 'Ukryj pełną specyfikację techniczną' : 'Pokaż pełną specyfikację techniczną'}</span>
                    <svg class="step2-details-toggle-arrow" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><polygon points="0,0 12,0 6,8" fill="currentColor"></polygon></svg>
                </button>
                ${slot.detailsExpanded ? (renderStep2TechColumns(slot.modelName, slot.unitStr) || '') : ''}` : ''}
            </div>`;
    });

    html += `
        <button type="button" class="step2-add-model-btn" onclick="addAnotherStep2Model()">
            <span class="pulse-plus">+</span> Dodaj kolejny model
        </button>`;

    specsContainer.innerHTML = html;

    document.querySelectorAll('.step2-list-model-row').forEach(row => {
        const isSelected = step2Selections.some(s => s && s.modelName === row.dataset.model);
        row.classList.toggle('has-selected', isSelected);
    });
}

// Wypełnia kartę z danymi wybranej maszyny (nazwa modelu, licznik sztuk,
// najważniejsze parametry, przycisk pełnej specyfikacji technicznej) w
// obrębie danego okna kalkulatora - #techInlineSpec_t{techId}, obok "Wyniki
// obliczeń technologicznych" (patrz .step2-tech-results-row w style.css).
// Dokładny odpowiednik karty ".step2-spec-card" używanej w ścieżce "wybierz
// z listy" (patrz renderStep2Specs powyżej), tyle że renderowany bezpośrednio
// w oknie kalkulatora zamiast w osobnym panelu po prawej stronie strony -
// zgodnie z życzeniem klienta, żeby wszystko było w jednym oknie razem z
// "Dane technologiczne". Pierwsze okno (techId 0) nie ma przycisku kosza -
// dokładnie tak samo jak w nagłówku samego okna kalkulatora (patrz trashBtn
// w renderStep2TechBlockHtml) - więc tutaj nie jest powielany.
function renderStep2TechInlineSpec(techId) {
    const card = document.getElementById('techInlineSpec_t' + techId);
    if (!card) return;

    const pos = step2TechBlockIds.indexOf(techId);
    const slot = pos !== -1 ? step2Selections[pos] : null;
    if (!slot) {
        card.innerHTML = '';
        return;
    }

    const typeData = machineData[selectedMachineType];
    const screwMatch = slot.unitStr.match(/\((\d+)\s*mm\)/i);
    const screwDiameter = screwMatch ? `${screwMatch[1]} mm` : '–';
    const agregat = formatStep2AgregatLabel(slot.unitStr);

    card.innerHTML = `
        <div class="step2-spec-card-header">
            <div class="step2-spec-card-titles">
                <h3>${slot.modelName}</h3>
                <p class="step2-list-specs-sub">${typeData ? typeData.label : ''} — ${agregat}</p>
            </div>
            <div class="step2-qty-stepper">
                <button type="button" class="step2-qty-btn" onclick="changeStep2Qty(${pos}, -1)" aria-label="Zmniejsz liczbę maszyn">−</button>
                <input type="text" inputmode="numeric" class="step2-qty-input" value="${slot.qty}" onchange="setStep2Qty(${pos}, this.value)">
                <button type="button" class="step2-qty-btn" onclick="changeStep2Qty(${pos}, 1)" aria-label="Zwiększ liczbę maszyn">+</button>
            </div>
        </div>
        <ul class="step2-list-specs-table">
            <li><span>Siła zwarcia</span><strong>${slot.force} ton</strong></li>
            <li><span>Agregat wtryskowy</span><strong>${agregat}</strong></li>
            <li><span>Średnica ślimaka</span><strong>${screwDiameter}</strong></li>
            ${slot.tieBar ? `<li><span>Prześwit między kolumnami</span><strong>${slot.tieBar} mm</strong></li>` : ''}
            <li><span>Min. wysokość formy</span><strong>${slot.minH} mm</strong></li>
            <li><span>Maks. wysokość formy</span><strong>${slot.maxH} mm</strong></li>
        </ul>
        ${machineTechSpecs[slot.modelName] && machineTechSpecs[slot.modelName].units[slot.unitStr] ? `
        <button type="button" class="step2-details-toggle${slot.detailsExpanded ? ' is-expanded' : ''}" onclick="toggleStep2Details(${pos})" aria-expanded="${slot.detailsExpanded ? 'true' : 'false'}">
            <span>${slot.detailsExpanded ? 'Ukryj pełną specyfikację techniczną' : 'Pokaż pełną specyfikację techniczną'}</span>
            <svg class="step2-details-toggle-arrow" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><polygon points="0,0 12,0 6,8" fill="currentColor"></polygon></svg>
        </button>
        ${slot.detailsExpanded ? (renderStep2TechColumns(slot.modelName, slot.unitStr) || '') : ''}` : ''}
    `;
}

// -------------------- Nawigacja między krokami --------------------

function nextStep(step, targetView) {
    if (step < 1 || step > 4) return;

    if (currentStep === 1) {
        const radios = document.getElementsByName('machine_type');
        for (const r of radios) {
            if (r.checked) selectedMachineType = r.value;
        }
        if (step === 2 && CONFIGURATOR_STEP1_ONLY_TYPES.includes(selectedMachineType)) {
            return;
        }
        if (step === 2) resetStep2ForType(targetView);
    }

    // Wspólna walidacja dla obu ścieżek Kroku 2 - wystarczy przynajmniej
    // jeden wypełniony slot w step2Selections (czy to wynik kalkulatora,
    // czy wybór bezpośrednio z listy modeli).
    if (step >= 3 && !step2Selections.some(s => s)) {
        if (step2SubView === 'list') {
            const errEl = document.getElementById('step2ListError');
            if (errEl) { errEl.textContent = 'Wybierz wtryskarkę z listy, aby przejść dalej.'; errEl.style.display = 'block'; }
        } else {
            showCalcError('Najpierw kliknij przycisk „DOBIERZ WTRYSKARKĘ” i wybierz rozmiar agregatu wtryskowego, aby przejść dalej.', 'step2TechNavError');
        }
        return;
    }

    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep = step;
    document.getElementById(`step${currentStep}`).classList.add('active');
    window.scrollTo({ top: document.querySelector('.configurator-container').offsetTop - 100, behavior: 'smooth' });

    const progress = (currentStep / 4) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;

    if (currentStep === 3) populateStep3();
    if (currentStep === 4) populateStep4Summary();
}

function showCalcError(msg, elId) {
    const el = document.getElementById(elId || 'calcError');
    if (!el) { alert(msg); return; }
    el.textContent = msg;
    el.style.display = 'block';
}

function clearCalcError(elId) {
    const el = document.getElementById(elId || 'calcError');
    if (el) { el.style.display = 'none'; el.textContent = ''; }
}

// -------------------- Krok 2 (dane technologiczne): "okna kalkulatora" --------------------
//
// Ścieżka "dane technologiczne" pozwala dodać więcej niż jedną maszynę -
// każda ma WŁASNE "okno kalkulatora" (własny formularz + własny wynik),
// dokładnie tak jak ścieżka "wybierz z listy" pozwala dodać więcej niż jeden
// model przyciskiem "+ Dodaj kolejny model". step2TechBlockIds[i] to stabilny
// numer danego okna (patrz deklaracja step2TechBlockIds wyżej) - pola
// formularza mają id zakończone na "_t<numer>" (np. "mold_length_t0").

// Buduje ścieżkę "dane technologiczne" od zera (wywoływane przy każdorazowym
// wejściu do Kroku 2 tą ścieżką) - czyści poprzednie okna i tworzy jedno,
// puste okno kalkulatora.
function buildStep2TechPath() {
    const container = document.getElementById('step2TechBlocks');
    if (!container) return;

    step2Selections = [];
    step2TechBlockIds = [];
    step2TechNextId = 0;
    container.innerHTML = '';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'step2-add-model-btn';
    addBtn.onclick = addStep2TechBlock;
    addBtn.innerHTML = '<span class="pulse-plus">+</span> Dodaj kolejny model';
    container.appendChild(addBtn);

    addStep2TechBlock();
}

// Przycisk "+ Dodaj kolejny model" (pod obliczeniami) - dokłada kolejne,
// puste okno kalkulatora tuż przed samym przyciskiem (który zawsze zostaje
// na końcu), nie ruszając istniejących okien (i wpisanych już w nich danych).
function addStep2TechBlock() {
    const container = document.getElementById('step2TechBlocks');
    if (!container) return;

    const id = step2TechNextId++;
    step2TechBlockIds.push(id);
    step2Selections.push(null);

    const wrapper = document.createElement('div');
    wrapper.className = 'step2-tech-block';
    wrapper.dataset.techId = id;
    wrapper.innerHTML = renderStep2TechBlockHtml(id);

    const addBtn = container.querySelector('.step2-add-model-btn');
    if (addBtn) {
        container.insertBefore(wrapper, addBtn);
    } else {
        container.appendChild(wrapper);
    }

    populateMaterialSelect(id);
    renderStep2Specs();
}

// Kosz w nagłówku okna (poza pierwszym) - usuwa całe okno kalkulatora wraz z
// odpowiadającą mu maszyną w panelu po prawej. Pozostałe okna (i wpisane w
// nich dane) zostają nietknięte - usuwany jest tylko ten jeden element DOM.
function removeStep2TechBlock(techId) {
    const pos = step2TechBlockIds.indexOf(techId);
    if (pos === -1) return;

    step2TechBlockIds.splice(pos, 1);
    step2Selections.splice(pos, 1);

    const blockEl = document.querySelector(`.step2-tech-block[data-tech-id="${techId}"]`);
    if (blockEl) blockEl.remove();

    renderStep2Specs();
}

// Znacznik jednego okna kalkulatora - formularz identyczny jak wcześniej
// (Wymiary formy / Wymiary wypraski / Materiał), tylko z polami
// zaindeksowanymi numerem okna, plus wynik: "Sugerowany model" (sam model,
// dobrany automatycznie) i wybór rozmiaru agregatu wtryskowego - WYŁĄCZNIE
// spośród agregatów należących do tego jednego, sugerowanego modelu.
function renderStep2TechBlockHtml(id) {
    const trashBtn = id !== 0 ? `
        <button type="button" class="step2-remove-btn" onclick="removeStep2TechBlock(${id})" aria-label="Usuń tę maszynę" title="Usuń tę maszynę">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 20 7"></polyline><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"></path><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path></svg>
        </button>` : '';

    return `
        <div class="step2-tech-block-header">
            <h3>Dane technologiczne</h3>
            ${trashBtn}
        </div>

        <div class="form-grid">

            <div class="form-section">
                <h3>Wymiary formy</h3>
                <div class="form-group">
                    <label>Długość formy [mm]</label>
                    <input type="number" id="mold_length_t${id}" min="0" placeholder="np. 400">
                </div>
                <div class="form-group">
                    <label>Szerokość formy [mm]</label>
                    <input type="number" id="mold_width_t${id}" min="0" placeholder="np. 350">
                </div>
                <div class="form-group">
                    <label>Dostępny prześwit między kolumnami [mm] <span class="required-star">*</span></label>
                    <input type="number" id="tie_bar_clearance_t${id}" min="0" placeholder="np. 620">
                </div>
                <div class="form-group">
                    <label>Wysokość (grubość) formy [mm] <span class="opt-label">(opcjonalnie)</span></label>
                    <input type="number" id="mold_height_t${id}" min="0" placeholder="np. 500">
                </div>
                <div class="form-group">
                    <label>Liczba gniazd formy (wyprasek na cykl) <span class="required-star">*</span></label>
                    <input type="number" id="cavities_t${id}" min="1" step="1" value="1">
                </div>
            </div>

            <div class="form-section">
                <h3>Wymiary wypraski</h3>
                <div class="form-group">
                    <label>Masa detalu m [g] <span class="required-star">*</span></label>
                    <input type="number" id="part_weight_t${id}" min="0" step="0.01" placeholder="np. 25">
                </div>
                <div class="form-group">
                    <label>Powierzchnia wypraski F [cm²] <span class="required-star">*</span></label>
                    <input type="number" id="part_surface_t${id}" min="0" step="0.1" placeholder="np. 45">
                </div>
                <div class="form-group">
                    <label>Grubość ścianki [mm] <span class="opt-label">(opcjonalnie)</span></label>
                    <input type="number" id="wall_thickness_t${id}" min="0" step="0.1" placeholder="np. 2.0">
                </div>
                <div class="form-group checkbox-inline">
                    <label><input type="checkbox" id="has_fillets_t${id}"> Zaokrąglenia krawędzi</label>
                    <label><input type="checkbox" id="has_ribs_t${id}"> Żebra usztywniające</label>
                </div>
            </div>

            <div class="form-section">
                <h3>Materiał</h3>
                <div class="form-group">
                    <label>Rodzaj tworzywa <span class="required-star">*</span></label>
                    <select id="material_select_t${id}" onchange="handleMaterialChange(${id})"></select>
                </div>
                <div class="form-group density-row">
                    <label>Gęstość wybranego tworzywa [g/cm³]</label>
                    <div class="density-row-inner">
                        <input type="number" step="0.01" id="density_value_t${id}" readonly>
                        <button type="button" class="btn-secondary btn-small" id="toggleCustomDensityBtn_t${id}" onclick="toggleCustomDensity(${id})">Inna gęstość</button>
                    </div>
                </div>
                <div class="form-group" id="custom_density_group_t${id}" style="display:none;">
                    <label>Własna gęstość [g/cm³]</label>
                    <input type="number" step="0.01" id="custom_density_t${id}" placeholder="np. 1.15">
                </div>
                <div class="form-group">
                    <label>Współczynnik ciśnienia w gnieździe formy k <span class="opt-label">(×100 kg/cm², typowo 3–8)</span></label>
                    <input type="number" id="k_factor_t${id}" value="6" min="1" max="12" step="0.5">
                </div>
            </div>

        </div>

        <div class="action-calc-bar">
            <button type="button" class="btn-primary btn-wave" onclick="calculateAndShowModels(${id})"><span class="btn-wave-label">DOBIERZ WTRYSKARKĘ</span></button>
        </div>

        <div id="calcError_t${id}" class="calc-error" style="display:none;"></div>

        <!-- Wyniki obliczeń (po lewej) i karta z danymi wybranej maszyny
             (po prawej, przeniesiona tutaj z panelu po prawej stronie strony -
             patrz renderStep2TechInlineSpec w script.js) - obie w jednym
             wierszu, w obrębie tego samego okna kalkulatora ("Dane
             technologiczne"), pokazywane/ukrywane razem. -->
        <div class="step2-tech-results-row" id="resultsSection_t${id}" style="display:none;">
            <div class="results-box">
                <div class="step2-suggested-model step2-suggested-model-top">
                    <span class="step2-suggested-model-label">Sugerowany model:</span>
                    <strong class="step2-suggested-model-name" id="suggestedModelName_t${id}">–</strong>
                </div>
                <div class="form-group">
                    <label>Wybierz rozmiar agregatu wtryskowego</label>
                    <select id="selected_agregat_t${id}" class="large-select" onchange="onTechAgregatChange(${id}, this.value)"></select>
                </div>
                <div class="calc-details" id="calcDetails_t${id}"></div>
            </div>
            <div class="step2-spec-card" id="techInlineSpec_t${id}"></div>
        </div>
    `;
}

// -------------------- Obsługa wyboru tworzywa (per okno kalkulatora) --------------------

function populateMaterialSelect(id) {
    const sel = document.getElementById('material_select_t' + id);
    if (!sel) return;
    sel.innerHTML = materialsData.map(m => `<option value="${m.density}">${m.label} (${m.density.toFixed(2)} g/cm³)</option>`).join('');
    handleMaterialChange(id);
}

function handleMaterialChange(id) {
    const sel = document.getElementById('material_select_t' + id);
    const disp = document.getElementById('density_value_t' + id);
    if (sel && disp) disp.value = parseFloat(sel.value).toFixed(2);
}

function toggleCustomDensity(id) {
    const group = document.getElementById('custom_density_group_t' + id);
    const btn = document.getElementById('toggleCustomDensityBtn_t' + id);
    const showing = group.style.display !== 'none' && group.style.display !== '';
    if (showing) {
        group.style.display = 'none';
        btn.textContent = 'Inna gęstość';
    } else {
        group.style.display = 'block';
        btn.textContent = 'Użyj gęstości z listy';
        document.getElementById('custom_density_t' + id).focus();
    }
}

function getSelectedDensity(id) {
    const customGroup = document.getElementById('custom_density_group_t' + id);
    if (customGroup && customGroup.style.display === 'block') {
        const v = parseFloat(document.getElementById('custom_density_t' + id).value);
        if (!isNaN(v) && v > 0) return v;
    }
    return parseFloat(document.getElementById('material_select_t' + id).value) || 1.0;
}

// -------------------- Obliczenia (Krok 2, ścieżka "dane technologiczne") --------------------
// Wzory wg materiału "Dobór Wtryskarek":
//   V_wtr = m / rho                 (objętość wtrysku pojedynczej wypraski)
//   P_s   = (m_T * g * k) / 1000    (orientacyjna siła zwarcia wg wzoru masowego, kN)
// Do praktycznego doboru maszyny (siła zwarcia w tonach) stosuje się przybliżenie
// inżynierskie oparte na powierzchni rzutu wypraski i ciśnieniu specyficznym w gnieździe:
//   F [ton] = F_wypraski[cm2] * liczba_gniazd * p_specyficzne[kg/cm2] / 1000
//
// Spośród modeli spełniających wymaganą siłę zwarcia (i pozostałe warunki)
// jako "sugerowany" traktowany jest pierwszy z nich (modele w machineData są
// uporządkowane rosnąco wg tonażu) - czyli najmniejszy model, który wystarcza.
// Lista "Wybierz rozmiar agregatu wtryskowego" pokazuje WYŁĄCZNIE agregaty
// należące do tego jednego modelu (a nie wszystkich pasujących modeli, jak
// poprzednio).

function calculateAndShowModels(id) {
    clearCalcError('calcError_t' + id);

    const cavities = parseInt(document.getElementById('cavities_t' + id).value) || 0;
    const partWeight = parseFloat(document.getElementById('part_weight_t' + id).value) || 0; // g
    const partSurface = parseFloat(document.getElementById('part_surface_t' + id).value) || 0; // cm2
    const tieClearance = parseFloat(document.getElementById('tie_bar_clearance_t' + id).value) || 0; // mm
    const moldHeight = parseFloat(document.getElementById('mold_height_t' + id).value) || 0; // mm (opcjonalne)
    const kFactor = parseFloat(document.getElementById('k_factor_t' + id).value) || 6; // x100 kg/cm2
    const density = getSelectedDensity(id); // g/cm3

    if (cavities <= 0 || partWeight <= 0 || partSurface <= 0 || tieClearance <= 0) {
        showCalcError('Uzupełnij wymagane pola oznaczone gwiazdką (*): liczba gniazd, masa i powierzchnia wypraski oraz dostępny prześwit między kolumnami.', 'calcError_t' + id);
        const resultsEl = document.getElementById('resultsSection_t' + id);
        if (resultsEl) resultsEl.style.display = 'none';
        return;
    }

    // Objętość wtrysku: V_wtr = m / rho
    const singleVwtr = partWeight / density; // cm3
    const totalVwtr = singleVwtr * cavities;
    const totalWeight = partWeight * cavities; // g

    // Wymagana siła zwarcia (metoda inżynierska - powierzchnia rzutu x ciśnienie specyficzne)
    const specificPressure = kFactor * 100; // kg/cm2
    const requiredForceTon = (partSurface * cavities * specificPressure) / 1000;

    // Orientacyjna wartość wg prostego wzoru masowego z materiału szkoleniowego (informacyjnie)
    // Wzór wg materiału "Dobór Wtryskarek": Ps = mT * g * k / 1000, gdzie mT podajemy w gramach,
    // co zgodnie z przykładem w materiale (20 g, k=6 -> ok. 1,18 N na gniazdo) daje wynik w niutonach (N).
    const docK = 6;
    const psDocN = (totalWeight * 9.81 * docK) / 1000;

    const typeData = machineData[selectedMachineType];

    let suitableModels = typeData.models.filter(m => {
        const forceOk = m.force >= requiredForceTon;
        const tieOk = !typeData.hasTieBar || m.tieBar === null || m.tieBar >= tieClearance;
        const heightOk = moldHeight <= 0 || (moldHeight >= m.minH && moldHeight <= m.maxH);
        return forceOk && tieOk && heightOk;
    });

    let usedFallback = false;
    if (suitableModels.length === 0) {
        usedFallback = true;
        // Fallback: pomijamy warunek wysokości formy, jeśli nic nie pasuje
        suitableModels = typeData.models.filter(m => {
            const forceOk = m.force >= requiredForceTon;
            const tieOk = !typeData.hasTieBar || m.tieBar === null || m.tieBar >= tieClearance;
            return forceOk && tieOk;
        });
    }

    const modelsToDisplay = suitableModels.length > 0 ? suitableModels : typeData.models;
    const suggestedModel = modelsToDisplay[0];

    const calcDiv = document.getElementById('calcDetails_t' + id);
    calcDiv.innerHTML = `
        <ul>
            <li>Objętość wtrysku pojedynczej wypraski (V<sub>wtr</sub> = m / ρ): <strong>${singleVwtr.toFixed(2)} cm³</strong></li>
            <li>Całkowita objętość wtrysku dla ${cavities} gniazd/a: <strong>${totalVwtr.toFixed(2)} cm³</strong></li>
            <li>Całkowita masa wtrysku: <strong>${totalWeight.toFixed(2)} g</strong></li>
            <li>Wymagana minimalna siła zwarcia (metoda powierzchniowa, p = ${specificPressure} kg/cm²): <strong>${requiredForceTon.toFixed(1)} ton</strong></li>
            <li>Orientacyjna siła zwarcia wg uproszczonego wzoru masowego P<sub>s</sub> = m·g·k/1000: <strong>${psDocN.toFixed(2)} N</strong></li>
            <li>Wymagany prześwit między kolumnami: min. <strong>${tieClearance} mm</strong></li>
            ${moldHeight > 0 ? `<li>Wysokość formy: <strong>${moldHeight} mm</strong></li>` : ''}
        </ul>
        ${usedFallback ? '<p class="calc-warning">Uwaga: żaden model nie spełnia jednocześnie podanej wysokości formy — pokazano model dobrany wyłącznie wg siły zwarcia i prześwitu. Zweryfikuj wysokość formy z działem technicznym.</p>' : ''}
    `;

    document.getElementById('suggestedModelName_t' + id).textContent = suggestedModel.name;

    const agregatSelect = document.getElementById('selected_agregat_t' + id);
    agregatSelect.innerHTML = suggestedModel.units.map(unit => {
        const agregat = formatStep2AgregatLabel(unit);
        const screwMatch = unit.match(/\((\d+)\s*mm\)/i);
        const screwDiameter = screwMatch ? screwMatch[1] : '–';
        return `<option value="${unit}">${agregat} (Ø${screwDiameter} mm)</option>`;
    }).join('');

    const materialLabel = document.getElementById('material_select_t' + id).selectedOptions[0].textContent;
    const moldLength = document.getElementById('mold_length_t' + id).value || '–';
    const moldWidth = document.getElementById('mold_width_t' + id).value || '–';
    const wallThickness = document.getElementById('wall_thickness_t' + id).value || '–';

    const techResults = {
        singleVwtr, totalVwtr, totalWeight, requiredForceTon, psDocN,
        cavities, partWeight, partSurface, density, tieClearance, moldHeight,
        moldLength, moldWidth, wallThickness, materialLabel
    };

    // Pokazuje wiersz z wynikami (Wyniki obliczeń + karta z danymi maszyny)
    // PRZED wypełnieniem go treścią poniżej (applyTechSelection -> renderStep2Specs).
    document.getElementById('resultsSection_t' + id).style.display = 'grid';

    applyTechSelection(id, suggestedModel, agregatSelect.value, techResults);
}

// Zapisuje wybór (model + agregat) danego okna kalkulatora do step2Selections
// (na tej samej pozycji, na której znajduje się jego techId w
// step2TechBlockIds) - dokładnie w takim samym kształcie, co sloty ścieżki
// "wybierz z listy" (patrz onStep2ListSelect), dzięki czemu Krok 3, Krok 4
// i panel po prawej działają identycznie niezależnie od wybranej ścieżki w
// Kroku 2. Dodatkowo zapamiętuje snapshot obliczeń technologicznych
// (techResults) - wykorzystywany w Kroku 4 oraz w mailu z konfiguracją.
function applyTechSelection(techId, model, unitStr, techResults) {
    const pos = step2TechBlockIds.indexOf(techId);
    if (pos === -1) return;

    const existing = step2Selections[pos];
    const existingQty = (existing && existing.qty) || 1;
    const existingOptions = (existing && existing.selectedOptions) || [];

    step2Selections[pos] = {
        modelName: model.name,
        unitStr,
        force: model.force,
        tieBar: model.tieBar,
        minH: model.minH,
        maxH: model.maxH,
        qty: existingQty,
        detailsExpanded: false,
        selectedOptions: existingOptions,
        optionsExpanded: false,
        techId,
        techResults
    };

    renderStep2Specs();
}

// Zmiana wybranego rozmiaru agregatu (bez ponownego przeliczania) - np. gdy
// klient chce inny wariant średnicy ślimaka tego samego, sugerowanego modelu.
function onTechAgregatChange(techId, unitStr) {
    const pos = step2TechBlockIds.indexOf(techId);
    if (pos === -1 || !step2Selections[pos]) return;
    step2Selections[pos].unitStr = unitStr;
    renderStep2Specs();
}

// -------------------- Wspólne: wyróżniony pasek z wybraną wtryskarką i średnicą ślimaka --------------------
// Używane zarówno w Kroku 3 (przy każdym bloku opcji dodatkowych), jak i w
// Kroku 4 (przy każdym bloku podsumowania). "Wyposażenie standardowe" w
// Kroku 3 pokazuje tylko nazwy maszyn w nagłówku (patrz populateStep3),
// bez tego paska.

function buildMachineHighlightInnerHtml(modelName, screwDiameter) {
    return `
        <span class="machine-highlight-item"><span class="machine-highlight-label">Wybrana wtryskarka:</span> <strong>${modelName}</strong></span>
        <span class="machine-highlight-item"><span class="machine-highlight-label">Średnica ślimaka:</span> <strong>${screwDiameter}</strong></span>
    `;
}

// Zwraca listę wszystkich skonfigurowanych maszyn dla Kroku 3/4 - WSZYSTKIE
// wypełnione sloty z step2Selections, niezależnie od tego, którą ścieżką
// Kroku 2 powstały (klient mógł dodać kilka różnych modeli/agregatów, zarówno
// przyciskiem "+ Dodaj kolejny model" przy wyborze z listy, jak i dodając
// kolejne "okna kalkulatora" w ścieżce "dane technologiczne"). Każdy wpis ma
// WŁASNĄ listę wybranych opcji dodatkowych (selectedOptions), stan rozwinięcia
// tej listy w Kroku 3 (optionsExpanded) oraz - jeśli pochodzi z kalkulatora -
// snapshot obliczeń technologicznych (techResults, patrz applyTechSelection).
// "slotRef" to referencja do oryginalnego slotu z step2Selections, żeby zmiany
// (checkboxy, rozwijanie, "zastosuj do wszystkich") od razu zapisywały się
// z powrotem.
function getConfiguredMachines() {
    return step2Selections
        .map((slot, idx) => (slot ? { slot, idx } : null))
        .filter(Boolean)
        .map(({ slot, idx }) => {
            if (!slot.selectedOptions) slot.selectedOptions = [];
            const screwMatch = slot.unitStr.match(/\((\d+)\s*mm\)/i);
            return {
                idx,
                modelName: slot.modelName,
                unitStr: slot.unitStr,
                qty: slot.qty || 1,
                screwDiameter: screwMatch ? `${screwMatch[1]} mm` : '–',
                selectedOptions: slot.selectedOptions,
                optionsExpanded: !!slot.optionsExpanded,
                techResults: slot.techResults || null,
                slotRef: slot
            };
        });
}

// -------------------- Krok 3: wyposażenie standardowe i opcje --------------------

// Rozdziela numer katalogowy ("13.") od treści opisu, aby zawinięty tekst
// nie zaczynał się pod numerem, tylko pod pierwszym słowem opisu (wcięcie wiszące).
function formatNumbered(text) {
    const m = text.match(/^(\d+\.)\s*(.*)$/s);
    if (!m) return `<span class="opt-text">${text}</span>`;
    return `<span class="opt-num">${m[1]}</span><span class="opt-text">${m[2]}</span>`;
}

// Atrybuty dopisywane do każdego <li> "Wyposażenia standardowego" (patrz
// populateStep3 niżej), żeby dymek z tłumaczeniem działał tam identycznie
// jak dla checkboxów "Opcji dodatkowych" (te mają te same nasłuchiwacze
// wpięte przez addEventListener - patrz renderStep3OptionsContainer).
function step3TooltipAttrs() {
    return ' onmouseenter="showStep3OptionTooltip(this)" onmouseleave="hideStep3OptionTooltip()" onclick="showStep3OptionTooltip(this)"';
}

// Aktualnie otwarty "wyzwalacz" dymka (wiersz/checkbox, nad którym dymek
// jest pokazany) - potrzebny, żeby kliknięcie poza nim zamykało dymek
// (patrz nasłuchiwacz "click" na document niżej), tak samo jak w przypadku
// wysuwanego menu agregatów w Kroku 2 (closeStep2UnitsFlyout).
let step3TooltipOpenTrigger = null;

// Pokazuje jeden, wspólny dymek z polskim tłumaczeniem danej pozycji z
// katalogu - sama lista w Kroku 3 (Wyposażenie standardowe / Opcje
// dodatkowe) zostaje po angielsku, zgodnie z oryginalnym katalogiem
// producenta; tłumaczenie pojawia się dopiero po najechaniu/dotknięciu, w
// jednym dymku stylowanym podobnie do wysuwanego menu agregatów w Kroku 2
// ("Proszę wybrać z listy", patrz #step2UnitsFlyout w CSS). Działa zarówno
// dla wierszy Wyposażenia standardowego (<li>), jak i checkboxów Opcji
// dodatkowych (<label class="checkbox-item">) - obie struktury mają w
// środku ten sam <span class="opt-text"> z angielskim opisem, który służy
// tu jako klucz do słownika OPTION_TRANSLATIONS.
function showStep3OptionTooltip(triggerEl) {
    const tooltip = document.getElementById('step3OptionTooltip');
    if (!tooltip || !triggerEl) return;

    const textEl = triggerEl.querySelector('.opt-text');
    const key = (textEl ? textEl.textContent : triggerEl.textContent).trim();
    const translation = OPTION_TRANSLATIONS[key];
    if (!translation) { hideStep3OptionTooltip(); return; }

    renderStep3TooltipText(tooltip, translation);
    positionStep3OptionTooltip(tooltip, triggerEl);
    tooltip.classList.add('is-open');
    step3TooltipOpenTrigger = triggerEl;
}

// Ukrywa dymek (wywoływane po zjechaniu kursorem, a także po kliknięciu
// poza aktualnym wyzwalaczem - patrz nasłuchiwacz "click" niżej).
function hideStep3OptionTooltip() {
    const tooltip = document.getElementById('step3OptionTooltip');
    if (tooltip) tooltip.classList.remove('is-open');
    step3TooltipOpenTrigger = null;
}

// Ustawia treść dymka: zwykły, pojedynczy ciąg tekstu, chyba że zawiera
// nawias I tak i tak zawinąłby się do kolejnej linii przy naturalnym
// zawijaniu na obecnej szerokości dymka - wtedy dopiero wymuszone jest
// przejście do nowej linii dokładnie przed otwierającym nawiasem, żeby
// fragment w nawiasie zawsze trafiał w całości pod spód (np. "Automatyczne
// przedmuchiwanie" / "(czyszczenie ślimaka)"), zamiast zawijać się w
// dowolnym, przypadkowym miejscu. Gdy cały tekst i tak mieści się w jednej
// linii, zostaje bez zmian.
function renderStep3TooltipText(tooltip, text) {
    const parenIdx = text.indexOf(' (');
    if (parenIdx === -1) {
        tooltip.textContent = text;
        return;
    }

    // Najpierw renderuje jako pojedynczy, niełamany ciąg znaków, żeby
    // sprawdzić (poprzez liczbę "prostokątów" tekstu), czy przy obecnej
    // szerokości dymka i tak zawinąłby się do kolejnej linii.
    tooltip.innerHTML = '<span class="step3-tooltip-line"></span>';
    const lineEl = tooltip.querySelector('.step3-tooltip-line');
    lineEl.textContent = text;
    const wraps = lineEl.getClientRects().length > 1;

    if (!wraps) {
        tooltip.textContent = text;
        return;
    }

    const mainPart = text.slice(0, parenIdx);
    const bracketPart = text.slice(parenIdx + 1);
    tooltip.innerHTML = '';
    const line1 = document.createElement('span');
    line1.textContent = mainPart;
    const line2 = document.createElement('span');
    line2.textContent = bracketPart;
    tooltip.appendChild(line1);
    tooltip.appendChild(document.createElement('br'));
    tooltip.appendChild(line2);
}

// Pozycjonuje dymek (position: fixed, więc współrzędne liczone względem
// okna przeglądarki, niezależnie od przewinięcia strony) tuż nad
// najechaną/kliknięta pozycją, a jeśli nie ma tam miejsca (blisko górnej
// krawędzi ekranu) - pod nią; dociśnięty do prawej krawędzi okna, gdyby
// inaczej wystawał poza widoczny obszar.
function positionStep3OptionTooltip(tooltip, triggerEl) {
    const rect = triggerEl.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const margin = 8;

    let top = rect.top - tooltipRect.height - margin;
    if (top < margin) top = rect.bottom + margin;

    let left = rect.left;
    const maxLeft = window.innerWidth - tooltipRect.width - margin;
    if (left > maxLeft) left = Math.max(margin, maxLeft);

    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
}

// Zamyka dymek po kliknięciu gdziekolwiek poza pozycją, nad którą był
// otwarty, i poza samym dymkiem - przydatne głównie na dotyku, gdzie nie ma
// zjechania kursorem (ten sam mechanizm co zamykanie wysuwanego menu
// agregatów w Kroku 2 - patrz closeStep2UnitsFlyout).
document.addEventListener('click', function (e) {
    const tooltip = document.getElementById('step3OptionTooltip');
    if (!tooltip || !tooltip.classList.contains('is-open')) return;
    if (tooltip.contains(e.target)) return;
    if (step3TooltipOpenTrigger && step3TooltipOpenTrigger.contains(e.target)) return;
    hideStep3OptionTooltip();
});

function populateStep3() {
    const machines = getConfiguredMachines();

    // "Wyposażenie standardowe" dotyczy całej serii (ten sam zestaw dla
    // wszystkich modeli wybranego typu wtryskarki) - w nagłówku wypisujemy po
    // prostu nazwy WSZYSTKICH wybranych wtryskarek wraz ze średnicą ślimaka,
    // oddzielone znakiem "//", zamiast wyróżnionego paska.
    const stdMachinesList = document.getElementById('step3StdMachinesList');
    if (stdMachinesList) {
        stdMachinesList.textContent = machines
            .map(m => `${m.modelName} (Ø ${m.screwDiameter})`)
            .join(' // ');
    }

    const data = optionSets[selectedMachineType];
    document.getElementById('std_injection_unit').innerHTML = data.std.injection.map(i => `<li${step3TooltipAttrs()}>${formatNumbered(i)}</li>`).join('');
    document.getElementById('std_clamping_unit').innerHTML = data.std.clamping.map(i => `<li${step3TooltipAttrs()}>${formatNumbered(i)}</li>`).join('');
    document.getElementById('std_general').innerHTML = data.std.general.map(i => `<li${step3TooltipAttrs()}>${formatNumbered(i)}</li>`).join('');

    renderStep3OptionsContainer(machines);
}

// Buduje sekcję "Opcje dodatkowe (do wyboru):" - jeden blok na każdą wybraną
// wtryskarkę. Checkboxy są tworzone przez DOM (nie inline onclick), żeby
// uniknąć problemów z cudzysłowami w opisach opcji z katalogu; ich stan
// zapisuje się bezpośrednio do slotRef.selectedOptions danej maszyny.
function renderStep3OptionsContainer(machines) {
    const container = document.getElementById('step3OptionsContainer');
    if (!container) return;

    if (!machines || machines.length === 0) {
        container.innerHTML = '';
        return;
    }

    const data = optionSets[selectedMachineType];
    const primary = machines[0];

    let html = `
        <div class="step3-machine-options-block" data-machine-idx="${primary.idx}">
            <div class="step3-machine-options-header">
                <div class="machine-highlight-box">${buildMachineHighlightInnerHtml(primary.modelName, primary.screwDiameter)}${buildStep3QtyControlsHtml(primary)}</div>
            </div>
            <div class="options-columns-grid" id="step3OptCols-${primary.idx}"></div>
            ${machines.length > 1 ? `
            <button type="button" class="step2-add-model-btn step3-apply-all-btn" onclick="applyStep3OptionsToAll()">
                <span class="pulse-plus">+</span> Zastosuj do wszystkich
            </button>` : ''}
        </div>`;

    // Kolejne maszyny (jeśli klient wybrał więcej niż jeden model w Kroku 2) -
    // opcje domyślnie zwinięte, rozwijane pulsującym trójkątem (ten sam
    // mechanizm/styl co "Pokaż pełną specyfikację techniczną" w Kroku 2).
    machines.slice(1).forEach(m => {
        html += `
            <div class="step3-machine-options-block" data-machine-idx="${m.idx}">
                <div class="step3-machine-options-header">
                    <div class="machine-highlight-box">${buildMachineHighlightInnerHtml(m.modelName, m.screwDiameter)}${buildStep3QtyControlsHtml(m)}</div>
                </div>
                <button type="button" class="step2-details-toggle${m.optionsExpanded ? ' is-expanded' : ''}" onclick="toggleStep3MachineOptionsPanel(${m.idx})" aria-expanded="${m.optionsExpanded ? 'true' : 'false'}">
                    <span>${m.optionsExpanded ? 'Ukryj opcje dodatkowe dla tej maszyny' : 'Pokaż opcje dodatkowe dla tej maszyny'}</span>
                    <svg class="step2-details-toggle-arrow" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><polygon points="0,0 12,0 6,8" fill="currentColor"></polygon></svg>
                </button>
                ${m.optionsExpanded ? `<div class="options-columns-grid" id="step3OptCols-${m.idx}"></div>` : ''}
            </div>`;
    });

    container.innerHTML = html;

    machines.filter(m => m.idx === primary.idx || m.optionsExpanded).forEach(m => {
        const colsEl = document.getElementById(`step3OptCols-${m.idx}`);
        if (!colsEl) return;
        colsEl.innerHTML = `
            <div class="option-col"><h4>Wtrysk</h4><div class="checkbox-grid" data-group="injection"></div></div>
            <div class="option-col"><h4>Zwarcie</h4><div class="checkbox-grid" data-group="clamping"></div></div>
            <div class="option-col"><h4>Ogólne</h4><div class="checkbox-grid" data-group="general"></div></div>
        `;
        ['injection', 'clamping', 'general'].forEach(group => {
            const groupEl = colsEl.querySelector(`[data-group="${group}"]`);
            data.opt[group].forEach(optText => {
                const label = document.createElement('label');
                label.className = 'checkbox-item';
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = m.selectedOptions.includes(optText);
                checkbox.addEventListener('change', () => {
                    const pos = m.selectedOptions.indexOf(optText);
                    if (checkbox.checked && pos === -1) {
                        m.selectedOptions.push(optText);
                        // Wibracja przy DODANIU opcji dodatkowej (patrz
                        // triggerHapticFeedback na górze pliku) - tylko przy
                        // zaznaczeniu, nie przy odznaczeniu.
                        triggerHapticFeedback(15);
                    }
                    if (!checkbox.checked && pos !== -1) m.selectedOptions.splice(pos, 1);
                });
                label.appendChild(checkbox);
                label.insertAdjacentHTML('beforeend', formatNumbered(optText));
                label.addEventListener('mouseenter', () => showStep3OptionTooltip(label));
                label.addEventListener('mouseleave', hideStep3OptionTooltip);
                label.addEventListener('click', (e) => { if (e.target !== checkbox) showStep3OptionTooltip(label); });
                groupEl.appendChild(label);
            });
        });
    });
}

// Przycisk "Zastosuj do wszystkich" (widoczny tylko gdy wybrano więcej niż
// jedną wtryskarkę) - kopiuje wybrane opcje dodatkowe z pierwszej (głównej)
// maszyny do wszystkich pozostałych.
function applyStep3OptionsToAll() {
    const machines = getConfiguredMachines();
    if (machines.length < 2) return;
    const primaryOptions = machines[0].selectedOptions.slice();
    machines.slice(1).forEach(m => {
        m.slotRef.selectedOptions = primaryOptions.slice();
    });
    populateStep3();
}

// Rozwija/zwija listę opcji dodatkowych danej (nie-głównej) maszyny.
function toggleStep3MachineOptionsPanel(machineIdx) {
    const machines = getConfiguredMachines();
    const machine = machines.find(m => m.idx === machineIdx);
    if (!machine) return;
    machine.slotRef.optionsExpanded = !machine.slotRef.optionsExpanded;
    populateStep3();
}

// Licznik sztuk (+/-) i kosz do usunięcia danego typu wtryskarki, po prawej
// stronie paska z jej nazwą - dokładnie ten sam znacznik/styl co stepper przy
// liście modeli w Kroku 2 (.step2-qty-stepper/.step2-qty-btn/.step2-remove-btn,
// patrz renderStep2Specs). Dostępne dla obu ścieżek Kroku 2 - zarówno
// "wybierz z listy", jak i "dane technologiczne" (obie mogą teraz dać więcej
// niż jedną maszynę, patrz step2Selections).
function buildStep3QtyControlsHtml(m) {
    return `
        <span class="machine-highlight-item step3-qty-controls">
            <div class="step2-qty-stepper">
                <button type="button" class="step2-qty-btn" onclick="changeStep3MachineQty(${m.idx}, -1)" aria-label="Zmniejsz liczbę maszyn">−</button>
                <input type="text" inputmode="numeric" class="step2-qty-input" value="${m.qty}" onchange="setStep3MachineQty(${m.idx}, this.value)">
                <button type="button" class="step2-qty-btn" onclick="changeStep3MachineQty(${m.idx}, 1)" aria-label="Zwiększ liczbę maszyn">+</button>
                <button type="button" class="step2-remove-btn" onclick="removeStep3Machine(${m.idx})" aria-label="Usuń ten typ maszyny" title="Usuń ten typ maszyny">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 20 7"></polyline><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"></path><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path></svg>
                </button>
            </div>
        </span>
    `;
}

// Zmiana liczby sztuk / usunięcie danego typu wtryskarki bezpośrednio z
// Kroku 3 - deleguje do tych samych funkcji co licznik w Kroku 2
// (step2Selections to jedno, wspólne źródło prawdy dla obu widoków), po
// czym odświeża panel opcji w Kroku 3.
function changeStep3MachineQty(slotIndex, delta) {
    changeStep2Qty(slotIndex, delta);
    populateStep3();
}

function setStep3MachineQty(slotIndex, value) {
    setStep2Qty(slotIndex, value);
    populateStep3();
}

// Usunięcie w ścieżce "dane technologiczne" musi iść przez
// removeStep2TechBlock (usuwa też odpowiadające okno kalkulatora i utrzymuje
// step2TechBlockIds w zgodzie ze step2Selections) - samo removeStep2Model
// wystarcza tylko w ścieżce "wybierz z listy".
function removeStep3Machine(slotIndex) {
    if (step2SubView === 'tech') {
        removeStep2TechBlock(step2TechBlockIds[slotIndex]);
    } else {
        removeStep2Model(slotIndex);
    }
    populateStep3();
}

// -------------------- Krok 4: podsumowanie --------------------

// Przycisk "Edytuj" przy danej maszynie w podsumowaniu (Krok 4) - wraca do
// Kroku 3 i od razu rozwija jej sekcję opcji dodatkowych, gotową do zmiany.
function editStep3Machine(machineIdx) {
    if (step2Selections[machineIdx]) {
        step2Selections[machineIdx].optionsExpanded = true;
    }
    nextStep(3);
}

function populateStep4Summary() {
    const machines = getConfiguredMachines();
    const typeData = machineData[selectedMachineType];

    // Pełne wyliczenia technologiczne pokazujemy dla KAŻDEJ skonfigurowanej
    // maszyny, która pochodzi z kalkulatora (ma własny snapshot techResults -
    // patrz applyTechSelection) - niezależnie od tego, ile maszyn klient
    // dodał w Kroku 2. Dla maszyn bez takiego snapshotu (wybór bezpośrednio z
    // listy modeli) pokazywana jest zamiast tego krótka informacja o sposobie
    // doboru. Wcześniej dane technologiczne pokazywane były tylko wtedy, gdy
    // klient skonfigurował dokładnie JEDNĄ maszynę - przy dwóch lub więcej
    // maszynach z kalkulatora znikały one całkowicie (ani dane, ani nawet
    // informacja zastępcza), mimo że były prawidłowo policzone i zapisane.
    const techRowsHtml = (r) => `
            <tr><td>Wymiary formy (dł. x szer.)</td><td>${r.moldLength} x ${r.moldWidth} mm</td></tr>
            <tr><td>Prześwit między kolumnami</td><td>${r.tieClearance} mm</td></tr>
            ${r.moldHeight > 0 ? `<tr><td>Wysokość formy</td><td>${r.moldHeight} mm</td></tr>` : ''}
            <tr><td>Liczba gniazd</td><td>${r.cavities}</td></tr>
            <tr><td>Materiał</td><td>${r.materialLabel}</td></tr>
            <tr><td>Grubość ścianki</td><td>${r.wallThickness} mm</td></tr>
            <tr><td>Masa jednej wypraski</td><td>${r.partWeight} g</td></tr>
            <tr><td>Całkowita masa wtrysku</td><td>${r.totalWeight.toFixed(2)} g</td></tr>
            <tr><td>Całkowita objętość wtrysku</td><td>${r.totalVwtr.toFixed(2)} cm³</td></tr>
            <tr><td>Wymagana siła zwarcia</td><td>${r.requiredForceTon.toFixed(1)} ton</td></tr>
    `;
    const noTechRowHtml = `
            <tr><td>Sposób doboru</td><td>Wybór bezpośrednio z listy modeli (bez danych technologicznych)</td></tr>
    `;

    // Podsumowanie z podziałem na każdą wybraną wtryskarkę osobno (jeśli
    // klient dodał w Kroku 2 więcej niż jeden model, każdy dostaje własny
    // blok z przyciskiem "Edytuj" wracającym do jego opcji w Kroku 3). Gdy
    // maszyn jest więcej niż jedna, każdy blok dostaje dodatkową klasę
    // (--multi), która styluje go jak osobne, białe pole na tle strony -
    // wyraźnie odseparowane od pozostałych, zamiast cienkiej linii-przerywnika.
    const machinesHtml = machines.map(m => `
        <div class="step4-machine-block${machines.length > 1 ? ' step4-machine-block--multi' : ''}" data-machine-idx="${m.idx}">
            <div class="step4-machine-block-header">
                <div class="machine-highlight-box">${buildMachineHighlightInnerHtml(m.modelName, m.screwDiameter)}<span class="machine-highlight-item step4-qty-label">ilość: <strong>${m.qty}</strong></span></div>
                <button type="button" class="btn-secondary btn-small step4-edit-btn" onclick="editStep3Machine(${m.idx})">Edytuj</button>
            </div>
            <table>
                <tr><td>Typ wtryskarki</td><td><strong>${typeData ? typeData.label : selectedMachineType}</strong></td></tr>
                <tr><td>Model i agregat wtryskowy</td><td><strong>${m.modelName} – agregat wtryskowy ${m.unitStr}</strong></td></tr>
                ${m.techResults ? techRowsHtml(m.techResults) : noTechRowHtml}
            </table>
            <h4>Wybrane opcje dodatkowe</h4>
            ${m.selectedOptions.length > 0 ? `<ul>${m.selectedOptions.map(o => `<li>${o}</li>`).join('')}</ul>` : '<p>Brak wybranych opcji dodatkowych.</p>'}
        </div>
    `).join('');

    const summaryDiv = document.getElementById('summaryView');
    summaryDiv.innerHTML = `
        <h4 class="step4-summary-title">Wybrana konfiguracja${machines.length > 1 ? ` (${machines.length} wtryskarki)` : ''}</h4>
        ${machinesHtml}
    `;
}

// -------------------- Walidacja formularza kontaktowego --------------------

function validateContactForm() {
    const firstname = document.getElementById('client_firstname').value.trim();
    const lastname = document.getElementById('client_lastname').value.trim();
    const email = document.getElementById('client_email').value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const statusEl = document.getElementById('sendStatus');

    if (!firstname || !lastname || !email) {
        statusEl.textContent = 'Uzupełnij wymagane pola: Imię, Nazwisko oraz adres e-mail.';
        statusEl.className = 'send-status error';
        return false;
    }
    if (!emailOk) {
        statusEl.textContent = 'Podany adres e-mail jest nieprawidłowy.';
        statusEl.className = 'send-status error';
        return false;
    }
    statusEl.textContent = '';
    statusEl.className = 'send-status';
    return true;
}

// -------------------- Generowanie PDF (jsPDF) --------------------

function generatePDF() {
    if (!window.jspdf) {
        alert('Biblioteka do generowania PDF nie została załadowana (brak połączenia z internetem?).');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const typeData = machineData[selectedMachineType];
    const machines = getConfiguredMachines();

    let y = 18;
    const left = 15;
    const lineGap = 6;
    const pageWidth = 210;

    doc.setFontSize(16);
    doc.setTextColor(10, 190, 181);
    doc.text('WOOJIN PLAIMM – konfiguracja doboru wtryskarki', left, y);
    y += lineGap + 2;

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Dokument ma charakter wyłącznie poglądowy i nie stanowi oferty handlowej.', left, y);
    y += lineGap + 2;

    doc.setDrawColor(10, 190, 181);
    doc.line(left, y, pageWidth - left, y);
    y += lineGap;

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('Typ wtryskarki:', left, y);
    doc.setFont(undefined, 'normal');
    doc.text(String(typeData ? typeData.label : selectedMachineType), left + 65, y);
    y += lineGap + 2;

    // Podsumowanie z podziałem na każdą wybraną wtryskarkę osobno (klient
    // mógł w Kroku 2 dodać więcej niż jeden model/agregat - patrz
    // getConfiguredMachines powyżej).
    machines.forEach((m, i) => {
        if (y > 250) { doc.addPage(); y = 18; }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(machines.length > 1 ? `Maszyna ${i + 1}: ${m.modelName}` : 'Wybrana konfiguracja', left, y);
        doc.setFont(undefined, 'normal');
        y += lineGap;

        doc.setFontSize(10);
        const rows = [
            ['Model wtryskarki', m.modelName],
            ['Agregat wtryskowy', m.unitStr],
            ['Średnica ślimaka', m.screwDiameter]
        ];
        const r = m.techResults;
        if (r) {
            rows.push(
                ['Liczba gniazd', String(r.cavities)],
                ['Prześwit między kolumnami', `${r.tieClearance} mm`],
                ['Masa jednej wypraski', `${r.partWeight} g`],
                ['Całkowita masa wtrysku', `${r.totalWeight.toFixed(2)} g`],
                ['Całkowita objętość wtrysku', `${r.totalVwtr.toFixed(2)} cm³`],
                ['Wymagana siła zwarcia', `${r.requiredForceTon.toFixed(1)} ton`],
                ['Materiał', r.materialLabel]
            );
        }
        rows.forEach(([label, value]) => {
            if (y > 280) { doc.addPage(); y = 18; }
            doc.setFont(undefined, 'bold');
            doc.text(`${label}:`, left, y);
            doc.setFont(undefined, 'normal');
            doc.text(String(value), left + 65, y);
            y += lineGap - 1;
        });

        y += 3;
        if (y > 280) { doc.addPage(); y = 18; }
        doc.setFont(undefined, 'bold');
        doc.text('Wybrane opcje dodatkowe:', left, y);
        doc.setFont(undefined, 'normal');
        y += lineGap - 1;
        if (m.selectedOptions.length === 0) {
            if (y > 280) { doc.addPage(); y = 18; }
            doc.text('Brak wybranych opcji dodatkowych.', left, y);
            y += lineGap - 1;
        } else {
            m.selectedOptions.forEach(opt => {
                const wrapped = doc.splitTextToSize(`• ${opt}`, pageWidth - left * 2);
                wrapped.forEach(line => {
                    if (y > 280) { doc.addPage(); y = 18; }
                    doc.text(line, left, y);
                    y += lineGap - 2;
                });
            });
        }
        y += 4;
    });

    y += 4;
    if (y > 260) { doc.addPage(); y = 18; }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Dane kontaktowe', left, y);
    doc.setFont(undefined, 'normal');
    y += lineGap;
    doc.setFontSize(10);
    const contactRows = [
        ['Imię i nazwisko', `${getVal('client_firstname')} ${getVal('client_lastname')}`],
        ['E-mail', getVal('client_email')],
        ['Telefon', getVal('client_phone') || '-'],
        ['Firma', getVal('client_company') || '-'],
        ['Adres', getVal('client_address') || '-'],
        ['Komentarz', getVal('client_comment') || '-']
    ];
    contactRows.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, left, y);
        doc.setFont(undefined, 'normal');
        const wrapped = doc.splitTextToSize(String(value), pageWidth - left - 65);
        doc.text(wrapped, left + 40, y);
        y += lineGap - 1 + (wrapped.length - 1) * (lineGap - 2);
    });

    doc.save('WOOJIN_PLAIMM_konfiguracja_wtryskarki.pdf');
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

// -------------------- Wysyłka e-mail z potwierdzeniem (EmailJS, bez klienta pocztowego) --------------------

function requestSendEmail() {
    if (!validateContactForm()) return;

    // Honeypot wypełniony - najpewniej bot. Odrzucamy po cichu, bez
    // pokazywania jakiegokolwiek komunikatu o błędzie (żeby nie zdradzić
    // automatowi, że został wykryty).
    if (isHoneypotFilled('config_hp')) return;

    if (!isHumanCheckVerified('humanCheckBtnConfig')) {
        const statusEl = document.getElementById('sendStatus');
        statusEl.className = 'send-status error';
        statusEl.textContent = 'Potwierdź, że nie jesteś robotem, zaznaczając pole powyżej, aby wysłać konfigurację.';
        const humanCheckBtn = document.getElementById('humanCheckBtnConfig');
        if (humanCheckBtn) humanCheckBtn.focus();
        return;
    }

    document.getElementById('confirmSendBox').style.display = 'block';
    document.getElementById('sendBtn').disabled = true;
}

function cancelSendEmail() {
    document.getElementById('confirmSendBox').style.display = 'none';
    document.getElementById('sendBtn').disabled = false;
}

// Proste escapowanie znaków specjalnych HTML - stosowane przy wstawianiu do
// treści e-maila wartości, które teoretycznie mogłyby zawierać "<"/">"/"&"
// (np. gdyby ktoś kiedyś dodał nazwę modelu z takim znakiem). Nie dotyczy to
// pola "message" (komentarz klienta), które - tak jak dotychczas - trafia do
// szablonu bez zmian.
function escapeEmailHtml(value) {
    return String(value === null || value === undefined ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Buduje gotowy fragment HTML (jeden <tr> na wtryskarkę) z jej modelem,
// średnicą ślimaka, ilością i własnymi opcjami dodatkowymi - dokładnie te
// same dane, co karta danej maszyny w Kroku 4 witryny. Szablon EmailJS (pole
// tekstowe wklejane na ich stronie) nie potrafi samodzielnie zapętlić listy
// maszyn ani nic obliczyć, dlatego cała pętla po maszynach odbywa się tutaj,
// w JS, a gotowy HTML trafia do jednej zmiennej szablonu ({{machines_html}}),
// wstawianej wprost (EmailJS podstawia wartości zmiennych bez ucieczki HTML,
// więc surowy HTML w wartości renderuje się poprawnie w treści e-maila).
function buildMachineEmailCardHtml(m) {
    const optsHtml = m.selectedOptions.length > 0
        ? escapeEmailHtml(m.selectedOptions.join(', '))
        : 'Brak wybranych opcji dodatkowych.';
    // Struktura odwzorowuje kartę maszyny z Kroku 4 na stronie
    // (.step4-machine-block--multi): białe "pole" z cienkim obramowaniem i
    // delikatnym cieniem, a w jego wnętrzu - u góry - ten sam wyróżniony,
    // turkusowy pasek co gdzie indziej w tym szablonie (model, średnica
    // ślimaka, ilość), a pod nim opcje dodatkowe tej konkretnej maszyny.
    return `
        <tr>
          <td style="padding:0 40px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e1e8ed;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,0.05);">
              <tr>
                <td style="padding:20px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e6fcfb;border-left:4px solid #0abeb5;border-radius:0 6px 6px 0;margin-bottom:16px;">
                    <tr>
                      <td style="padding:14px 18px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-size:16px;font-weight:900;color:#0f4c47;letter-spacing:-0.2px;font-family:'Lato', Arial, sans-serif;">${escapeEmailHtml(m.modelName)}</td>
                            <td align="right" style="font-size:13px;font-weight:700;color:#0a8f88;white-space:nowrap;font-family:'Lato', Arial, sans-serif;">ilość: ${escapeEmailHtml(m.qty)}</td>
                          </tr>
                        </table>
                        <span style="display:block;font-size:13px;color:#0f4c47;margin-top:4px;font-family:Arial, Helvetica, sans-serif;">Średnica ślimaka: ${escapeEmailHtml(m.screwDiameter)} &middot; Agregat wtryskowy: ${escapeEmailHtml(m.unitStr)}</span>
                      </td>
                    </tr>
                  </table>
                  <span style="display:block;font-size:11px;font-weight:700;letter-spacing:1px;color:#888888;text-transform:uppercase;padding-bottom:4px;font-family:'Lato', Arial, sans-serif;">Wybrane opcje dodatkowe</span>
                  <span style="display:block;font-size:14px;color:#111d35;line-height:1.5;font-family:Arial, Helvetica, sans-serif;">${optsHtml}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
    `;
}

// Buduje fragment HTML z danymi technologicznymi (wymiary formy, materiał,
// masy, wymagana siła zwarcia itd.) - dokładnie te same informacje, co
// techRowsHtml w populateStep4Summary() (Krok 4 na stronie). Pokazywane dla
// KAŻDEJ skonfigurowanej maszyny, która pochodzi z kalkulatora (ma snapshot
// techResults) - niezależnie od tego, ile maszyn klient dodał w Kroku 2; dla
// pozostałych (wybór bezpośrednio z listy modeli) pokazywana jest krótka
// informacja o sposobie doboru, tak jak w Kroku 4. Gdy skonfigurowana jest
// więcej niż jedna maszyna, każdy blok dostaje etykietę z nazwą modelu, do
// którego się odnosi - inaczej przy kilku wtryskarkach naraz nie było by
// wiadomo, których danych dotyczy dany wiersz. Wcześniej dane technologiczne
// pokazywane były tylko wtedy, gdy klient skonfigurował dokładnie JEDNĄ
// maszynę - przy dwóch lub więcej maszynach z kalkulatora znikały one
// całkowicie (ani dane, ani nawet informacja zastępcza), mimo że były
// prawidłowo policzone i zapisane.
function buildTechDetailsEmailHtml(machines) {
    const buildNoTechRow = () => `
        <tr>
          <td style="padding:0 40px 8px;">
            <span style="display:block;font-size:15px;font-weight:600;color:#111d35;font-family:Arial, Helvetica, sans-serif;">Sposób doboru: Wybór bezpośrednio z listy modeli (bez danych technologicznych)</span>
          </td>
        </tr>
        `;

    const buildTechGrid = (r) => {
        const rows = [
            ['Wymiary formy (dł. x szer.)', `${r.moldLength} x ${r.moldWidth} mm`],
            ['Prześwit między kolumnami', `${r.tieClearance} mm`]
        ];
        if (r.moldHeight > 0) rows.push(['Wysokość formy', `${r.moldHeight} mm`]);
        rows.push(
            ['Liczba gniazd', `${r.cavities}`],
            ['Materiał', r.materialLabel],
            ['Grubość ścianki', `${r.wallThickness} mm`],
            ['Masa jednej wypraski', `${r.partWeight} g`],
            ['Całkowita masa wtrysku', `${r.totalWeight.toFixed(2)} g`],
            ['Całkowita objętość wtrysku', `${r.totalVwtr.toFixed(2)} cm³`],
            ['Wymagana siła zwarcia', `${r.requiredForceTon.toFixed(1)} ton`]
        );

        // Wiersze parami (dwie kolumny), tak jak "Dane kontaktowe klienta" w
        // istniejącym szablonie - jeśli liczba pól jest nieparzysta, druga
        // kolumna ostatniego wiersza zostaje po prostu pusta.
        let gridHtml = '';
        for (let i = 0; i < rows.length; i += 2) {
            const [label1, value1] = rows[i];
            const second = rows[i + 1];
            gridHtml += `
            <tr>
              <td width="50%" style="padding:0 12px 18px 0;vertical-align:top;">
                <span style="display:block;font-size:11px;font-weight:700;letter-spacing:1px;color:#888888;text-transform:uppercase;padding-bottom:4px;font-family:'Lato', Arial, sans-serif;">${escapeEmailHtml(label1)}</span>
                <span style="display:block;font-size:15px;font-weight:600;color:#111d35;font-family:Arial, Helvetica, sans-serif;">${escapeEmailHtml(value1)}</span>
              </td>
              <td width="50%" style="padding:0 0 18px 12px;vertical-align:top;">${second ? `
                <span style="display:block;font-size:11px;font-weight:700;letter-spacing:1px;color:#888888;text-transform:uppercase;padding-bottom:4px;font-family:'Lato', Arial, sans-serif;">${escapeEmailHtml(second[0])}</span>
                <span style="display:block;font-size:15px;font-weight:600;color:#111d35;font-family:Arial, Helvetica, sans-serif;">${escapeEmailHtml(second[1])}</span>` : ''}
              </td>
            </tr>
        `;
        }

        return `
        <tr>
          <td style="padding:0 40px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${gridHtml}
            </table>
          </td>
        </tr>
        `;
    };

    return machines.map((m, i) => {
        const label = machines.length > 1 ? `
        <tr>
          <td style="padding:${i === 0 ? '0' : '18px'} 40px 6px;">
            <span style="display:block;font-size:13px;font-weight:700;color:#0abeb5;font-family:'Lato', Arial, sans-serif;">${escapeEmailHtml(m.modelName)}</span>
          </td>
        </tr>
        ` : '';
        return label + (m.techResults ? buildTechGrid(m.techResults) : buildNoTechRow());
    }).join('');
}

function confirmSendEmail() {
    document.getElementById('confirmSendBox').style.display = 'none';
    const statusEl = document.getElementById('sendStatus');

    const isConfigured = window.emailjs && EMAILJS_CONFIG.publicKey.indexOf('YOUR_') !== 0
        && EMAILJS_CONFIG.serviceId.indexOf('YOUR_') !== 0 && EMAILJS_CONFIG.templateId.indexOf('YOUR_') !== 0;

    if (!isConfigured) {
        statusEl.className = 'send-status error';
        statusEl.textContent = 'Wysyłka e-mail nie została jeszcze skonfigurowana (brak danych EmailJS w pliku script.js). Skorzystaj z przycisku „POBIERZ PDF”, a konfigurację wyślij ręcznie.';
        document.getElementById('sendBtn').disabled = false;
        return;
    }

    statusEl.className = 'send-status';
    statusEl.textContent = 'Wysyłanie konfiguracji…';

    const typeData = machineData[selectedMachineType];
    const machines = getConfiguredMachines();

    // Zwarty opis tekstowy KAŻDEJ wybranej maszyny (wersja czysto tekstowa,
    // zachowana dla zgodności wstecznej / na wypadek własnego, prostszego
    // szablonu) oraz gotowy HTML tych samych danych (machines_html) i danych
    // technologicznych (tech_details_html) do wstawienia wprost w aktualnym
    // szablonie e-mail (patrz emailjs_szablon.html).
    const machinesSummaryText = machines.map((m, i) => {
        const optsText = m.selectedOptions.length > 0 ? m.selectedOptions.join(', ') : 'brak';
        return `Maszyna ${i + 1}: ${m.modelName} (agregat ${m.unitStr}, średnica ślimaka ${m.screwDiameter}, ilość ${m.qty})\nOpcje dodatkowe: ${optsText}`;
    }).join('\n\n');

    const templateParams = {
        to_email: EMAILJS_CONFIG.recipient,
        client_copy_email: getVal('client_email'),
        machine_type: typeData ? typeData.label : selectedMachineType,
        selected_model: machines.map(m => `${m.modelName} (${m.unitStr})`).join(', '),
        machines_count: machines.length,
        machines_summary: machinesSummaryText,
        machines_html: machines.map(buildMachineEmailCardHtml).join(''),
        tech_details_html: buildTechDetailsEmailHtml(machines),
        cavities: (machines.length === 1 && machines[0].techResults) ? machines[0].techResults.cavities : '',
        required_force: (machines.length === 1 && machines[0].techResults) ? `${machines[0].techResults.requiredForceTon.toFixed(1)} ton` : '',
        total_shot_volume: (machines.length === 1 && machines[0].techResults) ? `${machines[0].techResults.totalVwtr.toFixed(2)} cm3` : '',
        material: (machines.length === 1 && machines[0].techResults) ? machines[0].techResults.materialLabel : '',
        options_list: machines[0] ? (machines[0].selectedOptions.join(', ') || 'brak') : 'brak',
        from_name: `${getVal('client_firstname')} ${getVal('client_lastname')}`,
        from_email: getVal('client_email'),
        phone: getVal('client_phone'),
        company: getVal('client_company'),
        address: getVal('client_address'),
        message: getVal('client_comment')
    };

    emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, templateParams).then(function () {
        statusEl.className = 'send-status success';
        statusEl.textContent = 'Konfiguracja została pomyślnie wysłana. Dziękujemy!';
        document.getElementById('sendBtn').disabled = false;
    }, function (error) {
        statusEl.className = 'send-status error';
        statusEl.textContent = 'Nie udało się wysłać konfiguracji. Spróbuj ponownie lub skorzystaj z przycisku „POBIERZ PDF”.';
        document.getElementById('sendBtn').disabled = false;
        console.error('EmailJS error:', error);
    });
}

// =====================================================================
// WIDOK 360° (PODSTRONA MASZYNY)
// Sekwencja 37 klatek na typ wtryskarki (img/<folder>/1.png ... 37.png),
// sterowana suwakiem, przeciąganiem po obrazie oraz strzałkami/listą
// typów służącymi do przełączania między modelami wtryskarek.
// =====================================================================

(function initViewer360() {
    const stage = document.getElementById('viewer360Stage');
    const imageEl = document.getElementById('viewer360Image');
    const slider = document.getElementById('viewer360Slider');
    const prevBtn = document.getElementById('viewer360Prev');
    const nextBtn = document.getElementById('viewer360Next');
    const typeItems = Array.from(document.querySelectorAll('.machine-type-item'));
    const metaBox = document.getElementById('machineMeta');
    const metaModel = document.getElementById('machineMetaModel');
    const metaDesc = document.getElementById('machineMetaDesc');

    if (!stage || !imageEl || !slider) return;

    const TOTAL_FRAMES = 37;

    // Konfiguracja dostępnych typów wtryskarek: folder z klatkami 360°,
    // nazwa/opis modelu wyświetlane pod listą. Wszystkie typy używają tych
    // samych, stałych proporcji kadru (.viewer360-stage w style.css) - dzięki
    // temu widok 360° ma zawsze ten sam rozmiar i pozycję przy przełączaniu
    // między typami (bez "skakania" paska/suwaka niżej lub wyżej).
    // "available: false" oznacza typ, dla którego nie ma jeszcze
    // przygotowanego widoku 360° (brak folderu ze zdjęciami) - lista
    // pokazuje go w kolejności, ale zamiast obrazu widoczny jest
    // komunikat "wkrótce dostępne".
    const MACHINE_TYPES = [
        { name: 'DL-A5',      folder: '360-DL',    available: true,  model: 'DL-A5',              desc: 'Wysokiej klasy dwupłytowa seria z systemem bezpośredniego ryglowania (Dual Lock)' },
        { name: 'TH-A5',      folder: '360-TH',    available: true,  model: 'TH-A5',              desc: 'Wysokiej klasy nowa seria hybrydowa z układem kolankowym' },
        { name: 'TE-A5',      folder: '360-TE',    available: true,  model: 'TE-A5',              desc: 'Wysokiej klasy nowa, w pełni elektryczna seria z układem kolankowym' },
        { name: 'TL-A5',      folder: '360-TL',    available: false, model: 'TL-A5',              desc: '' },
        { name: 'VHA-RS',     folder: '360-VH',    available: true,  model: 'VHA-RS',             desc: 'Wysokiej klasy, pionowa seria wtryskarek' },
        { name: 'MULTI',      folder: '360-MULTI', available: true,  model: 'NC-G5',              desc: 'Nowoczesna, pozioma, dwukolorowa seria hybrydowa' },
        { name: 'Super-Foam', folder: '360-SF',    available: true,  model: 'DL-A5(super-foam)',  desc: 'Wysokiej klasy seria z technologią super spieniania i bezpośrednim ryglowaniem' }
    ];

    let currentTypeIndex = 0;
    const preloadedFolders = {};

    const framePath = (typeIndex, frameIndex) =>
        `img/${MACHINE_TYPES[typeIndex].folder}/${frameIndex}.png`;

    function preloadType(typeIndex) {
        const type = MACHINE_TYPES[typeIndex];
        if (!type.available || preloadedFolders[type.folder]) return;
        preloadedFolders[type.folder] = true;
        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const preload = new Image();
            preload.src = framePath(typeIndex, i);
        }
    }

    function setFrame(frameIndex) {
        if (!MACHINE_TYPES[currentTypeIndex].available) return;
        const clamped = Math.max(1, Math.min(TOTAL_FRAMES, frameIndex));
        imageEl.src = framePath(currentTypeIndex, clamped);
        slider.value = clamped;
    }

    // Skala, z jakiej obraz "startuje" przy każdej zmianie typu, zanim
    // zmniejszy się do swojego standardowego rozmiaru (scale: 1) - patrz
    // efekt niżej w setMachineType() oraz przejście na .viewer360-stage img
    // w style.css.
    const TYPE_CHANGE_START_SCALE = 1.18;

    // Sekcje podzespołów ("Zespół zamykający", "Agregat wtryskowy" itd.) oraz opis
    // maszyny pod nimi są przypisane do konkretnego typu wtryskarki poprzez
    // atrybut data-machine-type w pliku HTML. Przy zmianie typu na liście
    // powyżej pokazujemy tylko te elementy, które pasują do aktualnie
    // wybranego typu - jeśli żaden nie pasuje (typ nie ma jeszcze
    // przygotowanych treści), cała sekcja jest ukrywana.
    const componentsSection = document.getElementById('componentsSection');
    const componentItems = Array.from(document.querySelectorAll('.component-item'));
    const machineDescPanels = Array.from(document.querySelectorAll('.machine-description-panel'));

    function updateComponentsForType(typeName) {
        let hasContent = false;

        componentItems.forEach((item) => {
            const matches = item.dataset.machineType === typeName;
            item.classList.toggle('is-hidden-type', !matches);
            if (matches) hasContent = true;
        });

        machineDescPanels.forEach((panel) => {
            panel.classList.toggle('is-hidden-type', panel.dataset.machineType !== typeName);
        });

        if (componentsSection) {
            componentsSection.style.display = hasContent ? '' : 'none';
        }
    }

    function setMachineType(typeIndex) {
        currentTypeIndex = ((typeIndex % MACHINE_TYPES.length) + MACHINE_TYPES.length) % MACHINE_TYPES.length;
        const type = MACHINE_TYPES[currentTypeIndex];

        typeItems.forEach((item, i) => {
            item.classList.toggle('active', i === currentTypeIndex);
            item.classList.toggle('is-unavailable', !MACHINE_TYPES[i].available);
        });

        // Efekt "pomniejszania się do standardowego rozmiaru" przy każdej
        // zmianie typu (także przy pierwszym wczytaniu strony, bo
        // setMachineType(0) jest wołane w inicjalizacji niżej): obraz
        // pojawia się na chwilę nieco większy, po czym płynnie i szybko
        // zmniejsza się do swojej właściwej wielkości (scale: 1).
        imageEl.style.transition = 'none';
        imageEl.style.transform = `scale(${TYPE_CHANGE_START_SCALE})`;
        // Wymuszenie przeliczenia stylów, aby powyższy stan (bez animacji)
        // zdążył się wyrenderować, zanim włączymy z powrotem przejście
        // i ustawimy docelową skalę - inaczej przeglądarka mogłaby po
        // prostu pominąć stan pośredni i animacji nie było by widać.
        void imageEl.offsetWidth;
        imageEl.style.transition = '';
        imageEl.style.transform = 'scale(1)';

        if (metaBox && metaModel && metaDesc) {
            if (type.available && type.model) {
                metaModel.textContent = type.model;
                metaDesc.textContent = type.desc || '';
                metaBox.style.display = '';
            } else {
                metaBox.style.display = 'none';
            }
        }

        updateComponentsForType(type.name);

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
    }

    typeItems.forEach((item) => {
        item.addEventListener('click', () => {
            setMachineType(parseInt(item.dataset.index, 10));
        });
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', () => setMachineType(currentTypeIndex - 1));
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => setMachineType(currentTypeIndex + 1));
    }

    slider.addEventListener('input', () => {
        setFrame(parseInt(slider.value, 10));
        // Wibracja przy przesuwaniu paska widoku 360° - jedno "kliknięcie"
        // haptyczne na każdą zmianę klatki (patrz triggerHapticFeedback na
        // górze pliku).
        triggerHapticFeedback(8);
    });

    // Obracanie przeciąganiem bezpośrednio po widoku (dodatkowo do suwaka)
    let isDragging = false;
    let startX = 0;
    let startFrame = 1;
    const DRAG_SENSITIVITY = 6; // px potrzebne na zmianę o jedną klatkę

    function handleDragStart(clientX) {
        if (!MACHINE_TYPES[currentTypeIndex].available) return;
        isDragging = true;
        startX = clientX;
        startFrame = parseInt(slider.value, 10);
        stage.classList.add('is-dragging');
    }

    function handleDragMove(clientX) {
        if (!isDragging) return;
        const deltaX = clientX - startX;
        const frameDelta = Math.round(deltaX / DRAG_SENSITIVITY);
        let newFrame = (startFrame - frameDelta - 1) % TOTAL_FRAMES;
        if (newFrame < 0) newFrame += TOTAL_FRAMES;
        const targetFrame = newFrame + 1;
        if (targetFrame !== parseInt(slider.value, 10)) {
            // Wibracja przy przesuwaniu palcem bezpośrednio po widoku 360°
            // (nie tylko po pasku) - tylko gdy przeciąganie faktycznie
            // zmienia wyświetlaną klatkę (patrz triggerHapticFeedback na
            // górze pliku). Na komputerze (mysz) funkcja i tak nic nie robi.
            triggerHapticFeedback(8);
        }
        setFrame(targetFrame);
    }

    function handleDragEnd() {
        isDragging = false;
        stage.classList.remove('is-dragging');
    }

    stage.addEventListener('mousedown', (e) => handleDragStart(e.clientX));
    window.addEventListener('mousemove', (e) => handleDragMove(e.clientX));
    window.addEventListener('mouseup', handleDragEnd);

    stage.addEventListener('touchstart', (e) => handleDragStart(e.touches[0].clientX), { passive: true });
    stage.addEventListener('touchmove', (e) => handleDragMove(e.touches[0].clientX), { passive: true });
    stage.addEventListener('touchend', handleDragEnd);

    // ---- Efekt "lupy" na komputerach (najechanie myszką na widok 360°) ----
    // Uruchamiany wyłącznie na urządzeniach z myszką/precyzyjnym wskaźnikiem
    // ("hover: hover" + "pointer: fine") - na telefonach/tabletach widok
    // 360° obsługuje się przez dotyk (przeciąganie palcem), które jest już
    // zapewnione przez obsługę touchstart/touchmove/touchend powyżej.
    const magnifier = document.getElementById('viewer360Magnifier');
    const supportsHoverMagnifier = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (magnifier && supportsHoverMagnifier) {
        const MAGNIFIER_ZOOM = 2.2;

        function updateMagnifier(clientX, clientY) {
            if (!MACHINE_TYPES[currentTypeIndex].available) {
                magnifier.classList.remove('is-active');
                return;
            }

            const rect = stage.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            const half = (magnifier.offsetWidth || 170) / 2;

            magnifier.style.left = `${x - half}px`;
            magnifier.style.top = `${y - half}px`;

            magnifier.style.backgroundImage = `url("${imageEl.currentSrc || imageEl.src}")`;
            magnifier.style.backgroundSize = `${rect.width * MAGNIFIER_ZOOM}px ${rect.height * MAGNIFIER_ZOOM}px`;
            magnifier.style.backgroundPosition = `${-(x * MAGNIFIER_ZOOM - half)}px ${-(y * MAGNIFIER_ZOOM - half)}px`;

            magnifier.classList.add('is-active');
        }

        stage.addEventListener('mouseenter', (e) => updateMagnifier(e.clientX, e.clientY));
        stage.addEventListener('mousemove', (e) => updateMagnifier(e.clientX, e.clientY));
        stage.addEventListener('mouseleave', () => magnifier.classList.remove('is-active'));
    }

    // Inicjalizacja - pierwszy typ na liście (DL-A5) jako aktywny
    setMachineType(0);
})();

// =====================================================================
// EFEKT "WYSUWANIA SIĘ OD SPODU" DLA SEKCJI PODZESPOŁÓW (maszyny.html)
// Każda sekcja (Zespół zamykający / Agregat wtryskowy / Układ hydrauliczny /
// Sterownik...) pojawia się dopiero, gdy użytkownik przewinie stronę do
// niej - podobnie jak liczniki w sekcji #woojinStats na stronie głównej.
// =====================================================================
(function initComponentsReveal() {
    const items = document.querySelectorAll('.component-item');
    if (!items.length) return;

    if (!('IntersectionObserver' in window)) {
        items.forEach((item) => item.classList.add('is-visible'));
        return;
    }

    // Gdy kilka sekcji przekroczy próg widoczności w tym samym momencie
    // (np. przy szybkim przewijaniu strony lub na małym ekranie, gdzie
    // widać od razu dwie sekcje), pojawiają się kaskadowo, z niewielkim
    // opóźnieniem między kolejnymi, zamiast wszystkie naraz - dzięki temu
    // animacja wygląda znacznie płynniej. Przy normalnym, stopniowym
    // przewijaniu (jedna sekcja na raz) opóźnienie wynosi 0ms, więc nic
    // się nie zmienia.
    const REVEAL_STAGGER_MS = 90;
    const REVEAL_STAGGER_MAX_MS = 270;

    const observer = new IntersectionObserver(
        function (entries) {
            const revealed = entries.filter((entry) => entry.isIntersecting);

            revealed.forEach(function (entry, i) {
                const delay = Math.min(i * REVEAL_STAGGER_MS, REVEAL_STAGGER_MAX_MS);
                entry.target.style.transitionDelay = `${delay}ms`;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        }
    );

    items.forEach((item) => observer.observe(item));
})();

// =====================================================================
// WIDOK 360° W KROKU 1 KONFIGURATORA (konfigurator.html)
// Uproszczona wersja widoku 360° - bez strzałek/przycisków przełączania
// typu (wybór typu odbywa się przez kliknięcie karty maszyny po lewej
// stronie), ale z tym samym mechanizmem obracania przeciąganiem/suwakiem
// oraz efektem lupy na komputerach, co na podstronie "Maszyny". Nad
// widokiem wyświetlana jest wyłącznie nazwa aktualnie wybranego typu.
// =====================================================================

(function initConfiguratorViewer360() {
    const stage = document.getElementById('cfgViewer360Stage');
    const imageEl = document.getElementById('cfgViewer360Image');
    const slider = document.getElementById('cfgViewer360Slider');
    const handEl = document.getElementById('cfgViewer360Hand');
    const nameLabel = document.getElementById('step1ViewerName');
    const descLabel = document.getElementById('step1ViewerDesc');
    const radios = Array.from(document.querySelectorAll('.machine-card input[name="machine_type"]'));

    if (!stage || !imageEl || !slider || !radios.length) return;

    const TOTAL_FRAMES = 37;

    // Foldery z klatkami 360° dla typów dostępnych w konfiguratorze - te
    // same zasoby (img/360-XX), co na podstronie "Maszyny". TL-A5 nie ma
    // jeszcze przygotowanego widoku 360° (analogicznie jak tam). Opis
    // (desc) jest tym samym tekstem, który wcześniej znajdował się w
    // kafelku po lewej - teraz wyświetlany pod nazwą modelu w panelu
    // podglądu 360° po prawej.
    const TYPE_VIEWER_DATA = {
        'DL-A5': { folder: '360-DL', available: true, desc: 'Premium, energooszczędna wtryskarka dwupłytowa z systemem podwójnego ryglowania (Dual Lock) — do dużych, precyzyjnych wyprasek wymagających wysokiej siły zwarcia.' },
        'TH-A5': { folder: '360-TH', available: true, desc: 'Klasyczna, energooszczędna wtryskarka hydrauliczna o dużej sztywności konstrukcji i wysokiej powtarzalności procesu wtrysku.' },
        'TE-A5': { folder: '360-TE', available: true, desc: 'W pełni elektryczna wtryskarka zapewniająca najwyższą precyzję, powtarzalność wagi wypraski oraz najniższe zużycie energii.' },
        'TL-A5': { folder: '360-TL', available: false, desc: 'Wtryskarka bez kolumn (tie-bar-less) dająca pełną swobodę doboru wielkości formy, wielogniazdowości i automatyzacji.' },
        'VHA-RS': { folder: '360-VH', available: true, desc: 'Wysokiej klasy, pionowa wtryskarka hydrauliczna z obrotowym stołem (turntable), przeznaczona do formowania z insertami oraz pionowego układu wtrysku.' },
        'MULTI': { folder: '360-MULTI', available: true, desc: 'Nowoczesna, pozioma wtryskarka dwukolorowa (2K) do formowania dwóch różnych tworzyw lub kolorów w jednym cyklu produkcyjnym (ONE-CYCLE).' },
        'Super-Foam': { folder: '360-SF', available: true, desc: 'Dwupłytowa wtryskarka z systemem bezpośredniego ryglowania (Dual Lock) i technologią super spieniania, dedykowana produkcji dużych, lekkich elementów, w tym palet.' }
    };

    let currentType = 'DL-A5';
    const preloadedFolders = {};

    // Dłoń podpowiadająca możliwość obracania widoku pojawia się na nowo i
    // znika na stałe 5 sekund po każdym załadowaniu widoku 360° - zarówno
    // przy pierwszym wejściu na stronę, jak i po każdej zmianie typu
    // wtryskarki z kafelków (patrz wywołanie w setViewerType() poniżej).
    // Klasa .is-gone (display:none) ma pierwszeństwo przed ewentualnym
    // późniejszym usunięciem klasy .is-hidden przez handleDragEnd.
    let handAutoHideTimer = null;

    function scheduleHandAutoHide() {
        if (!handEl) return;
        clearTimeout(handAutoHideTimer);
        handEl.classList.remove('is-gone');
        handAutoHideTimer = setTimeout(() => {
            handEl.classList.add('is-gone');
        }, 5000);
    }

    // Automatyczne obracanie widoku 360° - ten sam mechanizm co w
    // initViewer360() na podstronie "Maszyny": włączone domyślnie, pauzuje
    // się przy ręcznej interakcji (suwak/przeciąganie) i wznawia po chwili
    // bezczynności.
    const AUTO_ROTATE_FRAME_INTERVAL_MS = 90;
    const AUTO_ROTATE_RESUME_DELAY_MS = 3500;
    let autoRotateTimer = null;
    let autoRotateResumeTimer = null;

    // Skala, z jakiej obraz "startuje" przy każdej zmianie typu, zanim
    // zmniejszy się do swojego standardowego rozmiaru (scale: 1) - ten sam
    // efekt i ta sama wartość co w initViewer360() na podstronie "Maszyny".
    const TYPE_CHANGE_START_SCALE = 1.18;

    const framePath = (frameIndex) => `img/${TYPE_VIEWER_DATA[currentType].folder}/${frameIndex}.png`;

    function preloadCurrentType() {
        const data = TYPE_VIEWER_DATA[currentType];
        if (!data.available || preloadedFolders[data.folder]) return;
        preloadedFolders[data.folder] = true;
        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const preload = new Image();
            preload.src = `img/${data.folder}/${i}.png`;
        }
    }

    function setFrame(frameIndex) {
        if (!TYPE_VIEWER_DATA[currentType].available) return;
        const clamped = Math.max(1, Math.min(TOTAL_FRAMES, frameIndex));
        imageEl.src = framePath(clamped);
        slider.value = clamped;
    }

    function advanceAutoRotateFrame() {
        const current = parseInt(slider.value, 10) || 1;
        const next = current >= TOTAL_FRAMES ? 1 : current + 1;
        setFrame(next);
    }

    function stopAutoRotate() {
        if (autoRotateTimer) {
            clearInterval(autoRotateTimer);
            autoRotateTimer = null;
        }
    }

    function startAutoRotate() {
        stopAutoRotate();
        if (!TYPE_VIEWER_DATA[currentType].available) return;
        autoRotateTimer = setInterval(advanceAutoRotateFrame, AUTO_ROTATE_FRAME_INTERVAL_MS);
    }

    function scheduleAutoRotateResume() {
        clearTimeout(autoRotateResumeTimer);
        autoRotateResumeTimer = setTimeout(startAutoRotate, AUTO_ROTATE_RESUME_DELAY_MS);
    }

    function pauseAutoRotate() {
        stopAutoRotate();
        scheduleAutoRotateResume();
    }

    function setViewerType(typeName) {
        if (!TYPE_VIEWER_DATA[typeName]) return;
        clearTimeout(autoRotateResumeTimer);
        currentType = typeName;
        const data = TYPE_VIEWER_DATA[currentType];

        if (nameLabel) nameLabel.textContent = currentType;
        if (descLabel) descLabel.textContent = data.desc || '';

        // Efekt "pomniejszania się do standardowego rozmiaru" przy zmianie
        // typu - identyczny jak w setMachineType() na podstronie "Maszyny":
        // obraz pojawia się na chwilę nieco większy, po czym płynnie i
        // szybko zmniejsza się do swojej właściwej wielkości (scale: 1).
        imageEl.style.transition = 'none';
        imageEl.style.transform = `scale(${TYPE_CHANGE_START_SCALE})`;
        void imageEl.offsetWidth;
        imageEl.style.transition = '';
        imageEl.style.transform = 'scale(1)';

        if (data.available) {
            stage.classList.remove('is-unavailable');
            slider.disabled = false;
            preloadCurrentType();
            setFrame(1);
            startAutoRotate();
        } else {
            stage.classList.add('is-unavailable');
            slider.disabled = true;
            stopAutoRotate();
        }

        scheduleHandAutoHide();
    }

    radios.forEach((radio) => {
        radio.addEventListener('change', () => {
            if (radio.checked) setViewerType(radio.value);
        });
    });

    slider.addEventListener('input', () => {
        setFrame(parseInt(slider.value, 10));
        pauseAutoRotate();
        // Wibracja przy przesuwaniu paska widoku 360° - jedno "kliknięcie"
        // haptyczne na każdą zmianę klatki (patrz triggerHapticFeedback na
        // górze pliku).
        triggerHapticFeedback(8);
    });

    // Obracanie przeciąganiem (mysz i dotyk) - identycznie jak na
    // podstronie "Maszyny".
    let isDragging = false;
    let startX = 0;
    let startFrame = 1;
    const DRAG_SENSITIVITY = 6;

    function handleDragStart(clientX) {
        if (!TYPE_VIEWER_DATA[currentType].available) return;
        isDragging = true;
        startX = clientX;
        startFrame = parseInt(slider.value, 10);
        stage.classList.add('is-dragging');
        // Ukrycie dłoni sygnalizującej możliwość obracania widoku - na
        // komputerach robi to już samo :hover w CSS, ale na dotyku (gdzie
        // hover nie występuje) trzeba to zrobić ręcznie w JS.
        if (handEl) handEl.classList.add('is-hidden');
        pauseAutoRotate();
    }

    function handleDragMove(clientX) {
        if (!isDragging) return;
        const deltaX = clientX - startX;
        const frameDelta = Math.round(deltaX / DRAG_SENSITIVITY);
        let newFrame = (startFrame - frameDelta - 1) % TOTAL_FRAMES;
        if (newFrame < 0) newFrame += TOTAL_FRAMES;
        const targetFrame = newFrame + 1;
        if (targetFrame !== parseInt(slider.value, 10)) {
            // Wibracja przy przesuwaniu palcem bezpośrednio po widoku 360°
            // (nie tylko po pasku) - tylko gdy przeciąganie faktycznie
            // zmienia wyświetlaną klatkę (patrz triggerHapticFeedback na
            // górze pliku). Na komputerze (mysz) funkcja i tak nic nie robi.
            triggerHapticFeedback(8);
        }
        setFrame(targetFrame);
        pauseAutoRotate();
    }

    function handleDragEnd() {
        isDragging = false;
        stage.classList.remove('is-dragging');
        if (handEl) handEl.classList.remove('is-hidden');
    }

    stage.addEventListener('mousedown', (e) => handleDragStart(e.clientX));
    window.addEventListener('mousemove', (e) => handleDragMove(e.clientX));
    window.addEventListener('mouseup', handleDragEnd);

    stage.addEventListener('touchstart', (e) => handleDragStart(e.touches[0].clientX), { passive: true });
    stage.addEventListener('touchmove', (e) => handleDragMove(e.touches[0].clientX), { passive: true });
    stage.addEventListener('touchend', handleDragEnd);

    // Inicjalizacja - typ aktualnie zaznaczony w formularzu (checked)
    // (setViewerType() uruchamia też powyższy 5-sekundowy timer dłoni)
    const checkedRadio = radios.find((r) => r.checked);
    setViewerType(checkedRadio ? checkedRadio.value : 'DL-A5');
})();

// =====================================================================
// FORMULARZ KONTAKTOWY (kontakt.html) - wybór adresata i wysyłka mailto
// =====================================================================

(function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const statusEl = document.getElementById('contactFormStatus');

    const RECIPIENTS = {
        biuro: 'ploffice@wjpim.com',
        handlowiec: 'mczekalik@wjpim.com',
        serwis: 'woojin.choi@wjpim.com'
    };

    const TOPIC_LABELS = {
        biuro: 'Biuro',
        handlowiec: 'Handlowiec',
        serwis: 'Serwis'
    };

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Honeypot wypełniony - najpewniej bot. Odrzucamy zgłoszenie po
        // cichu, bez żadnego komunikatu o błędzie (żeby nie zdradzić
        // automatowi, że został wykryty).
        if (isHoneypotFilled('contact_hp')) return;

        if (!isHumanCheckVerified('humanCheckBtnContact')) {
            if (statusEl) {
                statusEl.textContent = 'Potwierdź, że nie jesteś robotem, zaznaczając pole powyżej, aby wysłać wiadomość.';
                statusEl.classList.remove('success');
                statusEl.classList.add('error');
            }
            const humanCheckBtn = document.getElementById('humanCheckBtnContact');
            if (humanCheckBtn) humanCheckBtn.focus();
            return;
        }

        const topic = (form.querySelector('input[name="contact_topic"]:checked') || {}).value || 'biuro';
        const recipient = RECIPIENTS[topic];

        const name = document.getElementById('contact_name').value.trim();
        const email = document.getElementById('contact_email').value.trim();
        const phone = document.getElementById('contact_phone').value.trim();
        const message = document.getElementById('contact_message').value.trim();

        const subject = 'Wiadomość ze strony WOOJIN PLAIMM - ' + TOPIC_LABELS[topic];

        const bodyLines = [
            'Imię i nazwisko: ' + name,
            'E-mail: ' + email,
            phone ? 'Telefon: ' + phone : null,
            '',
            message
        ].filter(Boolean);

        const mailtoUrl = 'mailto:' + recipient +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(bodyLines.join('\n'));

        if (statusEl) {
            statusEl.textContent = 'Otwieramy Twój program pocztowy z przygotowaną wiadomością...';
            statusEl.classList.remove('error');
            statusEl.classList.add('success');
        }

        window.location.href = mailtoUrl;
    });
})();

// =====================================================================
// INTERAKTYWNY MODEL 3D WTRYSKARKI TE-A5 (index.html, sekcja #te3dSection)
// Model wtryskarki w pełni elektrycznej TE-A5 zbudowany z prostych brył
// (prostopadłościany, walce, torusy) na podstawie zdjęć z widoku 360°,
// renderu przekroju oraz katalogu TE-A5. Rysowany bezpośrednio w WebGL -
// bez zewnętrznych bibliotek (np. three.js), więc nie trzeba dogrywać
// żadnych dodatkowych plików ani polegać na zewnętrznym CDN.
//
// Co potrafi:
//  - obracanie przeciąganiem (mysz / palec - na telefonie tylko w poziomie,
//    żeby pionowy ruch palcem nadal przewijał stronę), przybliżanie
//    przyciskami +/−, Ctrl + kółko myszy lub klawiaturą (strzałki, +/−),
//  - numerowane znaczniki (hotspoty) i zakładki z najważniejszymi cechami -
//    kliknięcie przenosi kamerę do danego zespołu, podświetla go neonowo i
//    wyświetla opis w panelu po prawej (treści: tablica TE3D_FEATURES),
//  - tryb X-RAY: obudowy stają się półprzezroczyste ("hologram" z
//    neonowymi krawędziami), odsłaniając układ kolanowy, płyty, kolumny,
//    ślimak, śruby kulowe, serwosilniki i napędy w szafie,
//  - symulację cyklu wtrysku (zamykanie formy -> dosunięcie dyszy ->
//    wtrysk -> docisk -> chłodzenie + dozowanie -> otwieranie -> wypychanie),
//  - automatyczny, powolny obrót w widoku ogólnym.
// Pętla renderowania działa tylko wtedy, gdy sekcja jest widoczna na
// ekranie (IntersectionObserver), żeby nie obciążać komputera/telefonu.
// Gdy przeglądarka nie obsługuje WebGL - zamiast modelu wyświetla się
// zdjęcie przekroju maszyny, a zakładki/panel opisu działają normalnie.
// =====================================================================

(function initTe3DShowcase() {
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
    const cycleHud = document.getElementById('te3dCycleHud');
    const cycleList = document.getElementById('te3dCycleList');
    if (!stage || !canvas || !panel || !tabsEl) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const IMG = 'img/te-a5/';

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
            media: { type: 'img', src: IMG + 'te-a5-przekroj.jpg', alt: 'Przekrój wtryskarki elektrycznej TE-A5', caption: 'TE-A5 · przekrój konstrukcji' },
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
            anchor: [0.62, 0.5, 0.6], normal: [0, 0, 1],
            view: { target: [0.55, 0.62, 0.1], r: 3.9, theta: 0.3, phi: 1.28 },
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
            media: { type: 'img', src: IMG + 'te-a5-przekroj.jpg', alt: 'Zespół zamykający TE-A5 z układem kolanowym', caption: 'Zespół zamykający · układ kolanowy' },
            anchor: [-1.72, 1.78, 0.25], normal: [0, 0.2, 1],
            view: { target: [-1.75, 1.42, 0], r: 3.6, theta: -0.5, phi: 1.08 },
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
            anchor: [-3.0, 1.62, 0.3], normal: [-0.75, 0.15, 0.65],
            view: { target: [-2.75, 1.38, 0], r: 3.3, theta: -1.15, phi: 1.2 },
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
                'Większy prześwit między kolumnami, np. TE220A5: 625 × 625 mm'
            ],
            media: null,
            anchor: [-0.9, 0.95, 0.55], normal: [0, 0, 1],
            view: { target: [-0.95, 1.2, 0], r: 3.4, theta: -0.22, phi: 1.2 },
            xray: true
        },
        {
            id: 'injection', num: '05', tab: 'Agregat wtryskowy', kicker: 'ZESPÓŁ WTRYSKU',
            title: 'Zintegrowany agregat wtryskowy',
            lead: 'Sztywny zespół wtrysku z jednolitym odlewem obudowy i precyzyjnym czujnikiem siły zapewnia powtarzalność wypraski co do grama.',
            points: [
                'Obudowa wtrysku i śruba kulowa w jednym odlewie — mniejsze tolerancje montażowe',
                'Śruba kulowa o minimalnym luzie — wysoka powtarzalność pozycjonowania',
                'Czujnik siły (load cell) — dokładna kontrola ciśnienia wtrysku i ciśnienia wstecznego',
                'Symetryczne, podwójne cylindry docisku dyszy — stabilny docisk i równoległość płyt',
                'Prędkość wtrysku do 350 mm/s (opcjonalnie do 700 mm/s)'
            ],
            media: { type: 'img', src: IMG + 'te-a5-agregat.jpg', alt: 'Agregat wtryskowy TE-A5 pod obudową', caption: 'Agregat wtryskowy · widok pod obudową' },
            anchor: [1.95, 1.74, 0.3], normal: [0, 0.55, 0.85],
            view: { target: [1.95, 1.3, 0], r: 4.1, theta: 0.78, phi: 1.08 },
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
            media: { type: 'img', src: IMG + 'te-a5-sterownik.jpg', alt: 'Panel sterowania B&R wtryskarki TE-A5', caption: 'Panel sterowania · ekran 21″' },
            anchor: [0.3, 1.9, 0.8], normal: [0, 0, 1],
            view: { target: [0.3, 1.55, 0.72], r: 2.1, theta: 0.18, phi: 1.42 },
            xray: false
        }
    ];

    // Etapy symulacji cyklu (czasy w sekundach, pętla).
    const CYCLE_PHASES = [
        { name: 'Zamykanie formy', t0: 0.0, t1: 1.0 },
        { name: 'Dosunięcie dyszy', t0: 1.0, t1: 1.4 },
        { name: 'Wtrysk', t0: 1.4, t1: 2.2 },
        { name: 'Docisk', t0: 2.2, t1: 3.0 },
        { name: 'Chłodzenie + dozowanie', t0: 3.0, t1: 4.8, parallel: true },
        { name: 'Otwieranie formy', t0: 4.8, t1: 5.8 },
        { name: 'Wypychanie', t0: 5.8, t1: 6.8 }
    ];
    const CYCLE_LENGTH = 7.3;
    const CYCLE_VIEW = { target: [-0.2, 1.3, 0], r: 7.4, theta: -0.1, phi: 1.3 };

    let activeFeature = 0;
    let userXray = false;
    let autoRotate = !reduceMotion;
    let cycleRunning = false;

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
            <figure class="te3d-media">
                <img src="${f.media.src}" alt="${f.media.alt}" loading="lazy">
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
            float s = boxSdf(p - vec2(-0.08, 0.0), vec2(2.95, 0.58));
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
        // tabliczka modelu
        plate: makeTexture(256, 64, (x, w, h) => {
            x.fillStyle = '#22282f'; x.fillRect(0, 0, w, h);
            x.fillStyle = '#ffffff'; x.font = 'bold 34px Arial'; x.fillText('TE', 22, 45);
            x.fillStyle = '#00e1d6'; x.fillText('-A5', 66, 45);
            x.fillStyle = '#8f9aa6'; x.font = '14px Arial'; x.fillText('SERIES', 150, 44);
        }),
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
        vent: mat('#8c949d', { tex: TEX.vent }),
        logo: mat('#5dc6b5', { tex: TEX.logo }),
        plate: mat('#22282f', { tex: TEX.plate }),
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

    const YC = 1.40;   // oś zespołu zamykającego / wtrysku
    const PL = 0.48;   // połowa wymiaru płyt
    const M_CLOSED = -0.85;
    const STROKE = 0.2;
    const PIV = 0.12;  // odsunięcie osi dźwigni od osi maszyny

    function buildMachine() {
        // ===== RAMA / PODSTAWA =====
        R(-3.08, 2.95, 0.78, 0.86, -0.62, 0.62, M.steel);
        [-0.56, 0.56].forEach(z => {
            R(-3.08, -1.0, 0.12, 0.22, z - 0.05, z + 0.05, M.steel);
            R(-3.08, -1.0, 0.62, 0.7, z - 0.05, z + 0.05, M.steel);
            [-3.0, -2.08, -1.1].forEach(x => R(x - 0.06, x + 0.06, 0.12, 0.78, z - 0.06, z + 0.06, M.steel));
        });
        R(-3.0, -1.1, 0.14, 0.22, -0.12, 0.12, M.steelMid);
        [-2.54, -1.6].forEach(x => R(x - 0.04, x + 0.04, 0.14, 0.22, -0.56, 0.56, M.steelMid));

        // szafa elektryczna pod agregatem
        R(-1.0, 2.85, 0.06, 0.14, -0.5, 0.5, M.steel);
        R(-0.96, 2.79, 0.14, 0.78, -0.31, -0.29, M.steelDark);
        R(-1.02, -0.96, 0.14, 0.78, -0.58, 0.58, M.steel, { cover: true });
        R(2.79, 2.85, 0.14, 0.78, -0.58, 0.58, M.steel, { cover: true });
        const doors = 6, dx0 = -0.94, dx1 = 2.77, gap = 0.028;
        const dw = (dx1 - dx0 - gap * (doors - 1)) / doors;
        for (let i = 0; i < doors; i++) {
            const x0 = dx0 + i * (dw + gap), x1 = x0 + dw;
            [1, -1].forEach(s => {
                const z = s * 0.575;
                R(x0, x1, 0.18, 0.74, z - 0.01, z + 0.01, M.tealDoor, { cover: true, f: 'energy' });
                if (i === 1 || i === 3 || i === 4) {
                    R(x0 + 0.1, x0 + 0.22, 0.52, 0.64, z + s * 0.011 - 0.003, z + s * 0.011 + 0.003, M.black, { cover: true, xo: 0, edges: false });
                }
                if (i === 3) {
                    R(x0 + 0.2, x0 + 0.32, 0.26, 0.38, z + s * 0.011 - 0.003, z + s * 0.011 + 0.003, M.black, { cover: true, xo: 0, edges: false });
                }
                R(x1 - 0.08, x1 - 0.055, 0.43, 0.47, z + s * 0.013 - 0.004, z + s * 0.013 + 0.004, M.light, { cover: true, xo: 0, edges: false });
            });
        }
        // napędy KEBA w szafie (widoczne w X-RAY)
        [[-0.78, -0.46], [-0.36, -0.04], [0.06, 0.38], [0.52, 0.9], [1.02, 1.4], [1.55, 1.95]].forEach(([x0, x1], i) => {
            R(x0, x1, 0.2, i % 2 ? 0.66 : 0.7, -0.26, 0.34, M.drive, { f: 'energy' });
            R(x0 + 0.04, x1 - 0.04, 0.6, 0.625, 0.34, 0.352, M.led, { f: 'energy', edges: false });
            R(x0 + 0.04, x0 + 0.1, 0.28, 0.5, 0.34, 0.352, M.steelMid, { edges: false });
        });

        // stopki poziomujące
        [-3.0, -2.08, -1.1, -0.92, 0.95, 2.78].forEach(x => [-0.56, 0.56].forEach(z => {
            C('y', 0.075, 0.0, 0.05, x, z, M.steel, { edges: false });
            C('y', 0.02, 0.05, 0.13, x, z, M.chrome, { edges: false });
        }));

        // prowadnice L/M pod płytą ruchomą + szyny sań wtrysku
        [-0.42, 0.42].forEach(z => {
            R(-2.6, -0.16, 0.86, 0.89, z - 0.03, z + 0.03, M.chrome, { f: 'platen' });
        });
        [-0.34, 0.34].forEach(z => R(0.32, 2.95, 0.86, 0.9, z - 0.04, z + 0.04, M.steelMid));

        // ===== ZESPÓŁ ZAMYKAJĄCY (wnętrze) =====
        // płyta tylna + podparcie
        R(-2.95, -2.62, YC - PL, YC + PL, -PL, PL, M.steel, { f: 'clampcomp' });
        R(-2.95, -2.62, 0.86, YC - PL, -0.4, 0.4, M.steel);
        // ucha dźwigni na płycie tylnej
        [-1, 1].forEach(sy => [-0.2, 0.2].forEach(z => {
            R(-2.62, -2.26, YC + sy * PIV - 0.05, YC + sy * PIV + 0.05, z - 0.035, z + 0.035, M.steelMid, { f: 'toggle' });
        }));
        // wieniec zębaty regulacji wysokości formy + koła na kolumnach
        add(geoTorus('x', 0.44, 0.032, 48, 8), M.steelMid, { pos: [-2.985, YC, 0], f: 'clampcomp' });
        add(geoTorus('x', 0.44, 0.02, 48, 6), M.chrome, { pos: [-3.0, YC, 0], f: 'clampcomp', edges: false });
        [-1, 1].forEach(sy => [-1, 1].forEach(sz => {
            C('x', 0.105, -3.02, -2.955, YC + sy * 0.32, sz * 0.32, M.steelMid, { f: 'clampcomp' });
            C('x', 0.06, -3.05, -3.02, YC + sy * 0.32, sz * 0.32, M.chrome, { f: 'clampcomp', edges: false });
        }));
        // silnik regulacji + czujnik siły zwarcia
        C('x', 0.055, -3.07, -2.96, YC - 0.42, -0.28, M.white, { f: 'clampcomp' });
        R(-2.9, -2.7, YC + PL, YC + PL + 0.04, 0.24, 0.36, M.sensor, { f: 'clampcomp' });
        // serwosilnik zwarcia + koło pasowe + pas
        C('x', 0.2, -3.08, -3.03, YC, 0, M.steelDark, { f: 'toggle' });
        C('x', 0.06, -3.1, -3.03, YC, 0, M.chrome, { f: 'toggle', edges: false });
        C('x', 0.085, -2.6, -2.2, YC - 0.36, 0.3, M.white, { f: 'toggle' });
        C('x', 0.07, -3.08, -3.03, YC - 0.36, 0.3, M.steelDark, { f: 'toggle' });
        (function belt() {
            const ay = YC - 0.36, az = 0.3, by = YC, bz = 0;
            const dy = by - ay, dz = bz - az, len = Math.hypot(dy, dz), ang = Math.atan2(dz, dy);
            const py = -dz / len, pz = dy / len;
            [0.075, -0.075].forEach(off => {
                add(geoBox(0.045, len, 0.012), M.black, {
                    pos: [-3.055, (ay + by) / 2 + py * off * 1.8, (az + bz) / 2 + pz * off * 1.8],
                    rot: [ang, 0, 0], edges: false, f: 'toggle'
                });
            });
        })();

        // kolumny (tie-bar)
        [-1, 1].forEach(sy => [-1, 1].forEach(sz => {
            C('x', 0.045, -2.99, 0.27, YC + sy * 0.32, sz * 0.32, M.chrome, { f: 'platen', seg: 20 });
            C('x', 0.075, 0.2, 0.31, YC + sy * 0.32, sz * 0.32, M.steelMid, { edges: false });
        }));

        // płyta stała + płyta czołowa z rowkami teowymi
        R(-0.1, 0.2, YC - 0.52, YC + 0.52, -0.52, 0.52, M.steel);
        R(-0.1, 0.2, 0.86, YC - 0.52, -0.45, 0.45, M.steel);
        R(-0.125, -0.1, YC - 0.5, YC + 0.5, -0.5, 0.5, M.light);
        [-0.36, -0.18, 0.18, 0.36].forEach(dy => [[-0.47, -0.28], [0.28, 0.47]].forEach(([z0, z1]) => {
            R(-0.129, -0.124, YC + dy - 0.012, YC + dy + 0.012, z0, z1, M.steelDark, { edges: false });
        }));
        R(-0.36, -0.125, YC - 0.27, YC + 0.27, -0.25, 0.25, M.mold);
        R(-0.364, -0.36, YC - 0.12, YC + 0.12, -0.15, 0.15, M.moldCore, { edges: false });

        // płyta ruchoma (węzeł animowany)
        const nMP = node([M_CLOSED - STROKE, 0, 0]);
        R(0, 0.25, YC - PL, YC + PL, -PL, PL, M.steel, { parent: nMP, f: 'platen' });
        R(-0.08, 0, YC - 0.24, YC + 0.24, -0.24, 0.24, M.steelMid, { parent: nMP, f: 'platen' });
        [-1, 1].forEach(sy => [-0.13, 0.13].forEach(z => {
            R(-0.14, -0.08, YC + sy * PIV - 0.05, YC + sy * PIV + 0.05, z - 0.03, z + 0.03, M.steelMid, { parent: nMP, f: 'toggle' });
        }));
        [-0.42, 0.42].forEach(z => {
            R(0.02, 0.23, 0.885, 0.93, z - 0.06, z + 0.06, M.red, { parent: nMP, f: 'platen' });
        });
        R(0.25, 0.49, YC - 0.27, YC + 0.27, -0.25, 0.25, M.mold, { parent: nMP });
        R(0.49, 0.494, YC - 0.12, YC + 0.12, -0.15, 0.15, M.moldCore, { parent: nMP, edges: false });
        const nEj = node([0, 0, 0], nMP);
        C('x', 0.03, -0.36, -0.08, YC, 0, M.chrome, { parent: nEj });
        C('x', 0.06, -0.4, -0.36, YC, 0, M.steelMid, { parent: nEj, edges: false });

        // mechanizm kolanowy (pozycje liczone co klatkę - updateToggle)
        const unitBox = geoBox(1, 0.085, 0.045);
        const toggle = { linksA: [], linksB: [], small: [], pinsJ: [] };
        [-1, 1].forEach(sy => {
            [-0.2, 0.2].forEach(z => toggle.linksA.push({ sy, z, m: add(unitBox, M.steelMid, { f: 'toggle' }) }));
            [-0.13, 0.13].forEach(z => toggle.linksB.push({ sy, z, m: add(unitBox, M.steelMid, { f: 'toggle' }) }));
            [-0.26, 0.26].forEach(z => toggle.small.push({ sy, z, m: add(geoBox(1, 0.06, 0.035), M.steel, { f: 'toggle' }) }));
            toggle.pinsJ.push({ sy, m: add(geoCyl('z', 0.04, 0.58, 16), M.chrome, { f: 'toggle' }) });
        });
        toggle.cross = add(geoBox(0.12, 0.22, 0.44), M.steelMid, { f: 'toggle' });
        toggle.screw = add(geoCyl('x', 0.03, 1, 16), M.chrome, { f: 'toggle' });

        // ===== OSŁONY ZESPOŁU ZAMYKAJĄCEGO (obudowa - półprzezroczysta w X-RAY) =====
        R(-3.1, -1.02, 0.86, 1.98, 0.645, 0.665, M.teal, { cover: true });
        R(-3.1, -1.02, 0.86, 1.98, -0.665, -0.645, M.teal, { cover: true });
        R(-3.1, -1.02, 1.96, 1.98, -0.665, 0.665, M.teal, { cover: true });
        R(-3.12, -3.1, 0.86, 1.98, -0.665, 0.665, M.teal, { cover: true });
        [1, -1].forEach(s => {
            const z = s * 0.667;
            R(-3.06, -1.08, 1.33, 1.336, z - 0.002, z + 0.002, M.seam, { cover: true, xo: 0, edges: false });
            R(-3.06, -1.08, 1.66, 1.666, z - 0.002, z + 0.002, M.seam, { cover: true, xo: 0, edges: false });
            R(-2.063, -2.057, 0.9, 1.94, z - 0.002, z + 0.002, M.seam, { cover: true, xo: 0, edges: false });
        });
        add(geoPlane(0.64, 0.16), M.logo, { pos: [-2.66, 1.82, 0.667], cover: true, xo: 0, edges: false });
        add(geoPlane(0.4, 0.1), M.plate, { pos: [-1.4, 1.05, 0.667], cover: true, xo: 0, edges: false });

        // sygnalizator świetlny
        C('y', 0.012, 1.98, 2.05, -2.98, -0.5, M.steelDark, { edges: false });
        const lamps = {
            g: C('y', 0.034, 2.05, 2.11, -2.98, -0.5, M.lampG, { seg: 16 }),
            y: C('y', 0.034, 2.11, 2.17, -2.98, -0.5, M.lampY, { seg: 16 }),
            r: C('y', 0.034, 2.17, 2.23, -2.98, -0.5, M.lampR, { seg: 16 })
        };
        C('y', 0.03, 2.23, 2.25, -2.98, -0.5, M.white, { seg: 16, edges: false });

        // ===== DRZWI OCHRONNE STREFY FORMY =====
        [1, -1].forEach(s => {
            const z = s * 0.7;
            R(-1.02, 0.02, 1.92, 1.98, z - 0.02, z + 0.02, M.frame, { cover: true });
            R(-1.02, 0.02, 0.86, 0.92, z - 0.02, z + 0.02, M.frame, { cover: true });
            R(-1.02, -0.96, 0.92, 1.92, z - 0.02, z + 0.02, M.frame, { cover: true });
            R(-0.04, 0.02, 0.92, 1.92, z - 0.02, z + 0.02, M.frame, { cover: true });
            R(-0.96, -0.04, 0.92, 1.92, z - 0.004, z + 0.004, M.glass, { glass: true, edges: false });
        });
        R(-1.02, 0.02, 1.965, 1.975, -0.7, 0.7, M.glass, { glass: true, edges: false });
        C('y', 0.016, 1.26, 1.62, -0.14, 0.745, M.chrome, { cover: true, xo: 0, edges: false });

        // ===== KOLUMNA PANELU + STEROWNIK =====
        R(0.02, 0.28, 0.86, 2.02, -0.68, 0.68, M.silver, { cover: true, xo: 0.1 });
        R(0.28, 0.36, 1.5, 1.58, 0.6, 0.72, M.steelDark, { f: 'controller' });
        R(0.1, 0.5, 1.2, 1.92, 0.72, 0.79, M.black, { f: 'controller' });
        R(0.13, 0.47, 1.25, 1.87, 0.79, 0.795, M.screen, { f: 'controller', edges: false });
        R(0.03, 0.09, 1.0, 1.12, 0.68, 0.7, M.yellow, { cover: true, xo: 0, edges: false });
        C('z', 0.03, 0.7, 0.74, 0.06, 1.06, M.red, { f: 'controller', seg: 16 });
        [1.2, 1.28, 1.36, 1.44].forEach(y => C('z', 0.014, 0.68, 0.7, 0.06, y, M.light, { cover: true, xo: 0, edges: false, seg: 12 }));

        // ===== AGREGAT WTRYSKOWY (węzeł sań - dosunięcie dyszy) =====
        const nCar = node([0.06, 0, 0]);
        C('x', 0.028, -0.06, 0.3, YC, 0, M.chrome, { parent: nCar, f: 'injection', seg: 16 });
        C('x', 0.075, 0.3, 1.42, YC, 0, M.barrel, { parent: nCar, cover: true, xo: 0.28, f: 'injection' });
        const heaters = [0.45, 0.66, 0.87, 1.08, 1.29].map(x =>
            C('x', 0.092, x - 0.07, x + 0.07, YC, 0, M.heater, { parent: nCar, cover: true, xo: 0.32 }));
        const melt = C('x', 0.05, 0.28, 0.72, YC, 0, M.melt, { parent: nCar, edges: false });
        R(1.22, 1.4, YC + 0.07, YC + 0.24, -0.1, 0.1, M.steelMid, { parent: nCar });
        R(0.34, 1.4, YC - 0.19, YC + 0.17, -0.2, 0.2, M.perf, { parent: nCar, cover: true, uv: [10, 3], f: 'injection' });
        [-0.3, 0.3].forEach(z => {
            C('x', 0.055, 1.3, 1.62, YC - 0.1, z, M.steelDark, { parent: nCar, f: 'injection' });
            C('x', 0.025, 0.2, 1.45, YC - 0.1, z, M.chrome, { f: 'injection', seg: 12 });
        });
        R(1.4, 2.9, 0.9, 1.0, -0.4, 0.4, M.steel, { parent: nCar });
        R(1.0, 1.42, 0.9, 1.02, 0.42, 0.5, M.black, { parent: nCar, edges: false });
        // obudowa agregatu
        R(1.42, 2.95, 1.0, 1.66, -0.44, 0.44, M.teal, { parent: nCar, cover: true, f: 'injection' });
        R(1.62, 2.78, 1.66, 1.78, -0.36, 0.36, M.vent, { parent: nCar, cover: true, uv: [3, 1] });
        add(geoPlane(0.6, 0.15), M.logo, { parent: nCar, pos: [2.6, 1.54, 0.442], cover: true, xo: 0, edges: false });
        R(1.95, 2.07, 1.3, 1.42, 0.441, 0.445, M.yellow, { parent: nCar, cover: true, xo: 0, edges: false });
        R(2.1, 2.2, 1.3, 1.42, 0.441, 0.445, M.white, { parent: nCar, cover: true, xo: 0, edges: false });
        // wnętrze agregatu
        R(1.46, 1.74, 1.06, 1.62, -0.36, 0.36, M.steelDark, { parent: nCar, f: 'injection' });
        R(2.62, 2.72, 1.06, 1.62, -0.36, 0.36, M.steelDark, { parent: nCar });
        [-0.22, 0.22].forEach(z => {
            C('x', 0.035, 1.74, 2.62, YC, z, M.chrome, { parent: nCar, f: 'injection', seg: 14 });
            C('x', 0.13, 2.74, 2.8, YC, z, M.steelDark, { parent: nCar, seg: 28 });
            C('x', 0.11, 2.22, 2.6, 1.2, z, M.white, { parent: nCar, f: 'injection' });
            C('x', 0.07, 2.74, 2.8, 1.2, z, M.steelDark, { parent: nCar, edges: false, seg: 18 });
        });
        // ślimak (obraca się podczas dozowania, przesuwa przy wtrysku)
        const nScrew = node([0, YC, 0], nCar);
        C('x', 0.045, 0.32, 1.94, 0, 0, M.screw, { parent: nScrew, seg: 16 });
        for (let x = 0.38; x < 1.36; x += 0.075) {
            C('x', 0.066, x, x + 0.012, 0, 0, M.screw, { parent: nScrew, edges: false, seg: 18 });
        }
        R(0.36, 1.36, 0.042, 0.054, -0.007, 0.007, M.stripe, { parent: nScrew, edges: false });
        // płyta dociskowa + czujnik siły (load cell) + silnik dozowania
        const nPush = node([0, 0, 0], nCar);
        R(1.94, 2.04, 1.1, 1.6, -0.34, 0.34, M.steelMid, { parent: nPush });
        C('x', 0.1, 1.9, 1.94, YC, 0, M.loadcell, { parent: nPush, f: 'injection', seg: 20 });
        C('x', 0.09, 2.04, 2.3, YC, 0, M.white, { parent: nPush, f: 'injection' });
        [-0.22, 0.22].forEach(z => C('x', 0.062, 1.9, 2.06, YC, z, M.steelMid, { parent: nPush, edges: false, seg: 16 }));

        // wypraska (pojawia się przy wypychaniu)
        const part = R(-0.02, 0.02, -0.12, 0.12, -0.16, 0.16, M.part, { edges: true });
        part.visible = false;

        return { nMP, nEj, nCar, nScrew, nPush, toggle, lamps, heaters, melt, part };
    }

    const rig = buildMachine();

    // Kinematyka układu kolanowego dla danej pozycji płyty ruchomej
    const RX = -2.26, LINK = 0.66;
    function setLink(m, x1, y1, x2, y2, z) {
        const dx = x2 - x1, dy = y2 - y1;
        m.pos = [(x1 + x2) / 2, (y1 + y2) / 2, z];
        m.rot = [0, 0, Math.atan2(dy, dx)];
        m.scl = [Math.hypot(dx, dy), 1, 1];
    }

    function updateToggle(open) {
        const Mx = M_CLOSED - STROKE * open;
        rig.nMP.pos[0] = Mx;
        const px = Mx - 0.11;
        const d = px - RX;
        const off = Math.sqrt(Math.max(LINK * LINK - (d / 2) * (d / 2), 0));
        const jx = (RX + px) / 2;
        const cx = -1.58 - 0.45 * open;
        rig.toggle.linksA.forEach(l => setLink(l.m, RX, YC + l.sy * PIV, jx, YC + l.sy * (PIV + off), l.z));
        rig.toggle.linksB.forEach(l => setLink(l.m, jx, YC + l.sy * (PIV + off), px, YC + l.sy * PIV, l.z));
        rig.toggle.pinsJ.forEach(p => { p.m.pos = [jx, YC + p.sy * (PIV + off), 0]; });
        const kx = RX + 0.7 * (jx - RX);
        rig.toggle.small.forEach(l => setLink(l.m, cx, YC + l.sy * 0.08, kx, YC + l.sy * (PIV + 0.7 * off), l.z));
        rig.toggle.cross.pos = [cx, YC, 0];
        const s0 = -2.62, s1 = cx - 0.06;
        rig.toggle.screw.pos = [(s0 + s1) / 2, YC, 0];
        rig.toggle.screw.scl = [Math.max(0.01, s1 - s0), 1, 1];
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
    function resize() {
        const rect = stage.getBoundingClientRect();
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
    const anim = { open: 1, car: 0.06, screwX: 0, screwRot: 0, eject: 0, heat: 0, melt: 0 };

    function ease(t) { t = Math.min(1, Math.max(0, t)); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function seg(t, a, b) { return ease((t - a) / (b - a)); }

    function cyclePhaseIndex(t) {
        for (let i = 0; i < CYCLE_PHASES.length; i++) if (t >= CYCLE_PHASES[i].t0 && t < CYCLE_PHASES[i].t1) return i;
        return -1;
    }

    function updateCycle(dt) {
        const k = 1 - Math.exp(-dt * 5);
        if (cycleRunning) {
            cycleT = (cycleT + dt) % CYCLE_LENGTH;
            const t = cycleT;
            let open;
            if (t < 1.0) open = 1 - seg(t, 0, 1.0);
            else if (t < 4.8) open = 0;
            else open = seg(t, 4.8, 5.8);
            let car;
            if (t < 1.0) car = 0.06;
            else if (t < 1.4) car = 0.06 * (1 - seg(t, 1.0, 1.4));
            else if (t < 4.8) car = 0;
            else car = 0.06 * seg(t, 4.8, 5.6);
            let sx;
            if (t < 1.4) sx = 0;
            else if (t < 2.2) sx = -0.18 * seg(t, 1.4, 2.2);
            else if (t < 3.0) sx = -0.18 - 0.012 * seg(t, 2.2, 3.0);
            else if (t < 4.8) sx = -0.192 * (1 - seg(t, 3.0, 4.8));
            else sx = 0;
            anim.open = open;
            anim.car = car;
            anim.screwX = sx;
            if (t >= 3.0 && t < 4.8) anim.screwRot += dt * 9;
            anim.eject = (t >= 5.8 && t < 6.8) ? Math.sin(Math.PI * (t - 5.8) / 1.0) : 0;
            anim.heat += (1 - anim.heat) * k;
            const meltTarget = t >= 1.4 && t < 2.2 ? 0.85 : (t >= 2.2 && t < 3.0 ? 0.6 : (t >= 3.0 && t < 4.8 ? 0.35 + 0.35 * seg(t, 3.0, 4.8) : 0.5));
            anim.melt += (meltTarget - anim.melt) * Math.min(1, dt * 8);

            // wypraska: pojawia się przy wypychaniu, spada i znika
            const p = rig.part;
            if (t >= 5.8 && t < 7.1) {
                p.visible = true;
                const faceX = M_CLOSED - STROKE + 0.515;
                const push = 0.06 * seg(t, 5.8, 6.15);
                const fall = t > 6.15 ? (t - 6.15) : 0;
                p.pos = [faceX + push, YC - 4.9 * fall * fall, 0];
                p.rot = [0, 0, -fall * 2.4];
                p.alphaOverride = 0.9 * (1 - seg(t, 6.6, 7.05));
            } else {
                p.visible = false;
            }
        } else {
            anim.open += (1 - anim.open) * k;
            anim.car += (0.06 - anim.car) * k;
            anim.screwX += (0 - anim.screwX) * k;
            anim.eject += (0 - anim.eject) * k;
            anim.heat += (0 - anim.heat) * k;
            anim.melt += (0 - anim.melt) * k;
            rig.part.visible = false;
        }

        updateToggle(anim.open);
        rig.nCar.pos[0] = anim.car;
        rig.nScrew.pos[0] = anim.screwX;
        rig.nScrew.rot[0] = anim.screwRot;
        rig.nPush.pos[0] = anim.screwX;
        rig.nEj.pos[0] = 0.07 * anim.eject;

        const pulse = 0.75 + 0.25 * Math.sin(time * 6);
        rig.heaters.forEach(h => { h.emOverride = [0.5 * anim.heat * pulse, 0.04 * anim.heat, 0.42 * anim.heat * pulse]; });
        rig.melt.alphaOverride = anim.melt * xrayMix;
        rig.melt.visible = anim.melt * xrayMix > 0.02;
        rig.lamps.g.emOverride = cycleRunning ? [0.1, 0.55, 0.22] : [0, 0, 0];
        rig.lamps.y.emOverride = !cycleRunning ? [0.35, 0.26, 0.02] : [0, 0, 0];

        if (cycleRunning && cycleList) {
            const idx = cyclePhaseIndex(cycleT);
            Array.prototype.forEach.call(cycleList.children, (li, i) => {
                li.classList.toggle('is-active', i === idx);
                li.classList.toggle('is-done', idx === -1 ? true : i < idx);
            });
        }
    }

    // ---------- Aktualizacja sceny ----------
    const view = m4(), proj = m4(), viewProj = m4();
    const eye = [0, 0, 0];

    function update(dt) {
        time += dt;
        const idle = time - lastInteraction > 4 && !dragging;
        if (autoRotate && idle && activeFeature === 0 && !cycleRunning) {
            goal.theta += dt * 0.16;
        }

        const kc = 1 - Math.exp(-dt * (reduceMotion ? 14 : 4.2));
        cam.theta += (goal.theta - cam.theta) * kc;
        cam.phi += (goal.phi - cam.phi) * kc;
        cam.r += (goal.r - cam.r) * kc;
        for (let i = 0; i < 3; i++) cam.t[i] += (goal.t[i] - cam.t[i]) * kc;

        const wantX = (cycleRunning || userXray) ? 1 : 0;
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
        let r = mt.color[0], g = mt.color[1], b = mt.color[2];
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
        const rect = stage.getBoundingClientRect();
        const cw = rect.width, ch = rect.height;
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

    function setCycle(on) {
        cycleRunning = on;
        setPressed('cycle', on);
        const label = toolbar && toolbar.querySelector('.te3d-cycle-label');
        if (label) label.textContent = on ? 'Zatrzymaj cykl' : 'Symulacja cyklu';
        const short = toolbar && toolbar.querySelector('.te3d-btn-short');
        if (short) short.textContent = on ? 'Stop' : 'Cykl';
        if (cycleHud) cycleHud.hidden = !on;
        stage.classList.toggle('te3d-cycle-running', on);
        if (on) {
            cycleT = 0;
            if (activeFeature === 0) applyView(CYCLE_VIEW);
        } else {
            setPressed('xray', userXray);
        }
        if (on) setPressed('xray', true);
        requestRender();
    }

    if (cycleList) {
        cycleList.innerHTML = CYCLE_PHASES.map(p => `<li>${p.name}${p.parallel ? '<em>RÓWNOLEGLE</em>' : ''}</li>`).join('');
    }

    if (toolbar) {
        toolbar.addEventListener('click', (e) => {
            const b = e.target.closest('[data-action]');
            if (!b) return;
            const a = b.dataset.action;
            markInteraction();
            if (a === 'reset') {
                if (cycleRunning) setCycle(false);
                selectFeature(0);
            } else if (a === 'xray') {
                userXray = !userXray;
                setPressed('xray', userXray || cycleRunning);
            } else if (a === 'cycle') {
                setCycle(!cycleRunning);
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
        setPressed('xray', userXray || cycleRunning);
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
})();