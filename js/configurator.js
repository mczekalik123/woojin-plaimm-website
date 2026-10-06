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
// widoczne w e-mailu, edytuje się je w js/configurator.js (funkcje
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
    },
    // Listy wg katalogów: VH Series (str. 20, VHA-RS), MULTI Series (str. 26, NC-G5),
    // Super-Foam Series (str. 30, DL-A5 S.F.); pisownia ujednolicona z pozostałymi seriami.
    'VHA-RS': {
        std: {
            injection: ['01. Single Flight Screw', '02. Injection valve gate circuit (AC 1 + DC 1)', '03. PID Heating Control', '04. Weekly Heating Timer', '05. Cold screw start protection mode', '06. Temperature display & Alarm in abnormal Temp.', '07. Auto Purging', '08. Injection Speed & Pressure step (10 step)', '09. Holding Speed & Pressure step (5 step)', '10. Charging Speed & Pressure step (3 step)', '11. Back Pressure control step (3 step)', '12. Injection Pressure Graph Display', '13. Injection Speed Graph Display', '14. Screw RPM Display', '15. Cushion Display & Alarm', '16. Charging time count & alarm', '17. Screw & Barrel (Anti Wear)'],
            clamping: ['01. Clamping area Curtain sensor', '02. Working Foot-board (Above 120ton)', '03. Hydraulic Core puller (Moving platen side, 1 stage)', '04. Air blow-off unit (1 ea, Upper part)', '05. Safety device (for electric & hydraulic)', '06. Mold-Open Speed & Pressure step (4 step)', '07. Mold-Close Speed & Pressure step (5 step)', '08. Ejector Speed & Pressure step (2 step)'],
            general: ['01. Clamp area safety sensor (Vertical type IMM)', '02. Standard Maintenance tools', '03. Standard spare part', '04. Leveling pad', '05. Cooling water distributor', '06. Automatic grease lubrication (Clamping)', '07. Robot interface (Standard)', '08. 3 Phase electric outlet (2 ea)', '09. Single Phase electric outlet (1 ea)', '10. Hopper throat temperature control device', '11. Hydraulic oil purification device', '12. Hydraulic oil temperature control device', '13. Hydraulic oil level alarm', '14. Hydraulic oil temperature check & alarm', '15. Hydraulic oil heating mode', '16. 3 color alarm light', '17. Shot data saving by external way', '18. Production data statistics', '19. Alarming & History save', '20. Log history save', '21. I/O circuit display']
        },
        opt: {
            injection: ['01. Heater Disconnection check device', '02. Screw & Barrel (Nitrided barrel)', '03. Screw & Barrel (Anti Wear & Corrosive)', '04. Valve Gate Circuit & Connector (Interior type)', '05. Pneumatic Valve Gate Block (Interior type)', '06. Shut-off Nozzle (Pneumatic, Hydraulic, Spring)', '07. Customized Design Screw (SB, Mixing, Coating)'],
            clamping: ['01. Daylight Extension', '02. Hydraulic Core Check Valve', '03. Hydraulic Core Interlock Connector (EM13, WJ Standard)', '04. Hydraulic Core (Rotary table type)', '05. Ejector Check Valve', '06. Ejector Interlock Connector (WJ Standard, EM13)', '07. Mold Insulation Plate', '08. Pneumatic Core Puller (1-3 Stages)'],
            general: ['01. Hydraulic Auto-Clamp unit', '02. Heater Insulation Band', '03. Robot Interface (EM12, EM67, SPI)', '04. CMS (Central Monitoring System)', '05. AVR (Automatic Voltage Regulator) on Electric Panel', '06. UPS (Uninterruptible Power Supply) on Electric Panel', '07. Dosing unit Interface (for Masterbatch)', '08. Gas Injection Interface', '09. Steam Injection Interface', '10. External Temperature Display (F/P)', '11. Interior type Hot Runner Controller (EM14, WJ Standard)', '12. Controller Moving device']
        }
    },
    'MULTI': {
        std: {
            injection: ['01. Single Flight Screw', '02. Injection valve gate circuit (AC 1 + DC 1)', '03. PID Heating Control', '04. Weekly Heating Timer', '05. Cold screw protection mode', '06. Temperature display & Alarm in abnormal Temp.', '07. Auto Purging', '08. Injection Speed & Pressure step (10 step)', '09. Holding Speed & Pressure step (5 step)', '10. Charging Speed & Pressure step (4 step)', '11. Back Pressure control step (4 step)', '12. Injection Pressure Graph Display', '13. Injection Speed Graph Display', '14. Screw RPM Display', '15. Cushion Display & Alarm', '16. Charging time count & alarm', '17. Screw & Barrel (Anti Wear)'],
            clamping: ['01. Hydraulic Core puller (Moving platen side, 1 stage)', '02. Air blow-off unit (Fixed side 1 + Moving side 1)', '03. Safety device (for electric & hydraulic)', '04. Automatic Mold thickness adjust mode', '05. Mold-Open Speed & Pressure step (5 step)', '06. Mold-Close Speed & Pressure step (5 step)', '07. Ejector Speed & Pressure step (3 step)'],
            general: ['01. 3 Phase electric outlet (4 ea)', '02. Standard Maintenance tools', '03. Standard spare part', '04. Leveling pad', '05. Cooling water distributor', '06. Robot interface (Standard)', '07. Hydraulic oil purification device', '08. Hydraulic oil level alarm', '09. Hydraulic oil temperature check & alarm', '10. Hydraulic oil heating mode', '11. 3 color alarm light', '12. Shot data saving by external way', '13. Production data statistics', '14. Alarming & History save', '15. Log history save', '16. I/O circuit display', '17. Shot data save (Internal 1,000 / External device)']
        },
        opt: {
            injection: ['01. Heater Disconnection check device', '02. Screw & Barrel (Nitrided barrel)', '03. Screw & Barrel (Anti Wear & Corrosive)', '04. Valve Gate Circuit & Connector (Interior type)', '05. Pneumatic Valve Gate Block (Interior type)', '06. Shut-off Nozzle (Pneumatic, Hydraulic, Spring)', '07. Customized Design Screw (SB, Mixing, Coating)'],
            clamping: ['01. Daylight Extension', '02. Product Chute', '03. Hydraulic Core Check Valve', '04. Hydraulic Core Interlock Connector (EM13, WJ Standard)', '05. Spring type Ejector retraction', '06. Ejector Check Valve', '07. Mold Insulation Plate'],
            general: ['01. Steel tray for resin leakage', '02. Hopper throat temperature control device', '03. Heater Insulation Band', '04. Automatic Grease Lubrication (Clamping unit)', '05. Robot Interface (EM12, EM67, EM67.1, SPI)', '06. CMS (Central Monitoring System)', '07. AVR (Automatic Voltage Regulator) on Electric Panel', '08. UPS (Uninterruptible Power Supply) on Electric Panel', '09. Dosing unit Interface (for Masterbatch)', '10. Gas Injection Interface', '11. Steam Injection Interface', '12. Interior type Hot Runner Controller (EM13, WJ Standard)']
        }
    },
    'Super-Foam': {
        std: {
            injection: ['01. Automatic Injection unit swiveling (Below IH 11900)', '02. Single Flight Screw', '03. Injection valve gate circuit (AC 1 + DC 1)', '04. Back-Pressure Closed-loop system', '05. PID Heating Control', '06. Weekly Heating Timer', '07. Cold screw start protection mode', '08. Temperature display & Alarm in abnormal Temp.', '09. Auto Purging', '10. Injection Speed & Pressure step (10 step)', '11. Holding Speed & Pressure step (5 step)', '12. Charging Speed & Pressure step (3 step)', '13. Back Pressure control step (3 step)', '14. Injection Pressure Graph Display', '15. Injection Speed Graph Display', '16. Screw RPM Display', '17. Cushion Display & Alarm', '18. Charging time count & alarm', '19. Screw & Barrel (Anti Wear & Corrosive)', '20. Measuring electricity', '21. Raw material supply device', '22. Shut-off Nozzle (Pneumatic)'],
            clamping: ['01. Safety Foot-board (Above 900ton)', '02. Automatic safety Door open/close (Above 500ton)', '03. Clamping area Curtain sensor', '04. Hydraulic Core puller (Moving platen side, 1 stage)', '05. Air blow-off unit (Fixed side 1 + Moving side 1)', '06. Safety device (for electric & hydraulic)', '07. Spring mold mode', '08. Automatic Mold thickness adjust mode', '09. Mold-Open Speed & Pressure step (5 step)', '10. Ejector Speed & Pressure step (3 step)'],
            general: ['01. Standard Maintenance tools', '02. Standard spare part', '03. Leveling pad', '04. Cooling water distributor', '05. Automatic grease lubrication (Clamping)', '06. Robot interface (Standard)', '07. 3 Phase electric outlet (2 ea)', '08. Single Phase electric outlet (1 ea)', '09. Steel tray for resin leakage', '10. Hopper throat temperature control device', '11. Hydraulic oil purification device', '12. Hydraulic oil temperature control device', '13. Hydraulic oil level alarm', '14. Hydraulic oil temperature check & alarm', '15. Hydraulic oil heating mode', '16. 3 color alarm light', '17. Shot data saving by external way', '18. Production data statistics', '19. Alarming & History save', '20. Log history save', '21. I/O circuit display', '22. Shot data save (Internal 1,000 / External device)']
        },
        opt: {
            injection: ['01. Heater Disconnection check device', '02. Hopper Slide (L/M)', '03. Hopper Ladder & Stand', '04. Valve Gate Circuit & Connector (Interior type)', '05. Hydraulic Valve Gate Block (Interior type)', '06. Pneumatic Valve Gate Block (Interior type)', '07. Hydraulic Valve Gate Device (External device)', '08. Nozzle cylinders equipped with Potentiometers', '09. Charging on Fly (AC Motor)'],
            clamping: ['01. Rotating Core Circuit', '02. Safety Foot-board (Below 700ton)', '03. Core & Ejector on Fly', '04. Daylight Extension', '05. Core-Back Mode', '06. Core Pressure release Circuit (Automatic)', '07. Core Pressure release Circuit (Manual)', '08. Product Chute', '09. Automatic Tie-bar Retraction', '10. Hydraulic Core Check Valve', '11. Hydraulic Core Interlock Connector (EM13, WJ Standard)', '12. Hydraulic Core Puller (2~8 Stages)', '13. Mold ring on Moving-Platen', '14. Spring type Ejector retraction', '15. Ejector Check Valve', '16. Ejector Interlock Connector (WJ Standard, EM13)', '17. Ejector Forward/Backward External switch', '18. Mold Insulation Plate', '19. Pneumatic Core Puller (1~7 Stages)'],
            general: ['01. Hydraulic Auto-Clamp unit', '02. Anchor-bolt set (Clamping unit)', '03. Heater Insulation Band', '04. Automatic Grease Lubrication (Injection unit)', '05. Robot Interface (EM12, EM67, EM67.1, SPI)', '06. CMS (Central Monitoring System)', '07. AVR (Automatic Voltage Regulator) on Electric Panel', '08. UPS (Uninterruptible Power Supply) on Electric Panel', '09. Dosing unit Interface (for Masterbatch)', '10. Gas Injection Interface', '11. Steam Injection Interface', '12. External Temperature Display (F/P)', '13. Interior type Hot Runner Controller (EM13, WJ Standard)', '14. Booster', '15. Nitrogen generator', '16. Air dryer', '17. C.P.M system (Counter Pressure Molding System)']
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
    '3 Phase electric outlet (2 ea)': 'Zestaw gniazd elektrycznych trójfazowych (5-pin) – 2 zestawy',
    '3 color alarm light': 'Trójkolorowa lampa statusu maszyny',
    'AVR (Automatic Voltage Regulator) on Electric Panel': 'Sterowanie stabilizatorem napięcia (AVR) w szafie elektrycznej',
    'Air blow-off unit (Fixed side 1 + Moving side 1)': 'Układ zdmuchiwania pneumatycznego – 2 zawory zdmuchiwania (strona stała + strona ruchoma)',
    'Alarming & History save': 'Wyświetlanie i zapis historii alarmów',
    'Anchor-bolt set (Clamping unit)': 'Śruby kotwiące (jednostka zamykania)',
    'Auto Purging': 'Funkcja automatycznego czyszczenia układu plastyfikacji',
    'Automatic Ball-screw grease lubrication (All parts)': 'Automatyczne doprowadzanie smaru do układu kolanowego i agregatu',
    'Automatic Grease Lubrication (Clamping unit)': 'Układ automatycznego smarowania mechanizmu zamykania',
    'Automatic Grease Lubrication (Injection unit)': 'Automatyczne smarowanie (jednostka wtryskowa)',
    'Automatic Injection unit swiveling (Below IH 11900)': 'Automatyczne wychylanie agregatu (dla IH poniżej 11900)',
    'Automatic Mold thickness adjust mode': 'Funkcja automatycznej regulacji wysokości formy wtryskowej',
    'Automatic clamp force measurement mode': 'Czujnik tensometryczny pokazujący siłę zwarcia',
    'Automatic grease lubrication (Clamping)': 'Układ automatycznego smarowania mechanizmu zamykania',
    'Automatic oil lubrication (Toggle)': 'Układ automatycznego smarowania mechanizmu zamykania',
    'Automatic safety Door open/close': 'Automatyczny napęd osłony przedniej',
    'Automatic safety Door open/close (Above 450ton)': 'Automatyczny napęd osłony przedniej (powyżej 450 ton)',
    'Back Pressure control step (3 step)': '3 etapy kontroli przeciwciśnienia plastyfikacji',
    'Back-Pressure Closed-loop system': 'Sterowanie przeciwciśnieniem w pętli zamkniętej',
    'CMS (Central Monitoring System)': 'CMS (centralny system monitorowania)',
    'Charging Speed & Pressure step (3 step)': '3 etapy kontroli procesu plastyfikacji (prędkość / ciśnienie)',
    'Charging on Fly (AC Motor)': 'Ruchy równoległe dozowania (silnik AC)',
    'Charging on Fly (Pump type)': 'Ruchy równoległe dozowania (typ pompowy)',
    'Charging time count & alarm': 'Alarm przekroczonego czasu plastyfikacji',
    'Clamping area Curtain sensor (Above 550ton)': 'Kurtyna świetlna osłony po stronie operatora (powyżej 550 ton)',
    'Cold screw protection mode': 'Zabezpieczenie przed wykonaniem ruchów zimnym ślimakiem',
    'Cold screw start protection mode': 'Zabezpieczenie przed wykonaniem ruchów zimnym ślimakiem',
    'Cooling water distributor': 'Rozdzielacz wody chłodzącej',
    'Core & Ejector on Fly': 'Ruchy rdzeni i wyrzutnika równoległe z otwieraniem / zamykaniem formy',
    'Core Pressure release Circuit (Automatic)': 'Układ zwalniania nacisku rdzenia (automatyczny)',
    'Core Pressure release Circuit (Manual)': 'Układ zwalniania nacisku rdzenia (ręczny)',
    'Core on Fly': 'Ruchy rdzeni równoległe z otwieraniem / zamykaniem formy',
    'Core-Back Mode': 'Tryb cofania rdzenia (core-back)',
    'Cushion Display & Alarm': 'Wyświetlenie pozycji poduszki resztkowej wtrysku wraz z alarmem',
    'Customized Design Screw (SB, Mixing, Coating)': 'Ślimak w wykonaniu specjalnym (SB, mieszający, z powłoką)',
    'Daylight Extension': 'Zwiększenie maksymalnej odległości między płytą stałą a ruchomą',
    'Dosing unit Interface (for Masterbatch)': 'Sygnał dozowania tworzywa / barwnika',
    'Ejecting on fly': 'Ruchy równoległe wyrzutnika podczas otwierania formy wtryskowej',
    'Ejector Check Valve': 'Zawór sprawdzający na wyrzutniku',
    'Ejector Forward/Backward External switch': 'Zewnętrzny przełącznik wysuwu/cofania wypychacza',
    'Ejector Interlock Connector (WJ Standard, EM13)': 'Złącze blokady wypychacza (standard WJ, EM13)',
    'Ejector Speed & Pressure step (2 step)': '2 etapy kontroli ciśnienia i prędkości ruchów wyrzutnika',
    'Ejector Speed & Pressure step (3 step)': '3 etapy kontroli ciśnienia i prędkości ruchów wyrzutnika',
    'External Temperature Display (F/P)': 'Dodatkowy wyświetlacz temperatury (F/P)',
    'Fast Injection Circuit (ACC)': 'Akumulatory wtrysku (ACC)',
    'Gas Injection Interface': 'Interfejs wtrysku gazu',
    'Heater Disconnection check device': 'Wyświetlanie i alarmowanie o niepoprawnej pracy grzałek',
    'Heater Insulation Band': 'Opaski termoizolacyjne cylindra grzewczego',
    'Holding Speed & Pressure step (5 step)': '5 etapów kontroli procesu docisku (prędkość / ciśnienie)',
    'Hopper Ladder & Stand': 'Schody i drabinka do zbiornika zasypowego',
    'Hopper Slide (L/M)': 'Prowadnice liniowe dla leja zasypowego (L/M)',
    'Hopper throat temperature control device': 'Układ kontroli temperatury strefy zasypu',
    'Hydraulic Auto-Clamp unit': 'Automatyczny, hydrauliczny system mocowania formy (QDC)',
    'Hydraulic Core Check Valve': 'Hydrauliczny zawór zwrotny rdzenia',
    'Hydraulic Core Device (Fixed: 170~400ton / Moving: 1or2 stage)': 'Złącze rdzenia hydraulicznego (strona stała: 170–400 t / strona ruchoma: 1 rdzeń / 2 rdzenie)',
    'Hydraulic Core Interlock Connector (EM13, WJ Standard)': 'Złącze blokady rdzenia (EM13, standard WJ)',
    'Hydraulic Core Puller (2~8 Stages)': 'Dodatkowe zawory rdzeni hydraulicznych (2–8)',
    'Hydraulic Core Puller (Fixed, 1~4 Stages)': 'Dodatkowe zawory rdzeni hydraulicznych (strona stała, 1–4)',
    'Hydraulic Core Puller (Moving 2~4 Stages)': 'Dodatkowe zawory rdzeni hydraulicznych (strona ruchoma, 2–4)',
    'Hydraulic Core puller (Moving platen side, 1 stage)': 'Złącze rdzenia hydraulicznego (strona płyty ruchomej, 1 rdzeń)',
    'Hydraulic Valve Gate Block (Interior type)': 'Hydrauliczny blok zaworu iglicowego (typ wewnętrzny)',
    'Hydraulic Valve Gate Device (External device)': 'Hydrauliczne urządzenie zaworu iglicowego (zewnętrzne)',
    'Hydraulic oil heating mode': 'Tryb podgrzewania oleju hydraulicznego',
    'Hydraulic oil level alarm': 'Czujnik poziomu oleju z alarmem',
    'Hydraulic oil purification device': 'Filtracja bocznikowa oleju',
    'Hydraulic oil temperature check & alarm': 'Alarm niewłaściwej temperatury oleju hydraulicznego',
    'Hydraulic oil temperature control device': 'Regulator temperatury oleju hydraulicznego',
    'I/O circuit display': 'Wyświetlanie wejść / wyjść sygnałów cyfrowych',
    'Injection Pressure Graph Display': 'Wyświetlenie graficzne ciśnienia wtrysku',
    'Injection Speed & Pressure step (10 step)': '10 etapów kontroli procesu wtrysku (prędkość / ciśnienie)',
    'Injection Speed Graph Display': 'Wykres prędkości wtrysku',
    'Injection valve gate circuit (AC 1 + DC 1)': 'Zawór wtryskowy (1. zawór: 1 × AC + 1 × DC)',
    'Interior type Hot Runner Controller (EM13, WJ Standard)': 'Wbudowany sterownik gorących kanałów (EM13, standard WJ)',
    'Leveling pad': 'Stopy poziomujące',
    'Log history save': 'Historia zmian wprowadzanych parametrów',
    'Long-holding pressure type upgrade': 'Rozszerzenie do długiego czasu docisku',
    'Lubricating oil Recycling device': 'Układ recyrkulacji oleju z układu centralnego smarowania',
    'Mold Insulation Platen': 'Płyty termoizolacyjne stołów maszyny',
    'Mold ring on Moving-Platen': 'Pierścień centrujący na płycie ruchomej',
    'Mold thickness adjusting break unit': 'Hamulec regulacji grubości formy',
    'Mold-Close Speed & Pressure step (5 step)': '5 etapów kontroli zamykania formy wtryskowej (prędkość / ciśnienie)',
    'Mold-Open Speed & Pressure step (4 step)': '4 etapy kontroli otwierania formy wtryskowej (prędkość / ciśnienie)',
    'Mold-Open Speed & Pressure step (5 step)': '5 etapów kontroli otwierania formy wtryskowej (prędkość / ciśnienie)',
    'Nozzle cylinders equipped with Potentiometers': 'Cylindry dyszy wyposażone w potencjometry',
    'PID Heating Control': 'Układ kontroli temperatury PID',
    'Pneumatic Core Puller (1-3 Stages)': 'Dodatkowe zawory pneumatyczne (1–3)',
    'Pneumatic Core Puller (1~7 Stages)': 'Dodatkowe zawory pneumatyczne (1–7)',
    'Pneumatic Valve Gate Block (Interior type)': 'Pneumatyczny blok zaworu iglicowego (typ wewnętrzny)',
    'Product Chute': 'Zsypnia dla odbioru detali',
    'Product drop check device': 'Fotokomórka licząca produkty',
    'Product quality sorting device (Below 280ton)': 'Układ separacji jakościowej produktów (poniżej 280 ton)',
    'Production data statistics': 'Funkcja statystyki procesu (SPC)',
    'Robot Interface (EM12, EM67, EM67.1, SPI)': 'Złącze robota wg Euromap (EM12, EM67, EM67.1, SPI)',
    'Robot interface (Standard)': 'Złącze robota wg Euromap',
    'Rotating Core Circuit': 'Rdzeń wykręcany elektrycznie',
    'Safety Foot-board (Above 1050ton)': 'Platforma bezpieczeństwa pod płytami (powyżej 1050 ton)',
    'Safety Foot-board (Above 650ton)': 'Platforma bezpieczeństwa pod płytami (powyżej 650 ton)',
    'Safety Foot-board (Below 850ton)': 'Platforma bezpieczeństwa pod płytami (poniżej 850 ton)',
    'Safety device (for electric & hydraulic)': 'Układ bezpieczeństwa hydraulicznego i elektrycznego',
    'Screw & Barrel (Anti Wear & Corrosive)': 'Ślimak i cylinder o podwyższonej odporności na ścieranie i korozję',
    'Screw & Barrel (Anti Wear)': 'Ślimak i cylinder o podwyższonej odporności na ścieranie',
    'Screw & Barrel (Nitrided barrel)': 'Ślimak i cylinder (cylinder azotowany)',
    'Screw RPM Display': 'Wyświetlanie obrotów ślimaka w czasie plastyfikacji',
    'Shot data save (Internal 1,000 / External device)': 'Pojemność archiwizacji danych parametrów form wtryskowych (pamięć wewnętrzna: 1000 / pamięć zewnętrzna)',
    'Shot data saving by external way': 'Zapis danych na zewnętrznym nośniku pamięci',
    'Shut-off Nozzle': 'Dysza zamykana',
    'Shut-off Nozzle (Hydraulic)': 'Dysza zamykana hydraulicznie',
    'Shut-off Nozzle (Pneumatic, Hydraulic, Spring)': 'Dysza zamykana (sprężynowa / hydrauliczna / pneumatyczna)',
    'Single Flight Screw': 'Standardowy ślimak',
    'Single Phase electric outlet (1 ea)': 'Zestaw gniazd elektrycznych 230 V (1 szt.)',
    'Spring mold mode': 'Tryb formy sprężynowej',
    'Spring type Ejector retraction': 'Cofanie wypychacza typu sprężynowego',
    'Standard Maintenance tools': 'Podstawowy zestaw narzędzi',
    'Standard spare part': 'Zestaw podstawowych części zamiennych',
    'Steam Injection Interface': 'Interfejs wtrysku pary',
    'Steel tray for resin leakage': 'Stalowa taca na wyciek tworzywa',
    'Temperature display & Alarm in abnormal Temp.': 'Kontrola i alarm nieprawidłowego funkcjonowania czujników temperatury układu plastyfikacji',
    'UPS (Uninterruptible Power Supply) on Electric Panel': 'UPS (zasilacz awaryjny) w szafie elektrycznej',
    'Valve Gate Circuit & Connector (Interior type)': 'Obwód i złącze zaworu iglicowego (typ wewnętrzny)',
    'Weekly Heating Timer': 'Tygodniowy zegar włączania grzania układu plastyfikacji',

    // Pozycje występujące tylko w listach VHA-RS, NC-G5 (MULTI) i DL-A5 (S.F.)
    '3 Phase electric outlet (4 ea)': 'Zestaw gniazd elektrycznych trójfazowych (5-pin) – 4 zestawy',
    'Air blow-off unit (1 ea, Upper part)': 'Układ zdmuchiwania pneumatycznego – 1 zawór zdmuchiwania (część górna)',
    'Air dryer': 'Osuszacz powietrza',
    'Automatic Tie-bar Retraction': 'Automatyczne wysuwanie kolumny (łatwiejszy montaż dużych form)',
    'Automatic safety Door open/close (Above 500ton)': 'Automatyczny napęd osłony przedniej (powyżej 500 ton)',
    'Back Pressure control step (4 step)': '4 etapy kontroli przeciwciśnienia plastyfikacji',
    'Booster': 'Sprężarka podnosząca ciśnienie gazu (booster)',
    'C.P.M system (Counter Pressure Molding System)': 'System CPM – wtrysk z przeciwciśnieniem gazu w gnieździe formy',
    'Charging Speed & Pressure step (4 step)': '4 etapy kontroli procesu plastyfikacji (prędkość / ciśnienie)',
    'Clamp area safety sensor (Vertical type IMM)': 'Czujnik bezpieczeństwa strefy zamykania (wtryskarka pionowa)',
    'Clamping area Curtain sensor': 'Kurtyna świetlna osłony po stronie operatora',
    'Controller Moving device': 'Przestawny (ruchomy) panel sterownika',
    'Hydraulic Core (Rotary table type)': 'Rdzeń hydrauliczny w stole obrotowym',
    'Interior type Hot Runner Controller (EM14, WJ Standard)': 'Wbudowany sterownik gorących kanałów (EM14, standard WJ)',
    'Measuring electricity': 'Pomiar zużycia energii elektrycznej',
    'Mold Insulation Plate': 'Płyty termoizolacyjne stołów maszyny',
    'Nitrogen generator': 'Generator azotu',
    'Raw material supply device': 'Układ ilościowego podawania surowca do ślimaka',
    'Robot Interface (EM12, EM67, SPI)': 'Złącze robota wg Euromap (EM12, EM67, SPI)',
    'Safety Foot-board (Above 900ton)': 'Platforma bezpieczeństwa pod płytami (powyżej 900 ton)',
    'Safety Foot-board (Below 700ton)': 'Platforma bezpieczeństwa pod płytami (poniżej 700 ton)',
    'Shut-off Nozzle (Pneumatic)': 'Dysza zamykana pneumatycznie',
    'Working Foot-board (Above 120ton)': 'Podest roboczy dla operatora (powyżej 120 ton)'
};

// Zdjęcia i opisy wybranych pozycji wyposażenia - pokazywane w dymku Kroku 3
// razem z tłumaczeniem (patrz showStep3OptionTooltip). Klucz = tekst pozycji
// bez numeru, tak jak w OPTION_TRANSLATIONS. "types" - typy maszyn, do których
// zdjęcie pasuje (brak = każdy typ, w którego liście pozycja występuje).
// Pliki: img/opt/opcje/ (zoptymalizowane kopie zdjęć z img/opcje/).
const OPTION_MEDIA_DIR = 'img/opt/opcje/';
const OPTION_MEDIA = {
    'Single Flight Screw': {
        images: [
            { src: 'slimak-standardowy.jpg', wide: true, caption: 'Ślimak standardowy' },
            { src: 'zawor-zwrotny-ring.jpg', caption: 'Zawór zwrotny typu ring' }
        ],
        desc: 'Uniwersalny ślimak jednozwojowy ze strefą zasilania, sprężania i dozowania – do przetwórstwa większości tworzyw. Na jego końcu pracuje zawór zwrotny z pierścieniem, który nie pozwala stopionemu tworzywu cofać się podczas wtrysku.'
    },
    'Customized Design Screw (SB, Mixing, Coating)': {
        images: [
            { src: 'slimak-sb.jpg', wide: true, caption: 'Ślimak SB' },
            { src: 'slimak-mieszajacy.jpg', wide: true, caption: 'Ślimak mieszający' },
            { src: 'slimak-pvc.jpg', caption: 'Ślimak utwardzany do PVC' },
            { src: 'zawor-zwrotny-glove.jpg', caption: 'Zawór zwrotny typu glove' }
        ],
        desc: 'Ślimak dobierany do konkretnego tworzywa i wyrobu: SB – do wydajniejszego uplastyczniania, mieszający – do równomiernego rozprowadzenia barwnika i dodatków, utwardzany lub z powłoką – do tworzyw wymagających, np. PVC. Do ślimaka dobierany jest odpowiedni zawór zwrotny.'
    },
    'Screw & Barrel (Nitrided barrel)': {
        images: [{ src: 'cylinder-azotowany.jpg', caption: 'Cylinder azotowany' }],
        desc: 'Cylinder z wewnętrzną powierzchnią utwardzoną przez azotowanie – sprawdzone rozwiązanie do tworzyw bez wypełniaczy ściernych i dodatków powodujących korozję.'
    },
    'Screw & Barrel (Anti Wear)': {
        images: [{ src: 'cylinder-bimetaliczny.jpg', caption: 'Cylinder bimetaliczny' }],
        desc: 'Ślimak i cylinder o podwyższonej odporności na ścieranie – cylinder bimetaliczny ze stopową wykładziną wewnętrzną znacznie dłużej zachowuje wymiary przy tworzywach z wypełniaczami, np. z włóknem szklanym.'
    },
    'Screw & Barrel (Anti Wear & Corrosive)': {
        images: [{ src: 'cylinder-bimetaliczny.jpg', caption: 'Cylinder bimetaliczny' }],
        desc: 'Ślimak i cylinder bimetaliczny odporne jednocześnie na ścieranie i korozję – do tworzyw z wypełniaczami oraz materiałów agresywnych chemicznie, np. PVC czy tworzyw z uniepalniaczami.'
    },
    'Automatic Ball-screw grease lubrication (All parts)': {
        types: ['TE-A5'],
        images: [{ src: 'sruba-kulowa.jpg', caption: 'Śruba kulowa' }],
        desc: 'Śruby kulowe napędów zamykania, wtrysku i wypychacza są smarowane automatycznie – mniejsze zużycie, stała dokładność pozycjonowania i brak ręcznego smarowania.'
    },
    'Automatic clamp force measurement mode': {
        types: ['TE-A5'],
        images: [{ src: 'czujnik-sily-zwarcia.jpg', caption: 'Czujnik siły zwarcia' }],
        desc: 'Czujnik mierzy siłę zwarcia w czasie rzeczywistym. Gdy zmienia się ona, np. wskutek nagrzewania formy, płyt i kolumn, sterownik automatycznie ją koryguje – bez ręcznej regulacji i z mniejszą liczbą braków.'
    },
    'CMS (Central Monitoring System)': {
        images: [{ src: 'cms.jpg', caption: 'Centralny system monitoringu' }],
        desc: 'Wtryskarki połączone w sieć – na jednym komputerze widać stan wszystkich maszyn w hali, alarmy i dane produkcyjne.'
    },
    'Hydraulic oil purification device': {
        images: [{ src: 'obieg-oleju.jpg', caption: 'Niezależny obieg oleju z filtrem i chłodnicą' }],
        desc: 'Niezależny obieg z własną pompą stale przepuszcza olej przez filtr i chłodnicę. Olej pozostaje czysty, co wydłuża jego żywotność i chroni podzespoły hydrauliki.'
    },
    'Hydraulic oil temperature control device': {
        images: [{ src: 'obieg-oleju.jpg', caption: 'Niezależny obieg oleju z filtrem i chłodnicą' }],
        desc: 'Chłodnica w niezależnym obiegu oleju utrzymuje stałą temperaturę oleju hydraulicznego – stabilna, powtarzalna praca maszyny i ochrona przed przegrzaniem.'
    },
    'Mold thickness adjusting break unit': {
        types: ['TH-A5'],
        images: [{ src: 'regulacja-wysokosci-formy-th-a5.jpg', caption: 'Układ regulacji wysokości formy TH-A5' }],
        desc: 'Hamulec silnika regulacji wysokości formy utrzymuje ustawioną siłę zwarcia i położenie płyty podczas wielokrotnego otwierania i zamykania formy.'
    },
    'Automatic Mold thickness adjust mode': {
        types: ['TH-A5'],
        images: [{ src: 'regulacja-wysokosci-formy-th-a5.jpg', caption: 'Układ regulacji wysokości formy TH-A5' }],
        desc: 'Silnik regulacji z enkoderem automatycznie i precyzyjnie dopasowuje mechanizm zamykania do wysokości formy, dzięki czemu siłę zwarcia można ustawić dokładnie.'
    }
};

// Zdjęcie/opis dla pozycji wyposażenia - tylko gdy pasuje do typu maszyny,
// której dotyczy pozycja (w Kroku 3 każda sekcja typu ma własne data-type)
function getOptionMedia(key, type) {
    const media = OPTION_MEDIA[key];
    if (!media || (media.types && !media.types.includes(type))) return null;
    return media;
}

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
    },
    // Katalog "VH Series" - podseria VHA-RS (pionowa ze stołem obrotowym).
    // Katalog nie podaje prześwitu między kolumnami ani maks. wysokości formy
    // (podaje średnicę stołu obrotowego) - stąd tieBar/maxH = null.
    'VHA-RS': {
        label: 'VHA-RS (wtryskarka pionowa)',
        hasTieBar: false,
        models: [
            { name: 'VHA50RS', force: 50, tieBar: null, minH: 200, maxH: null, units: ['IH140V O(22mm)', 'IH140V A(25mm)', 'IH140V B(28mm)'] },
            { name: 'VHA75RS', force: 75, tieBar: null, minH: 200, maxH: null, units: ['IH200V O(25mm)', 'IH200V A(28mm)', 'IH200V B(32mm)'] },
            { name: 'VHA100RS', force: 100, tieBar: null, minH: 250, maxH: null, units: ['IH280V O(28mm)', 'IH280V A(32mm)', 'IH280V B(36mm)'] }
        ]
    },
    // Katalog "MULTI Series" - seria NC-G5 (dwukolorowa, stół obrotowy na
    // płycie ruchomej). Katalog nie podaje maks. wysokości formy (maxH = null).
    'MULTI': {
        label: 'NC-G5 (wtryskarka dwukolorowa)',
        hasTieBar: true,
        models: [
            { name: 'NC130G5', force: 130, tieBar: 700, minH: 170, maxH: null, units: ['IC240 S(25mm)', 'IC240 O(28mm)', 'IC240 A(32mm)'] },
            { name: 'NC220G5', force: 220, tieBar: 950, minH: 250, maxH: null, units: ['IC510 S(40mm)', 'IC510 O(45mm)', 'IC510 A(50mm)'] },
            { name: 'NC400G5', force: 400, tieBar: 1120, minH: 300, maxH: null, units: ['IC610 S(40mm)', 'IC610 O(45mm)', 'IC610 A(50mm)'] }
        ]
    },
    // Katalog "Super-Foam Series" - DL-A5 (S.F.), po jednym agregacie (A) na
    // model. Nazwy z dopiskiem "(S.F.)", bo dane różnią się od zwykłych DL-A5.
    'Super-Foam': {
        label: 'DL-A5 Super-Foam (super spienianie)',
        hasTieBar: true,
        models: [
            { name: 'DL500A5 (S.F.)', force: 500, tieBar: 920, minH: 350, maxH: 900, units: ['IH2800 A(70mm)'] },
            { name: 'DL600A5 (S.F.)', force: 600, tieBar: 1040, minH: 400, maxH: 950, units: ['IH4200 A(80mm)'] },
            { name: 'DL700A5 (S.F.)', force: 700, tieBar: 1110, minH: 450, maxH: 950, units: ['IH5900 A(90mm)'] },
            { name: 'DL900A5 (S.F.)', force: 900, tieBar: 1200, minH: 500, maxH: 1100, units: ['IH8800 A(105mm)'] },
            { name: 'DL1100A5 (S.F.)', force: 1100, tieBar: 1420, minH: 600, maxH: 1200, units: ['IH8800 A(105mm)'] },
            { name: 'DL1300A5 (S.F.)', force: 1300, tieBar: 1580, minH: 700, maxH: 1400, units: ['IH11900 A(115mm)'] },
            { name: 'DL1800A5 (S.F.)', force: 1800, tieBar: 1850, minH: 700, maxH: 1600, units: ['IH15300 A(125mm)'] },
            { name: 'DL2000A5 (S.F.)', force: 2000, tieBar: 2020, minH: 800, maxH: 1700, units: ['IH15300 A(125mm)'] },
            { name: 'DL2300A5 (S.F.)', force: 2300, tieBar: 2020, minH: 800, maxH: 1700, units: ['IH15300 A(125mm)'] },
            { name: 'DL2500A5 (S.F.)', force: 2500, tieBar: 2180, minH: 900, maxH: 2000, units: ['IH21500 A(140mm)'] },
            { name: 'DL2700A5 (S.F.)', force: 2700, tieBar: 2180, minH: 900, maxH: 2000, units: ['IH21500 A(140mm)'] },
            { name: 'DL3000A5 (S.F.)', force: 3000, tieBar: 2260, minH: 1100, maxH: 2000, units: ['IH33000 A(160mm)'] },
            { name: 'DL3300A5 (S.F.)', force: 3300, tieBar: 2260, minH: 1100, maxH: 2000, units: ['IH33000 A(160mm)'] }
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
    },

    // ---- VHA-RS (katalog VH Series, str. 14) ----

"VHA50RS": {
        clamping: { clampingForce: "50(490)", moldOpeningForce: null, tieBarDistance: null, platenDimension: null, maxMoldSize: null, rotaryTableSize: 880, daylight: 250, maxDaylight: 450, minMoldHeight: 200, maxMoldHeight: null, ejectorForce: "2.7(26)", ejectorStroke: 60, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH140V O(22mm)": { injection: { screwDiameter: 22, injPressureKgcm2: 3487, injPressureMpa: 342, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 46, shotWeight: 42, injRate: 49, injRateOptional: null, screwStroke: 120, injSpeed: 130, injSpeedOptional: null, plasticizingCapacity: 13, screwRotationSpeed: 220 }, general: { motorCapacity: 13.9, motorCapacityOptional: null, heaterCapacity: 5.2, totalElectricPower: 19.1, totalElectricPowerHigh: null, hydraulicOilTank: 180, coolingWater: 20, machineWeight: 3.5, machineDimension: "2.9 x 1.6 x 2.9" } },
            "IH140V A(25mm)": { injection: { screwDiameter: 25, injPressureKgcm2: 2700, injPressureMpa: 265, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 59, shotWeight: 54, injRate: 64, injRateOptional: null, screwStroke: 120, injSpeed: 130, injSpeedOptional: null, plasticizingCapacity: 16, screwRotationSpeed: 220 }, general: { motorCapacity: 13.9, motorCapacityOptional: null, heaterCapacity: 5.2, totalElectricPower: 19.1, totalElectricPowerHigh: null, hydraulicOilTank: 180, coolingWater: 20, machineWeight: 3.5, machineDimension: "2.9 x 1.6 x 2.9" } },
            "IH140V B(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 2152, injPressureMpa: 211, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 74, shotWeight: 68, injRate: 80, injRateOptional: null, screwStroke: 120, injSpeed: 130, injSpeedOptional: null, plasticizingCapacity: 23, screwRotationSpeed: 220 }, general: { motorCapacity: 13.9, motorCapacityOptional: null, heaterCapacity: 5.2, totalElectricPower: 19.1, totalElectricPowerHigh: null, hydraulicOilTank: 180, coolingWater: 20, machineWeight: 3.5, machineDimension: "2.9 x 1.6 x 2.9" } }
        }
    },

    "VHA75RS": {
        clamping: { clampingForce: "75(735)", moldOpeningForce: null, tieBarDistance: null, platenDimension: null, maxMoldSize: null, rotaryTableSize: 1000, daylight: 250, maxDaylight: 450, minMoldHeight: 200, maxMoldHeight: null, ejectorForce: "2.7(26)", ejectorStroke: 60, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH200V O(25mm)": { injection: { screwDiameter: 25, injPressureKgcm2: 2923, injPressureMpa: 287, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 69, shotWeight: 63, injRate: 59, injRateOptional: null, screwStroke: 140, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 16, screwRotationSpeed: 220 }, general: { motorCapacity: 13.9, motorCapacityOptional: null, heaterCapacity: 6.1, totalElectricPower: 20, totalElectricPowerHigh: null, hydraulicOilTank: 180, coolingWater: 20, machineWeight: 4.2, machineDimension: "3.1 x 1.8 x 3.1" } },
            "IH200V A(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 2330, injPressureMpa: 228, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 86, shotWeight: 78, injRate: 74, injRateOptional: null, screwStroke: 140, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 23, screwRotationSpeed: 220 }, general: { motorCapacity: 13.9, motorCapacityOptional: null, heaterCapacity: 6.1, totalElectricPower: 20, totalElectricPowerHigh: null, hydraulicOilTank: 180, coolingWater: 20, machineWeight: 4.2, machineDimension: "3.1 x 1.8 x 3.1" } },
            "IH200V B(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 1784, injPressureMpa: 175, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 113, shotWeight: 102, injRate: 97, injRateOptional: null, screwStroke: 140, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 31, screwRotationSpeed: 220 }, general: { motorCapacity: 13.9, motorCapacityOptional: null, heaterCapacity: 6.1, totalElectricPower: 20, totalElectricPowerHigh: null, hydraulicOilTank: 180, coolingWater: 20, machineWeight: 4.2, machineDimension: "3.1 x 1.8 x 3.1" } }
        }
    },

    "VHA100RS": {
        clamping: { clampingForce: "100(981)", moldOpeningForce: null, tieBarDistance: null, platenDimension: null, maxMoldSize: null, rotaryTableSize: 1100, daylight: 250, maxDaylight: 500, minMoldHeight: 250, maxMoldHeight: null, ejectorForce: "4.3(42)", ejectorStroke: 80, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IH280V O(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 2847, injPressureMpa: 279, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 99, shotWeight: 90, injRate: 97, injRateOptional: null, screwStroke: 160, injSpeed: 158, injSpeedOptional: null, plasticizingCapacity: 23, screwRotationSpeed: 220 }, general: { motorCapacity: 19.5, motorCapacityOptional: null, heaterCapacity: 6.7, totalElectricPower: 26.2, totalElectricPowerHigh: null, hydraulicOilTank: 250, coolingWater: 40, machineWeight: 5.5, machineDimension: "3.5 x 1.9 x 3.5" } },
            "IH280V A(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 2180, injPressureMpa: 214, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 129, shotWeight: 117, injRate: 127, injRateOptional: null, screwStroke: 160, injSpeed: 158, injSpeedOptional: null, plasticizingCapacity: 31, screwRotationSpeed: 220 }, general: { motorCapacity: 19.5, motorCapacityOptional: null, heaterCapacity: 6.7, totalElectricPower: 26.2, totalElectricPowerHigh: null, hydraulicOilTank: 250, coolingWater: 40, machineWeight: 5.5, machineDimension: "3.5 x 1.9 x 3.5" } },
            "IH280V B(36mm)": { injection: { screwDiameter: 36, injPressureKgcm2: 1722, injPressureMpa: 169, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 163, shotWeight: 148, injRate: 161, injRateOptional: null, screwStroke: 160, injSpeed: 158, injSpeedOptional: null, plasticizingCapacity: 51, screwRotationSpeed: 220 }, general: { motorCapacity: 19.5, motorCapacityOptional: null, heaterCapacity: 6.7, totalElectricPower: 26.2, totalElectricPowerHigh: null, hydraulicOilTank: 250, coolingWater: 40, machineWeight: 5.5, machineDimension: "3.5 x 1.9 x 3.5" } }
        }
    },

    // ---- MULTI / NC-G5 (katalog MULTI Series, str. 10) ----

    "NC130G5": {
        clamping: { clampingForce: "130(1274)", moldOpeningForce: null, tieBarDistance: "700 x 300", platenDimension: "920 x 530", maxMoldSize: "(250 x 360) x 2", rotaryTableSize: 735, daylight: 450, maxDaylight: 620, minMoldHeight: 170, maxMoldHeight: null, ejectorForce: 3.3, ejectorStroke: 114, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IC240 S(25mm)": { injection: { screwDiameter: 25, injPressureKgcm2: 3241, injPressureMpa: 317, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 74, shotWeight: 67, injRate: 49, injRateOptional: null, screwStroke: 150, injSpeed: 99, injSpeedOptional: null, plasticizingCapacity: 17, screwRotationSpeed: 237 }, general: { motorCapacity: "36.4(18.2+18.2)", motorCapacityOptional: null, heaterCapacity: 12.6, totalElectricPower: 49, totalElectricPowerHigh: null, hydraulicOilTank: 360, coolingWater: 40, machineWeight: 6.9, machineDimension: "5.2 x 1.7 x 2.1" } },
            "IC240 O(28mm)": { injection: { screwDiameter: 28, injPressureKgcm2: 2584, injPressureMpa: 253, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 92, shotWeight: 84, injRate: 61, injRateOptional: null, screwStroke: 150, injSpeed: 99, injSpeedOptional: null, plasticizingCapacity: 23, screwRotationSpeed: 237 }, general: { motorCapacity: "36.4(18.2+18.2)", motorCapacityOptional: null, heaterCapacity: 12.6, totalElectricPower: 49, totalElectricPowerHigh: null, hydraulicOilTank: 360, coolingWater: 40, machineWeight: 6.9, machineDimension: "5.2 x 1.7 x 2.1" } },
            "IC240 A(32mm)": { injection: { screwDiameter: 32, injPressureKgcm2: 1978, injPressureMpa: 193, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 121, shotWeight: 110, injRate: 80, injRateOptional: null, screwStroke: 150, injSpeed: 99, injSpeedOptional: null, plasticizingCapacity: 30, screwRotationSpeed: 237 }, general: { motorCapacity: "36.4(18.2+18.2)", motorCapacityOptional: null, heaterCapacity: 12.6, totalElectricPower: 49, totalElectricPowerHigh: null, hydraulicOilTank: 360, coolingWater: 40, machineWeight: 6.9, machineDimension: "5.2 x 1.7 x 2.1" } }
        }
    },

    "NC220G5": {
        clamping: { clampingForce: "220(2156)", moldOpeningForce: null, tieBarDistance: "950 x 360", platenDimension: "1220 x 630", maxMoldSize: "(400 x 500) x 2", rotaryTableSize: 1030, daylight: 520, maxDaylight: 770, minMoldHeight: 250, maxMoldHeight: null, ejectorForce: 3.3, ejectorStroke: 178, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IC510 S(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 2242, injPressureMpa: 219, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 226, shotWeight: 206, injRate: 112, injRateOptional: null, screwStroke: 180, injSpeed: 89, injSpeedOptional: null, plasticizingCapacity: 67, screwRotationSpeed: 237 }, general: { motorCapacity: "56.6(28.3+28.3)", motorCapacityOptional: null, heaterCapacity: 24.2, totalElectricPower: 80.8, totalElectricPowerHigh: null, hydraulicOilTank: 700, coolingWater: 65, machineWeight: 11.9, machineDimension: "6.2 x 2.0 x 2.4" } },
            "IC510 O(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 1772, injPressureMpa: 173, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 286, shotWeight: 261, injRate: 142, injRateOptional: null, screwStroke: 180, injSpeed: 89, injSpeedOptional: null, plasticizingCapacity: 90, screwRotationSpeed: 237 }, general: { motorCapacity: "56.6(28.3+28.3)", motorCapacityOptional: null, heaterCapacity: 24.2, totalElectricPower: 80.8, totalElectricPowerHigh: null, hydraulicOilTank: 700, coolingWater: 65, machineWeight: 11.9, machineDimension: "6.2 x 2.0 x 2.4" } },
            "IC510 A(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 1435, injPressureMpa: 140, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 353, shotWeight: 322, injRate: 176, injRateOptional: null, screwStroke: 180, injSpeed: 89, injSpeedOptional: null, plasticizingCapacity: 122, screwRotationSpeed: 237 }, general: { motorCapacity: "56.6(28.3+28.3)", motorCapacityOptional: null, heaterCapacity: 24.2, totalElectricPower: 80.8, totalElectricPowerHigh: null, hydraulicOilTank: 700, coolingWater: 65, machineWeight: 11.9, machineDimension: "6.2 x 2.0 x 2.4" } }
        }
    },

    "NC400G5": {
        clamping: { clampingForce: "400(3922)", moldOpeningForce: null, tieBarDistance: "1120 x 680", platenDimension: "1385 x 1040", maxMoldSize: "(500 x 700) x 2", rotaryTableSize: 1320, daylight: 800, maxDaylight: 1100, minMoldHeight: 300, maxMoldHeight: null, ejectorForce: 5.6, ejectorStroke: 190, dryCycleTime: null, maxMoldWeight: null },
        units: {
            "IC610 S(40mm)": { injection: { screwDiameter: 40, injPressureKgcm2: 2689, injPressureMpa: 264, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 226, shotWeight: 206, injRate: 195, injRateOptional: null, screwStroke: 180, injSpeed: 155, injSpeedOptional: null, plasticizingCapacity: 74, screwRotationSpeed: 260 }, general: { motorCapacity: "88(44+44)", motorCapacityOptional: null, heaterCapacity: 24.2, totalElectricPower: 112.2, totalElectricPowerHigh: null, hydraulicOilTank: 1175, coolingWater: 65, machineWeight: 21, machineDimension: "7.3 x 2.4 x 2.7" } },
            "IC610 O(45mm)": { injection: { screwDiameter: 45, injPressureKgcm2: 2125, injPressureMpa: 208, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 286, shotWeight: 261, injRate: 246, injRateOptional: null, screwStroke: 180, injSpeed: 155, injSpeedOptional: null, plasticizingCapacity: 99, screwRotationSpeed: 260 }, general: { motorCapacity: "88(44+44)", motorCapacityOptional: null, heaterCapacity: 24.2, totalElectricPower: 112.2, totalElectricPowerHigh: null, hydraulicOilTank: 1175, coolingWater: 65, machineWeight: 21, machineDimension: "7.3 x 2.4 x 2.7" } },
            "IC610 A(50mm)": { injection: { screwDiameter: 50, injPressureKgcm2: 1721, injPressureMpa: 169, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 353, shotWeight: 322, injRate: 304, injRateOptional: null, screwStroke: 180, injSpeed: 155, injSpeedOptional: null, plasticizingCapacity: 133, screwRotationSpeed: 260 }, general: { motorCapacity: "88(44+44)", motorCapacityOptional: null, heaterCapacity: 24.2, totalElectricPower: 112.2, totalElectricPowerHigh: null, hydraulicOilTank: 1175, coolingWater: 65, machineWeight: 21, machineDimension: "7.3 x 2.4 x 2.7" } }
        }
    },

    // ---- Super-Foam / DL-A5 (S.F.) (katalog Super-Foam Series, str. 18-19) ----

    "DL500A5 (S.F.)": {
        clamping: { clampingForce: "500(4903)", moldOpeningForce: "38(368)", tieBarDistance: "920 x 830", platenDimension: "1280 x 1260", maxMoldSize: null, rotaryTableSize: null, daylight: 1650, maxDaylight: null, minMoldHeight: 350, maxMoldHeight: 900, ejectorForce: "11.1(108.9)", ejectorStroke: 200, dryCycleTime: 3.3, maxMoldWeight: "5.3/5.3/8" },
        units: {
            "IH2800 A(70mm)": { injection: { screwDiameter: 70, injPressureKgcm2: 1889, injPressureMpa: 185, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 1482, shotWeight: 1365, injRate: 472, injRateOptional: null, screwStroke: 385, injSpeed: 123, injSpeedOptional: null, plasticizingCapacity: 252, screwRotationSpeed: 180 }, general: { motorCapacity: 65.2, motorCapacityOptional: null, heaterCapacity: 28.7, totalElectricPower: 93.9, totalElectricPowerHigh: null, hydraulicOilTank: 600, coolingWater: 130, machineWeight: "19(13.5+5.5)", machineDimension: "8.4 x 2.7 x 2.2" } }
        }
    },

    "DL600A5 (S.F.)": {
        clamping: { clampingForce: "600(5884)", moldOpeningForce: "45(441)", tieBarDistance: "1040 x 910", platenDimension: "1430 x 1370", maxMoldSize: null, rotaryTableSize: null, daylight: 1750, maxDaylight: null, minMoldHeight: 400, maxMoldHeight: 950, ejectorForce: "16.6(162.8)", ejectorStroke: 220, dryCycleTime: 3.3, maxMoldWeight: "6.7/6.7/10" },
        units: {
            "IH4200 A(80mm)": { injection: { screwDiameter: 80, injPressureKgcm2: 1887, injPressureMpa: 185, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 2212, shotWeight: 2038, injRate: 602, injRateOptional: null, screwStroke: 440, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 328, screwRotationSpeed: 165 }, general: { motorCapacity: 87.6, motorCapacityOptional: null, heaterCapacity: 37.3, totalElectricPower: 124.9, totalElectricPowerHigh: null, hydraulicOilTank: 800, coolingWater: 130, machineWeight: "26(17+9)", machineDimension: "8.6 x 2.9 x 2.2" } }
        }
    },

    "DL700A5 (S.F.)": {
        clamping: { clampingForce: "700(6865)", moldOpeningForce: "53(515)", tieBarDistance: "1110 x 1110", platenDimension: "1520 x 1490", maxMoldSize: null, rotaryTableSize: null, daylight: 1850, maxDaylight: null, minMoldHeight: 450, maxMoldHeight: 950, ejectorForce: "19.8(194.2)", ejectorStroke: 250, dryCycleTime: 3.3, maxMoldWeight: "7.3/7.3/11" },
        units: {
            "IH5900 A(90mm)": { injection: { screwDiameter: 90, injPressureKgcm2: 1885, injPressureMpa: 185, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 3149, shotWeight: 2902, injRate: 763, injRateOptional: null, screwStroke: 495, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 408, screwRotationSpeed: 150 }, general: { motorCapacity: 87.6, motorCapacityOptional: null, heaterCapacity: 47, totalElectricPower: 134.6, totalElectricPowerHigh: null, hydraulicOilTank: 800, coolingWater: 130, machineWeight: "32(21.5+10.5)", machineDimension: "9.3 x 3.1 x 2.4" } }
        }
    },

    "DL900A5 (S.F.)": {
        clamping: { clampingForce: "900(8826)", moldOpeningForce: "68(662)", tieBarDistance: "1200 x 1120", platenDimension: "1720 x 1610", maxMoldSize: null, rotaryTableSize: null, daylight: 2100, maxDaylight: null, minMoldHeight: 500, maxMoldHeight: 1100, ejectorForce: "26.9(263.8)", ejectorStroke: 250, dryCycleTime: 4, maxMoldWeight: "8.6/8.6/13" },
        units: {
            "IH8800 A(105mm)": { injection: { screwDiameter: 105, injPressureKgcm2: 1756, injPressureMpa: 172, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 5022, shotWeight: 4628, injRate: 1041, injRateOptional: null, screwStroke: 580, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 515, screwRotationSpeed: 125 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 62.4, totalElectricPower: 172.4, totalElectricPowerHigh: null, hydraulicOilTank: 920, coolingWater: 180, machineWeight: "41(29+12)", machineDimension: "10.5 x 3.4 x 2.5" } }
        }
    },

    "DL1100A5 (S.F.)": {
        clamping: { clampingForce: "1100(10787)", moldOpeningForce: "83(809)", tieBarDistance: "1420 x 1170", platenDimension: "1870 x 1820", maxMoldSize: null, rotaryTableSize: null, daylight: 2400, maxDaylight: null, minMoldHeight: 600, maxMoldHeight: 1200, ejectorForce: "26.9(263.8)", ejectorStroke: 250, dryCycleTime: 4.4, maxMoldWeight: "14/14/21" },
        units: {
            "IH8800 A(105mm)": { injection: { screwDiameter: 105, injPressureKgcm2: 1756, injPressureMpa: 172, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 5022, shotWeight: 4628, injRate: 1041, injRateOptional: null, screwStroke: 580, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 515, screwRotationSpeed: 125 }, general: { motorCapacity: 110, motorCapacityOptional: null, heaterCapacity: 62.4, totalElectricPower: 172.4, totalElectricPowerHigh: null, hydraulicOilTank: 920, coolingWater: 180, machineWeight: "50(37.5+12.5)", machineDimension: "10.7 x 3.4 x 2.7" } }
        }
    },

    "DL1300A5 (S.F.)": {
        clamping: { clampingForce: "1300(12749)", moldOpeningForce: "98(956)", tieBarDistance: "1580 x 1280", platenDimension: "2230 x 1990", maxMoldSize: null, rotaryTableSize: null, daylight: 3050, maxDaylight: null, minMoldHeight: 700, maxMoldHeight: 1400, ejectorForce: "34.4(337.3)", ejectorStroke: 300, dryCycleTime: 5, maxMoldWeight: "20/20/30" },
        units: {
            "IH11900 A(115mm)": { injection: { screwDiameter: 115, injPressureKgcm2: 1809, injPressureMpa: 177, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 6544, shotWeight: 6030, injRate: 1249, injRateOptional: null, screwStroke: 630, injSpeed: 120, injSpeedOptional: null, plasticizingCapacity: 607, screwRotationSpeed: 115 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 76.4, totalElectricPower: 219, totalElectricPowerHigh: null, hydraulicOilTank: 1150, coolingWater: 180, machineWeight: "72(55+17)", machineDimension: "12.3 x 4.2 x 3.4" } }
        }
    },

    "DL1800A5 (S.F.)": {
        clamping: { clampingForce: "1800(17652)", moldOpeningForce: "135(1324)", tieBarDistance: "1850 x 1610", platenDimension: "2450 x 2200", maxMoldSize: null, rotaryTableSize: null, daylight: 3400, maxDaylight: null, minMoldHeight: 700, maxMoldHeight: 1600, ejectorForce: "44.5(436.4)", ejectorStroke: 300, dryCycleTime: 5.8, maxMoldWeight: "30/30/45" },
        units: {
            "IH15300 A(125mm)": { injection: { screwDiameter: 125, injPressureKgcm2: 1743, injPressureMpa: 171, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 8406, shotWeight: 7746, injRate: 1349, injRateOptional: null, screwStroke: 685, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 692, screwRotationSpeed: 105 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 86.2, totalElectricPower: 228.8, totalElectricPowerHigh: null, hydraulicOilTank: 1450, coolingWater: 180, machineWeight: "115(96+19)", machineDimension: "13.7 x 4.2 x 3.4" } }
        }
    },

    "DL2000A5 (S.F.)": {
        clamping: { clampingForce: "2000(19613)", moldOpeningForce: "150(1471)", tieBarDistance: "2020 x 1610", platenDimension: "2600 x 2250", maxMoldSize: null, rotaryTableSize: null, daylight: 3600, maxDaylight: null, minMoldHeight: 800, maxMoldHeight: 1700, ejectorForce: "44.5(436.4)", ejectorStroke: 300, dryCycleTime: 5.8, maxMoldWeight: "41/41/62" },
        units: {
            "IH15300 A(125mm)": { injection: { screwDiameter: 125, injPressureKgcm2: 1743, injPressureMpa: 171, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 8406, shotWeight: 7746, injRate: 1349, injRateOptional: null, screwStroke: 685, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 692, screwRotationSpeed: 105 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 86.2, totalElectricPower: 228.8, totalElectricPowerHigh: null, hydraulicOilTank: 1450, coolingWater: 180, machineWeight: "115(96+19)", machineDimension: "14.1 x 4.5 x 3.4" } }
        }
    },

    "DL2300A5 (S.F.)": {
        clamping: { clampingForce: "2300(22555)", moldOpeningForce: "173(1692)", tieBarDistance: "2020 x 1610", platenDimension: "2600 x 2250", maxMoldSize: null, rotaryTableSize: null, daylight: 3600, maxDaylight: null, minMoldHeight: 800, maxMoldHeight: 1700, ejectorForce: "44.5(436.4)", ejectorStroke: 300, dryCycleTime: 5.8, maxMoldWeight: "41/41/62" },
        units: {
            "IH15300 A(125mm)": { injection: { screwDiameter: 125, injPressureKgcm2: 1743, injPressureMpa: 171, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 8406, shotWeight: 7746, injRate: 1349, injRateOptional: null, screwStroke: 685, injSpeed: 110, injSpeedOptional: null, plasticizingCapacity: 692, screwRotationSpeed: 105 }, general: { motorCapacity: 142.6, motorCapacityOptional: null, heaterCapacity: 86.2, totalElectricPower: 228.8, totalElectricPowerHigh: null, hydraulicOilTank: 1450, coolingWater: 180, machineWeight: "115(96+19)", machineDimension: "14.1 x 4.5 x 3.4" } }
        }
    },

    "DL2500A5 (S.F.)": {
        clamping: { clampingForce: "2500(24517)", moldOpeningForce: "188(1839)", tieBarDistance: "2180 x 1760", platenDimension: "3030 x 2610", maxMoldSize: null, rotaryTableSize: null, daylight: 3900, maxDaylight: null, minMoldHeight: 900, maxMoldHeight: 2000, ejectorForce: "67.8(664.9)", ejectorStroke: 350, dryCycleTime: 8.2, maxMoldWeight: "50/50/75" },
        units: {
            "IH21500 A(140mm)": { injection: { screwDiameter: 140, injPressureKgcm2: 1816, injPressureMpa: 178, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 11853, shotWeight: 10923, injRate: 1537, injRateOptional: null, screwStroke: 770, injSpeed: 100, injSpeedOptional: null, plasticizingCapacity: 850, screwRotationSpeed: 95 }, general: { motorCapacity: 165, motorCapacityOptional: null, heaterCapacity: 110, totalElectricPower: 275, totalElectricPowerHigh: null, hydraulicOilTank: 1650, coolingWater: 240, machineWeight: "143(121+22)", machineDimension: "16 x 4.7 x 3.7" } }
        }
    },

    "DL2700A5 (S.F.)": {
        clamping: { clampingForce: "2700(26478)", moldOpeningForce: "203(1986)", tieBarDistance: "2180 x 1760", platenDimension: "3030 x 2610", maxMoldSize: null, rotaryTableSize: null, daylight: 3900, maxDaylight: null, minMoldHeight: 900, maxMoldHeight: 2000, ejectorForce: "67.8(664.9)", ejectorStroke: 350, dryCycleTime: 8.2, maxMoldWeight: "50/50/75" },
        units: {
            "IH21500 A(140mm)": { injection: { screwDiameter: 140, injPressureKgcm2: 1816, injPressureMpa: 178, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 11853, shotWeight: 10923, injRate: 1537, injRateOptional: null, screwStroke: 770, injSpeed: 100, injSpeedOptional: null, plasticizingCapacity: 850, screwRotationSpeed: 95 }, general: { motorCapacity: 165, motorCapacityOptional: null, heaterCapacity: 110, totalElectricPower: 275, totalElectricPowerHigh: null, hydraulicOilTank: 1650, coolingWater: 240, machineWeight: "143(121+22)", machineDimension: "16 x 4.7 x 3.7" } }
        }
    },

    "DL3000A5 (S.F.)": {
        clamping: { clampingForce: "3000(29420)", moldOpeningForce: "225(2206)", tieBarDistance: "2260 x 1810", platenDimension: "3140 x 2660", maxMoldSize: null, rotaryTableSize: null, daylight: 4000, maxDaylight: null, minMoldHeight: 1100, maxMoldHeight: 2000, ejectorForce: "67.8(664.9)", ejectorStroke: 350, dryCycleTime: 8.2, maxMoldWeight: "56/56/85" },
        units: {
            "IH33000 A(160mm)": { injection: { screwDiameter: 160, injPressureKgcm2: 1800, injPressureMpa: 177, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 16085, shotWeight: 14822, injRate: 1719, injRateOptional: null, screwStroke: 800, injSpeed: 85, injSpeedOptional: null, plasticizingCapacity: 1000, screwRotationSpeed: 78 }, general: { motorCapacity: 220, motorCapacityOptional: null, heaterCapacity: 209, totalElectricPower: 429, totalElectricPowerHigh: null, hydraulicOilTank: 2650, coolingWater: 240, machineWeight: "180(149+31)", machineDimension: "17.8 x 5 x 4" } }
        }
    },

    "DL3300A5 (S.F.)": {
        clamping: { clampingForce: "3300(32362)", moldOpeningForce: "248(2427)", tieBarDistance: "2260 x 1810", platenDimension: "3140 x 2660", maxMoldSize: null, rotaryTableSize: null, daylight: 4000, maxDaylight: null, minMoldHeight: 1100, maxMoldHeight: 2000, ejectorForce: "67.8(664.9)", ejectorStroke: 350, dryCycleTime: 8.2, maxMoldWeight: "56/56/85" },
        units: {
            "IH33000 A(160mm)": { injection: { screwDiameter: 160, injPressureKgcm2: 1800, injPressureMpa: 177, injHoldingPressureKgcm2: null, injHoldingPressureMpa: null, theoInjVolume: 16085, shotWeight: 14822, injRate: 1719, injRateOptional: null, screwStroke: 800, injSpeed: 85, injSpeedOptional: null, plasticizingCapacity: 1000, screwRotationSpeed: 78 }, general: { motorCapacity: 220, motorCapacityOptional: null, heaterCapacity: 209, totalElectricPower: 429, totalElectricPowerHigh: null, hydraulicOilTank: 2650, coolingWater: 240, machineWeight: "180(149+31)", machineDimension: "17.8 x 5 x 4" } }
        }
    }
};

