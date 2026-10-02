// =====================================================================
// PODSTRONA "KONTAKT" – formularz (wybór adresata + wysyłka mailto)
// oraz mapa Google wczytywana dopiero po zgodzie na pliki cookie lub
// po kliknięciu "Pokaż mapę Google".
// =====================================================================

(function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const statusEl = document.getElementById('contactFormStatus');

    const RECIPIENTS = {
        biuro: 'ploffice@wjpim.com',
        doradca: 'mczekalik@wjpim.com',
        serwis: 'woojin.choi@wjpim.com'
    };

    const TOPIC_LABELS = {
        biuro: 'Biuro',
        doradca: 'Doradca ds. produktów',
        serwis: 'Serwis'
    };

    function setStatus(text, type) {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.classList.toggle('success', type === 'success');
        statusEl.classList.toggle('error', type === 'error');
    }

    // Link "Serwis" w stopce (kontakt.html#serwis) od razu ustawia temat
    if (location.hash === '#serwis') {
        const serwisRadio = form.querySelector('input[name="contact_topic"][value="serwis"]');
        if (serwisRadio) serwisRadio.checked = true;
    }

    // Czyszczenie oznaczenia błędu po poprawieniu pola
    form.addEventListener('input', function (e) {
        if (e.target.matches('[aria-invalid="true"]')) e.target.removeAttribute('aria-invalid');
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Honeypot wypełniony - najpewniej bot; odrzucamy po cichu
        if (isHoneypotFilled('contact_hp')) return;

        const nameEl = document.getElementById('contact_name');
        const emailEl = document.getElementById('contact_email');
        const messageEl = document.getElementById('contact_message');
        const name = nameEl.value.trim();
        const email = emailEl.value.trim();
        const phone = document.getElementById('contact_phone').value.trim();
        const message = messageEl.value.trim();

        const invalid = [];
        if (!name) invalid.push(nameEl);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) invalid.push(emailEl);
        if (!message) invalid.push(messageEl);
        invalid.forEach(function (el) { el.setAttribute('aria-invalid', 'true'); });

        if (invalid.length) {
            setStatus(invalid.indexOf(emailEl) !== -1 && email
                ? 'Podany adres e-mail jest nieprawidłowy.'
                : 'Uzupełnij wymagane pola oznaczone gwiazdką (*).', 'error');
            invalid[0].focus();
            return;
        }

        if (!isHumanCheckVerified('humanCheckBtnContact')) {
            setStatus('Potwierdź, że nie jesteś robotem, zaznaczając pole powyżej, aby wysłać wiadomość.', 'error');
            const humanCheckBtn = document.getElementById('humanCheckBtnContact');
            if (humanCheckBtn) humanCheckBtn.focus();
            return;
        }

        const topic = (form.querySelector('input[name="contact_topic"]:checked') || {}).value || 'biuro';
        const recipient = RECIPIENTS[topic];
        const subject = 'Wiadomość ze strony WOOJIN PLAIMM - ' + TOPIC_LABELS[topic];
        const bodyLines = [
            'Imię i nazwisko: ' + name,
            'E-mail: ' + email,
            phone ? 'Telefon: ' + phone : null,
            '',
            message
        ].filter(function (line) { return line !== null; });

        const mailtoUrl = 'mailto:' + recipient +
            '?subject=' + encodeURIComponent(subject) +
            '&body=' + encodeURIComponent(bodyLines.join('\n'));

        setStatus('Otwieramy Twój program pocztowy z przygotowaną wiadomością…', 'success');
        window.location.href = mailtoUrl;
    });
})();

(function initMap() {
    const card = document.getElementById('mapCard');
    const placeholder = document.getElementById('mapPlaceholder');
    const btn = document.getElementById('loadMapBtn');
    if (!card || !placeholder) return;

    const MAP_SRC = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2551.0423086786854!2d19.056086776899723!3d50.25375820202931!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4716ce48b0a7249b%3A0x6b4fbbf55776c7c0!2sHutnicza%206%2C%2040-241%20Katowice!5e0!3m2!1spl!2spl!4v1700000000000!5m2!1spl!2spl';
    let loaded = false;

    function loadMap() {
        if (loaded) return;
        loaded = true;
        const iframe = document.createElement('iframe');
        iframe.src = MAP_SRC;
        iframe.title = 'Mapa dojazdu – ul. Hutnicza 6, Katowice';
        iframe.loading = 'lazy';
        iframe.referrerPolicy = 'no-referrer-when-downgrade';
        iframe.setAttribute('allowfullscreen', '');
        card.insertBefore(iframe, placeholder);
        iframe.addEventListener('load', function () { placeholder.remove(); });
    }

    if (btn) btn.addEventListener('click', loadMap);

    const consent = window.WJ && window.WJ.getConsent ? window.WJ.getConsent() : null;
    if (consent === 'accepted') loadMap();

    document.addEventListener('wj:consent', function (e) {
        if (e.detail === 'accepted') loadMap();
    });
})();
