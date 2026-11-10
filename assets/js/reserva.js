// =========================================================
// RESERVA — se abre con el botón "Reservar" de la ficha 3D.
// El script 3D envía el evento "a3d:reservar" con el auto,
// el color elegido y el precio.
// =========================================================
(() => {
    const PORCENTAJE_DEPOSITO = 0.05; // anticipo = 5 % del precio; cámbialo aquí si lo necesitas
    const deposito = (precio) => Math.round(precio * PORCENTAJE_DEPOSITO / 1000) * 1000;

    const root = document.getElementById('reserva');
    if (!root) return;

    const form = document.getElementById('rsv-form');
    const formView = document.getElementById('rsv-form-view');
    const doneView = document.getElementById('rsv-done-view');
    const scroller = root.querySelector('.rsv-scroll');
    const summary = document.getElementById('rsv-summary');
    const slot = root.querySelector('.rsv-summary-slot');
    const cardBox = document.getElementById('rsv-card');
    const legal = document.getElementById('rsv-legal');
    const submitBtn = form.querySelector('button[type="submit"]');

    const mxn = (n) => '$' + Number(n).toLocaleString('en-US') + ' MXN';
    let current = null;
    let lastFocus = null;

    const set = (key, value, prop = 'textContent') => {
        root.querySelectorAll(`[data-rsv="${key}"]`).forEach(el => { el[prop] = value; });
    };

    // ---------- Abrir / cerrar ----------
    function open(car) {
        current = car;
        set('modelo', car.name);
        set('anio', `${car.year} · Modelo`);
        set('color', car.variant);
        set('precio', mxn(car.price));
        set('deposito', mxn(deposito(car.price)));
        set('saldo', mxn(car.price - deposito(car.price)));
        root.querySelectorAll('[data-rsv="swatch"]').forEach(el => { el.style.background = car.color; });
        root.querySelectorAll('[data-rsv="specs"]').forEach(dl => {
            dl.innerHTML = (car.specs || []).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
        });
        // copia del resumen para la vista de celular
        const copy = summary.cloneNode(true);
        copy.removeAttribute('id');
        slot.replaceChildren(copy);

        formView.hidden = false;
        doneView.hidden = true;
        lastFocus = document.activeElement;
        root.hidden = false;
        scroller.scrollTop = 0;
        requestAnimationFrame(() => root.classList.add('open'));
        setTimeout(() => document.getElementById('rsv-nombre').focus({ preventScroll: true }), 350);
    }

    function close() {
        root.classList.remove('open');
        setTimeout(() => {
            root.hidden = true;
            if (!doneView.hidden) resetForm();
            if (lastFocus && lastFocus.focus) lastFocus.focus();
        }, 400);
    }

    function resetForm() {
        form.reset();
        form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
        form.querySelector('.rsv-legal-error').classList.remove('show');
        cardBox.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmar reserva y pagar anticipo';
    }

    window.addEventListener('a3d:reservar', (e) => open(e.detail));
    root.querySelectorAll('[data-rsv-close]').forEach(b => b.addEventListener('click', close));
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || root.hidden) return;
        if (!legal.hidden) { legal.hidden = true; return; }
        close();
    });

    // ---------- Método de pago ----------
    form.querySelectorAll('input[name="metodo"]').forEach(r => r.addEventListener('change', () => {
        cardBox.hidden = form.metodo.value !== 'tarjeta';
        cardBox.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    }));

    // ---------- Formato automático ----------
    const digits = (v) => v.replace(/\D/g, '');
    form.telefono.addEventListener('input', () => { form.telefono.value = digits(form.telefono.value).slice(0, 12); });
    form.numero.addEventListener('input', () => {
        form.numero.value = digits(form.numero.value).slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ');
    });
    form.vencimiento.addEventListener('input', (e) => {
        let d = digits(form.vencimiento.value).slice(0, 4);
        if (d.length >= 3 || (d.length === 2 && e.inputType !== 'deleteContentBackward')) d = d.slice(0, 2) + '/' + d.slice(2);
        form.vencimiento.value = d;
    });
    form.cvv.addEventListener('input', () => { form.cvv.value = digits(form.cvv.value).slice(0, 4); });

    // Fecha: a partir de mañana, máximo 60 días
    const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const limit = new Date(); limit.setDate(limit.getDate() + 60);
    form.fecha.min = iso(tomorrow);
    form.fecha.max = iso(limit);

    // ---------- Validación ----------
    const luhn = (num) => {
        let sum = 0, alt = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let n = +num[i];
            if (alt) { n *= 2; if (n > 9) n -= 9; }
            sum += n; alt = !alt;
        }
        return sum % 10 === 0;
    };

    const rules = {
        nombre: (v) => v.trim().split(/\s+/).length >= 2 && v.trim().length >= 5,
        correo: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
        telefono: (v) => form.lada.value === '+52' ? v.length === 10 : v.length >= 7,
        titular: (v) => v.trim().length >= 5,
        numero: (v) => { const d = digits(v); return d.length >= 13 && d.length <= 19 && luhn(d); },
        vencimiento: (v) => {
            const m = /^(\d{2})\/(\d{2})$/.exec(v); if (!m) return false;
            const mes = +m[1], anio = 2000 + +m[2];
            if (mes < 1 || mes > 12) return false;
            const now = new Date();
            return anio > now.getFullYear() || (anio === now.getFullYear() && mes >= now.getMonth() + 1);
        },
        cvv: (v) => /^\d{3,4}$/.test(v),
        fecha: (v) => {
            if (!v || v < form.fecha.min || v > form.fecha.max) return false;
            return new Date(v + 'T12:00:00').getDay() !== 0; // domingo cerrado
        },
        horario: (v) => v !== '',
    };

    function check(name) {
        const input = form[name];
        const field = input.closest('.rsv-field');
        const ok = rules[name](input.value);
        field.classList.toggle('invalid', !ok);
        return ok;
    }

    Object.keys(rules).forEach(name => {
        const input = form[name];
        input.addEventListener('blur', () => { if (input.value) check(name); });
        input.addEventListener('input', () => { if (input.closest('.rsv-field').classList.contains('invalid')) check(name); });
    });
    form.lada.addEventListener('change', () => { if (form.telefono.value) check('telefono'); });

    const legalBoxes = [form.terminos, form.privacidad];
    const legalError = form.querySelector('.rsv-legal-error');
    legalBoxes.forEach(cb => cb.addEventListener('change', () => {
        cb.closest('.rsv-check').classList.toggle('invalid', !cb.checked);
        if (legalBoxes.every(b => b.checked)) legalError.classList.remove('show');
    }));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const fields = ['nombre', 'correo', 'telefono', 'fecha', 'horario'];
        if (form.metodo.value === 'tarjeta') fields.push('titular', 'numero', 'vencimiento', 'cvv');

        let firstBad = null;
        fields.forEach(n => { if (!check(n) && !firstBad) firstBad = form[n]; });
        legalBoxes.forEach(cb => {
            cb.closest('.rsv-check').classList.toggle('invalid', !cb.checked);
            if (!cb.checked && !firstBad) firstBad = cb;
        });
        legalError.classList.toggle('show', !legalBoxes.every(b => b.checked));

        if (firstBad) {
            firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstBad.focus({ preventScroll: true });
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Procesando…';
        setTimeout(() => showDone(), 1200); // simulación del procesamiento
    });

    function showDone() {
        const folio = 'AUT-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 90000) + 10000);
        const fecha = new Date(form.fecha.value + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
        const pago = form.metodo.value === 'tarjeta'
            ? `${mxn(deposito(current.price))} · Tarjeta terminación ${digits(form.numero.value).slice(-4)}`
            : `${mxn(deposito(current.price))} · Pendiente por transferencia SPEI`;

        set('folio', folio);
        set('correo-final', form.correo.value.trim());
        set('vehiculo-final', `${current.name} · ${current.variant} · ${mxn(current.price)}`);
        set('pago-final', pago);
        set('contacto-final', `${form.contacto.value} · ${fecha}, ${form.horario.value}`);

        formView.hidden = true;
        doneView.hidden = false;
        scroller.scrollTop = 0;
    }

    // ---------- Textos legales ----------
    const LEGAL = {
        terminos: {
            title: 'Términos y condiciones de la reserva',
            html: `<ol>
                <li>La reserva queda formalizada al acreditarse el depósito de garantía equivalente al ${PORCENTAJE_DEPOSITO * 100} % del precio del vehículo.</li>
                <li>La unidad seleccionada se aparta en inventario durante 15 días naturales contados a partir de la confirmación del pago.</li>
                <li>El depósito se descuenta íntegramente del precio total del vehículo al momento de la compra.</li>
                <li>Si el cliente desiste de la compra, VELOCE podrá retener el depósito por concepto de gastos administrativos, salvo lo dispuesto en el punto 5.</li>
                <li>Si la operación no se concreta por causas imputables a VELOCE (falta de disponibilidad, error en la configuración o en el precio), el depósito se reembolsa al 100% en un plazo máximo de 10 días hábiles.</li>
                <li>El precio mostrado está en pesos mexicanos (MXN) y no incluye tenencia, placas ni gastos de registro.</li>
                <li>La reserva es personal e intransferible y está sujeta a la validación de identidad del comprador.</li>
            </ol>`,
        },
        privacidad: {
            title: 'Aviso de privacidad',
            html: `<p>VELOCE es responsable del tratamiento de los datos personales que proporcionas en este formulario: nombre, correo electrónico, teléfono y preferencias de contacto.</p>
                <p>Los utilizamos para dar seguimiento a tu solicitud de reserva, contactarte por medio de un asesor de ventas y agendar tu visita. Si lo autorizas, también para enviarte información sobre lanzamientos y eventos.</p>
                <p>Tus datos no se venden ni se comparten con terceros ajenos a la operación. Puedes ejercer tus derechos de acceso, rectificación, cancelación u oposición (derechos ARCO) en cualquier momento escribiendo a nuestro equipo de atención a clientes.</p>`,
        },
    };
    root.querySelectorAll('[data-rsv-legal]').forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        const t = LEGAL[btn.dataset.rsvLegal];
        document.getElementById('rsv-legal-title').textContent = t.title;
        document.getElementById('rsv-legal-body').innerHTML = t.html;
        legal.hidden = false;
        document.getElementById('rsv-legal-ok').focus();
    }));
    document.getElementById('rsv-legal-ok').addEventListener('click', () => { legal.hidden = true; });
    legal.addEventListener('click', (e) => { if (e.target === legal) legal.hidden = true; });
})();