// =====================================================================
// STAN KONFIGURATORA
// =====================================================================
//
// Jedna konfiguracja może zawierać wtryskarki RÓŻNYCH typów (np. DL-A5 i
// TE-A5). Każda maszyna w cfgMachines ma własne pole "type" i to WYŁĄCZNIE
// z niego biorą się jej dane techniczne (machineData / machineTechSpecs),
// wyposażenie standardowe i lista opcji dodatkowych (optionSets) - typy,
// specyfikacje i opcje nigdy się więc nie mieszają. Konfiguracja zapisuje
// się automatycznie w pamięci przeglądarki (saveConfiguration) i jest
// przywracana przy kolejnym wejściu na stronę (restoreSavedConfiguration).

let currentStep = 1;

// Typ, dla którego klient dobiera teraz maszyny w Kroku 2 (wybrany w Kroku 1).
// Maszyny innych typów dodane wcześniej zostają w konfiguracji bez zmian.
let selectedMachineType = 'DL-A5';

// Aktualnie widoczny "pod-widok" Kroku 2: 'tech' (jedno lub więcej "okien"
// kalkulatora danych technologicznych) albo 'list' (wybór z listy). Wybór
// sposobu doboru odbywa się w Kroku 1 (przyciski "Kalkulator" / "Wybierz
// z listy"). Obie ścieżki zapisują wybrane maszyny do WSPÓLNEJ listy
// cfgMachines (patrz niżej).
let step2SubView = 'tech';

