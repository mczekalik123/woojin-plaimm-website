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

    // Pełne wyliczenia technologiczne pokazujemy tylko wtedy, gdy jest
    // dokładnie JEDNA skonfigurowana maszyna i pochodzi ona z kalkulatora
    // (ma własny snapshot techResults - patrz applyTechSelection). W
    // pozostałych przypadkach (wybór z listy, albo więcej niż jedna maszyna
    // - niezależnie od ścieżki) pokazywana jest krótka informacja o sposobie
    // doboru zamiast pustych/mylących danych.
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
                ${machines.length === 1 ? (m.techResults ? techRowsHtml(m.techResults) : noTechRowHtml) : ''}
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
// techRowsHtml w populateStep4Summary() (Krok 4 na stronie). Pokazywane tylko
// gdy jest dokładnie jedna skonfigurowana maszyna i pochodzi ona z
// kalkulatora (ma snapshot techResults); w przeciwnym razie (wybór z listy
// albo więcej niż jedna maszyna) zwraca krótką informację o sposobie doboru,
// tak jak w Kroku 4.
function buildTechDetailsEmailHtml(machines) {
    const r = machines.length === 1 ? machines[0].techResults : null;

    if (!r) {
        return `
        <tr>
          <td style="padding:0 40px 8px;">
            <span style="display:block;font-size:15px;font-weight:600;color:#111d35;font-family:Arial, Helvetica, sans-serif;">Sposób doboru: Wybór bezpośrednio z listy modeli (bez danych technologicznych)</span>
          </td>
        </tr>
        `;
    }

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