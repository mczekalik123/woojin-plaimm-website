// =====================================================================
// PODSTRONA "KONTAKT" – formularz (wysyłka bezpośrednio ze strony przez
// EmailJS na jeden adres) oraz mapa Google wczytywana dopiero po zgodzie
// na pliki cookie lub po kliknięciu "Pokaż mapę Google".
// =====================================================================

(function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const statusEl = document.getElementById('contactFormStatus');
    const sendBtn = document.getElementById('contactSendBtn');

    // Wysyłka przez EmailJS - to samo konto (publicKey) i ta sama usługa
    // (serviceId) co w konfiguratorze (EMAILJS_CONFIG w js/configurator.js),
    // ale osobny szablon "Kontakt". Ustawienia szablonu w panelu EmailJS
    // (zakładka Settings): To Email = {{to_email}}, Reply To = {{reply_to}},
    // zaznaczone "Enable reCAPTCHA V2 verification" z tajnym kluczem.
    // Pusty templateId = jak wcześniej: wiadomość otwierana w programie pocztowym.
    const CONTACT_EMAILJS = {
        publicKey: 'byBOR_lP37-lDcIkR',
        serviceId: 'service_z0egkga',
        templateId: 'template_j3zplpr'
    };

    // Wszystkie wiadomości z formularza trafiają na jeden adres (ten sam,
    // na który wysyłane są konfiguracje - EMAILJS_CONFIG.recipient w js/configurator.js)
    const CONTACT_RECIPIENT = 'mczekalik@wjpim.com';

    function setStatus(text, type) {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.classList.toggle('success', type === 'success');
        statusEl.classList.toggle('error', type === 'error');
    }

    function canSendDirectly() {
        return !!CONTACT_EMAILJS.templateId && !!window.emailjs;
    }

    // Treść wiadomości do szablonu jako bezpieczny HTML z zachowanymi
    // akapitami (w szablonie {{{message_html}}} - trzy klamry, bez ucieczki)
    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function setSending(isSending) {
        if (!sendBtn) return;
        sendBtn.disabled = isSending;
        sendBtn.setAttribute('aria-busy', isSending ? 'true' : 'false');
    }

    // Google reCAPTCHA (wspólny kod i klucz: js/main.js). Token sprawdza
    // EmailJS przy wysyłce (weryfikacja włączona w ustawieniach szablonu).
    // Skrypt Google wczytujemy dopiero, gdy formularz zbliża się do ekranu.
    const RECAPTCHA_BOX = 'contactRecaptcha';
    swapHumanCheckForRecaptcha('humanCheckWrapContact', 'contactRecaptchaWrap');

    function loadRecaptcha() {
        renderRecaptcha(RECAPTCHA_BOX, function () {
            if (statusEl && statusEl.classList.contains('error')) setStatus('', null);
        });
    }

    if (isRecaptchaEnabled()) {
        const recaptchaWrap = document.getElementById('contactRecaptchaWrap');
        if ('IntersectionObserver' in window && recaptchaWrap) {
            const observer = new IntersectionObserver(function (entries) {
                if (entries.some(function (entry) { return entry.isIntersecting; })) {
                    observer.disconnect();
                    loadRecaptcha();
                }
            }, { rootMargin: '300px 0px' });
            observer.observe(recaptchaWrap);
        } else {
            loadRecaptcha();
        }
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

        if (isRecaptchaEnabled()) {
            if (!getRecaptchaToken(RECAPTCHA_BOX)) {
                if (isRecaptchaLoadFailed()) {
                    setStatus('Nie udało się wczytać zabezpieczenia reCAPTCHA – sprawdź połączenie lub wyłącz blokowanie skryptów dla tej strony i odśwież stronę.', 'error');
                    loadRecaptcha();
                } else {
                    setStatus('Zaznacz pole „Nie jestem robotem” powyżej, aby wysłać wiadomość.', 'error');
                }
                return;
            }
        } else if (!isHumanCheckVerified('humanCheckBtnContact')) {
            setStatus('Potwierdź, że nie jesteś robotem, zaznaczając pole powyżej, aby wysłać wiadomość.', 'error');
            const humanCheckBtn = document.getElementById('humanCheckBtnContact');
            if (humanCheckBtn) humanCheckBtn.focus();
            return;
        }

        const recipient = CONTACT_RECIPIENT;
        const subject = 'Wiadomość ze strony woojinplaimm.pl';

        if (canSendDirectly()) {
            // Kopię dostaje też nadawca: w ustawieniach szablonu EmailJS pole
            // "Cc" = {{from_email}} (patrz emailjs_szablon_kontakt.html)
            const params = {
                to_email: recipient,
                subject: subject,
                from_name: name,
                from_email: email,
                reply_to: email,
                phone: phone || '—',
                message: message,
                message_html: escapeHtml(message).replace(/\r?\n/g, '<br>'),
                sent_at: new Date().toLocaleString('pl-PL', { dateStyle: 'long', timeStyle: 'short' })
            };
            // Nazwa parametru wymagana przez EmailJS (weryfikacja reCAPTCHA po ich stronie)
            if (isRecaptchaEnabled()) params['g-recaptcha-response'] = getRecaptchaToken(RECAPTCHA_BOX);

            setStatus('Wysyłanie wiadomości…', null);
            setSending(true);
            emailjs.send(CONTACT_EMAILJS.serviceId, CONTACT_EMAILJS.templateId, params, { publicKey: CONTACT_EMAILJS.publicKey }).then(function () {
                setStatus('Dziękujemy! Wiadomość została wysłana. Odpowiemy najszybciej, jak to możliwe.', 'success');
                form.reset();
                const humanCheckBtn = document.getElementById('humanCheckBtnContact');
                if (humanCheckBtn) humanCheckBtn.setAttribute('aria-pressed', 'false');
                resetRecaptcha(RECAPTCHA_BOX);
                setSending(false);
            }, function (error) {
                setStatus('Nie udało się wysłać wiadomości. Spróbuj ponownie za chwilę albo napisz bezpośrednio na adres ' + recipient + '.', 'error');
                resetRecaptcha(RECAPTCHA_BOX);
                setSending(false);
                console.error('EmailJS error:', error);
            });
            return;
        }

        // Bez skonfigurowanego szablonu EmailJS (albo gdy biblioteka się nie
        // wczytała) - wiadomość przygotowana w programie pocztowym klienta
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