// Typy maszyn widoczne w Kroku 1 (widok 360° + krótki opis), dla których
// dalsze kroki konfiguratora nie zostały jeszcze opracowane - zamiast przejścia
// do Kroku 2 pokazuje się informacja z kontaktem (showStep1OnlyNotice).
// Obecnie wszystkie typy mają pełne dane, więc lista jest pusta.
const CONFIGURATOR_STEP1_ONLY_TYPES = [];

// Wszystkie maszyny w konfiguracji (wszystkich typów). Jeden wpis = jeden
// model z agregatem wtryskowym i liczbą sztuk:
//   uid              - stały identyfikator (przyciski +/-, kosz, opcje)
//   type             - typ maszyny (klucz machineData / optionSets)
//   modelName, unitStr
//   qty              - liczba maszyn
//   source           - 'list' (wybór z listy) albo 'tech' (kalkulator)
//   techId           - numer okna kalkulatora (tylko source 'tech')
//   techInputs       - dane wpisane w oknie kalkulatora (do odtworzenia okna)
//   techResults      - wyniki obliczeń (Krok 4, PDF, e-mail) albo null
//   selectedOptions  - wybrane opcje dodatkowe (wyłącznie z optionSets[type])
//   detailsExpanded / optionsExpanded - stan rozwinięcia list na stronie
let cfgMachines = [];
let cfgUidCounter = 0;
let cfgTechCounter = 0;

