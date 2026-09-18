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
// "Email Template" (pola: to_email, from_name, from_email, message...),
// a następnie podstawić właściwe identyfikatory poniżej, w sekcji
// EMAILJS_CONFIG. Bez tego przycisk "WYŚLIJ KONFIGURACJĘ" pokaże
// czytelny komunikat o braku konfiguracji zamiast realnej wysyłki.
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
// STAN KONFIGURATORA
// =====================================================================

let currentStep = 1;
let selectedMachineType = 'DL-A5';
let lastCalculationResults = null;

// Wypełnienie listy materiałów przy starcie
document.addEventListener('DOMContentLoaded', function () {
    const sel = document.getElementById('material_select');
    if (sel) {
        sel.innerHTML = materialsData.map(m => `<option value="${m.density}">${m.label} (${m.density.toFixed(2)} g/cm³)</option>`).join('');
        handleMaterialChange();
    }
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

    radios.forEach(r => r.addEventListener('change', updateSelection));
    updateSelection();
}

// -------------------- Nawigacja między krokami --------------------

function nextStep(step) {
    if (step < 1 || step > 4) return;

    if (currentStep === 1) {
        const radios = document.getElementsByName('machine_type');
        for (const r of radios) {
            if (r.checked) selectedMachineType = r.value;
        }
    }

    if (step >= 3 && !(lastCalculationResults && document.getElementById('selected_machine_model').value)) {
        showCalcError('Najpierw kliknij przycisk „DOBIERZ WTRYSKARKĘ” i wybierz konkretny model oraz agregat wtryskowy.');
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

function showCalcError(msg) {
    const el = document.getElementById('calcError');
    if (!el) { alert(msg); return; }
    el.textContent = msg;
    el.style.display = 'block';
}

function clearCalcError() {
    const el = document.getElementById('calcError');
    if (el) { el.style.display = 'none'; el.textContent = ''; }
}

// -------------------- Obsługa wyboru tworzywa --------------------

function handleMaterialChange() {
    const sel = document.getElementById('material_select');
    const disp = document.getElementById('density_value');
    if (sel && disp) disp.value = parseFloat(sel.value).toFixed(2);
}

function toggleCustomDensity() {
    const group = document.getElementById('custom_density_group');
    const btn = document.getElementById('toggleCustomDensityBtn');
    const showing = group.style.display !== 'none' && group.style.display !== '';
    if (showing) {
        group.style.display = 'none';
        btn.textContent = 'Inna gęstość';
    } else {
        group.style.display = 'block';
        btn.textContent = 'Użyj gęstości z listy';
        document.getElementById('custom_density').focus();
    }
}

function getSelectedDensity() {
    const customGroup = document.getElementById('custom_density_group');
    if (customGroup && customGroup.style.display === 'block') {
        const v = parseFloat(document.getElementById('custom_density').value);
        if (!isNaN(v) && v > 0) return v;
    }
    return parseFloat(document.getElementById('material_select').value) || 1.0;
}

// -------------------- Obliczenia (Krok 2) --------------------
// Wzory wg materiału "Dobór Wtryskarek":
//   V_wtr = m / rho                 (objętość wtrysku pojedynczej wypraski)
//   P_s   = (m_T * g * k) / 1000    (orientacyjna siła zwarcia wg wzoru masowego, kN)
// Do praktycznego doboru maszyny (siła zwarcia w tonach) stosuje się przybliżenie
// inżynierskie oparte na powierzchni rzutu wypraski i ciśnieniu specyficznym w gnieździe:
//   F [ton] = F_wypraski[cm2] * liczba_gniazd * p_specyficzne[kg/cm2] / 1000

function calculateAndShowModels() {
    clearCalcError();

    const cavities = parseInt(document.getElementById('cavities').value) || 0;
    const partWeight = parseFloat(document.getElementById('part_weight').value) || 0; // g
    const partSurface = parseFloat(document.getElementById('part_surface').value) || 0; // cm2
    const tieClearance = parseFloat(document.getElementById('tie_bar_clearance').value) || 0; // mm
    const moldHeight = parseFloat(document.getElementById('mold_height').value) || 0; // mm (opcjonalne)
    const kFactor = parseFloat(document.getElementById('k_factor').value) || 6; // x100 kg/cm2
    const density = getSelectedDensity(); // g/cm3

    if (cavities <= 0 || partWeight <= 0 || partSurface <= 0 || tieClearance <= 0) {
        showCalcError('Uzupełnij wymagane pola oznaczone gwiazdką (*): liczba gniazd, masa i powierzchnia wypraski oraz dostępny prześwit między kolumnami.');
        document.getElementById('resultsSection').style.display = 'none';
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

    const calcDiv = document.getElementById('calcDetails');
    calcDiv.innerHTML = `
        <p><strong>Wyniki obliczeń technologicznych (${typeData.label}):</strong></p>
        <ul>
            <li>Objętość wtrysku pojedynczej wypraski (V<sub>wtr</sub> = m / ρ): <strong>${singleVwtr.toFixed(2)} cm³</strong></li>
            <li>Całkowita objętość wtrysku dla ${cavities} gniazd/a: <strong>${totalVwtr.toFixed(2)} cm³</strong></li>
            <li>Całkowita masa wtrysku: <strong>${totalWeight.toFixed(2)} g</strong></li>
            <li>Wymagana minimalna siła zwarcia (metoda powierzchniowa, p = ${specificPressure} kg/cm²): <strong>${requiredForceTon.toFixed(1)} ton</strong></li>
            <li>Orientacyjna siła zwarcia wg uproszczonego wzoru masowego P<sub>s</sub> = m·g·k/1000 (wartość informacyjna wg materiału szkoleniowego, k=${docK}): <strong>${psDocN.toFixed(2)} N</strong></li>
            <li>Wymagany prześwit między kolumnami: min. <strong>${tieClearance} mm</strong></li>
            ${moldHeight > 0 ? `<li>Wysokość formy: <strong>${moldHeight} mm</strong></li>` : ''}
        </ul>
        ${usedFallback ? '<p class="calc-warning">Uwaga: żaden model nie spełnia jednocześnie podanej wysokości formy — pokazano modele dobrane wyłącznie wg siły zwarcia i prześwitu. Zweryfikuj wysokość formy z działem technicznym.</p>' : ''}
    `;

    const selectEl = document.getElementById('selected_machine_model');
    selectEl.innerHTML = '';
    modelsToDisplay.forEach(m => {
        m.units.forEach(unit => {
            const opt = document.createElement('option');
            opt.value = `${m.name} – agregat wtryskowy ${unit}`;
            opt.dataset.model = m.name;
            opt.dataset.unit = unit;
            opt.textContent = `${m.name}  (siła zwarcia: ${m.force} T)  →  ${unit}`;
            selectEl.appendChild(opt);
        });
    });

    lastCalculationResults = {
        singleVwtr, totalVwtr, totalWeight, requiredForceTon, psDocN,
        cavities, partWeight, partSurface, density, tieClearance, moldHeight,
        selectedType: selectedMachineType
    };

    document.getElementById('resultsSection').style.display = 'block';
}

// -------------------- Wspólne: wyróżniony pasek z wybraną wtryskarką i średnicą ślimaka --------------------
// Używane zarówno w Kroku 3 (pod paskiem postępu), jak i w Kroku 4 (pod paskiem postępu, nad podsumowaniem).

function renderMachineHighlight(elementId) {
    const highlightDiv = document.getElementById(elementId);
    if (!highlightDiv) return;

    const machineSelectEl = document.getElementById('selected_machine_model');
    const selectedMachineOption = machineSelectEl ? machineSelectEl.selectedOptions[0] : null;

    if (selectedMachineOption && selectedMachineOption.dataset.model) {
        const modelName = selectedMachineOption.dataset.model;
        const unitStr = selectedMachineOption.dataset.unit || '';
        const screwMatch = unitStr.match(/\((\d+)\s*mm\)/i);
        const screwDiameter = screwMatch ? `${screwMatch[1]} mm` : '–';
        highlightDiv.innerHTML = `
            <span class="machine-highlight-item"><span class="machine-highlight-label">Wybrana wtryskarka:</span> <strong>${modelName}</strong></span>
            <span class="machine-highlight-item"><span class="machine-highlight-label">Średnica ślimaka:</span> <strong>${screwDiameter}</strong></span>
        `;
        highlightDiv.style.display = 'flex';
    } else {
        highlightDiv.style.display = 'none';
    }
}

// -------------------- Krok 3: wyposażenie standardowe i opcje --------------------

// Rozdziela numer katalogowy ("13.") od treści opisu, aby zawinięty tekst
// nie zaczynał się pod numerem, tylko pod pierwszym słowem opisu (wcięcie wiszące).
function formatNumbered(text) {
    const m = text.match(/^(\d+\.)\s*(.*)$/s);
    if (!m) return `<span class="opt-text">${text}</span>`;
    return `<span class="opt-num">${m[1]}</span><span class="opt-text">${m[2]}</span>`;
}

function populateStep3() {
    renderMachineHighlight('step3MachineHighlight');

    const data = optionSets[selectedMachineType];

    document.getElementById('std_injection_unit').innerHTML = data.std.injection.map(i => `<li>${formatNumbered(i)}</li>`).join('');
    document.getElementById('std_clamping_unit').innerHTML = data.std.clamping.map(i => `<li>${formatNumbered(i)}</li>`).join('');
    document.getElementById('std_general').innerHTML = data.std.general.map(i => `<li>${formatNumbered(i)}</li>`).join('');

    const renderOptions = (containerId, list) => {
        document.getElementById(containerId).innerHTML = list.map((opt, idx) => `
            <label class="checkbox-item">
                <input type="checkbox" name="add_option" value="${opt}">
                ${formatNumbered(opt)}
            </label>
        `).join('');
    };

    renderOptions('opt_injection_unit', data.opt.injection);
    renderOptions('opt_clamping_unit', data.opt.clamping);
    renderOptions('opt_general', data.opt.general);
}

// -------------------- Krok 4: podsumowanie --------------------

function getSelectedOptions() {
    return Array.from(document.querySelectorAll('input[name="add_option"]:checked')).map(c => c.value);
}

function populateStep4Summary() {
    const machineSelectEl = document.getElementById('selected_machine_model');
    const selectedModelText = machineSelectEl.value;
    const selectedOptions = getSelectedOptions();
    const r = lastCalculationResults;
    const typeData = machineData[selectedMachineType];

    // Wyróżniona informacja: dokładnie wybrany model wtryskarki + średnica ślimaka
    renderMachineHighlight('step4MachineHighlight');

    const moldLength = document.getElementById('mold_length').value || '–';
    const moldWidth = document.getElementById('mold_width').value || '–';
    const wallThickness = document.getElementById('wall_thickness').value || '–';
    const materialLabel = document.getElementById('material_select').selectedOptions[0].textContent;

    const summaryDiv = document.getElementById('summaryView');
    summaryDiv.innerHTML = `
        <h4>Wybrana konfiguracja</h4>
        <table>
            <tr><td>Typ wtryskarki</td><td><strong>${typeData.label}</strong></td></tr>
            <tr><td>Model i agregat wtryskowy</td><td><strong>${selectedModelText}</strong></td></tr>
            <tr><td>Wymiary formy (dł. x szer.)</td><td>${moldLength} x ${moldWidth} mm</td></tr>
            <tr><td>Prześwit między kolumnami</td><td>${r.tieClearance} mm</td></tr>
            ${r.moldHeight > 0 ? `<tr><td>Wysokość formy</td><td>${r.moldHeight} mm</td></tr>` : ''}
            <tr><td>Liczba gniazd</td><td>${r.cavities}</td></tr>
            <tr><td>Materiał</td><td>${materialLabel}</td></tr>
            <tr><td>Grubość ścianki</td><td>${wallThickness} mm</td></tr>
            <tr><td>Masa jednej wypraski</td><td>${r.partWeight} g</td></tr>
            <tr><td>Całkowita masa wtrysku</td><td>${r.totalWeight.toFixed(2)} g</td></tr>
            <tr><td>Całkowita objętość wtrysku</td><td>${r.totalVwtr.toFixed(2)} cm³</td></tr>
            <tr><td>Wymagana siła zwarcia</td><td>${r.requiredForceTon.toFixed(1)} ton</td></tr>
        </table>
        <h4>Wybrane opcje dodatkowe</h4>
        ${selectedOptions.length > 0 ? `<ul>${selectedOptions.map(o => `<li>${o}</li>`).join('')}</ul>` : '<p>Brak wybranych opcji dodatkowych.</p>'}
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
    const r = lastCalculationResults;
    const typeData = machineData[selectedMachineType];
    const selectedModelText = document.getElementById('selected_machine_model').value || '–';
    const selectedOptions = getSelectedOptions();

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
    doc.setFontSize(12);
    doc.text('Wybrana konfiguracja', left, y);
    y += lineGap;

    doc.setFontSize(10);
    const rows = [
        ['Typ wtryskarki', typeData ? typeData.label : selectedMachineType],
        ['Model i agregat wtryskowy', selectedModelText],
        ['Liczba gniazd', r ? String(r.cavities) : '-'],
        ['Prześwit między kolumnami', r ? `${r.tieClearance} mm` : '-'],
        ['Masa jednej wypraski', r ? `${r.partWeight} g` : '-'],
        ['Całkowita masa wtrysku', r ? `${r.totalWeight.toFixed(2)} g` : '-'],
        ['Całkowita objętość wtrysku', r ? `${r.totalVwtr.toFixed(2)} cm³` : '-'],
        ['Wymagana siła zwarcia', r ? `${r.requiredForceTon.toFixed(1)} ton` : '-'],
        ['Materiał', document.getElementById('material_select').selectedOptions[0].textContent]
    ];
    rows.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(`${label}:`, left, y);
        doc.setFont(undefined, 'normal');
        doc.text(String(value), left + 65, y);
        y += lineGap - 1;
    });

    y += 3;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Wybrane opcje dodatkowe', left, y);
    doc.setFont(undefined, 'normal');
    y += lineGap;
    doc.setFontSize(10);
    if (selectedOptions.length === 0) {
        doc.text('Brak wybranych opcji dodatkowych.', left, y);
        y += lineGap - 1;
    } else {
        selectedOptions.forEach(opt => {
            const wrapped = doc.splitTextToSize(`• ${opt}`, pageWidth - left * 2);
            wrapped.forEach(line => {
                if (y > 280) { doc.addPage(); y = 18; }
                doc.text(line, left, y);
                y += lineGap - 2;
            });
        });
    }

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

    const r = lastCalculationResults;
    const typeData = machineData[selectedMachineType];
    const selectedOptions = getSelectedOptions();

    const templateParams = {
        to_email: EMAILJS_CONFIG.recipient,
        client_copy_email: getVal('client_email'),
        machine_type: typeData ? typeData.label : selectedMachineType,
        selected_model: document.getElementById('selected_machine_model').value,
        cavities: r ? r.cavities : '',
        required_force: r ? `${r.requiredForceTon.toFixed(1)} ton` : '',
        total_shot_volume: r ? `${r.totalVwtr.toFixed(2)} cm3` : '',
        material: document.getElementById('material_select').selectedOptions[0].textContent,
        options_list: selectedOptions.join(', ') || 'brak',
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
        { name: 'VH',         folder: '360-VH',    available: true,  model: 'VH',                 desc: 'Wysokiej klasy seria wtryskarek pionowych' },
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

    // Sekcje podzespołów ("Clamping Unit", "Injection Unit" itd.) oraz opis
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
        setFrame(newFrame + 1);
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
// Każda sekcja (Clamping Unit / Injection Unit / Hydraulic Unit /
// Controller...) pojawia się dopiero, gdy użytkownik przewinie stronę do
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
        'TL-A5': { folder: '360-TL', available: false, desc: 'Wtryskarka bez kolumn (tie-bar-less) dająca pełną swobodę doboru wielkości formy, wielogniazdowości i automatyzacji.' }
    };

    let currentType = 'DL-A5';
    const preloadedFolders = {};

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

    function setViewerType(typeName) {
        if (!TYPE_VIEWER_DATA[typeName]) return;
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
        } else {
            stage.classList.add('is-unavailable');
            slider.disabled = true;
            if (magnifier) magnifier.classList.remove('is-active');
        }
    }

    radios.forEach((radio) => {
        radio.addEventListener('change', () => {
            if (radio.checked) setViewerType(radio.value);
        });
    });

    slider.addEventListener('input', () => {
        setFrame(parseInt(slider.value, 10));
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
    }

    function handleDragMove(clientX) {
        if (!isDragging) return;
        const deltaX = clientX - startX;
        const frameDelta = Math.round(deltaX / DRAG_SENSITIVITY);
        let newFrame = (startFrame - frameDelta - 1) % TOTAL_FRAMES;
        if (newFrame < 0) newFrame += TOTAL_FRAMES;
        setFrame(newFrame + 1);
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

    // ---- Efekt "lupy" na komputerach (tak jak na podstronie Maszyny) ----
    const magnifier = document.getElementById('cfgViewer360Magnifier');
    const supportsHoverMagnifier = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (magnifier && supportsHoverMagnifier) {
        const MAGNIFIER_ZOOM = 2.2;

        function updateMagnifier(clientX, clientY) {
            if (!TYPE_VIEWER_DATA[currentType].available) {
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

    // Inicjalizacja - typ aktualnie zaznaczony w formularzu (checked)
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