// Maszyny wybrane do porównania (patrz js/configurator-compare.js) - zapisane
// jako trójki { type, modelName, unitStr }, więc można porównywać także
// maszyny spoza konfiguracji.
const COMPARE_MAX = 4;
let compareItems = [];

// -------------------- Pomocnicze: typy, modele, maszyny --------------------

// Model o danej nazwie WYŁĄCZNIE w obrębie danego typu (null, gdy nie należy do typu)
function findModel(type, modelName) {
    const typeData = machineData[type];
    if (!typeData) return null;
    return typeData.models.find(m => m.name === modelName) || null;
}

function getTypeLabel(type) {
    return machineData[type] ? machineData[type].label : type;
}

function getScrewDiameter(unitStr) {
    const m = String(unitStr).match(/\((\d+)\s*mm\)/i);
    return m ? `${m[1]} mm` : '–';
}

function getMachine(uid) {
    return cfgMachines.find(m => m.uid === uid) || null;
}

// Typy obecne w konfiguracji - zawsze w kolejności z machineData, żeby grupy
// w Kroku 3, Kroku 4, PDF i e-mailu miały stały porządek
function getConfigTypes() {
    return Object.keys(machineData).filter(type => cfgMachines.some(m => m.type === type));
}

function createMachine(type, modelName, unitStr, source, extra) {
    return Object.assign({
        uid: 'm' + (++cfgUidCounter),
        type,
        modelName,
        unitStr,
        qty: 1,
        source,
        techResults: null,
        selectedOptions: [],
        detailsExpanded: false,
        optionsExpanded: false
    }, extra || {});
}

// Odmiana polska: 1 wtryskarka, 2-4 wtryskarki, 5+ wtryskarek (12-14 jak 5+)
function plPlural(n, one, few, many) {
    if (n === 1) return one;
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
}

// Wspólne wywołanie po każdej zmianie konfiguracji: zapis w przeglądarce i
// odświeżenie panelu "Twoja konfiguracja" (oraz znaczników w Kroku 1)
function onConfigurationChanged() {
    saveConfiguration();
    renderConfigPanel();
}

// Lista materiałów jest wypełniana per "okno kalkulatora" dopiero przy jego
// utworzeniu (patrz populateMaterialSelect/addStep2TechBlock) - przy starcie
// strony żadne okno jeszcze nie istnieje (Krok 2 pokazuje się dopiero po
// wyborze sposobu doboru w Kroku 1).
document.addEventListener('DOMContentLoaded', function () {
    initMachineCardSelection();
    restoreSavedConfiguration();
    renderConfigPanel();
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

    radios.forEach(r => r.addEventListener('change', (e) => {
        updateSelection();
        // Wibracja przy wyborze rodzaju wtryskarki w Kroku 1 (patrz
        // triggerHapticFeedback na górze pliku) - tylko przy wyborze przez
        // klienta, nie przy przywracaniu zapisanej konfiguracji.
        if (e.isTrusted) triggerHapticFeedback(10);
    }));
    updateSelection();
}

// Karty typów w Kroku 1: znacznik, ile modeli danego typu jest już w konfiguracji
function updateStep1TypeBadges() {
    document.querySelectorAll('.machine-card input[name="machine_type"]').forEach(r => {
        const card = r.closest('.machine-card');
        const body = card && card.querySelector('.card-body');
        if (!body) return;
        const count = cfgMachines.filter(m => m.type === r.value).length;
        let badge = body.querySelector('.card-in-config');
        if (!count) {
            if (badge) badge.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'card-in-config';
            body.appendChild(badge);
        }
        badge.textContent = `W konfiguracji: ${count} ${plPlural(count, 'model', 'modele', 'modeli')}`;
    });
}

// Zaznacza typ w Kroku 1 (np. po przywróceniu zapisanej konfiguracji) - z
// odświeżeniem podświetlenia karty i widoku 360°
function setStep1Type(type) {
    const radio = document.querySelector(`.machine-card input[name="machine_type"][value="${type}"]`);
    if (!radio || radio.checked) return;
    radio.checked = true;
    radio.dispatchEvent(new Event('change', { bubbles: true }));
}

// -------------------- Krok 2: dobór wtryskarki (tech / lista) --------------------

// Pokazuje jeden z dwóch "pod-widoków" Kroku 2 dla aktualnego typu:
// formularz danych technologicznych ('tech') albo listę modeli ('list').
function showStep2SubView(view) {
    step2SubView = view;
    document.getElementById('step2TechPath').style.display = view === 'tech' ? '' : 'none';
    document.getElementById('step2ListPath').style.display = view === 'list' ? '' : 'none';

    // Nad listą / kalkulatorem zawsze widać, dla jakiego typu dobieramy maszyny
    document.querySelectorAll('.step2-type-label').forEach(el => {
        el.innerHTML = `Typ wtryskarki: <strong>${getTypeLabel(selectedMachineType)}</strong>`;
    });

    if (view === 'list') buildStep2List();
    if (view === 'tech') buildStep2TechPath();

    scrollToConfigurator();
}

// Przygotowanie Kroku 2 przy wejściu z Kroku 1 (dla nowo wybranego typu).
// Maszyny wybrane wcześniej - także innych typów - zostają w konfiguracji.
// `view` to sposób doboru wybrany przyciskiem w Kroku 1 ('tech' albo 'list').
function resetStep2ForType(view) {
    clearCalcError();

    const listErr = document.getElementById('step2ListError');
    if (listErr) { listErr.style.display = 'none'; listErr.textContent = ''; }

    const techNavErr = document.getElementById('step2TechNavError');
    if (techNavErr) { techNavErr.style.display = 'none'; techNavErr.textContent = ''; }

    showStep2SubView(view === 'list' ? 'list' : 'tech');
}

// Liczba pustych kart "Wybierz wtryskarkę z listy" w ścieżce "wybierz z
// listy" (tylko na stronie, nie w konfiguracji). Kolejny wybór z listy modeli
// trafia do pustej karty jako NOWA maszyna; gdy pustej karty nie ma, wybór
// zastępuje ostatnią maszynę aktualnego typu wybraną z listy - dodatkowe
// maszyny dodaje się przyciskiem "+ Dodaj kolejny model".
let step2ListPlaceholders = 0;

// Numery okien kalkulatora widocznych w ścieżce "dane technologiczne" (dla
// aktualnego typu). Numer jest nadawany raz, przy utworzeniu okna, i zapisany
// w maszynie (techId) - pola formularza danego okna mają id zakończone na
// "_t<numer>" (np. "mold_length_t3"), więc usunięcie jednego okna nie rusza
// danych wpisanych w pozostałych.
let step2TechBlockIds = [];

// Element wysuwanego menu agregatów jest jeden, współdzielony przez wszystkie
// wiersze listy - jego zawartość i pozycja są ustawiane dynamicznie przez
// openStep2UnitsFlyout(), w zależności od tego, nad którym paskiem modelu
// znajduje się aktualnie kursor / który pasek został kliknięty. Menu NIE
// znika samo przy zjechaniu kursorem - zamyka je dopiero wybór konkretnego
// agregatu (onStep2ListSelect) albo kliknięcie poza listą i poza menu.
let step2FlyoutOpenRow = null;

// Buduje listę wszystkich wtryskarek (model + średnica ślimaka) dla aktualnie
// wybranego typu (Krok 1). Każdy model (np. DL450A5) to jeden pasek -
// wszystkie jego agregaty wtryskowe są ukryte wewnątrz wspólnego, wysuwanego
// menu (patrz #step2UnitsFlyout / openStep2UnitsFlyout) i pokazują się po
// najechaniu myszką / kliknięciu paska.
function buildStep2List() {
    const itemsContainer = document.getElementById('step2ListItems');
    const specsContainer = document.getElementById('step2ListSpecs');
    if (!itemsContainer || !specsContainer) return;

    const typeData = machineData[selectedMachineType];
    if (!typeData) { itemsContainer.innerHTML = ''; return; }

    closeStep2UnitsFlyout();
    // Pusta karta na start tylko wtedy, gdy ten typ nie ma jeszcze maszyn
    step2ListPlaceholders = cfgMachines.some(m => m.type === selectedMachineType) ? 0 : 1;

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

// Dane modelu (siła zwarcia, agregaty itd.) w obrębie aktualnego typu (Krok 2)
function getStep2Model(modelName) {
    return findModel(selectedMachineType, modelName);
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
        const isSelected = cfgMachines.some(m => m.type === selectedMachineType && m.modelName === modelName && m.unitStr === unit);
        unitsHtml += `
            <button type="button" class="step2-list-unit-item${isSelected ? ' is-selected' : ''}"
                onclick="onStep2ListSelect('${modelName}', '${unit}')">
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

// Po kliknięciu konkretnego agregatu w wysuwanym menu: dodaje maszynę
// (aktualnego typu) do pustej karty albo zastępuje ostatnią maszynę tego
// typu wybraną z listy (patrz step2ListPlaceholders), zamyka menu i
// odświeża panel najważniejszych danych. Model i agregat są sprawdzane w
// obrębie typu, więc nie da się dodać modelu z innej serii.
function onStep2ListSelect(modelName, unitStr) {
    const type = selectedMachineType;
    const model = findModel(type, modelName);
    if (!model || !model.units.includes(unitStr)) return;

    const listOfType = cfgMachines.filter(m => m.type === type && m.source === 'list');
    if (step2ListPlaceholders > 0 || !listOfType.length) {
        cfgMachines.push(createMachine(type, modelName, unitStr, 'list'));
        if (step2ListPlaceholders > 0) step2ListPlaceholders--;
    } else {
        // Ten sam typ = ta sama lista opcji, więc wybrane opcje i liczba sztuk zostają
        const last = listOfType[listOfType.length - 1];
        last.modelName = modelName;
        last.unitStr = unitStr;
        last.detailsExpanded = false;
    }

    closeStep2UnitsFlyout();
    renderStep2Specs();

    const errEl = document.getElementById('step2ListError');
    if (errEl) { errEl.style.display = 'none'; errEl.textContent = ''; }
    onConfigurationChanged();
}

// Zmiana liczby maszyn (+/-), z dolnym limitem 1.
function changeMachineQty(uid, delta) {
    const m = getMachine(uid);
    if (!m) return;
    const current = parseInt(m.qty, 10) || 1;
    m.qty = Math.max(1, current + delta);
    syncMachineQtyInputs(uid);
    onConfigurationChanged();
}

// Ręczna edycja liczby maszyn w polu tekstowym - również z dolnym limitem 1.
function setMachineQty(uid, value) {
    const m = getMachine(uid);
    if (!m) return;
    let n = parseInt(value, 10);
    if (isNaN(n) || n < 1) n = 1;
    m.qty = n;
    syncMachineQtyInputs(uid);
    onConfigurationChanged();
}

// Po zmianie liczby sztuk aktualizujemy wyłącznie pola licznika tej maszyny -
// bez odtwarzania całej karty (inaczej rozwinięta pełna specyfikacja za
// każdym razem ponownie odtwarzała animację pojawiania się, a przyciski +/-
// traciły fokus).
function syncMachineQtyInputs(uid) {
    const m = getMachine(uid);
    if (!m) return;
    document.querySelectorAll(`.step2-qty-input[data-uid="${uid}"]`).forEach(input => {
        input.value = m.qty;
    });
}

// Przycisk "+ Dodaj kolejny model" - dodaje kolejną, pustą kartę; kolejny
// wybór z listy modeli trafi do niej jako nowa maszyna.
function addAnotherStep2Model() {
    step2ListPlaceholders++;
    renderStep2Specs();
}

function removeStep2Placeholder() {
    if (step2ListPlaceholders > 0) step2ListPlaceholders--;
    renderStep2Specs();
}

// Usuwa maszynę z konfiguracji (kosz w Kroku 2 lub 3). Maszyna z kalkulatora
// znika razem ze swoim oknem kalkulatora, jeśli jest akurat na stronie.
function removeMachine(uid) {
    const idx = cfgMachines.findIndex(m => m.uid === uid);
    if (idx === -1) return;
    const [removed] = cfgMachines.splice(idx, 1);

    if (removed.source === 'tech') {
        const pos = step2TechBlockIds.indexOf(removed.techId);
        if (pos !== -1) {
            step2TechBlockIds.splice(pos, 1);
            const blockEl = document.querySelector(`.step2-tech-block[data-tech-id="${removed.techId}"]`);
            if (blockEl) blockEl.remove();
        }
    }

    // Panel Kroku 2 nigdy nie zostaje zupełnie pusty
    if (removed.type === selectedMachineType && !cfgMachines.some(m => m.type === selectedMachineType)) {
        if (step2SubView === 'list' && step2ListPlaceholders === 0) step2ListPlaceholders = 1;
        if (step2SubView === 'tech' && step2TechBlockIds.length === 0 && document.getElementById('step2TechBlocks')) addStep2TechBlock();
    }

    renderStep2Specs();
    onConfigurationChanged();
}

// Rozwija/zwija pełną specyfikację techniczną (3 kolumny: Wtrysk/Zwarcie/
// Ogólne) pod podstawowymi danymi danej maszyny. Domyślnie zwinięta.
// Animację pojawiania się (.is-entering) dostaje tylko właśnie rozwinięta
// specyfikacja - przy innych odświeżeniach kart pojawia się od razu.
let step2DetailsEnterUid = null;

function toggleMachineDetails(uid) {
    const m = getMachine(uid);
    if (!m) return;
    m.detailsExpanded = !m.detailsExpanded;
    step2DetailsEnterUid = m.detailsExpanded ? uid : null;
    renderStep2Specs();
    step2DetailsEnterUid = null;
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
    if (!m) {
        // sama wartość w tonach (np. siła wyrzutnika NC-G5 w katalogu MULTI)
        return /^[\d.]+$/.test(String(value)) ? `${value} T` : value;
    }
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

// Wiersze pełnej specyfikacji technicznej - WSPÓLNE dla karty maszyny w
// Kroku 2 (renderStep2TechColumns) i tabeli porównania maszyn
// (js/configurator-compare.js), żeby oba widoki pokazywały te same dane w
// tym samym formacie. value(g) zwraca gotowy tekst albo null, gdy dana seria
// nie ma tego parametru (null w machineTechSpecs) - taki wiersz jest pomijany.
const TECH_SPEC_SECTIONS = [
    ['injection', 'Wtrysk'],
    ['clamping', 'Zwarcie'],
    ['general', 'Ogólne']
];

const withUnit = (value, unit) => (value != null ? `${value} ${unit}` : null);
const withOptional = (value, optional, optLabel, unit) =>
    (value != null ? `${value}${optional != null ? ` / ${optional} ${optLabel}` : ''} ${unit}` : null);

const TECH_SPEC_ROWS = [
    { section: 'injection', label: 'Średnica ślimaka', value: g => withUnit(g('injection', 'screwDiameter'), 'mm') },
    { section: 'injection', label: 'Ciśnienie wtrysku', value: g => withUnit(g('injection', 'injPressureMpa'), 'MPa') },
    { section: 'injection', label: 'Ciśnienie docisku', value: g => withUnit(g('injection', 'injHoldingPressureMpa'), 'MPa') },
    { section: 'injection', label: 'Teoret. objętość wtrysku', value: g => withUnit(g('injection', 'theoInjVolume'), 'cm³') },
    { section: 'injection', label: 'Masa wtrysku (PS)', value: g => withUnit(g('injection', 'shotWeight'), 'g') },
    { section: 'injection', label: 'Prędkość wtrysku', value: g => withOptional(g('injection', 'injRate'), g('injection', 'injRateOptional'), '(opc.)', 'cm³/s') },
    { section: 'injection', label: 'Skok ślimaka', value: g => withUnit(g('injection', 'screwStroke'), 'mm') },
    { section: 'injection', label: 'Prędkość wtrysku (liniowa)', value: g => withOptional(g('injection', 'injSpeed'), g('injection', 'injSpeedOptional'), '(opc.)', 'mm/s') },
    { section: 'injection', label: 'Wydajność plastyfikacji', value: g => withUnit(g('injection', 'plasticizingCapacity'), 'kg/h') },
    { section: 'injection', label: 'Obroty ślimaka', value: g => withUnit(g('injection', 'screwRotationSpeed'), 'obr/min') },

    { section: 'clamping', label: 'Siła zwarcia', value: g => formatTonKn(g('clamping', 'clampingForce')) },
    { section: 'clamping', label: 'Siła otwierania formy', value: g => formatTonKn(g('clamping', 'moldOpeningForce')) },
    { section: 'clamping', label: 'Prześwit między kolumnami', value: g => withUnit(g('clamping', 'tieBarDistance'), 'mm') },
    { section: 'clamping', label: 'Wymiar płyty', value: g => withUnit(g('clamping', 'platenDimension'), 'mm') },
    { section: 'clamping', label: 'Maks. wymiar formy', value: g => withUnit(g('clamping', 'maxMoldSize'), 'mm') },
    { section: 'clamping', label: 'Średnica stołu obrotowego', value: g => { const v = g('clamping', 'rotaryTableSize'); return v != null ? `Ø ${v} mm` : null; } },
    { section: 'clamping', label: 'Droga otwarcia', value: g => withUnit(g('clamping', 'daylight'), 'mm') },
    { section: 'clamping', label: 'Maks. odstęp między płytami', value: g => withUnit(g('clamping', 'maxDaylight'), 'mm') },
    { section: 'clamping', label: 'Min. wysokość formy', value: g => withUnit(g('clamping', 'minMoldHeight'), 'mm') },
    { section: 'clamping', label: 'Maks. wysokość formy', value: g => withUnit(g('clamping', 'maxMoldHeight'), 'mm') },
    { section: 'clamping', label: 'Siła wyrzutnika', value: g => formatTonKn(g('clamping', 'ejectorForce')) },
    { section: 'clamping', label: 'Skok wyrzutnika', value: g => withUnit(g('clamping', 'ejectorStroke'), 'mm') },
    { section: 'clamping', label: 'Czas cyklu suchego', value: g => withUnit(g('clamping', 'dryCycleTime'), 's') },
    { section: 'clamping', label: 'Maks. masa formy', value: g => withUnit(g('clamping', 'maxMoldWeight'), 't') },

    { section: 'general', label: 'Moc silnika', value: g => withOptional(g('general', 'motorCapacity'), g('general', 'motorCapacityOptional'), '(opc.)', 'kW') },
    { section: 'general', label: 'Moc grzałek', value: g => withUnit(g('general', 'heaterCapacity'), 'kW') },
    { section: 'general', label: 'Całkowita moc elektryczna', value: g => withOptional(g('general', 'totalElectricPower'), g('general', 'totalElectricPowerHigh'), '(High)', 'kW') },
    { section: 'general', label: 'Zbiornik oleju hydraulicznego', value: g => withUnit(g('general', 'hydraulicOilTank'), 'l') },
    { section: 'general', label: 'Zużycie wody chłodzącej', value: g => withUnit(g('general', 'coolingWater'), 'l/min') },
    { section: 'general', label: 'Masa maszyny', value: g => withUnit(g('general', 'machineWeight'), 't') },
    { section: 'general', label: 'Wymiary maszyny', value: g => withUnit(g('general', 'machineDimension'), 'm') }
];

// Wartość jednego wiersza specyfikacji dla maszyny danego typu - null, gdy
// model nie należy do typu albo seria nie ma tego parametru
function getTechRowValue(row, type, modelName, unitStr) {
    if (!findModel(type, modelName)) return null;
    return row.value((section, field) => getTechField(modelName, unitStr, section, field));
}

// Buduje znacznik 3 kolumn (Wtrysk / Zwarcie / Ogólne) z pełnymi danymi
// technologicznymi dla wybranej pary model+agregat danego typu, pomijając
// wiersze, których dana seria maszyn nie posiada. Zwraca null, gdy danych brak.
function renderStep2TechColumns(type, modelName, unitStr, animate) {
    if (!findModel(type, modelName) || !machineTechSpecs[modelName] || !machineTechSpecs[modelName].units[unitStr]) return null;

    const col = (section, title) => {
        const rows = TECH_SPEC_ROWS
            .filter(row => row.section === section)
            .map(row => [row.label, getTechRowValue(row, type, modelName, unitStr)])
            .filter(([, value]) => value != null);
        return `
                    <div class="step2-tech-col">
                        <h4 class="step2-tech-col-title">${title}</h4>
                        <ul class="step2-tech-list">
                            ${rows.map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join('')}
                        </ul>
                    </div>`;
    };

    return `
                <div class="step2-tech-grid${animate ? ' is-entering' : ''}">
                    ${TECH_SPEC_SECTIONS.map(([section, title]) => col(section, title)).join('')}
                </div>`;
}

const TRASH_ICON_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 20 7"></polyline><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"></path><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"></path></svg>';

// Wnętrze karty z danymi jednej maszyny (nazwa modelu, typ, licznik sztuk,
// najważniejsze parametry, przycisk porównania i pełnej specyfikacji) -
// wspólne dla ścieżki "wybierz z listy" (karty po prawej stronie) i
// kalkulatora (karta w oknie kalkulatora, bez kosza - tam usuwa się całe okno).
function machineSpecCardInnerHtml(m, removable) {
    const model = findModel(m.type, m.modelName);
    if (!model) return '';
    const agregat = formatStep2AgregatLabel(m.unitStr);
    const hasSpecs = machineTechSpecs[m.modelName] && machineTechSpecs[m.modelName].units[m.unitStr];
    const inCompare = isInCompare(m.type, m.modelName, m.unitStr);

    return `
        <div class="step2-spec-card-header">
            <div class="step2-spec-card-titles">
                <h3>${m.modelName}</h3>
                <p class="step2-list-specs-sub">${getTypeLabel(m.type)} — ${agregat}</p>
            </div>
            <div class="step2-qty-stepper">
                <button type="button" class="step2-qty-btn" onclick="changeMachineQty('${m.uid}', -1)" aria-label="Zmniejsz liczbę maszyn">−</button>
                <input type="text" inputmode="numeric" class="step2-qty-input" data-uid="${m.uid}" value="${m.qty}" onchange="setMachineQty('${m.uid}', this.value)" aria-label="Liczba maszyn">
                <button type="button" class="step2-qty-btn" onclick="changeMachineQty('${m.uid}', 1)" aria-label="Zwiększ liczbę maszyn">+</button>
                ${removable ? `<button type="button" class="step2-remove-btn" onclick="removeMachine('${m.uid}')" aria-label="Usuń tę maszynę z konfiguracji" title="Usuń tę maszynę z konfiguracji">${TRASH_ICON_SVG}</button>` : ''}
            </div>
        </div>
        <ul class="step2-list-specs-table">
            <li><span>Siła zwarcia</span><strong>${model.force} ton</strong></li>
            <li><span>Agregat wtryskowy</span><strong>${agregat}</strong></li>
            <li><span>Średnica ślimaka</span><strong>${getScrewDiameter(m.unitStr)}</strong></li>
            ${model.tieBar ? `<li><span>Prześwit między kolumnami</span><strong>${model.tieBar} mm</strong></li>` : ''}
            <li><span>Min. wysokość formy</span><strong>${model.minH} mm</strong></li>
            ${model.maxH ? `<li><span>Maks. wysokość formy</span><strong>${model.maxH} mm</strong></li>` : ''}
        </ul>
        <div class="step2-card-tools">
            <button type="button" class="cfg-compare-toggle${inCompare ? ' is-active' : ''}" onclick="toggleCompareMachine('${m.uid}')" aria-pressed="${inCompare ? 'true' : 'false'}">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M17 4v16M3 8h8M13 16h8"/></svg>
                <span>${inCompare ? 'W porównaniu' : 'Dodaj do porównania'}</span>
            </button>
        </div>
        ${hasSpecs ? `
        <button type="button" class="step2-details-toggle${m.detailsExpanded ? ' is-expanded' : ''}" onclick="toggleMachineDetails('${m.uid}')" aria-expanded="${m.detailsExpanded ? 'true' : 'false'}">
            <span>${m.detailsExpanded ? 'Ukryj pełną specyfikację techniczną' : 'Pokaż pełną specyfikację techniczną'}</span>
            <svg class="step2-details-toggle-arrow" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><polygon points="0,0 12,0 6,8" fill="currentColor"></polygon></svg>
        </button>
        ${m.detailsExpanded ? (renderStep2TechColumns(m.type, m.modelName, m.unitStr, m.uid === step2DetailsEnterUid) || '') : ''}` : ''}
    `;
}

// Odtwarza karty z danymi maszyn w Kroku 2. Ścieżka "wybierz z listy" -
// panel po prawej (#step2ListSpecs): maszyny AKTUALNEGO typu + puste karty
// + przycisk "+ Dodaj kolejny model". Ścieżka "dane technologiczne" - karta
// w każdym oknie kalkulatora (renderStep2TechInlineSpec).
function renderStep2Specs() {
    if (step2SubView === 'tech') {
        step2TechBlockIds.forEach(techId => renderStep2TechInlineSpec(techId));
        return;
    }

    const specsContainer = document.getElementById('step2ListSpecs');
    if (!specsContainer) return;

    const machines = cfgMachines.filter(m => m.type === selectedMachineType);
    const placeholderText = 'Wybierz wtryskarkę z listy<span class="step2-desktop-only-text"> po lewej</span>, aby zobaczyć jej najważniejsze dane.';

    let html = machines.map(m => `
            <div class="step2-spec-card" data-uid="${m.uid}">${machineSpecCardInnerHtml(m, true)}</div>`).join('');

    for (let p = 0; p < step2ListPlaceholders; p++) {
        // Kosz na pustej karcie, o ile nie jest to jedyne pole w panelu
        const removable = machines.length > 0 || p > 0;
        html += `
            <div class="step2-spec-card is-placeholder">
                ${removable ? `
                <div class="step2-placeholder-header">
                    <button type="button" class="step2-remove-btn" onclick="removeStep2Placeholder()" aria-label="Usuń to pole" title="Usuń to pole">${TRASH_ICON_SVG}</button>
                </div>` : ''}
                <p class="step2-list-specs-placeholder">${placeholderText}</p>
            </div>`;
    }

    html += `
        <button type="button" class="step2-add-model-btn" onclick="addAnotherStep2Model()">
            <span class="pulse-plus">+</span> Dodaj kolejny model
        </button>`;

    specsContainer.innerHTML = html;

    document.querySelectorAll('.step2-list-model-row').forEach(row => {
        row.classList.toggle('has-selected', machines.some(m => m.modelName === row.dataset.model));
    });
}

// Wypełnia kartę z danymi maszyny w obrębie danego okna kalkulatora -
// #techInlineSpec_t{techId}, obok "Wyniki obliczeń technologicznych".
// Karta nie ma kosza - maszynę z kalkulatora usuwa się koszem całego okna.
function renderStep2TechInlineSpec(techId) {
    const card = document.getElementById('techInlineSpec_t' + techId);
    if (!card) return;
    const m = getTechMachine(techId);
    card.innerHTML = m ? machineSpecCardInnerHtml(m, false) : '';
}

// -------------------- Nawigacja między krokami --------------------

function nextStep(step, targetView) {
    if (step < 1 || step > 4) return;

    if (currentStep === 1 && step === 2) {
        const radios = document.getElementsByName('machine_type');
        for (const r of radios) {
            if (r.checked) selectedMachineType = r.value;
        }
        if (CONFIGURATOR_STEP1_ONLY_TYPES.includes(selectedMachineType)) {
            showStep1OnlyNotice(selectedMachineType);
            return;
        }
        hideStep1OnlyNotice();
        resetStep2ForType(targetView);
    } else if (step === 2 && currentStep > 2) {
        // Powrót z Kroku 3/4: Krok 2 aktualnego typu budowany od nowa z
        // konfiguracji (w Kroku 3 można było usunąć maszynę lub zmienić ilość)
        showStep2SubView(step2SubView);
    }

    // Do Kroku 3 i 4 wystarczy przynajmniej jedna maszyna w konfiguracji
    // (dowolnego typu, z kalkulatora albo z listy).
    if (step >= 3 && !cfgMachines.length) {
        if (step2SubView === 'list') {
            const errEl = document.getElementById('step2ListError');
            if (errEl) { errEl.textContent = 'Wybierz wtryskarkę z listy, aby przejść dalej.'; errEl.style.display = 'block'; }
        } else {
            showCalcError('Najpierw kliknij przycisk „DOBIERZ WTRYSKARKĘ” i wybierz rozmiar agregatu wtryskowego, aby przejść dalej.', 'step2TechNavError');
        }
        return;
    }

    hideResumeNotice();
    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep = step;
    const stepEl = document.getElementById(`step${currentStep}`);
    stepEl.classList.add('active');
    scrollToConfigurator();

    updateCfgStepper();

    if (currentStep === 3) populateStep3();
    if (currentStep === 4) { populateStep4Summary(); initConfigRecaptcha(); }
    onConfigurationChanged();
}

// Przewija do początku konfiguratora (z uwzględnieniem stałego nagłówka)
function scrollToConfigurator() {
    const container = document.querySelector('.configurator-container');
    if (!container) return;
    const header = document.querySelector('.site-header');
    const offset = (header ? header.offsetHeight : 70) + 16;
    const top = container.getBoundingClientRect().top + window.scrollY - offset;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
}

// Wskaźnik kroków nad konfiguratorem + pasek postępu
function updateCfgStepper() {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.width = `${(currentStep / 4) * 100}%`;
    document.querySelectorAll('#cfgStepper li').forEach(li => {
        const n = parseInt(li.dataset.step, 10);
        li.classList.toggle('is-active', n === currentStep);
        li.classList.toggle('is-done', n < currentStep);
        if (n === currentStep) li.setAttribute('aria-current', 'step');
        else li.removeAttribute('aria-current');
    });
    // Ponowne odtworzenie animacji wejścia treści kroku
    const stepEl = document.getElementById(`step${currentStep}`);
    if (stepEl) {
        stepEl.classList.remove('is-entering');
        void stepEl.offsetWidth;
        stepEl.classList.add('is-entering');
    }
}

// Serie bez doboru online (VHA-RS, MULTI, Super-Foam) - zamiast "martwego"
// przycisku pokazujemy informację z kontaktem do przedstawiciela.
function showStep1OnlyNotice(typeName) {
    const el = document.getElementById('step1Notice');
    if (!el) return;
    el.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/></svg>
        <div>
            <strong>Dobór online dla serii ${typeName} jest w przygotowaniu.</strong>
            <p>Skontaktuj się z naszym przedstawicielem — pomożemy dobrać model i wyposażenie do Twojej produkcji.</p>
            <div class="cfg-notice-actions">
                <a class="btn btn--dark btn--sm" href="kontakt.html">Formularz kontaktowy</a>
                <a class="btn btn--outline btn--sm" href="tel:+48573288069">+48 573 288 069</a>
            </div>
        </div>`;
    el.hidden = false;
    el.classList.remove('is-shaking');
    void el.offsetWidth;
    el.classList.add('is-shaking');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideStep1OnlyNotice() {
    const el = document.getElementById('step1Notice');
    if (el) el.hidden = true;
}

document.addEventListener('change', function (e) {
    if (e.target && e.target.name === 'machine_type') hideStep1OnlyNotice();
});

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
// każda ma WŁASNE "okno kalkulatora" (własny formularz + własny wynik).
// Okno należy do typu, dla którego zostało utworzone (data-type), a
// maszyna z niego zapisuje numer okna (techId) i wpisane dane (techInputs),
// dzięki czemu po powrocie do Kroku 2 lub do strony okna są odtwarzane.

// Maszyna dobrana w danym oknie kalkulatora (null, gdy jeszcze nie dobrano)
function getTechMachine(techId) {
    return cfgMachines.find(m => m.source === 'tech' && m.techId === techId) || null;
}

// Buduje ścieżkę "dane technologiczne" dla aktualnego typu: odtwarza okna
// maszyn tego typu dobranych wcześniej kalkulatorem albo tworzy jedno puste.
function buildStep2TechPath() {
    const container = document.getElementById('step2TechBlocks');
    if (!container) return;

    step2TechBlockIds = [];
    container.innerHTML = '';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'step2-add-model-btn';
    addBtn.onclick = () => addStep2TechBlock();
    addBtn.innerHTML = '<span class="pulse-plus">+</span> Dodaj kolejny model';
    container.appendChild(addBtn);

    const techMachines = cfgMachines.filter(m => m.type === selectedMachineType && m.source === 'tech');
    if (techMachines.length) techMachines.forEach(m => addStep2TechBlock(m));
    else addStep2TechBlock();
}

// Przycisk "+ Dodaj kolejny model" (pod obliczeniami) - dokłada kolejne,
// puste okno kalkulatora tuż przed samym przyciskiem (który zawsze zostaje
// na końcu), nie ruszając istniejących okien (i wpisanych już w nich danych).
// Z argumentem `machine` - odtwarza okno zapisanej maszyny (dane + wynik).
function addStep2TechBlock(machine) {
    const container = document.getElementById('step2TechBlocks');
    if (!container) return;

    const id = machine ? machine.techId : cfgTechCounter++;
    const showTrash = step2TechBlockIds.length > 0;
    step2TechBlockIds.push(id);

    const wrapper = document.createElement('div');
    wrapper.className = 'step2-tech-block';
    wrapper.dataset.techId = id;
    wrapper.dataset.type = selectedMachineType;
    wrapper.innerHTML = renderStep2TechBlockHtml(id, showTrash);

    const addBtn = container.querySelector('.step2-add-model-btn');
    if (addBtn) {
        container.insertBefore(wrapper, addBtn);
    } else {
        container.appendChild(wrapper);
    }

    populateMaterialSelect(id);
    if (machine && machine.techInputs) {
        restoreTechInputs(id, machine.techInputs);
        calculateAndShowModels(id, machine);
    }
    renderStep2Specs();
}

// Kosz w nagłówku okna - usuwa całe okno kalkulatora wraz z maszyną dobraną
// w nim (jeśli już była). Pozostałe okna (i wpisane w nich dane) zostają.
function removeStep2TechBlock(techId) {
    const pos = step2TechBlockIds.indexOf(techId);
    if (pos === -1) return;

    step2TechBlockIds.splice(pos, 1);
    const blockEl = document.querySelector(`.step2-tech-block[data-tech-id="${techId}"]`);
    if (blockEl) blockEl.remove();

    const idx = cfgMachines.findIndex(m => m.source === 'tech' && m.techId === techId);
    if (idx !== -1) cfgMachines.splice(idx, 1);

    renderStep2Specs();
    onConfigurationChanged();
}

// Znacznik jednego okna kalkulatora - formularz (Wymiary formy / Wymiary
// wypraski / Materiał) z polami zaindeksowanymi numerem okna, plus wynik:
// "Sugerowany model" (dobrany automatycznie) i wybór rozmiaru agregatu
// wtryskowego - WYŁĄCZNIE spośród agregatów tego jednego, sugerowanego modelu.
function renderStep2TechBlockHtml(id, showTrash) {
    const trashBtn = showTrash ? `
        <button type="button" class="step2-remove-btn" onclick="removeStep2TechBlock(${id})" aria-label="Usuń tę maszynę" title="Usuń tę maszynę">${TRASH_ICON_SVG}</button>` : '';

    // Pole prześwitu między kolumnami tylko dla typów, w których katalog go
    // podaje (bez TL-A5 - konstrukcja bezkolumnowa - i VHA-RS - stół obrotowy).
    const typeData = machineData[selectedMachineType];
    const tieBarField = !typeData || typeData.hasTieBar ? `
                <div class="form-group">
                    <label for="tie_bar_clearance_t${id}">Wymagany prześwit między kolumnami [mm] <span class="required-star">*</span></label>
                    <input type="number" id="tie_bar_clearance_t${id}" min="0" placeholder="np. 620">
                </div>` : '';

    return `
        <div class="step2-tech-block-header">
            <h3>Dane technologiczne</h3>
            ${trashBtn}
        </div>

        <div class="form-grid">

            <div class="form-section">
                <h3>Wymiary formy</h3>
                <div class="form-group">
                    <label for="mold_length_t${id}">Długość formy [mm]</label>
                    <input type="number" id="mold_length_t${id}" min="0" placeholder="np. 400">
                </div>
                <div class="form-group">
                    <label for="mold_width_t${id}">Szerokość formy [mm]</label>
                    <input type="number" id="mold_width_t${id}" min="0" placeholder="np. 350">
                </div>${tieBarField}
                <div class="form-group">
                    <label for="mold_height_t${id}">Wysokość (grubość) formy [mm] <span class="opt-label">(opcjonalnie)</span></label>
                    <input type="number" id="mold_height_t${id}" min="0" placeholder="np. 500">
                </div>
                <div class="form-group">
                    <label for="cavities_t${id}">Liczba gniazd formy (wyprasek na cykl) <span class="required-star">*</span></label>
                    <input type="number" id="cavities_t${id}" min="1" step="1" value="1">
                </div>
            </div>

            <div class="form-section">
                <h3>Wymiary wypraski</h3>
                <div class="form-group">
                    <label for="part_weight_t${id}">Masa detalu m [g] <span class="required-star">*</span></label>
                    <input type="number" id="part_weight_t${id}" min="0" step="0.01" placeholder="np. 25">
                </div>
                <div class="form-group">
                    <label for="part_surface_t${id}">Powierzchnia wypraski F [cm²] <span class="required-star">*</span></label>
                    <input type="number" id="part_surface_t${id}" min="0" step="0.1" placeholder="np. 45">
                </div>
                <div class="form-group">
                    <label for="wall_thickness_t${id}">Grubość ścianki [mm] <span class="opt-label">(opcjonalnie)</span></label>
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
                    <label for="material_select_t${id}">Rodzaj tworzywa <span class="required-star">*</span></label>
                    <select id="material_select_t${id}" onchange="handleMaterialChange(${id})"></select>
                </div>
                <div class="form-group density-row">
                    <label for="density_value_t${id}">Gęstość wybranego tworzywa [g/cm³]</label>
                    <div class="density-row-inner">
                        <input type="number" step="0.01" id="density_value_t${id}" readonly>
                        <button type="button" class="btn-secondary btn-small" id="toggleCustomDensityBtn_t${id}" onclick="toggleCustomDensity(${id})">Inna gęstość</button>
                    </div>
                </div>
                <div class="form-group" id="custom_density_group_t${id}" style="display:none;">
                    <label for="custom_density_t${id}">Własna gęstość [g/cm³]</label>
                    <input type="number" step="0.01" id="custom_density_t${id}" placeholder="np. 1.15">
                </div>
                <div class="form-group">
                    <label for="k_factor_t${id}">Współczynnik ciśnienia w gnieździe formy k <span class="opt-label">(×100 kg/cm², typowo 3–8)</span></label>
                    <input type="number" id="k_factor_t${id}" value="6" min="1" max="12" step="0.5">
                </div>
            </div>

        </div>

        <div class="action-calc-bar">
            <button type="button" class="btn-primary btn-wave" onclick="calculateAndShowModels(${id})"><span class="btn-wave-label">DOBIERZ WTRYSKARKĘ</span></button>
        </div>

        <div id="calcError_t${id}" class="calc-error" style="display:none;"></div>

        <!-- Wyniki obliczeń (po lewej) i karta z danymi wybranej maszyny
             (po prawej) - w jednym wierszu, w obrębie tego samego okna
             kalkulatora, pokazywane/ukrywane razem. -->
        <div class="step2-tech-results-row" id="resultsSection_t${id}" style="display:none;">
            <div class="results-box">
                <div class="step2-suggested-model step2-suggested-model-top">
                    <span class="step2-suggested-model-label">Sugerowany model:</span>
                    <strong class="step2-suggested-model-name" id="suggestedModelName_t${id}">–</strong>
                </div>
                <div class="form-group">
                    <label for="selected_agregat_t${id}">Wybierz rozmiar agregatu wtryskowego</label>
                    <select id="selected_agregat_t${id}" class="large-select" onchange="onTechAgregatChange(${id}, this.value)"></select>
                    <p class="calc-shot-info" id="shotInfo_t${id}"></p>
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

// Dane wpisane w oknie kalkulatora - zapisywane w maszynie (techInputs),
// żeby po powrocie do Kroku 2 lub do strony okno wyglądało tak samo
const TECH_INPUT_FIELDS = ['mold_length', 'mold_width', 'tie_bar_clearance', 'mold_height', 'cavities', 'part_weight', 'part_surface', 'wall_thickness', 'custom_density', 'k_factor'];

function readTechInputs(id) {
    const inputs = {};
    TECH_INPUT_FIELDS.forEach(name => {
        const el = document.getElementById(`${name}_t${id}`);
        if (el) inputs[name] = el.value;
    });
    ['has_fillets', 'has_ribs'].forEach(name => {
        const el = document.getElementById(`${name}_t${id}`);
        inputs[name] = !!(el && el.checked);
    });
    const sel = document.getElementById('material_select_t' + id);
    inputs.material = sel && sel.selectedOptions[0] ? sel.selectedOptions[0].textContent : '';
    const customGroup = document.getElementById('custom_density_group_t' + id);
    inputs.customDensityOn = !!customGroup && customGroup.style.display === 'block';
    return inputs;
}

function restoreTechInputs(id, inputs) {
    if (!inputs || typeof inputs !== 'object') return;
    TECH_INPUT_FIELDS.forEach(name => {
        const el = document.getElementById(`${name}_t${id}`);
        if (el && typeof inputs[name] === 'string') el.value = inputs[name];
    });
    ['has_fillets', 'has_ribs'].forEach(name => {
        const el = document.getElementById(`${name}_t${id}`);
        if (el) el.checked = !!inputs[name];
    });
    const sel = document.getElementById('material_select_t' + id);
    if (sel && inputs.material) {
        const opt = Array.from(sel.options).find(o => o.textContent === inputs.material);
        if (opt) sel.value = opt.value;
        handleMaterialChange(id);
    }
    if (inputs.customDensityOn) {
        const group = document.getElementById('custom_density_group_t' + id);
        const btn = document.getElementById('toggleCustomDensityBtn_t' + id);
        if (group) group.style.display = 'block';
        if (btn) btn.textContent = 'Użyj gęstości z listy';
    }
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
// należące do tego jednego modelu.

// Dopasowanie dawki do agregatu. Droga dozowania potrzebna do zgromadzenia
// dawki V [cm³] przed ślimakiem o średnicy D [mm]: s = V·1000 / (π·D²/4) [mm].
// Katalogi WOOJIN PLAIMM zalecają drogę dozowania 1–3 średnic ślimaka
// ("metering distance ... 1 to 3 times of screw diameter"), a dawka nie może
// przekraczać teoretycznej objętości wtrysku agregatu.
function getShotFit(modelName, unitStr, shotVolume) {
    const spec = machineTechSpecs[modelName] && machineTechSpecs[modelName].units[unitStr];
    if (!spec) return null;
    const d = spec.injection.screwDiameter;
    const maxVol = spec.injection.theoInjVolume;
    const stroke = shotVolume * 1000 / (Math.PI * d * d / 4);
    const ratio = stroke / d;
    const fits = shotVolume <= maxVol;
    return { d, maxVol, stroke, ratio, fits, recommended: fits && ratio >= 1 && ratio <= 3 };
}

// Opis dopasowania dawki do aktualnie wybranego agregatu (pod listą agregatów)
function renderShotInfo(techId) {
    const el = document.getElementById('shotInfo_t' + techId);
    const m = getTechMachine(techId);
    if (!el) return;
    if (!m || !m.techResults) { el.innerHTML = ''; return; }
    const fit = getShotFit(m.modelName, m.unitStr, m.techResults.totalVwtr);
    if (!fit) { el.innerHTML = ''; return; }
    const ratio = fit.ratio.toFixed(1);
    let status;
    if (!fit.fits) status = `<span class="calc-shot-bad">dawka większa niż teoretyczna objętość wtrysku agregatu</span>`;
    else if (fit.ratio < 1) status = `<span class="calc-shot-warn">poniżej zalecanego zakresu 1–3 × D (agregat przewymiarowany)</span>`;
    else if (fit.ratio > 3) status = `<span class="calc-shot-warn">powyżej zalecanego zakresu 1–3 × D</span>`;
    else status = `<span class="calc-shot-ok">w zalecanym zakresie 1–3 × D</span>`;
    el.innerHTML = `Teoretyczna objętość wtrysku: <strong>${fit.maxVol} cm³</strong> · droga dozowania dla dawki ${m.techResults.totalVwtr.toFixed(1)} cm³: <strong>${Math.round(fit.stroke)} mm = ${ratio} × D</strong> — ${status}`;
}

// `restoreMachine` - przy odtwarzaniu zapisanego okna: ten sam wynik, z
// zachowaniem agregatu wybranego wcześniej przez klienta (jeśli nadal pasuje).
function calculateAndShowModels(id, restoreMachine) {
    clearCalcError('calcError_t' + id);

    // Typ okna kalkulatora - ten, dla którego okno zostało utworzone
    const blockEl = document.querySelector(`.step2-tech-block[data-tech-id="${id}"]`);
    const type = blockEl && machineData[blockEl.dataset.type] ? blockEl.dataset.type : selectedMachineType;
    const typeData = machineData[type];

    const cavitiesRaw = parseFloat(document.getElementById('cavities_t' + id).value);
    const cavities = Number.isInteger(cavitiesRaw) ? cavitiesRaw : 0;
    const partWeight = parseFloat(document.getElementById('part_weight_t' + id).value) || 0; // g
    const partSurface = parseFloat(document.getElementById('part_surface_t' + id).value) || 0; // cm2
    // Typy bez prześwitu między kolumnami w katalogu (TL-A5, VHA-RS) nie mają tego pola
    const tieInput = document.getElementById('tie_bar_clearance_t' + id);
    const tieClearance = tieInput ? (parseFloat(tieInput.value) || 0) : 0; // mm
    const moldHeight = parseFloat(document.getElementById('mold_height_t' + id).value) || 0; // mm (opcjonalne)
    const kFactor = parseFloat(document.getElementById('k_factor_t' + id).value); // x100 kg/cm2
    const density = getSelectedDensity(id); // g/cm3

    const failCalc = (msg) => {
        showCalcError(msg, 'calcError_t' + id);
        const resultsEl = document.getElementById('resultsSection_t' + id);
        if (resultsEl) resultsEl.style.display = 'none';
    };
    if (!(cavitiesRaw > 0) || partWeight <= 0 || partSurface <= 0 || (tieInput && tieClearance <= 0)) {
        failCalc(tieInput
            ? 'Uzupełnij wymagane pola oznaczone gwiazdką (*): liczba gniazd, masa i powierzchnia wypraski oraz wymagany prześwit między kolumnami.'
            : 'Uzupełnij wymagane pola oznaczone gwiazdką (*): liczba gniazd oraz masa i powierzchnia wypraski.');
        return;
    }
    if (cavities < 1) {
        failCalc('Liczba gniazd formy musi być liczbą całkowitą (1, 2, 3…).');
        return;
    }
    if (isNaN(kFactor) || kFactor < 1 || kFactor > 12) {
        failCalc('Współczynnik ciśnienia w gnieździe formy k musi mieścić się w zakresie 1–12 (typowo 3–8).');
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

    // ---- Dobór modelu (wyłącznie spośród modeli typu tego okna) ----
    // 1) siła zwarcia, prześwit między kolumnami i wysokość formy (jeśli podana),
    // 2) jeśli żaden model nie spełnia wysokości formy - pomijamy ten warunek,
    // 3) jeśli żaden model serii nie ma wymaganej siły zwarcia / prześwitu -
    //    pokazujemy największy model serii z wyraźnym ostrzeżeniem.
    const forceTieOk = m => m.force >= requiredForceTon && (!typeData.hasTieBar || m.tieBar === null || m.tieBar >= tieClearance);
    // maxH = null: katalog nie podaje maks. wysokości formy - sprawdzamy tylko minimum
    const heightOk = m => moldHeight <= 0 || (moldHeight >= m.minH && (m.maxH === null || moldHeight <= m.maxH));

    let candidates = typeData.models.filter(m => forceTieOk(m) && heightOk(m));
    let heightIgnored = false;
    if (!candidates.length) {
        candidates = typeData.models.filter(forceTieOk);
        heightIgnored = candidates.length > 0;
    }
    let exceedsSeries = false;
    if (!candidates.length) {
        exceedsSeries = true;
        candidates = [typeData.models[typeData.models.length - 1]];
    }

    // ---- Dobór agregatu wtryskowego ----
    // Najmniejszy model (spośród powyższych) z agregatem, w którym droga
    // dozowania mieści się w zalecanym zakresie 1–3 × D; jeśli takiego nie ma -
    // najmniejszy agregat, w którym dawka w ogóle się mieści.
    const findUnit = (test) => {
        for (const m of candidates) {
            const unit = m.units.find(u => { const f = getShotFit(m.name, u, totalVwtr); return f && test(f); });
            if (unit) return { model: m, unit };
        }
        return null;
    };
    let shotStatus = 'ok';
    let pick = findUnit(f => f.recommended);
    if (!pick) {
        pick = findUnit(f => f.fits);
        shotStatus = pick ? 'outsideRange' : 'tooBig';
    }
    if (!pick) {
        const m = candidates[candidates.length - 1];
        pick = { model: m, unit: m.units[m.units.length - 1] };
    }
    const suggestedModel = pick.model;
    const upsizedForShot = suggestedModel !== candidates[0];

    // Odtworzenie zapisanego okna: agregat wybrany wcześniej przez klienta
    let chosenUnit = pick.unit;
    if (restoreMachine && restoreMachine.modelName === suggestedModel.name && suggestedModel.units.includes(restoreMachine.unitStr)) {
        chosenUnit = restoreMachine.unitStr;
    }

    const maxForce = Math.max(...typeData.models.map(m => m.force));
    const maxTie = typeData.hasTieBar ? Math.max(...typeData.models.map(m => m.tieBar || 0)) : null;
    const warnings = [];
    if (exceedsSeries) {
        const reasons = [];
        if (requiredForceTon > maxForce) reasons.push(`wymagana siła zwarcia ${requiredForceTon.toFixed(1)} t (maks. w serii ${maxForce} t)`);
        if (maxTie !== null && tieClearance > maxTie) reasons.push(`wymagany prześwit ${tieClearance} mm (maks. w serii ${maxTie} mm)`);
        warnings.push(`Uwaga: żaden model serii ${type} nie spełnia wymagań${reasons.length ? ': ' + reasons.join(', ') : ''}. Pokazano największy model serii — skontaktuj się z doradcą lub wybierz inny typ wtryskarki.`);
    } else if (heightIgnored && moldHeight > 0) {
        warnings.push(`Uwaga: żaden model nie spełnia jednocześnie podanej wysokości formy — pokazano model dobrany bez uwzględnienia wysokości formy. Zweryfikuj wysokość formy z działem technicznym.`);
    }
    if (shotStatus === 'tooBig') {
        warnings.push(`Uwaga: dawka wtrysku ${totalVwtr.toFixed(1)} cm³ jest większa niż teoretyczna objętość wtrysku agregatów dobranych modeli. Skontaktuj się z doradcą w sprawie doboru agregatu.`);
    } else if (shotStatus === 'outsideRange') {
        warnings.push(`Uwaga: dla tej dawki żaden agregat nie zapewnia drogi dozowania w zalecanym zakresie 1–3 × D — dobrano najmniejszy agregat, w którym dawka się mieści.`);
    }

    const calcDiv = document.getElementById('calcDetails_t' + id);
    calcDiv.innerHTML = `
        <ul>
            <li>Objętość wtrysku pojedynczej wypraski (V<sub>wtr</sub> = m / ρ): <strong>${singleVwtr.toFixed(2)} cm³</strong></li>
            <li>Całkowita objętość wtrysku dla ${cavities} gniazd/a: <strong>${totalVwtr.toFixed(2)} cm³</strong></li>
            <li>Całkowita masa wtrysku: <strong>${totalWeight.toFixed(2)} g</strong></li>
            <li>Wymagana minimalna siła zwarcia (metoda powierzchniowa, p = ${specificPressure} kg/cm²): <strong>${requiredForceTon.toFixed(1)} ton</strong></li>
            <li>Orientacyjna siła zwarcia wg uproszczonego wzoru masowego P<sub>s</sub> = m·g·k/1000: <strong>${psDocN.toFixed(2)} N</strong></li>
            ${tieInput ? `<li>Wymagany prześwit między kolumnami: min. <strong>${tieClearance} mm</strong></li>` : ''}
            ${moldHeight > 0 ? `<li>Wysokość formy: <strong>${moldHeight} mm</strong></li>` : ''}
            ${upsizedForShot && !exceedsSeries ? `<li>Model większy niż wynika z siły zwarcia (${candidates[0].name}) — ze względu na objętość wtrysku.</li>` : ''}
        </ul>
        ${warnings.map(w => `<p class="calc-warning">${w}</p>`).join('')}
    `;

    document.getElementById('suggestedModelName_t' + id).textContent = suggestedModel.name;

    const agregatSelect = document.getElementById('selected_agregat_t' + id);
    agregatSelect.innerHTML = suggestedModel.units.map(unit => {
        const agregat = formatStep2AgregatLabel(unit);
        const screwMatch = unit.match(/\((\d+)\s*mm\)/i);
        const screwDiameter = screwMatch ? screwMatch[1] : '–';
        const fit = getShotFit(suggestedModel.name, unit, totalVwtr);
        const volInfo = fit ? `, ${fit.maxVol} cm³${fit.fits ? '' : ' – za mała objętość'}` : '';
        return `<option value="${unit}"${unit === chosenUnit ? ' selected' : ''}>${agregat} (Ø${screwDiameter} mm${volInfo})</option>`;
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

    applyTechSelection(id, type, suggestedModel, agregatSelect.value, techResults, readTechInputs(id));
    renderShotInfo(id);
}

// Zapisuje wybór (model + agregat) danego okna kalkulatora jako maszynę w
// konfiguracji (nową albo - przy ponownym przeliczeniu - tę samą, dobraną
// wcześniej w tym oknie), razem z wynikami obliczeń (Krok 4, PDF, e-mail) i
// wpisanymi danymi (odtworzenie okna). Typ maszyny = typ okna kalkulatora.
function applyTechSelection(techId, type, model, unitStr, techResults, techInputs) {
    let m = getTechMachine(techId);
    if (m && m.type === type) {
        m.modelName = model.name;
        m.unitStr = unitStr;
        m.techResults = techResults;
        m.techInputs = techInputs;
    } else {
        if (m) cfgMachines.splice(cfgMachines.indexOf(m), 1);
        m = createMachine(type, model.name, unitStr, 'tech', { techId, techResults, techInputs });
        cfgMachines.push(m);
    }

    renderStep2Specs();
    onConfigurationChanged();
}

// Zmiana wybranego rozmiaru agregatu (bez ponownego przeliczania) - np. gdy
// klient chce inny wariant średnicy ślimaka tego samego, sugerowanego modelu.
function onTechAgregatChange(techId, unitStr) {
    const m = getTechMachine(techId);
    const model = m && findModel(m.type, m.modelName);
    if (!model || !model.units.includes(unitStr)) return;
    m.unitStr = unitStr;
    if (m.techInputs) m.techInputs = readTechInputs(techId);
    renderStep2Specs();
    renderShotInfo(techId);
    onConfigurationChanged();
}

// -------------------- Wspólne: wyróżniony pasek z wybraną wtryskarką i średnicą ślimaka --------------------
// Używane zarówno w Kroku 3 (przy każdym bloku opcji dodatkowych), jak i w
// Kroku 4 (przy każdym bloku podsumowania).

function buildMachineHighlightInnerHtml(modelName, screwDiameter) {
    return `
        <span class="machine-highlight-item"><span class="machine-highlight-label">Wybrana wtryskarka:</span> <strong>${modelName}</strong></span>
        <span class="machine-highlight-item"><span class="machine-highlight-label">Średnica ślimaka:</span> <strong>${screwDiameter}</strong></span>
    `;
}

// Lista wszystkich maszyn w konfiguracji dla Kroku 3/4, PDF i e-maila -
// pogrupowana wg typu (kolejność typów z machineData), w obrębie typu w
// kolejności dodania. "ref" to oryginalny wpis z cfgMachines, żeby zmiany
// (checkboxy opcji, rozwijanie) od razu zapisywały się z powrotem.
function getConfiguredMachines() {
    const typeOrder = Object.keys(machineData);
    return cfgMachines
        .map((m, i) => ({ m, i }))
        .sort((a, b) => (typeOrder.indexOf(a.m.type) - typeOrder.indexOf(b.m.type)) || (a.i - b.i))
        .map(({ m }) => {
            if (!Array.isArray(m.selectedOptions)) m.selectedOptions = [];
            return {
                uid: m.uid,
                type: m.type,
                typeLabel: getTypeLabel(m.type),
                modelName: m.modelName,
                unitStr: m.unitStr,
                qty: m.qty || 1,
                screwDiameter: getScrewDiameter(m.unitStr),
                selectedOptions: m.selectedOptions,
                optionsExpanded: !!m.optionsExpanded,
                techResults: m.techResults || null,
                ref: m
            };
        });
}

// -------------------- Zapis konfiguracji w pamięci przeglądarki --------------------
//
// Cała konfiguracja (maszyny wszystkich typów, opcje, dane kalkulatora,
// porównanie, ostatni krok) zapisuje się w localStorage po każdej zmianie,
// więc zostaje także po zamknięciu karty lub przeglądarki - do czasu
// usunięcia przyciskiem "Usuń konfigurację" albo wyczyszczenia danych
// przeglądarki. Dane kontaktowe z Kroku 4 NIE są zapisywane. Przy odczycie
// każda maszyna jest sprawdzana (typ -> model -> agregat, opcje tylko z
// listy jej typu) - wpisy, które nie pasują do aktualnych danych, są pomijane.

const CFG_STORAGE_KEY = 'woojinConfigurator.v1';
let cfgLastSavedAt = null;
let cfgStorageAvailable = (function () {
    try {
        const probe = '__woojinCfgProbe';
        window.localStorage.setItem(probe, '1');
        window.localStorage.removeItem(probe);
        return true;
    } catch (e) {
        return false;
    }
})();

function saveConfiguration() {
    if (!cfgStorageAvailable) return;
    try {
        if (!cfgMachines.length && !compareItems.length) {
            window.localStorage.removeItem(CFG_STORAGE_KEY);
            cfgLastSavedAt = null;
            return;
        }
        cfgLastSavedAt = Date.now();
        window.localStorage.setItem(CFG_STORAGE_KEY, JSON.stringify({
            version: 1,
            savedAt: cfgLastSavedAt,
            step: currentStep,
            activeType: selectedMachineType,
            view: step2SubView,
            machines: cfgMachines.map(m => ({
                type: m.type,
                modelName: m.modelName,
                unitStr: m.unitStr,
                qty: m.qty,
                source: m.source,
                techId: m.techId,
                techInputs: m.techInputs,
                techResults: m.techResults,
                selectedOptions: m.selectedOptions
            })),
            compare: compareItems
        }));
    } catch (e) {
        cfgStorageAvailable = false;
    }
}

// Pola liczbowe wyników kalkulatora używane w Kroku 4, PDF i e-mailu
const TECH_RESULT_NUMBERS = ['singleVwtr', 'totalVwtr', 'totalWeight', 'requiredForceTon', 'psDocN', 'cavities', 'partWeight', 'partSurface', 'density', 'tieClearance', 'moldHeight'];

function sanitizeSavedMachine(raw) {
    if (!raw || typeof raw !== 'object') return null;
    // Typ, model i agregat muszą do siebie pasować - inaczej wpis jest pomijany
    const model = findModel(raw.type, raw.modelName);
    if (!model || !model.units.includes(raw.unitStr)) return null;

    const allowedOptions = new Set([].concat(...Object.values(optionSets[raw.type].opt)));
    const techResultsOk = raw.techResults && typeof raw.techResults === 'object' &&
        TECH_RESULT_NUMBERS.every(key => typeof raw.techResults[key] === 'number' && isFinite(raw.techResults[key]));
    const isTech = raw.source === 'tech' && Number.isInteger(raw.techId) && raw.techId >= 0 && techResultsOk;

    return createMachine(raw.type, raw.modelName, raw.unitStr, isTech ? 'tech' : 'list', {
        qty: Math.max(1, parseInt(raw.qty, 10) || 1),
        techId: isTech ? raw.techId : undefined,
        techInputs: isTech && raw.techInputs && typeof raw.techInputs === 'object' ? raw.techInputs : undefined,
        techResults: techResultsOk ? raw.techResults : null,
        selectedOptions: Array.isArray(raw.selectedOptions) ? raw.selectedOptions.filter(o => allowedOptions.has(o)) : []
    });
}

function isValidCompareItem(item) {
    if (!item || typeof item !== 'object') return false;
    const model = findModel(item.type, item.modelName);
    return !!model && model.units.includes(item.unitStr);
}

function loadSavedConfiguration() {
    if (!cfgStorageAvailable) return null;
    let data;
    try {
        data = JSON.parse(window.localStorage.getItem(CFG_STORAGE_KEY) || 'null');
    } catch (e) {
        return null;
    }
    if (!data || data.version !== 1 || !Array.isArray(data.machines)) return null;

    const machines = data.machines.map(sanitizeSavedMachine).filter(Boolean);
    // Numery okien kalkulatora muszą być unikalne
    const seenTech = new Set();
    machines.forEach(m => {
        if (m.source !== 'tech') return;
        if (seenTech.has(m.techId)) { m.source = 'list'; m.techId = undefined; m.techInputs = undefined; }
        else seenTech.add(m.techId);
    });

    return {
        savedAt: typeof data.savedAt === 'number' ? data.savedAt : null,
        step: [1, 2, 3, 4].includes(data.step) ? data.step : 1,
        activeType: machineData[data.activeType] ? data.activeType : null,
        view: data.view === 'list' ? 'list' : 'tech',
        machines,
        compare: Array.isArray(data.compare)
            ? data.compare.filter(isValidCompareItem).slice(0, COMPARE_MAX).map(c => ({ type: c.type, modelName: c.modelName, unitStr: c.unitStr }))
            : []
    };
}

// Przy wejściu na stronę: przywraca zapisaną konfigurację i pokazuje
// informację z wyborem - kontynuować albo usunąć ją i zacząć od nowa.
let cfgResumeStep = 1;

function restoreSavedConfiguration() {
    const saved = loadSavedConfiguration();
    if (!saved || (!saved.machines.length && !saved.compare.length)) return;

    cfgMachines = saved.machines;
    compareItems = saved.compare;
    cfgTechCounter = cfgMachines.reduce((max, m) => (m.source === 'tech' ? Math.max(max, m.techId + 1) : max), 0);
    cfgLastSavedAt = saved.savedAt;
    step2SubView = saved.view;
    if (saved.activeType) {
        selectedMachineType = saved.activeType;
        setStep1Type(saved.activeType);
    }

    if (cfgMachines.length) {
        cfgResumeStep = saved.step;
        showResumeNotice(saved.savedAt);
    }
}

function formatSavedTime(timestamp) {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    const time = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday ? `dziś o ${time}` : `${d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}, ${time}`;
}

function showResumeNotice(savedAt) {
    const el = document.getElementById('cfgResume');
    if (!el) return;
    const machines = getConfiguredMachines();
    const names = machines.map(m => m.modelName);
    const shown = names.slice(0, 4).join(', ') + (names.length > 4 ? ` i ${names.length - 4} ${plPlural(names.length - 4, 'inna', 'inne', 'innych')}` : '');
    el.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>
        <div>
            <strong>Witaj ponownie! Przywróciliśmy Twoją poprzednią konfigurację${savedAt ? ` (zapisaną ${formatSavedTime(savedAt)})` : ''}.</strong>
            <p>${machines.length} ${plPlural(machines.length, 'wtryskarka', 'wtryskarki', 'wtryskarek')}: ${shown}. Konfiguracja zapisuje się automatycznie w pamięci tej przeglądarki, także po zamknięciu strony. Możesz do niej wrócić albo ją usunąć i zacząć od nowa.</p>
            <div class="cfg-notice-actions">
                <button type="button" class="btn btn--primary btn--sm" onclick="resumeSavedConfiguration()">Wróć do konfiguracji</button>
                <button type="button" class="btn btn--outline btn--sm" onclick="clearConfiguration()">Usuń i zacznij od nowa</button>
            </div>
        </div>`;
    el.hidden = false;
}

function hideResumeNotice() {
    const el = document.getElementById('cfgResume');
    if (el) el.hidden = true;
}

// "Wróć do konfiguracji" - przejście do kroku, na którym klient skończył
function resumeSavedConfiguration() {
    hideResumeNotice();
    if (cfgResumeStep >= 3) nextStep(cfgResumeStep);
    else if (cfgResumeStep === 2) nextStep(2, step2SubView);
    else scrollToConfigurator();
}

// "Usuń konfigurację" - czyści maszyny wszystkich typów, porównanie i zapis
// w przeglądarce, po czym wraca do Kroku 1.
function clearConfiguration() {
    if (!window.confirm('Usunąć całą konfigurację (wszystkie wybrane maszyny i opcje)? Tej operacji nie można cofnąć.')) return;

    cfgMachines = [];
    compareItems = [];
    step2ListPlaceholders = 0;
    step2TechBlockIds = [];
    cfgLastSavedAt = null;
    try { window.localStorage.removeItem(CFG_STORAGE_KEY); } catch (e) { /* brak localStorage */ }

    hideResumeNotice();
    if (typeof closeCompare === 'function') closeCompare();

    if (currentStep !== 1) {
        document.getElementById(`step${currentStep}`).classList.remove('active');
        currentStep = 1;
        document.getElementById('step1').classList.add('active');
        updateCfgStepper();
    }
    scrollToConfigurator();
    renderConfigPanel();
}

// -------------------- Panel "Twoja konfiguracja" --------------------
//
// Widoczny nad krokami, gdy konfiguracja zawiera przynajmniej jedną maszynę:
// lista maszyn wszystkich typów, porównanie, dodanie kolejnego typu i
// usunięcie konfiguracji oraz informacja o zapisie w przeglądarce.

function renderConfigPanel() {
    updateStep1TypeBadges();

    const panel = document.getElementById('cfgCart');
    if (!panel) return;

    const machines = getConfiguredMachines();
    if (!machines.length) {
        panel.hidden = true;
        panel.innerHTML = '';
        return;
    }

    const types = getConfigTypes();
    const units = machines.reduce((sum, m) => sum + m.qty, 0);
    const chips = machines.map(m => `
            <li class="cfg-cart-chip">
                <span class="cfg-type-badge">${m.type}</span>
                <strong>${m.modelName}</strong>
                <span class="cfg-cart-chip-unit">${formatStep2AgregatLabel(m.unitStr)} · Ø${m.screwDiameter.replace(' mm', '')} mm</span>
                ${m.qty > 1 ? `<span class="cfg-cart-chip-qty">× ${m.qty}</span>` : ''}
            </li>`).join('');

    const note = cfgStorageAvailable
        ? `Konfiguracja zapisuje się automatycznie w pamięci tej przeglądarki${cfgLastSavedAt ? ` (ostatni zapis: ${formatSavedTime(cfgLastSavedAt)})` : ''}. Możesz do niej wrócić nawet po zamknięciu strony albo usunąć ją przyciskiem „Usuń konfigurację”. Dane kontaktowe nie są zapisywane.`
        : 'Twoja przeglądarka nie pozwala zapisać konfiguracji (np. tryb prywatny) — po zamknięciu strony konfiguracja zniknie. Możesz pobrać ją jako PDF w Kroku 4.';

    panel.innerHTML = `
        <div class="cfg-cart-head">
            <p class="cfg-cart-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9h10M7 13h6"/></svg>
                Twoja konfiguracja
                <span class="cfg-cart-count">${machines.length} ${plPlural(machines.length, 'model', 'modele', 'modeli')} · ${units} szt. · ${types.length} ${plPlural(types.length, 'typ', 'typy', 'typów')}</span>
            </p>
            <div class="cfg-cart-actions">
                ${currentStep < 3 ? `<button type="button" class="cfg-cart-btn cfg-cart-btn--primary" onclick="nextStep(3)">Przejdź do wyposażenia →</button>` : ''}
                <button type="button" class="cfg-cart-btn" onclick="openCompare()">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 4v16M17 4v16M3 8h8M13 16h8"/></svg>
                    Porównaj maszyny${compareItems.length ? ` (${compareItems.length})` : ''}
                </button>
                ${currentStep !== 1 ? `<button type="button" class="cfg-cart-btn" onclick="nextStep(1)">+ Dodaj inny typ</button>` : ''}
                <button type="button" class="cfg-cart-btn cfg-cart-btn--danger" onclick="clearConfiguration()">Usuń konfigurację</button>
            </div>
        </div>
        <ul class="cfg-cart-list" role="list">${chips}</ul>
        <p class="cfg-cart-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
            <span>${note}</span>
        </p>`;
    panel.hidden = false;
}

// Czy dana maszyna (typ + model + agregat) jest w porównaniu
function isInCompare(type, modelName, unitStr) {
    return compareItems.some(c => c.type === type && c.modelName === modelName && c.unitStr === unitStr);
}

// Wywoływane przez porównanie (js/configurator-compare.js) po każdej zmianie
function onCompareChanged() {
    renderStep2Specs();
    onConfigurationChanged();
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
// wpięte przez addEventListener - patrz buildStep3OptionCheckboxes).
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
    // Dymek musi być bezpośrednio w <body>: krok formularza ma po animacji
    // pojawiania się ustawiony transform, a wtedy position: fixed liczy się
    // od kroku, nie od okna - dymek lądował w zupełnie innym miejscu strony.
    if (tooltip.parentElement !== document.body) document.body.appendChild(tooltip);

    const textEl = triggerEl.querySelector('.opt-text');
    const key = (textEl ? textEl.textContent : triggerEl.textContent).trim();
    const translation = OPTION_TRANSLATIONS[key];
    if (!translation) { hideStep3OptionTooltip(); return; }

    // Pozycje ze zdjęciem (OPTION_MEDIA, dopasowane do typu maszyny) dostają
    // większy dymek: zdjęcie + tłumaczenie + krótki opis. Klasę trzeba ustawić
    // PRZED renderowaniem - zmienia szerokość dymka, a renderStep3TooltipText
    // mierzy zawijanie tekstu przy aktualnej szerokości. Typ bierzemy z sekcji
    // typu w Kroku 3, w której leży pozycja (data-type).
    const typeHost = triggerEl.closest('[data-type]');
    const media = getOptionMedia(key, typeHost ? typeHost.dataset.type : selectedMachineType);
    tooltip.classList.toggle('has-media', !!media);
    if (media) renderStep3TooltipMedia(tooltip, translation, media);
    else renderStep3TooltipText(tooltip, translation);
    positionStep3OptionTooltip(tooltip, textEl || triggerEl);
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

// Treść dymka dla pozycji ze zdjęciem: jasny panel ze zdjęciem (1 - duże,
// 2 - obok siebie lub jedno pod drugim, gdy jedno jest bardzo szerokie,
// więcej - siatka, w której szerokie zdjęcia ślimaków zajmują cały wiersz)
// z podpisami, pod nim tłumaczenie nazwy i opis. Zdjęcia mają w CSS stałą
// wysokość, więc rozmiar dymka nie zmienia się, gdy doczytają się już po
// pokazaniu dymka.
function renderStep3TooltipMedia(tooltip, translation, media) {
    const images = media.images;
    const hasWide = images.some(img => img.wide);
    const layout = images.length > 2 ? ' is-grid' : images.length === 2 ? (hasWide ? ' is-stack' : ' is-pair') : ' is-single';
    tooltip.innerHTML = `
        <div class="opt-tip-media${layout}">
            ${images.map(img => `
                <figure class="opt-tip-figure${img.wide ? ' is-wide' : ''}">
                    <div class="opt-tip-img"><img src="${OPTION_MEDIA_DIR}${img.src}" alt="${img.caption}" decoding="async"></div>
                    <figcaption>${img.caption}</figcaption>
                </figure>`).join('')}
        </div>
        <div class="opt-tip-body">
            <div class="opt-tip-title">${translation}</div>
            <p class="opt-tip-desc">${media.desc}</p>
        </div>`;
}

// Ikonka "zdjęcie" przy pozycjach, dla których dymek pokazuje zdjęcie i opis
function step3MediaBadgeHtml(optText, type) {
    if (!getOptionMedia(optText.replace(/^\d+\.\s*/, '').trim(), type)) return '';
    return '<span class="opt-media-badge" title="Zdjęcie i opis" aria-hidden="true">' +
        '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16.5l-5-5-8.5 8"/></svg></span>';
}

// Wczytuje z wyprzedzeniem zdjęcia pozycji typów maszyn z konfiguracji,
// żeby pojawiały się w dymku od razu przy pierwszym najechaniu.
const step3PreloadedMedia = new Set();
function preloadStep3OptionMedia() {
    getConfigTypes().forEach(type => {
        const data = optionSets[type];
        if (!data) return;
        [data.std, data.opt].forEach(set => Object.values(set).forEach(list => list.forEach(optText => {
            const media = getOptionMedia(optText.replace(/^\d+\.\s*/, '').trim(), type);
            if (!media) return;
            media.images.forEach(img => {
                const src = OPTION_MEDIA_DIR + img.src;
                if (step3PreloadedMedia.has(src)) return;
                step3PreloadedMedia.add(src);
                new Image().src = src;
            });
        })));
    });
}

// Pozycjonuje dymek (position: fixed - współrzędne względem okna) tuż pod
// angielskim tekstem pozycji, z "dzióbkiem" wskazującym jego początek; gdy
// pod tekstem brakuje miejsca (dolna krawędź ekranu) - tuż nad nim. Gdy
// wysoki dymek ze zdjęciem nie mieści się ani pod, ani nad tekstem (niskie
// okno), trafia na stronę z większą ilością miejsca, przesunięty tak, by nie
// wychodził poza okno - wtedy bez dzióbka. Rozmiar z offsetWidth/Height, bo
// getBoundingClientRect uwzględniałby skalowanie z animacji pojawiania się.
function positionStep3OptionTooltip(tooltip, anchorEl) {
    const rects = anchorEl.getClientRects();
    const first = rects.length ? rects[0] : anchorEl.getBoundingClientRect();
    const box = anchorEl.getBoundingClientRect();
    const tipW = tooltip.offsetWidth, tipH = tooltip.offsetHeight;
    const gap = 10, edge = 8;

    const spaceBelow = window.innerHeight - edge - (box.bottom + gap);
    const spaceAbove = first.top - gap - edge;
    const below = tipH <= spaceBelow || (tipH > spaceAbove && spaceBelow >= spaceAbove);
    let top = below ? box.bottom + gap : first.top - tipH - gap;
    // Gdy pozycja zjechała z ekranu (przewijanie), dymek odjeżdża razem z nią
    const anchorVisible = box.bottom > 0 && box.top < window.innerHeight;
    const clampedTop = anchorVisible ? Math.max(edge, Math.min(top, window.innerHeight - tipH - edge)) : top;
    tooltip.classList.toggle('no-arrow', clampedTop !== top);
    top = clampedTop;

    let left = first.left - 4;
    left = Math.min(left, window.innerWidth - tipW - edge);
    left = Math.max(edge, left);

    const arrowX = Math.max(12, Math.min(tipW - 12, first.left + 14 - left));
    tooltip.style.setProperty('--arrow-x', arrowX + 'px');
    tooltip.classList.toggle('is-below', below);
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
}

// Przy przewijaniu / zmianie rozmiaru okna otwarty dymek "jedzie" za swoją pozycją
function repositionStep3OptionTooltip() {
    const tooltip = document.getElementById('step3OptionTooltip');
    if (!tooltip || !tooltip.classList.contains('is-open') || !step3TooltipOpenTrigger) return;
    if (!step3TooltipOpenTrigger.isConnected) { hideStep3OptionTooltip(); return; }
    const textEl = step3TooltipOpenTrigger.querySelector('.opt-text');
    positionStep3OptionTooltip(tooltip, textEl || step3TooltipOpenTrigger);
}
window.addEventListener('scroll', repositionStep3OptionTooltip, { passive: true });
window.addEventListener('resize', repositionStep3OptionTooltip);

// Zamyka dymek po kliknięciu gdziekolwiek poza pozycją, nad którą był
// otwarty, i poza samym dymkiem - przydatne głównie na dotyku, gdzie nie ma
// zjechania kursorem (ten sam mechanizm co zamykanie wysuwanego menu
// agregatów w Kroku 2 - patrz closeStep2UnitsFlyout).
document.addEventListener('click', function (e) {
    const tooltip = document.getElementById('step3OptionTooltip');
    if (!tooltip || !tooltip.classList.contains('is-open')) return;
    if (tooltip.contains(e.target)) return;
    // Stuknięcie w wiersz opcji dodatkowej (zaznaczenie) zamyka dymek otwarty
    // przyciskiem "PL"; przy myszce dymek zostaje, dopóki kursor jest nad wierszem.
    const isOptionRow = step3TooltipOpenTrigger && step3TooltipOpenTrigger.classList.contains('checkbox-item');
    if (step3TooltipOpenTrigger && step3TooltipOpenTrigger.contains(e.target) && (!isOptionRow || e.pointerType === 'mouse')) return;
    hideStep3OptionTooltip();
});

// Przycisk "PL" przy opcji dodatkowej (widoczny tylko na ekranach dotykowych,
// patrz CSS) - pokazuje / chowa tłumaczenie BEZ zaznaczania opcji. Przycisk
// leży w <label>, ale kliknięcie elementu interaktywnego w etykiecie nie
// przełącza checkboxa; preventDefault dodatkowo to gwarantuje.
function createStep3TranslateButton(label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opt-translate-btn';
    btn.textContent = 'PL';
    btn.setAttribute('aria-label', 'Pokaż tłumaczenie na język polski');
    // Pozycja ze zdjęciem: ikonka zdjęcia trafia do przycisku (na dotyku
    // osobna ikonka w wierszu jest ukryta - patrz CSS .opt-media-badge)
    const badge = label.querySelector('.opt-media-badge');
    if (badge) {
        btn.classList.add('has-media');
        btn.insertAdjacentHTML('afterbegin', badge.innerHTML);
        btn.setAttribute('aria-label', 'Pokaż zdjęcie i tłumaczenie na język polski');
    }
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (step3TooltipOpenTrigger === label) hideStep3OptionTooltip();
        else showStep3OptionTooltip(label);
    });
    return btn;
}

// Krok 3 - jedna sekcja na każdy typ maszyny w konfiguracji: wyposażenie
// standardowe tego typu (optionSets[type].std) i opcje dodatkowe dla każdej
// maszyny tego typu (optionSets[type].opt). Lista opcji maszyny pochodzi
// wyłącznie z jej typu, więc opcje różnych serii nigdy się nie mieszają.
function populateStep3() {
    const container = document.getElementById('step3TypesContainer');
    if (!container) return;
    hideStep3OptionTooltip();

    const machines = getConfiguredMachines();
    if (!machines.length) {
        container.innerHTML = `
            <div class="cfg-empty">
                <p>Konfiguracja jest pusta — wybierz typ wtryskarki, aby dodać pierwszą maszynę.</p>
                <button type="button" class="btn-next" onclick="nextStep(1)">Wybierz typ wtryskarki</button>
            </div>`;
        return;
    }

    const types = getConfigTypes();
    container.innerHTML = types.map(type => {
        const data = optionSets[type];
        const ofType = machines.filter(m => m.type === type);
        const stdItemHtml = i => `<li${step3TooltipAttrs()}>${formatNumbered(i)}${step3MediaBadgeHtml(i, type)}</li>`;

        return `
            <section class="step3-type-section" data-type="${type}" aria-label="${getTypeLabel(type)}">
                <header class="step3-type-header">
                    <span class="cfg-type-badge cfg-type-badge--lg">${type}</span>
                    <h3>${getTypeLabel(type)}</h3>
                    <span class="step3-type-count">${ofType.length} ${plPlural(ofType.length, 'model', 'modele', 'modeli')}</span>
                </header>

                <h4 class="step3-sub-title">Wyposażenie standardowe <span class="step3-std-machines-list">${ofType.map(m => `${m.modelName} (Ø ${m.screwDiameter})`).join(' // ')}</span></h4>
                <div class="options-columns-grid">
                    <div class="option-col"><h4>Wtrysk</h4><ul>${data.std.injection.map(stdItemHtml).join('')}</ul></div>
                    <div class="option-col"><h4>Zwarcie</h4><ul>${data.std.clamping.map(stdItemHtml).join('')}</ul></div>
                    <div class="option-col"><h4>Ogólne</h4><ul>${data.std.general.map(stdItemHtml).join('')}</ul></div>
                </div>

                <h4 class="step3-sub-title">Opcje dodatkowe (do wyboru)</h4>
                ${ofType.map((m, i) => buildStep3MachineOptionsBlockHtml(m, i === 0, ofType.length)).join('')}
            </section>`;
    }).join('') + `
        <button type="button" class="step2-add-model-btn step3-add-type-btn" onclick="nextStep(1)">
            <span class="pulse-plus">+</span> Dodaj maszynę innego typu
        </button>`;

    // Checkboxy opcji tworzone przez DOM (nie inline onclick), żeby uniknąć
    // problemów z cudzysłowami w opisach opcji z katalogu
    machines.forEach(m => {
        const colsEl = document.getElementById(`step3OptCols-${m.uid}`);
        if (colsEl) buildStep3OptionCheckboxes(colsEl, m);
    });

    preloadStep3OptionMedia();
}

// Blok opcji dodatkowych jednej maszyny: pierwsza maszyna danego typu ma
// opcje zawsze rozwinięte, kolejne - rozwijane pulsującym trójkątem (ten sam
// mechanizm/styl co "Pokaż pełną specyfikację techniczną" w Kroku 2).
function buildStep3MachineOptionsBlockHtml(m, isPrimary, countOfType) {
    const header = `
        <div class="step3-machine-options-header">
            <div class="machine-highlight-box">${buildMachineHighlightInnerHtml(m.modelName, m.screwDiameter)}${buildStep3QtyControlsHtml(m)}</div>
        </div>`;

    if (isPrimary) {
        return `
            <div class="step3-machine-options-block" data-uid="${m.uid}">
                ${header}
                <div class="options-columns-grid" id="step3OptCols-${m.uid}"></div>
                ${countOfType > 1 ? `
                <button type="button" class="step2-add-model-btn step3-apply-all-btn" onclick="applyStep3OptionsToAll('${m.type}')">
                    <span class="pulse-plus">+</span> Zastosuj do wszystkich maszyn ${m.type}
                </button>` : ''}
            </div>`;
    }

    return `
        <div class="step3-machine-options-block" data-uid="${m.uid}">
            ${header}
            <button type="button" class="step2-details-toggle${m.optionsExpanded ? ' is-expanded' : ''}" onclick="toggleStep3MachineOptionsPanel('${m.uid}')" aria-expanded="${m.optionsExpanded ? 'true' : 'false'}">
                <span>${m.optionsExpanded ? 'Ukryj opcje dodatkowe dla tej maszyny' : 'Pokaż opcje dodatkowe dla tej maszyny'}</span>
                <svg class="step2-details-toggle-arrow" viewBox="0 0 12 8" width="12" height="8" aria-hidden="true"><polygon points="0,0 12,0 6,8" fill="currentColor"></polygon></svg>
            </button>
            ${m.optionsExpanded ? `<div class="options-columns-grid" id="step3OptCols-${m.uid}"></div>` : ''}
        </div>`;
}

// Checkboxy opcji dodatkowych jednej maszyny - WYŁĄCZNIE z listy jej typu.
// Stan zapisuje się bezpośrednio do selectedOptions tej maszyny.
function buildStep3OptionCheckboxes(colsEl, m) {
    const data = optionSets[m.type];
    if (!data) return;
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
            checkbox.checked = m.ref.selectedOptions.includes(optText);
            checkbox.addEventListener('change', () => {
                const selected = m.ref.selectedOptions;
                const pos = selected.indexOf(optText);
                if (checkbox.checked && pos === -1) {
                    selected.push(optText);
                    // Wibracja przy DODANIU opcji dodatkowej (patrz
                    // triggerHapticFeedback na górze pliku) - tylko przy
                    // zaznaczeniu, nie przy odznaczeniu.
                    triggerHapticFeedback(15);
                }
                if (!checkbox.checked && pos !== -1) selected.splice(pos, 1);
                onConfigurationChanged();
            });
            label.appendChild(checkbox);
            label.insertAdjacentHTML('beforeend', formatNumbered(optText) + step3MediaBadgeHtml(optText, m.type));
            // Komputer: tłumaczenie po najechaniu myszką. Dotyk: stuknięcie
            // wiersza tylko zaznacza opcję, a tłumaczenie pokazuje przycisk "PL"
            // (pointerType pomija myszkę "udawaną" przez stuknięcie palcem).
            label.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showStep3OptionTooltip(label); });
            label.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hideStep3OptionTooltip(); });
            if (OPTION_TRANSLATIONS[optText.replace(/^\d+\.\s*/, '').trim()]) {
                label.appendChild(createStep3TranslateButton(label));
            }
            groupEl.appendChild(label);
        });
    });
}

// "Zastosuj do wszystkich maszyn <typ>" (widoczny, gdy w konfiguracji jest
// więcej niż jedna maszyna danego typu) - kopiuje opcje pierwszej maszyny
// typu do pozostałych maszyn TEGO SAMEGO typu (inne serie mają inne listy
// opcji, więc ich nie dotyczy).
function applyStep3OptionsToAll(type) {
    const ofType = getConfiguredMachines().filter(m => m.type === type);
    if (ofType.length < 2) return;
    const primaryOptions = ofType[0].ref.selectedOptions.slice();
    ofType.slice(1).forEach(m => {
        m.ref.selectedOptions = primaryOptions.slice();
    });
    populateStep3();
    onConfigurationChanged();
}

// Rozwija/zwija listę opcji dodatkowych danej (nie-pierwszej) maszyny.
function toggleStep3MachineOptionsPanel(uid) {
    const m = getMachine(uid);
    if (!m) return;
    m.optionsExpanded = !m.optionsExpanded;
    populateStep3();
}

// Licznik sztuk (+/-) i kosz do usunięcia maszyny, po prawej stronie paska z
// jej nazwą - ten sam znacznik/styl co licznik przy karcie w Kroku 2.
function buildStep3QtyControlsHtml(m) {
    return `
        <span class="machine-highlight-item step3-qty-controls">
            <div class="step2-qty-stepper">
                <button type="button" class="step2-qty-btn" onclick="changeMachineQty('${m.uid}', -1)" aria-label="Zmniejsz liczbę maszyn">−</button>
                <input type="text" inputmode="numeric" class="step2-qty-input" data-uid="${m.uid}" value="${m.qty}" onchange="setMachineQty('${m.uid}', this.value)" aria-label="Liczba maszyn">
                <button type="button" class="step2-qty-btn" onclick="changeMachineQty('${m.uid}', 1)" aria-label="Zwiększ liczbę maszyn">+</button>
                <button type="button" class="step2-remove-btn" onclick="removeStep3Machine('${m.uid}')" aria-label="Usuń tę maszynę z konfiguracji" title="Usuń tę maszynę z konfiguracji">${TRASH_ICON_SVG}</button>
            </div>
        </span>
    `;
}

// Usunięcie maszyny bezpośrednio z Kroku 3 (wspólne removeMachine utrzymuje
// też w zgodzie okna kalkulatora); pusta konfiguracja wraca do Kroku 1.
function removeStep3Machine(uid) {
    removeMachine(uid);
    if (!cfgMachines.length) nextStep(1);
    else populateStep3();
}

// -------------------- Krok 4: podsumowanie --------------------

// Przycisk "Edytuj" przy danej maszynie w podsumowaniu (Krok 4) - wraca do
// Kroku 3 i od razu rozwija jej sekcję opcji dodatkowych, gotową do zmiany.
function editStep3Machine(uid) {
    const m = getMachine(uid);
    if (m) m.optionsExpanded = true;
    nextStep(3);
}

function populateStep4Summary() {
    const machines = getConfiguredMachines();

    // Pełne wyliczenia technologiczne pokazujemy dla KAŻDEJ maszyny dobranej
    // kalkulatorem (ma własne techResults), a dla maszyn wybranych z listy -
    // krótką informację o sposobie doboru.
    const techRowsHtml = (r) => `
            <tr><td>Wymiary formy (dł. x szer.)</td><td>${r.moldLength} x ${r.moldWidth} mm</td></tr>
            ${r.tieClearance > 0 ? `<tr><td>Prześwit między kolumnami</td><td>${r.tieClearance} mm</td></tr>` : ''}
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

    // Gdy maszyn jest więcej niż jedna, każdy blok dostaje klasę --multi
    // (osobne, białe pole na tle strony), a bloki są pogrupowane wg typu.
    const multi = machines.length > 1;
    const machineBlockHtml = m => `
        <div class="step4-machine-block${multi ? ' step4-machine-block--multi' : ''}" data-uid="${m.uid}">
            <div class="step4-machine-block-header">
                <div class="machine-highlight-box">${buildMachineHighlightInnerHtml(m.modelName, m.screwDiameter)}<span class="machine-highlight-item step4-qty-label">ilość: <strong>${m.qty}</strong></span></div>
                <button type="button" class="btn-secondary btn-small step4-edit-btn" onclick="editStep3Machine('${m.uid}')">Edytuj</button>
            </div>
            <table>
                <tr><td>Typ wtryskarki</td><td><strong>${m.typeLabel}</strong></td></tr>
                <tr><td>Model i agregat wtryskowy</td><td><strong>${m.modelName} – agregat wtryskowy ${m.unitStr}</strong></td></tr>
                ${m.techResults ? techRowsHtml(m.techResults) : noTechRowHtml}
            </table>
            <h4>Wybrane opcje dodatkowe</h4>
            ${m.selectedOptions.length > 0 ? `<ul>${m.selectedOptions.map(o => `<li>${o}</li>`).join('')}</ul>` : '<p>Brak wybranych opcji dodatkowych.</p>'}
        </div>
    `;

    const types = getConfigTypes();
    const machinesHtml = types.length > 1
        ? types.map(type => `
            <div class="step4-type-group">
                <h4 class="step4-type-title"><span class="cfg-type-badge">${type}</span> ${getTypeLabel(type)}</h4>
                ${machines.filter(m => m.type === type).map(machineBlockHtml).join('')}
            </div>`).join('')
        : machines.map(machineBlockHtml).join('');

    const summaryDiv = document.getElementById('summaryView');
    summaryDiv.innerHTML = `
        <h4 class="step4-summary-title">Wybrana konfiguracja${multi ? ` (${machines.length} ${plPlural(machines.length, 'wtryskarka', 'wtryskarki', 'wtryskarek')}${types.length > 1 ? `, ${types.length} ${plPlural(types.length, 'typ', 'typy', 'typów')}` : ''})` : ''}</h4>
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

// jsPDF i czcionka z polskimi znakami są pobierane dopiero przy pierwszym
// kliknięciu "Pobierz PDF" (oszczędność ~400 KB przy wczytaniu strony).
// Wbudowane czcionki jsPDF (Helvetica) nie mają liter ą, ę, ł, ś, ż itd.,
// dlatego osadzamy czcionkę Lato (TTF). Gdy się nie wczyta (brak internetu),
// polskie znaki zostają zamienione na ich odpowiedniki bez ogonków.
const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
const PDF_FONT_URLS = {
    normal: 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/lato@0.4.1/400Regular/Lato_400Regular.ttf',
    bold: 'https://cdn.jsdelivr.net/npm/@expo-google-fonts/lato@0.4.1/700Bold/Lato_700Bold.ttf'
};
let pdfFontCache = null;

function loadScriptOnce(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            if (window.jspdf) resolve(); else setTimeout(() => (window.jspdf ? resolve() : reject(new Error('timeout'))), 4000);
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('load ' + src));
        document.head.appendChild(s);
    });
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

async function loadPdfFonts() {
    if (pdfFontCache) return pdfFontCache;
    const [normal, bold] = await Promise.all(['normal', 'bold'].map(async (k) => {
        const res = await fetch(PDF_FONT_URLS[k], { mode: 'cors' });
        if (!res.ok) throw new Error('font ' + res.status);
        return arrayBufferToBase64(await res.arrayBuffer());
    }));
    pdfFontCache = { normal, bold };
    return pdfFontCache;
}

function stripPolishDiacritics(text) {
    const map = { 'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
        'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z', '–': '-', '—': '-', '³': '3', '²': '2' };
    return String(text).replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ–—³²]/g, ch => map[ch]);
}

async function generatePDF() {
    const btn = document.getElementById('pdfBtn');
    const label = btn ? btn.querySelector('.btn-label') : null;
    const originalLabel = label ? label.textContent : '';
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
    if (label) label.textContent = 'Przygotowuję PDF…';

    try {
        if (!window.jspdf) await loadScriptOnce(JSPDF_URL);
    } catch (e) {
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
        if (label) label.textContent = originalLabel;
        alert('Biblioteka do generowania PDF nie została załadowana (brak połączenia z internetem?).');
        return;
    }

    let fonts = null;
    try { fonts = await loadPdfFonts(); } catch (e) { fonts = null; }

    try {
        buildConfigurationPdf(fonts);
    } finally {
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
        if (label) label.textContent = originalLabel;
    }
}

function buildConfigurationPdf(fonts) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    if (fonts) {
        doc.addFileToVFS('Lato-Regular.ttf', fonts.normal);
        doc.addFont('Lato-Regular.ttf', 'Lato', 'normal');
        doc.addFileToVFS('Lato-Bold.ttf', fonts.bold);
        doc.addFont('Lato-Bold.ttf', 'Lato', 'bold');
        doc.setFont('Lato', 'normal');
    } else {
        // Awaryjnie: tekst bez polskich znaków diakrytycznych
        const origText = doc.text.bind(doc);
        const origSplit = doc.splitTextToSize.bind(doc);
        doc.text = (t, ...rest) => origText(Array.isArray(t) ? t.map(stripPolishDiacritics) : stripPolishDiacritics(t), ...rest);
        doc.splitTextToSize = (t, ...rest) => origSplit(stripPolishDiacritics(t), ...rest);
    }
    const machines = getConfiguredMachines();
    const typeLabels = getConfigTypes().map(getTypeLabel);

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
    // Status prawny przedstawicielstwa (art. 22 ustawy z 6.03.2018 r.) - bez sugestii sprzedaży
    const legalLines = doc.splitTextToSize(
        'Dokument ma charakter wyłącznie informacyjny i poglądowy i nie stanowi oferty w rozumieniu art. 66 § 1 Kodeksu cywilnego. ' +
        'WOOJIN PLAIMM Co., Ltd. przedstawicielstwo w Polsce prowadzi wyłącznie działalność w zakresie reklamy i promocji przedsiębiorcy zagranicznego ' +
        '(art. 22 ustawy z dnia 6 marca 2018 r. o zasadach uczestnictwa przedsiębiorców zagranicznych i innych osób zagranicznych w obrocie gospodarczym ' +
        'na terytorium Rzeczypospolitej Polskiej, t.j. Dz.U. z 2025 r. poz. 89) – nie prowadzi sprzedaży i nie zawiera umów.',
        pageWidth - left * 2
    );
    doc.text(legalLines, left, y);
    y += (legalLines.length - 1) * 4 + lineGap + 2;

    doc.setDrawColor(10, 190, 181);
    doc.line(left, y, pageWidth - left, y);
    y += lineGap;

    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text(typeLabels.length > 1 ? 'Typy wtryskarek:' : 'Typ wtryskarki:', left, y);
    doc.setFont(undefined, 'normal');
    const typeLines = doc.splitTextToSize(typeLabels.join(', '), pageWidth - left * 2 - 65);
    doc.text(typeLines, left + 65, y);
    y += (typeLines.length - 1) * 4 + lineGap + 2;

    // Podsumowanie z podziałem na każdą wybraną wtryskarkę osobno, pogrupowane
    // wg typu (getConfiguredMachines) - każda maszyna z własnym typem.
    machines.forEach((m, i) => {
        if (y > 250) { doc.addPage(); y = 18; }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(machines.length > 1 ? `Maszyna ${i + 1}: ${m.modelName}` : 'Wybrana konfiguracja', left, y);
        doc.setFont(undefined, 'normal');
        y += lineGap;

        doc.setFontSize(10);
        const rows = [
            ['Typ wtryskarki', m.typeLabel],
            ['Model wtryskarki', m.modelName],
            ['Agregat wtryskowy', m.unitStr],
            ['Średnica ślimaka', m.screwDiameter],
            ['Ilość', `${m.qty} szt.`]
        ];
        const r = m.techResults;
        if (r) {
            rows.push(['Liczba gniazd', String(r.cavities)]);
            if (r.tieClearance > 0) rows.push(['Prześwit między kolumnami', `${r.tieClearance} mm`]);
            rows.push(
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

// ---- reCAPTCHA v2 (wspólny kod i klucz: js/main.js, RECAPTCHA_SITE_KEY) ----
// EmailJS obsługuje wyłącznie wersję v2 i sam sprawdza token po swojej
// stronie. KOLEJNOŚĆ: najpierw wgrać na serwer kod z kluczem, dopiero potem
// w EmailJS (szablon -> Settings) włączyć "Enable reCAPTCHA V2
// verification" - odwrotnie wysyłka z konfiguratora przestanie działać.
const CONFIG_RECAPTCHA_BOX = 'configRecaptcha';

swapHumanCheckForRecaptcha('humanCheckWrapConfig', 'configRecaptchaWrap');

// Skrypt Google wczytujemy dopiero w Kroku 4 (formularz wysyłki), a nie
// przy każdym wejściu do konfiguratora - mniej danych dla Google i szybsze
// wczytanie strony. Wywoływane z nextStep().
function initConfigRecaptcha() {
    renderRecaptcha(CONFIG_RECAPTCHA_BOX, function () {
        const statusEl = document.getElementById('sendStatus');
        if (statusEl && statusEl.classList.contains('error')) { statusEl.className = 'send-status'; statusEl.textContent = ''; }
    });
}

// Komunikat, gdy brakuje potwierdzenia reCAPTCHA (albo skrypt Google się nie
// wczytał, np. przez blokadę reklam lub brak internetu)
function showRecaptchaError(statusEl, expired) {
    statusEl.className = 'send-status error';
    if (isRecaptchaLoadFailed()) {
        statusEl.textContent = 'Nie udało się wczytać zabezpieczenia reCAPTCHA (sprawdź połączenie lub wyłącz blokowanie skryptów dla tej strony) i odśwież stronę. Możesz też pobrać PDF i wysłać konfigurację ręcznie.';
        initConfigRecaptcha();
    } else if (expired) {
        statusEl.textContent = 'Potwierdzenie „Nie jestem robotem” wygasło. Zaznacz pole ponownie i wyślij konfigurację.';
    } else {
        statusEl.textContent = 'Zaznacz pole „Nie jestem robotem” powyżej, aby wysłać konfigurację.';
    }
    const wrap = document.getElementById('configRecaptchaWrap');
    if (wrap) wrap.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function requestSendEmail() {
    if (!validateContactForm()) return;

    // Honeypot wypełniony - najpewniej bot. Odrzucamy po cichu, bez
    // pokazywania jakiegokolwiek komunikatu o błędzie (żeby nie zdradzić
    // automatowi, że został wykryty).
    if (isHoneypotFilled('config_hp')) return;

    const statusEl = document.getElementById('sendStatus');
    if (isRecaptchaEnabled()) {
        if (!getRecaptchaToken(CONFIG_RECAPTCHA_BOX)) { showRecaptchaError(statusEl, false); return; }
    } else if (!isHumanCheckVerified('humanCheckBtnConfig')) {
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
                        <span style="display:block;font-size:13px;color:#0f4c47;margin-top:4px;font-family:Arial, Helvetica, sans-serif;">Typ: ${escapeEmailHtml(m.typeLabel)}</span>
                        <span style="display:block;font-size:13px;color:#0f4c47;margin-top:2px;font-family:Arial, Helvetica, sans-serif;">Średnica ślimaka: ${escapeEmailHtml(m.screwDiameter)} &middot; Agregat wtryskowy: ${escapeEmailHtml(m.unitStr)}</span>
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
            ['Wymiary formy (dł. x szer.)', `${r.moldLength} x ${r.moldWidth} mm`]
        ];
        if (r.tieClearance > 0) rows.push(['Prześwit między kolumnami', `${r.tieClearance} mm`]);
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
            <span style="display:block;font-size:13px;font-weight:700;color:#0abeb5;font-family:'Lato', Arial, sans-serif;">${escapeEmailHtml(m.modelName)} (${escapeEmailHtml(m.type)})</span>
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
        statusEl.textContent = 'Wysyłka e-mail nie została jeszcze skonfigurowana (brak danych EmailJS w pliku js/configurator.js) lub biblioteka nie wczytała się (brak internetu). Skorzystaj z przycisku „Pobierz PDF”, a konfigurację wyślij ręcznie.';
        document.getElementById('sendBtn').disabled = false;
        return;
    }

    // Token reCAPTCHA wygasa po ok. 2 minutach - mógł wygasnąć, zanim
    // klient kliknął "Tak, wyślij"
    const recaptchaToken = isRecaptchaEnabled() ? getRecaptchaToken(CONFIG_RECAPTCHA_BOX) : '';
    if (isRecaptchaEnabled() && !recaptchaToken) {
        showRecaptchaError(statusEl, true);
        document.getElementById('sendBtn').disabled = false;
        return;
    }

    statusEl.className = 'send-status';
    statusEl.textContent = 'Wysyłanie konfiguracji…';

    const machines = getConfiguredMachines();

    // Zwarty opis tekstowy KAŻDEJ wybranej maszyny (wersja czysto tekstowa,
    // zachowana dla zgodności wstecznej / na wypadek własnego, prostszego
    // szablonu) oraz gotowy HTML tych samych danych (machines_html) i danych
    // technologicznych (tech_details_html) do wstawienia wprost w aktualnym
    // szablonie e-mail (patrz emailjs_szablon.html). Każda maszyna ma
    // własny typ - konfiguracja może zawierać kilka typów naraz.
    const machinesSummaryText = machines.map((m, i) => {
        const optsText = m.selectedOptions.length > 0 ? m.selectedOptions.join(', ') : 'brak';
        return `Maszyna ${i + 1}: ${m.modelName} – ${m.typeLabel} (agregat ${m.unitStr}, średnica ślimaka ${m.screwDiameter}, ilość ${m.qty})\nOpcje dodatkowe: ${optsText}`;
    }).join('\n\n');

    const templateParams = {
        to_email: EMAILJS_CONFIG.recipient,
        client_copy_email: getVal('client_email'),
        machine_type: getConfigTypes().map(getTypeLabel).join(', '),
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
    // Nazwa parametru wymagana przez EmailJS (weryfikacja reCAPTCHA po ich stronie)
    if (recaptchaToken) templateParams['g-recaptcha-response'] = recaptchaToken;

    emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, templateParams).then(function () {
        statusEl.className = 'send-status success';
        statusEl.textContent = 'Konfiguracja została pomyślnie wysłana. Dziękujemy!';
        document.getElementById('sendBtn').disabled = false;
        resetRecaptcha(CONFIG_RECAPTCHA_BOX);
    }, function (error) {
        statusEl.className = 'send-status error';
        statusEl.textContent = 'Nie udało się wysłać konfiguracji. Spróbuj ponownie lub skorzystaj z przycisku „POBIERZ PDF”.';
        document.getElementById('sendBtn').disabled = false;
        resetRecaptcha(CONFIG_RECAPTCHA_BOX);
        console.error('EmailJS error:', error);
    });
}

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
    const hintEl = document.querySelector('#step1Viewer .viewer360-hint');
    const radios = Array.from(document.querySelectorAll('.machine-card input[name="machine_type"]'));

    if (!stage || !imageEl || !slider || !radios.length) return;

    const TOTAL_FRAMES = 37;

    // Foldery z klatkami 360° dla typów dostępnych w konfiguratorze - te
    // same zasoby (img/360-XX), co na podstronie "Maszyny". TL-A5 nie ma
    // jeszcze przygotowanego widoku 360° (analogicznie jak tam). Opis
    // (desc) jest tym samym tekstem, który wcześniej znajdował się w
    // kafelku po lewej - teraz wyświetlany pod nazwą modelu w panelu
    // podglądu 360° po prawej. levelY i shadow - wypoziomowanie maszyny
    // i cień na podłodze, te same wartości co w js/machines.js.
    const TYPE_VIEWER_DATA = {
        'DL-A5': { folder: '360-DL', available: true, levelY: 7.55, desc: 'Premium, energooszczędna wtryskarka dwupłytowa z systemem podwójnego ryglowania (Dual Lock) — do dużych, precyzyjnych wyprasek wymagających wysokiej siły zwarcia.' },
        'TH-A5': { folder: '360-TH', available: true, levelY: 1.19, desc: 'Klasyczna, energooszczędna wtryskarka hydrauliczna o dużej sztywności konstrukcji i wysokiej powtarzalności procesu wtrysku.' },
        'TE-A5': { folder: '360-TE', available: true, levelY: -0.51, desc: 'W pełni elektryczna wtryskarka zapewniająca najwyższą precyzję, powtarzalność wagi wypraski oraz najniższe zużycie energii.' },
        'TL-A5': { folder: '360-TL', available: false, levelY: 3.7, shadow: { y: 86.5, w: 88 }, still: 'img/opt/tl-a5-widok.jpg', desc: 'Wtryskarka bez kolumn (tie-bar-less) dająca pełną swobodę doboru wielkości formy, wielogniazdowości i automatyzacji.' },
        'VHA-RS': { folder: '360-VH', available: true, levelY: -0.62, shadow: { y: 89.5, w: 40 }, desc: 'Wysokiej klasy, pionowa wtryskarka hydrauliczna z obrotowym stołem (turntable), przeznaczona do formowania z insertami oraz pionowego układu wtrysku.' },
        'MULTI': { folder: '360-MULTI', available: true, levelY: -0.85, desc: 'Nowoczesna, pozioma wtryskarka dwukolorowa (2K) do formowania dwóch różnych tworzyw lub kolorów w jednym cyklu produkcyjnym (ONE-CYCLE).' },
        'Super-Foam': { folder: '360-SF', available: true, levelY: 4.34, desc: 'Dwupłytowa wtryskarka z systemem Dual Lock i technologią super spieniania, dedykowana produkcji dużych, lekkich elementów, w tym palet.' }
    };

    let currentType = 'DL-A5';
    const preloadedFolders = {};

    // Skala, z jakiej obraz "startuje" przy każdej zmianie typu, zanim
    // zmniejszy się do swojego standardowego rozmiaru (scale: 1) - ten sam
    // efekt i ta sama wartość co w initViewer360() na podstronie "Maszyny".
    const TYPE_CHANGE_START_SCALE = 1.18;

    const framePath = (frameIndex) => `img/${TYPE_VIEWER_DATA[currentType].folder}/${frameIndex}.jpg`;

    function preloadCurrentType() {
        const data = TYPE_VIEWER_DATA[currentType];
        if (!data.available || preloadedFolders[data.folder]) return;
        preloadedFolders[data.folder] = [];
        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const preload = new Image();
            preload.decoding = 'async';
            preload.src = `img/${data.folder}/${i}.jpg`;
            preloadedFolders[data.folder].push(preload);
        }
    }

    function setFrame(frameIndex) {
        if (!TYPE_VIEWER_DATA[currentType].available) return;
        const clamped = Math.max(1, Math.min(TOTAL_FRAMES, frameIndex));
        imageEl.src = framePath(clamped);
        slider.value = clamped;
        slider.style.setProperty('--fill', (((clamped - 1) / (TOTAL_FRAMES - 1)) * 100).toFixed(2) + '%');
    }

    // Obrót "na powitanie" - tak samo jak na podstronie "Maszyny" (js/machines.js):
    // jeden pełny obrót przy pierwszym otwarciu danego typu. Typ, który już się
    // obrócił (albo którego użytkownik sam obracał), po powrocie do niego stoi.
    // Lista żyje tylko w pamięci strony - po przeładowaniu każdy typ znowu
    // obróci się raz. Obrót przerywa każda interakcja (suwak / przeciąganie).
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const spunTypes = new Set();
    let spinTimer = null;
    let stageVisible = !('IntersectionObserver' in window);
    let introToken = 0;

    function stopSpin() {
        if (spinTimer) { clearInterval(spinTimer); spinTimer = null; }
    }

    function userTookOver() {
        stopSpin();
        introToken++;
        spunTypes.add(currentType);
    }

    function scheduleIntroSpin() {
        const typeName = currentType;
        const data = TYPE_VIEWER_DATA[typeName];
        if (reduceMotion || !data.available || !stageVisible || spunTypes.has(typeName)) return;
        const token = ++introToken;
        const imgs = preloadedFolders[data.folder] || [];
        // Start dopiero po wczytaniu wszystkich klatek, żeby obrót był płynny
        Promise.all(imgs.map((im) => (im.decode ? im.decode().catch(() => null) : null)))
            .then(() => setTimeout(() => {
                if (token !== introToken || !stageVisible || currentType !== typeName) return;
                spunTypes.add(typeName);
                stopSpin();
                let steps = 0;
                spinTimer = setInterval(() => {
                    steps++;
                    const current = parseInt(slider.value, 10) || 1;
                    setFrame(current >= TOTAL_FRAMES ? 1 : current + 1);
                    if (steps >= TOTAL_FRAMES) stopSpin();
                }, 55);
            }, 300));
    }

    // Obrót startuje dopiero, gdy widok jest na ekranie (np. po powrocie do kroku 1
    // albo po przewinięciu do widoku, jeśli typ zmieniono poza ekranem)
    if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
            stageVisible = entries[0].isIntersecting;
            if (stageVisible) scheduleIntroSpin();
            else introToken++;
        }, { threshold: 0.6 }).observe(stage);
    }

    function setViewerType(typeName) {
        if (!TYPE_VIEWER_DATA[typeName]) return;
        stopSpin();
        introToken++;
        currentType = typeName;
        const data = TYPE_VIEWER_DATA[currentType];

        if (nameLabel) nameLabel.textContent = currentType;
        if (descLabel) descLabel.textContent = data.desc || '';

        // Wypoziomowanie zdjęcia i cień na podłodze (tylko serie bez własnego cienia)
        stage.style.setProperty('--level-y', (data.levelY || 0) + '%');
        stage.classList.toggle('has-floor-shadow', !!data.shadow);
        if (data.shadow) {
            stage.style.setProperty('--shadow-y', data.shadow.y + '%');
            stage.style.setProperty('--shadow-w', data.shadow.w + '%');
        }
        // Podpis "Przeciągnij, aby obrócić" tylko tam, gdzie jest widok 360°
        if (hintEl) hintEl.style.visibility = data.available ? '' : 'hidden';

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
            stage.classList.remove('is-unavailable', 'has-still');
            imageEl.alt = 'Widok 360° wtryskarki WOOJIN PLAIMM';
            slider.disabled = false;
            preloadCurrentType();
            setFrame(1);
            scheduleIntroSpin();
        } else {
            // Brak klatek 360°: zdjęcie poglądowe (jeśli jest) + informacja "wkrótce"
            stage.classList.add('is-unavailable');
            stage.classList.toggle('has-still', !!data.still);
            if (data.still) {
                imageEl.src = data.still;
                imageEl.alt = `Wtryskarka WOOJIN PLAIMM ${typeName} – zdjęcie poglądowe`;
            }
            slider.disabled = true;
            slider.value = 1;
            slider.style.setProperty('--fill', '0%');
        }
    }

    radios.forEach((radio) => {
        radio.addEventListener('change', () => {
            if (radio.checked) setViewerType(radio.value);
        });
    });

    slider.addEventListener('input', () => {
        userTookOver();
        setFrame(parseInt(slider.value, 10));
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
        userTookOver();
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

    // Inicjalizacja - typ aktualnie zaznaczony w formularzu (checked)
    const checkedRadio = radios.find((r) => r.checked);
    setViewerType(checkedRadio ? checkedRadio.value : 'DL-A5');
})();
