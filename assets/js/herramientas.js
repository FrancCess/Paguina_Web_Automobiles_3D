// =========================================================
// HERRAMIENTAS DEL MENÚ
// Comparador de modelos, guía de mantenimiento, calculadora de
// financiamiento, prueba de manejo, accesos a los 11 autos y favoritos.
// Los datos salen de autos.js (window.AUTOMOBILI).
// =========================================================
(() => {
    const CFG = window.AUTOMOBILI || { autos: [], colores: [] };
    const AUTOS = CFG.autos;
    const COLORES = CFG.colores;
    const API = () => window.Automobili3D || {};

    // ---------- utilidades ----------
    const mxn = (n) => '$' + Math.round(n).toLocaleString('en-US') + ' MXN';
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const preciosColor = (a) => COLORES.map((c) => ({
        nombre: c.nombre, hex: c.hex,
        precio: a.preciosPorColor && a.preciosPorColor[c.nombre] != null
            ? a.preciosPorColor[c.nombre]
            : Math.round((a.precioBase || 0) * (1 + (c.recargo || 0)) / 100) * 100,
    }));
    const precioDesde = (a) => Math.min(...preciosColor(a).map((p) => p.precio));
    const spec = (a, etiqueta) => { const s = (a.specs || []).find(([k]) => k === etiqueta); return s ? s[1] : null; };
    const opcionesAutos = (sel) => AUTOS.map((a, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${esc(a.nombre)}</option>`).join('');
    const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    // ---------- una página por característica ----------
    // index.html está en la raíz; las demás páginas están en paginas/
    const EN_SUBPAGINA = !!document.body.dataset.herramienta;
    const DIR_PAGINAS = EN_SUBPAGINA ? '' : 'paginas/';
    const INICIO = EN_SUBPAGINA ? '../index.html' : 'index.html';
    const PAGINAS = {
        comparador: 'comparador.html', mantenimiento: 'mantenimiento.html', financiamiento: 'financiamiento.html',
        prueba: 'prueba-de-manejo.html', garantia: 'garantia.html', seguro: 'seguro.html',
        accesorios: 'accesorios.html', entrega: 'entrega-a-domicilio.html', ficha: 'ficha.html',
    };
    const urlDe = (name, opts = {}) => {
        const q = new URLSearchParams();
        if (opts.i != null && AUTOS[opts.i]) q.set('auto', AUTOS[opts.i].modelo);
        if (opts.sel) q.set('comparar', opts.sel.filter((x) => x != null && AUTOS[x]).map((x) => AUTOS[x].modelo).join(','));
        const t = q.toString();
        return DIR_PAGINAS + PAGINAS[name] + (t ? '?' + t : '');
    };
    const idx = (modelo) => AUTOS.findIndex((a) => a.modelo === modelo);
    const PAGE = document.body.dataset.herramienta || null;   // en index.html no existe
    const goTool = (name, opts = {}) => { location.href = urlDe(name, opts); };
    const goHome = () => { location.href = INICIO; };

    // favoritos (mismo almacenamiento que usa el garaje 3D)
    const FK = 'automobili-favoritos';
    const favoritos = () => {
        if (API().favoritos) return API().favoritos();
        try { const v = JSON.parse(localStorage.getItem(FK) || '[]'); return Array.isArray(v) ? v : []; } catch { return window.__favMem || []; }
    };
    const toggleFav = (k) => {
        if (API().toggleFavorito) return API().toggleFavorito(k);
        const a = favoritos(), n = a.includes(k) ? a.filter((x) => x !== k) : a.concat(k);
        window.__favMem = n;
        try { localStorage.setItem(FK, JSON.stringify(n)); } catch { /* sin almacenamiento */ }
        window.dispatchEvent(new CustomEvent('a3d:fav'));
    };

    const root = PAGE ? document.querySelector('.tool-page') : null;
    const body = PAGE ? root.querySelector('#tool-body') : null;
    const crumb = PAGE ? root.querySelector('#tool-crumb') : null;
    const crumbRoot = PAGE ? root.querySelector('.rsv-crumb') : null;
    const scroller = { set scrollTop(v) { window.scrollTo({ top: v }); } };

    function renderPage(name, opts = {}) {
        const t = TOOLS[name];
        const val = (x) => (typeof x === 'function' ? x(opts) : x);
        const titulo = val(t.titulo);
        crumbRoot.firstChild.textContent = name === 'ficha' ? 'Modelos ' : ['garantia', 'seguro', 'accesorios', 'entrega'].includes(name) ? 'Servicios ' : 'Herramientas ';
        crumb.textContent = name === 'ficha' ? AUTOS[opts.i || 0].nombre : val(t.titulo);
        document.title = (name === 'ficha' ? AUTOS[opts.i || 0].nombre : titulo) + ' | VELOCE';
        body.innerHTML = `
            <span class="rsv-eyebrow">${val(t.eyebrow)}</span>
            <h1 class="rsv-title">${titulo}</h1>
            <p class="rsv-lead">${val(t.lead)}</p>
            <div id="tool-content"></div>`;
        t.render(body.querySelector('#tool-content'), opts);
        root.querySelectorAll('.tp-nav a').forEach((a) => a.classList.toggle('on', a.dataset.p === name));
    }
    const openTool = (name, opts) => goTool(name, opts);
    const closeTool = goHome;
    document.addEventListener('click', (e) => { if (PAGE && e.target.closest('[data-tool-close]')) goHome(); });

    const verEn3D = (i, hex) => { location.href = INICIO + '?ver=' + AUTOS[i].modelo + (hex ? '&color=' + encodeURIComponent(hex) : ''); };
    const reservar = (i, colorNombre) => { location.href = INICIO + '?reservar=' + AUTOS[i].modelo + '&color=' + encodeURIComponent(colorNombre); };

    // =====================================================
    // 1. COMPARADOR DE MODELOS
    // =====================================================
    const METRICAS = [
        { k: 'hp', label: 'Potencia', fmt: (a) => a.datos.hp != null ? `${a.datos.hp.toLocaleString('en-US')} hp` : 'Sin dato', val: (a) => a.datos.hp, mejor: 'max' },
        { k: 'acel', label: 'Aceleración', fmt: (a) => a.datos.acel != null ? `${a.datos.acel} s <small>${a.datos.acelRef} km/h</small>` : 'Sin dato', val: (a) => a.datos.acel, mejor: 'min' },
        { k: 'vel', label: 'Velocidad máxima', fmt: (a) => a.datos.velMax != null ? `${a.datos.velMax} km/h` : 'Sin dato', val: (a) => a.datos.velMax, mejor: 'max' },
        { k: 'precio', label: 'Precio desde', fmt: (a) => mxn(precioDesde(a)), val: (a) => precioDesde(a), mejor: 'min' },
    ];
    function renderComparador(el, opts) {
        const sel = opts.sel ? opts.sel.concat([null, null]).slice(0, 3) : [0, 6, 9];
        el.innerHTML = `
            <div class="cmp-pick row g-3 row-cols-1 row-cols-md-3">
                ${[0, 1, 2].map((n) => `
                    <div class="col"><div class="rsv-field">
                        <label for="cmp-${n}">Auto ${n + 1}${n === 2 ? ' <em>(opcional)</em>' : ''}</label>
                        <select id="cmp-${n}">${n === 2 ? '<option value="">— Ninguno —</option>' : ''}${opcionesAutos(sel[n])}</select>
                    </div></div>`).join('')}
            </div>
            <div id="cmp-out"></div>
            <p class="rsv-fine tool-note">0–96 km/h equivale a 0–60 mph, la medida que usan los fabricantes en Estados Unidos. "Sin dato": el fabricante no publica esa cifra o no la pudimos confirmar.</p>`;
        const selects = [0, 1, 2].map((n) => el.querySelector('#cmp-' + n));
        const draw = () => {
            const elegidos = selects.map((s) => s.value).filter((v) => v !== '').map(Number);
            const autos = elegidos.map((i) => AUTOS[i]);
            const cols = autos.length;
            let html = `<div class="cmp-grid" style="--cols:${cols}">`;
            html += '<div class="cmp-head cmp-label"></div>' + autos.map((a, n) => `
                <div class="cmp-head">
                    <span class="rsv-k">${a.anio} · ${esc(a.tipo)}</span>
                    <h3>${esc(a.nombre)}</h3>
                    <button type="button" class="cmp-3d" data-i="${elegidos[n]}">Ver en 3D →</button>
                </div>`).join('');
            METRICAS.forEach((m) => {
                const vals = autos.map(m.val);
                const nums = vals.filter((v) => v != null);
                const best = nums.length > 1 ? (m.mejor === 'max' ? Math.max(...nums) : Math.min(...nums)) : null;
                const max = Math.max(...nums, 0);
                html += `<div class="cmp-label">${m.label}</div>` + autos.map((a, n) => {
                    const v = vals[n];
                    const pct = v == null ? 0 : (m.mejor === 'min' && m.k === 'acel' ? (Math.min(...nums) / v) : v / max) * 100;
                    const win = v != null && v === best;
                    return `<div class="cmp-cell${win ? ' win' : ''}">
                        <div class="cmp-val">${m.fmt(a)}${win ? '<span class="cmp-tag">' + (m.k === 'precio' ? 'Más accesible' : 'Mejor') + '</span>' : ''}</div>
                        <div class="cmp-bar"><i style="width:${v == null ? 0 : Math.max(4, pct).toFixed(1)}%"></i></div>
                    </div>`;
                }).join('');
            });
            const filaTexto = (label, f) => `<div class="cmp-label">${label}</div>` + autos.map((a) => `<div class="cmp-cell"><div class="cmp-val">${esc(f(a) || 'Sin dato')}</div></div>`).join('');
            html += filaTexto('Tracción', (a) => a.datos.traccion);
            html += filaTexto('Motor', (a) => spec(a, 'Motor'));
            html += '</div>';
            el.querySelector('#cmp-out').innerHTML = html;
        };
        selects.forEach((s) => s.addEventListener('change', draw));
        el.addEventListener('click', (e) => { const b = e.target.closest('.cmp-3d'); if (b) verEn3D(Number(b.dataset.i)); });
        draw();
    }

    // =====================================================
    // 2. GUÍA DE MANTENIMIENTO
    // =====================================================
    // Intervalos de referencia en km: [uso normal sedán, uso normal deportivo]
    const SERVICIOS = [
        { n: 'Cambio de aceite y filtro', km: [10000, 7500], d: 'Usa el aceite sintético del grado que indica el manual.' },
        { n: 'Rotación y revisión de llantas', km: [10000, 8000], d: 'Revisa desgaste, presión y alineación.' },
        { n: 'Revisión de balatas y discos', km: [20000, 10000], d: 'Revisa el grosor de las balatas y el estado de los discos.' },
        { n: 'Filtro de aire de cabina', km: [20000, 20000], d: 'Mejora el aire acondicionado y la calidad del aire.' },
        { n: 'Filtro de aire del motor', km: [30000, 20000], d: 'Un filtro sucio resta potencia y aumenta el consumo.' },
        { n: 'Cambio de líquido de frenos', km: [40000, 30000], d: 'O cada 2 años, lo que ocurra primero.' },
        { n: 'Aceite de transmisión', km: [60000, 50000], d: 'Especialmente importante en cajas de doble embrague.' },
        { n: 'Bujías', km: [60000, 40000], d: 'Motores turbo y de alto rendimiento las desgastan antes.' },
        { n: 'Cambio de refrigerante', km: [80000, 60000], d: 'Evita sobrecalentamientos y corrosión.' },
    ];
    const CONSEJOS = {
        sedan: ['Revisa la presión de las llantas una vez al mes, en frío.', 'Cambia los limpiaparabrisas cada año, antes de la temporada de lluvias.', 'Si manejas mucho en ciudad o tráfico, usa el plan de "uso severo".'],
        deportivo: ['Deja que el motor alcance su temperatura antes de exigirle potencia.', 'Las llantas de alto desempeño se gastan más rápido: revísalas seguido.', 'Después de manejar fuerte, deja el motor en marcha un minuto para enfriar el turbo.'],
        hibrido: ['El sistema de alta tensión solo debe revisarlo un taller certificado de la marca.', 'El frenado regenerativo hace que las balatas duren más, pero revísalas igual.', 'Mantén la batería entre 20 % y 80 % si el auto pasará tiempo sin usarse.'],
        carreras: ['Los autos de carreras se mantienen por horas de uso en pista, no por kilómetros.', 'Después de cada evento se revisan frenos, suspensión, llantas y fluidos.', 'Sigue siempre el manual técnico del equipo y del fabricante.'],
    };
    const categoria = (a) => /carreras/i.test(a.tipo) ? 'carreras' : /h[ií]brido|el[eé]ctrico/i.test(a.tipo) ? 'hibrido' : /sed[aá]n/i.test(a.tipo) ? 'sedan' : 'deportivo';
    function renderMantenimiento(el, opts = {}) {
        el.innerHTML = `
            <div class="rsv-grid mnt-form">
                <div class="rsv-field"><label for="mnt-auto">Tu auto</label><select id="mnt-auto">${opcionesAutos(opts.i != null ? opts.i : 9)}</select></div>
                <div class="rsv-field"><label for="mnt-km">Kilometraje actual</label><input id="mnt-km" type="number" inputmode="numeric" min="0" step="500" value="25000"></div>
                <div class="rsv-field rsv-col-2"><label>Tipo de uso</label>
                    <div class="rsv-methods rsv-methods-inline" role="radiogroup" aria-label="Tipo de uso">
                        <label class="rsv-method"><input type="radio" name="mnt-uso" value="normal" checked><span><b>Normal</b><small>Carretera y ciudad sin mucho tráfico</small></span></label>
                        <label class="rsv-method"><input type="radio" name="mnt-uso" value="severo"><span><b>Severo</b><small>Tráfico pesado, calor, polvo o pista</small></span></label>
                    </div>
                </div>
            </div>
            <div id="mnt-out"></div>
            <p class="rsv-fine tool-note">Intervalos de referencia generales. Sigue siempre el manual de servicio de tu auto y las indicaciones de la agencia.</p>`;
        const draw = () => {
            const a = AUTOS[Number(el.querySelector('#mnt-auto').value)];
            const km = Math.max(0, Number(el.querySelector('#mnt-km').value) || 0);
            const severo = el.querySelector('input[name="mnt-uso"]:checked').value === 'severo';
            const cat = categoria(a);
            const idx = cat === 'sedan' ? 0 : 1;
            let filas = '';
            if (cat !== 'carreras') {
                const items = SERVICIOS.map((s) => {
                    const cada = Math.round(s.km[idx] * (severo ? 0.7 : 1) / 500) * 500;
                    const prox = (Math.floor(km / cada) + 1) * cada;
                    return { ...s, cada, prox, faltan: prox - km };
                }).sort((x, y) => x.faltan - y.faltan);
                filas = items.map((s) => {
                    const pronto = s.faltan <= s.cada * 0.15;
                    return `<div class="mnt-row${pronto ? ' soon' : ''}">
                        <div><b>${s.n}</b><small>${s.d}</small></div>
                        <div class="mnt-k"><span class="rsv-k">Cada</span>${s.cada.toLocaleString('en-US')} km</div>
                        <div class="mnt-k"><span class="rsv-k">Próximo</span>${s.prox.toLocaleString('en-US')} km</div>
                        <div class="mnt-k mnt-f"><span class="rsv-k">Faltan</span>${s.faltan.toLocaleString('en-US')} km${pronto ? '<em>Pronto</em>' : ''}</div>
                    </div>`;
                }).join('');
            } else {
                filas = '<div class="mnt-row"><div><b>Mantenimiento por horas de pista</b><small>Este auto de carreras no sigue un calendario por kilómetros.</small></div></div>';
            }
            el.querySelector('#mnt-out').innerHTML = `
                <fieldset class="rsv-block"><legend><span>01</span> Calendario de servicios · ${esc(a.nombre)}</legend>${filas}</fieldset>
                <fieldset class="rsv-block"><legend><span>02</span> Consejos para un ${cat === 'sedan' ? 'sedán' : cat === 'hibrido' ? 'deportivo híbrido o eléctrico' : cat === 'carreras' ? 'auto de carreras' : 'deportivo'}</legend>
                    <ul class="mnt-tips">${CONSEJOS[cat].map((t) => `<li>${t}</li>`).join('')}</ul>
                </fieldset>`;
        };
        el.addEventListener('input', draw);
        el.addEventListener('change', draw);
        draw();
    }

    // =====================================================
    // 3. CALCULADORA DE FINANCIAMIENTO
    // =====================================================
    function renderFinanciamiento(el, opts) {
        el.innerHTML = `
            <div class="fin-layout">
                <div>
                    <div class="rsv-grid">
                        <div class="rsv-field"><label for="fin-auto">Auto</label><select id="fin-auto">${opcionesAutos(opts.i != null ? opts.i : 0)}</select></div>
                        <div class="rsv-field"><label for="fin-color">Color</label><select id="fin-color"></select></div>
                        <div class="rsv-field rsv-col-2"><label for="fin-eng">Enganche <em id="fin-eng-v"></em></label><input id="fin-eng" type="range" min="10" max="60" step="5" value="20"></div>
                        <div class="rsv-field"><label for="fin-plazo">Plazo</label><select id="fin-plazo">${[12, 24, 36, 48, 60, 72].map((m) => `<option value="${m}"${m === 48 ? ' selected' : ''}>${m} meses</option>`).join('')}</select></div>
                        <div class="rsv-field"><label for="fin-tasa">Tasa anual <em>(editable)</em></label><input id="fin-tasa" type="number" min="0" max="60" step="0.1" value="13.5"></div>
                    </div>
                </div>
                <aside class="rsv-summary fin-res" id="fin-res"></aside>
            </div>
            <p class="rsv-fine tool-note">Cálculo ilustrativo con pagos fijos mensuales. No incluye seguro, comisión por apertura ni IVA sobre intereses; la tasa real depende de la institución financiera y de tu perfil.</p>`;
        const $ = (q) => el.querySelector(q);
        const fillColors = () => {
            const a = AUTOS[Number($('#fin-auto').value)];
            const pc = preciosColor(a);
            const ini = pc.find((p) => p.nombre === a.colorInicial) || pc[0];
            $('#fin-color').innerHTML = pc.map((p) => `<option value="${p.nombre}"${p === ini ? ' selected' : ''}>${p.nombre} · ${mxn(p.precio)}</option>`).join('');
        };
        const calc = () => {
            const i = Number($('#fin-auto').value), a = AUTOS[i];
            const c = preciosColor(a).find((p) => p.nombre === $('#fin-color').value) || preciosColor(a)[0];
            const precio = c.precio, eng = Number($('#fin-eng').value) / 100, n = Number($('#fin-plazo').value);
            const tasa = Math.max(0, Number($('#fin-tasa').value) || 0) / 100 / 12;
            const enganche = Math.round(precio * eng), monto = precio - enganche;
            const mensual = tasa > 0 ? monto * tasa / (1 - Math.pow(1 + tasa, -n)) : monto / n;
            const total = mensual * n, intereses = total - monto;
            $('#fin-eng-v').textContent = `· ${Math.round(eng * 100)} %`;
            const base = enganche + total;
            $('#fin-res').innerHTML = `
                <span class="rsv-k">${esc(a.nombre)} · ${esc(c.nombre)}</span>
                <div class="fin-big"><span class="rsv-k">Mensualidad estimada</span><strong>${mxn(mensual)}</strong><small>${n} pagos</small></div>
                <div class="fin-split" aria-hidden="true"><i style="width:${(enganche / base * 100).toFixed(1)}%"></i><i style="width:${(monto / base * 100).toFixed(1)}%"></i><i style="width:${(intereses / base * 100).toFixed(1)}%"></i></div>
                <dl class="rsv-totals">
                    <div><dt>Precio del auto</dt><dd>${mxn(precio)}</dd></div>
                    <div><dt><i class="dot d1"></i>Enganche</dt><dd>${mxn(enganche)}</dd></div>
                    <div><dt><i class="dot d2"></i>Monto a financiar</dt><dd>${mxn(monto)}</dd></div>
                    <div><dt><i class="dot d3"></i>Intereses totales</dt><dd>${mxn(intereses)}</dd></div>
                    <div class="rsv-total"><dt>Total pagado</dt><dd>${mxn(enganche + total)}</dd></div>
                </dl>
                <button type="button" class="rsv-btn fin-go">Reservar este auto</button>
                <button type="button" class="rsv-btn-ghost fin-3d">Ver en 3D</button>`;
        };
        $('#fin-auto').addEventListener('change', () => { fillColors(); calc(); });
        el.addEventListener('input', calc);
        el.addEventListener('change', (e) => { if (e.target.id !== 'fin-auto') calc(); });
        el.addEventListener('click', (e) => {
            const i = Number($('#fin-auto').value), a = AUTOS[i];
            if (e.target.closest('.fin-3d')) verEn3D(i);
            if (e.target.closest('.fin-go')) {
                const c = preciosColor(a).find((p) => p.nombre === $('#fin-color').value);
                reservar(i, c.nombre);
            }
        });
        fillColors(); calc();
    }

    // =====================================================
    // 4. AGENDAR PRUEBA DE MANEJO
    // =====================================================
    function renderPrueba(el, opts) {
        const man = new Date(); man.setDate(man.getDate() + 1);
        const lim = new Date(); lim.setDate(lim.getDate() + 45);
        el.innerHTML = `
            <form id="pm-form" novalidate>
                <fieldset class="rsv-block"><legend><span>01</span> Auto</legend>
                    <div class="rsv-field"><label for="pm-auto">¿Qué auto quieres manejar?</label><select id="pm-auto" name="auto">${opcionesAutos(opts.i != null ? opts.i : 0)}</select></div>
                </fieldset>
                <fieldset class="rsv-block"><legend><span>02</span> Tus datos</legend>
                    <div class="rsv-grid">
                        <div class="rsv-field rsv-col-2"><label for="pm-nombre">Nombre completo</label><input id="pm-nombre" name="nombre" type="text" autocomplete="name" placeholder="Nombre(s) y apellidos"><small class="rsv-error">Escribe tu nombre completo.</small></div>
                        <div class="rsv-field"><label for="pm-correo">Correo electrónico</label><input id="pm-correo" name="correo" type="email" autocomplete="email" placeholder="nombre@correo.com"><small class="rsv-error">Escribe un correo válido.</small></div>
                        <div class="rsv-field"><label for="pm-tel">Teléfono</label><input id="pm-tel" name="tel" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="10 dígitos" maxlength="10"><small class="rsv-error">Escribe un teléfono de 10 dígitos.</small></div>
                    </div>
                </fieldset>
                <fieldset class="rsv-block"><legend><span>03</span> Fecha y hora</legend>
                    <div class="rsv-grid">
                        <div class="rsv-field"><label for="pm-fecha">Fecha</label><input id="pm-fecha" name="fecha" type="date" min="${iso(man)}" max="${iso(lim)}"><small class="rsv-error">Elige una fecha de lunes a sábado.</small></div>
                        <div class="rsv-field"><label for="pm-hora">Horario</label><select id="pm-hora" name="hora"><option value="">Selecciona un horario</option><option>10:00</option><option>11:30</option><option>13:00</option><option>16:00</option><option>17:30</option></select><small class="rsv-error">Elige un horario.</small></div>
                    </div>
                </fieldset>
                <fieldset class="rsv-block"><legend><span>04</span> Requisitos</legend>
                    <label class="rsv-check"><input type="checkbox" name="licencia"><span>Cuento con licencia de conducir vigente y la presentaré el día de la prueba. <em>Obligatorio</em></span></label>
                    <label class="rsv-check"><input type="checkbox" name="privacidad"><span>Acepto que VELOCE use mis datos para agendar y confirmar la prueba de manejo. <em>Obligatorio</em></span></label>
                    <small class="rsv-error pm-legal">Debes aceptar ambos requisitos para continuar.</small>
                </fieldset>
                <div class="rsv-actions"><button type="button" class="rsv-btn-ghost" data-tool-close>Cancelar</button><button type="submit" class="rsv-btn">Agendar prueba de manejo</button></div>
            </form>
            <div class="rsv-done" id="pm-done" hidden></div>`;
        const f = el.querySelector('#pm-form');
        const tel = f.tel;
        tel.addEventListener('input', () => { tel.value = tel.value.replace(/\D/g, '').slice(0, 10); });
        const reglas = {
            nombre: (v) => v.trim().split(/\s+/).length >= 2,
            correo: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
            tel: (v) => v.length === 10,
            fecha: (v) => !!v && v >= f.fecha.min && v <= f.fecha.max && new Date(v + 'T12:00:00').getDay() !== 0,
            hora: (v) => v !== '',
        };
        f.addEventListener('submit', (e) => {
            e.preventDefault();
            let primero = null;
            Object.entries(reglas).forEach(([k, ok]) => {
                const bien = ok(f[k].value);
                f[k].closest('.rsv-field').classList.toggle('invalid', !bien);
                if (!bien && !primero) primero = f[k];
            });
            const legal = f.licencia.checked && f.privacidad.checked;
            f.querySelector('.pm-legal').classList.toggle('show', !legal);
            if (!legal && !primero) primero = f.licencia;
            if (primero) { primero.scrollIntoView({ behavior: 'smooth', block: 'center' }); primero.focus({ preventScroll: true }); return; }
            const a = AUTOS[Number(f.auto.value)];
            const folio = 'PM-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 90000) + 10000);
            const fecha = new Date(f.fecha.value + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
            f.hidden = true;
            const done = el.querySelector('#pm-done');
            done.hidden = false;
            done.innerHTML = `
                <div class="rsv-done-mark" aria-hidden="true"></div>
                <span class="rsv-eyebrow">Cita registrada</span>
                <h2 class="rsv-title">Te esperamos al volante</h2>
                <p class="rsv-lead">Folio <b>${folio}</b>. Enviamos la confirmación a <b>${esc(f.correo.value.trim())}</b>.</p>
                <dl class="rsv-totals rsv-done-list">
                    <div><dt>Auto</dt><dd>${esc(a.nombre)}</dd></div>
                    <div><dt>Fecha</dt><dd>${fecha}, ${f.hora.value}</dd></div>
                    <div><dt>Lugar</dt><dd>Showroom VELOCE</dd></div>
                </dl>
                <button type="button" class="rsv-btn" data-tool-close>Listo</button>`;
            scroller.scrollTop = 0;
        });
        const limpiar = (e) => { const fld = e.target.closest('.rsv-field.invalid'); if (fld && reglas[e.target.name] && reglas[e.target.name](e.target.value)) fld.classList.remove('invalid'); };
        f.addEventListener('input', limpiar);
        f.addEventListener('change', limpiar);
        f.addEventListener('change', () => { if (f.licencia.checked && f.privacidad.checked) f.querySelector('.pm-legal').classList.remove('show'); });
    }


    // =====================================================
    // 5. FICHA DE CADA AUTO
    // =====================================================
    const DESCRIPCION = {
        'ferrari458': 'Biplaza de motor central con un V8 atmosférico de 4.5 litros. Presentado en 2009, su diseño estuvo a cargo de Pininfarina y combina aerodinámica de competencia con un interior pensado para el uso diario.',
        'granturismo': 'La versión más radical del GranTurismo: un gran turismo de cuatro plazas con un V8 atmosférico de 4.7 litros, construido en Módena, que suma una puesta a punto más firme y ligera a la elegancia de Maserati.',
        'supra': 'La quinta generación del Supra, desarrollada junto con BMW. Monta un seis cilindros en línea turbo de 3.0 litros, tracción trasera y una carrocería compacta con proporciones de cofre largo.',
        'porsche918': 'Hiperdeportivo híbrido enchufable que combina un V8 de 4.6 litros con dos motores eléctricos. Se fabricaron 918 unidades y en 2013 bajó de los siete minutos en el circuito de Nürburgring.',
        'huracan': 'Convertible de motor central con un V10 atmosférico de 5.2 litros y tracción integral. El sistema de dinámica del EVO anticipa las reacciones del auto para ajustar tracción, dirección y suspensión.',
        'mclaren': 'La versión "Longtail" del 720S: más ligera, más potente y con aerodinámica más agresiva. Su techo rígido retráctil permite conducir a cielo abierto sin perder el carácter de auto de pista.',
        'chiron': 'Sucesor del Veyron, fabricado en Molsheim, Francia. Su motor W16 de 8.0 litros con cuatro turbos lo convirtió en uno de los autos de producción más potentes y veloces del mundo.',
        'jetta-gli': 'La versión deportiva del Jetta, fabricado en Puebla, México. Suma un motor 2.0 TSI turbo, suspensión más firme, frenos de mayor tamaño y detalles en rojo que lo distinguen.',
        'bmw-serie3': 'El sedán ejecutivo deportivo por excelencia. El 330i combina un cuatro cilindros turbo de 2.0 litros con la tracción integral xDrive, para un manejo ágil en cualquier condición.',
        'mazda3': 'Sedán compacto con el lenguaje de diseño Kodo de Mazda y un motor Skyactiv-G de 2.5 litros. Destaca por su interior de calidad premium y un manejo preciso para su categoría.',
        'audi-r8': 'La versión de carreras GT3 del Audi R8, con un V10 de 5.2 litros. Ha competido en campeonatos de todo el mundo y ganado carreras de resistencia como las 24 Horas de Nürburgring.',
    };
    function renderFicha(el, opts) {
        const i = opts.i || 0, a = AUTOS[i], pc = preciosColor(a);
        let sel = pc.find((p) => p.nombre === a.colorInicial) || pc[0];
        const d = a.datos || {};
        const otros = (i === 6 ? 0 : 6);
        const stat = (k, v, u) => `<div class="col"><div class="fc-stat h-100"><span class="rsv-k">${k}</span><strong>${v != null ? v : 'Sin dato'}</strong>${v != null && u ? `<small>${u}</small>` : ''}</div></div>`;
        el.innerHTML = `
            <div class="fc-hero">
                <div class="fc-chip" id="fc-chip" style="--c:${sel.hex}" aria-hidden="true"></div>
                <div class="fc-price"><span class="rsv-k">Precio en <b id="fc-color">${sel.nombre}</b></span><strong id="fc-precio">${mxn(sel.precio)}</strong><small>Desde ${mxn(precioDesde(a))}</small></div>
                <div class="fc-actions">
                    <button type="button" class="rsv-btn" data-act="reservar">Reservar</button>
                    <button type="button" class="rsv-btn-ghost" data-act="3d">Ver en 3D</button>
                    <button type="button" class="rsv-btn-ghost fc-fav" data-act="fav"></button>
                </div>
            </div>
            <fieldset class="rsv-block"><legend><span>01</span> Desempeño</legend>
                <div class="fc-stats row g-3 row-cols-2 row-cols-lg-4">
                    ${stat('Potencia', d.hp != null ? d.hp.toLocaleString('en-US') : null, 'hp')}
                    ${stat('Aceleración', d.acel, d.acel != null ? `s · ${d.acelRef} km/h` : '')}
                    ${stat('Vel. máxima', d.velMax, 'km/h')}
                    ${stat('Tracción', d.traccion, '')}
                </div>
            </fieldset>
            <fieldset class="rsv-block"><legend><span>02</span> Ficha técnica</legend>
                <dl class="rsv-totals fc-specs">
                    <div><dt>Año del modelo</dt><dd>${a.anio}</dd></div>
                    <div><dt>Tipo</dt><dd>${esc(a.tipo)}</dd></div>
                    ${(a.specs || []).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
                    <div><dt>Largo</dt><dd>${a.largo.toFixed(2)} m</dd></div>
                </dl>
            </fieldset>
            <fieldset class="rsv-block"><legend><span>03</span> Colores y precios</legend>
                <div class="fc-colors">${pc.map((p) => `<button type="button" class="fc-col${p === sel ? ' on' : ''}" data-col="${p.nombre}"><i style="background:${p.hex}"></i><span>${p.nombre}</span><b>${mxn(p.precio)}</b></button>`).join('')}</div>
            </fieldset>
            <fieldset class="rsv-block"><legend><span>04</span> Siguientes pasos</legend>
                <div class="fc-next row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-4">
                    <div class="col"><button type="button" class="h-100 w-100" data-go="comparador"><b>Comparar</b><span>Enfréntalo con otros modelos</span></button></div>
                    <div class="col"><button type="button" class="h-100 w-100" data-go="financiamiento"><b>Financiar</b><span>Calcula tu mensualidad</span></button></div>
                    <div class="col"><button type="button" class="h-100 w-100" data-go="prueba"><b>Prueba de manejo</b><span>Agenda tu cita</span></button></div>
                    <div class="col"><button type="button" class="h-100 w-100" data-go="mantenimiento"><b>Mantenimiento</b><span>Conoce su calendario</span></button></div>
                </div>
            </fieldset>
            <p class="rsv-fine tool-note">Precios en pesos mexicanos (MXN). No incluyen tenencia, placas ni gastos de registro.</p>`;
        const favBtn = el.querySelector('.fc-fav');
        const pintaFav = () => {
            const on = favoritos().includes(a.modelo);
            favBtn.textContent = on ? '♥  En mis favoritos' : '♡  Guardar en favoritos';
            favBtn.classList.toggle('on', on);
        };
        pintaFav();
        const onFav = () => { if (el.isConnected) pintaFav(); };
        window.addEventListener('a3d:fav', onFav);
        el.addEventListener('click', (e) => {
            const col = e.target.closest('[data-col]');
            if (col) {
                sel = pc.find((p) => p.nombre === col.dataset.col);
                el.querySelectorAll('.fc-col').forEach((b) => b.classList.toggle('on', b === col));
                el.querySelector('#fc-chip').style.setProperty('--c', sel.hex);
                el.querySelector('#fc-color').textContent = sel.nombre;
                el.querySelector('#fc-precio').textContent = mxn(sel.precio);
                return;
            }
            const act = e.target.closest('[data-act]');
            if (act && act.dataset.act === 'fav') { toggleFav(a.modelo); return; }
            if (act && act.dataset.act === '3d') { verEn3D(i, sel.hex); return; }
            if (act && act.dataset.act === 'reservar') {
                reservar(i, sel.nombre);
                return;
            }
            const go = e.target.closest('[data-go]');
            if (go) openTool(go.dataset.go, go.dataset.go === 'comparador' ? { sel: [i, otros] } : { i });
        });
    }

    // =====================================================
    // 6. SERVICIOS
    // =====================================================
    function renderGarantia(el) {
        el.innerHTML = `
            <fieldset class="rsv-block"><legend><span>01</span> Qué cubre</legend>
                <div class="sv-cards row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-4">
                    <div class="col"><div class="sv-card h-100"><span class="rsv-k">Defensa a defensa</span><strong>3 años</strong><small>o 60,000 km</small><p>Componentes mecánicos, eléctricos y electrónicos con defectos de fabricación.</p></div></div>
                    <div class="col"><div class="sv-card h-100"><span class="rsv-k">Tren motriz</span><strong>5 años</strong><small>o 100,000 km</small><p>Motor, transmisión, diferenciales y ejes.</p></div></div>
                    <div class="col"><div class="sv-card h-100"><span class="rsv-k">Pintura y corrosión</span><strong>6 años</strong><small>sin límite de km</small><p>Perforación por corrosión y defectos de la pintura de fábrica.</p></div></div>
                    <div class="col"><div class="sv-card h-100"><span class="rsv-k">Batería de alto voltaje</span><strong>8 años</strong><small>o 160,000 km</small><p>Solo para modelos híbridos o eléctricos.</p></div></div>
                </div>
            </fieldset>
            <fieldset class="rsv-block"><legend><span>02</span> Qué no cubre</legend>
                <ul class="mnt-tips">
                    <li>Piezas de desgaste normal: llantas, balatas, discos, plumas y focos.</li>
                    <li>Daños por accidentes, mal uso, competencias o modificaciones no autorizadas.</li>
                    <li>Mantenimientos no realizados a tiempo según el calendario del fabricante.</li>
                </ul>
            </fieldset>
            <fieldset class="rsv-block"><legend><span>03</span> Garantía extendida</legend>
                <div class="sv-cards sv-cards-3 row g-3 row-cols-1 row-cols-md-3">
                    <div class="col"><div class="sv-card h-100"><span class="rsv-k">Plus</span><strong>+1 año</strong><small>${mxn(14900)}</small><p>Extiende la cobertura defensa a defensa un año más.</p></div></div>
                    <div class="col"><div class="sv-card h-100 on"><span class="rsv-k">Premium · Recomendado</span><strong>+2 años</strong><small>${mxn(24900)}</small><p>Dos años más, con auto sustituto mientras tu auto está en el taller.</p></div></div>
                    <div class="col"><div class="sv-card h-100"><span class="rsv-k">Total</span><strong>+3 años</strong><small>${mxn(39900)}</small><p>Tres años más, asistencia vial y mantenimientos de mano de obra incluidos.</p></div></div>
                </div>
            </fieldset>
            <p class="rsv-fine tool-note">Programa de garantía de VELOCE. La garantía de fábrica de cada marca puede variar; un asesor te dará las condiciones de tu auto.</p>`;
    }
    function formContacto(el, extra, boton, ok) {
        el.insertAdjacentHTML('beforeend', `
            <form class="sv-form" novalidate>
                ${extra}
                <fieldset class="rsv-block"><legend><span>·</span> Tus datos</legend>
                    <div class="rsv-grid">
                        <div class="rsv-field rsv-col-2"><label>Nombre completo</label><input name="nombre" type="text" autocomplete="name" placeholder="Nombre(s) y apellidos"><small class="rsv-error">Escribe tu nombre completo.</small></div>
                        <div class="rsv-field"><label>Correo electrónico</label><input name="correo" type="email" autocomplete="email" placeholder="nombre@correo.com"><small class="rsv-error">Escribe un correo válido.</small></div>
                        <div class="rsv-field"><label>Teléfono</label><input name="tel" type="tel" inputmode="numeric" maxlength="10" placeholder="10 dígitos"><small class="rsv-error">Escribe un teléfono de 10 dígitos.</small></div>
                    </div>
                    <label class="rsv-check" style="margin-top:20px"><input type="checkbox" name="privacidad"><span>Acepto que VELOCE use mis datos para contactarme sobre esta solicitud. <em>Obligatorio</em></span></label>
                    <small class="rsv-error sv-legal">Debes aceptar para continuar.</small>
                </fieldset>
                <div class="rsv-actions"><button type="button" class="rsv-btn-ghost" data-tool-close>Cancelar</button><button type="submit" class="rsv-btn">${boton}</button></div>
            </form>`);
        const f = el.querySelector('.sv-form');
        f.tel.addEventListener('input', () => { f.tel.value = f.tel.value.replace(/\D/g, '').slice(0, 10); });
        const reglas = { nombre: (v) => v.trim().split(/\s+/).length >= 2, correo: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), tel: (v) => v.length === 10 };
        f.addEventListener('input', (e) => { const r = reglas[e.target.name]; if (r && r(e.target.value)) e.target.closest('.rsv-field').classList.remove('invalid'); });
        f.addEventListener('submit', (e) => {
            e.preventDefault();
            let primero = null;
            Object.entries(reglas).forEach(([k, r]) => { const bien = r(f[k].value); f[k].closest('.rsv-field').classList.toggle('invalid', !bien); if (!bien && !primero) primero = f[k]; });
            f.querySelector('.sv-legal').classList.toggle('show', !f.privacidad.checked);
            if (!f.privacidad.checked && !primero) primero = f.privacidad;
            if (primero) { primero.scrollIntoView({ behavior: 'smooth', block: 'center' }); primero.focus({ preventScroll: true }); return; }
            const folio = 'SV-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 90000) + 10000);
            el.innerHTML = `<div class="rsv-done" style="padding-top:30px">
                <div class="rsv-done-mark" aria-hidden="true"></div>
                <span class="rsv-eyebrow">Solicitud recibida</span>
                <h2 class="rsv-title">${ok}</h2>
                <p class="rsv-lead">Folio <b>${folio}</b>. Te escribiremos a <b>${esc(f.correo.value.trim())}</b>.</p>
                <button type="button" class="rsv-btn" data-tool-close>Listo</button></div>`;
            scroller.scrollTop = 0;
        });
    }
    function renderSeguro(el) {
        const cob = [
            ['Básica', 'Responsabilidad civil por daños a terceros, gastos médicos a ocupantes y asistencia legal.'],
            ['Limitada', 'Todo lo de la Básica más robo total del auto.'],
            ['Amplia', 'Todo lo de la Limitada más daños materiales a tu auto por choque, cristales y asistencia vial.'],
        ];
        el.innerHTML = `
            <fieldset class="rsv-block"><legend><span>01</span> Tipos de cobertura</legend>
                <div class="sv-cards sv-cards-3 row g-3 row-cols-1 row-cols-md-3">${cob.map(([n, d], k) => `<div class="col"><div class="sv-card h-100${k === 2 ? ' on' : ''}"><span class="rsv-k">${k === 2 ? 'Recomendada para autos nuevos' : 'Cobertura'}</span><strong>${n}</strong><p>${d}</p></div></div>`).join('')}</div>
            </fieldset>`;
        formContacto(el, `
            <fieldset class="rsv-block"><legend><span>02</span> Cotiza tu seguro</legend>
                <div class="rsv-grid">
                    <div class="rsv-field"><label>Auto</label><select name="auto">${opcionesAutos(0)}</select></div>
                    <div class="rsv-field"><label>Cobertura</label><select name="cobertura"><option>Amplia</option><option>Limitada</option><option>Básica</option></select></div>
                </div>
                <p class="rsv-fine" style="margin-top:14px">Comparamos tu auto con varias aseguradoras y te enviamos las mejores opciones.</p>
            </fieldset>`, 'Solicitar cotización', 'Estamos preparando tu cotización');
    }
    const ACCESORIOS = [
        ['Tapetes de alfombra premium', 'Interior', 3900],
        ['Cubierta exterior a la medida', 'Protección', 6500],
        ['Protección cerámica de pintura', 'Protección', 18900],
        ['Película de seguridad y polarizado', 'Protección', 7800],
        ['Cargador de pared para casa (11 kW)', 'Carga', 24500],
        ['Kit de limpieza y detallado', 'Cuidado', 2400],
        ['Cámara de tablero 4K', 'Tecnología', 4600],
        ['Portaequipaje de techo', 'Viaje', 9800],
    ];
    function renderAccesorios(el) {
        const carrito = new Set();
        el.innerHTML = `
            <div class="fin-layout">
                <div class="ac-grid row g-3 row-cols-1 row-cols-md-2">${ACCESORIOS.map(([n, c, p], k) => `
                    <div class="col"><button type="button" class="ac-item h-100 w-100" data-ac="${k}" aria-pressed="false">
                        <span class="rsv-k">${c}</span><b>${n}</b><span class="ac-p">${mxn(p)}</span><span class="ac-add">+ Agregar</span>
                    </button></div>`).join('')}</div>
                <aside class="rsv-summary fin-res" id="ac-res"></aside>
            </div>
            <p class="rsv-fine tool-note">Precios de referencia con instalación incluida. La disponibilidad depende del modelo de tu auto.</p>`;
        const res = el.querySelector('#ac-res');
        const draw = () => {
            const items = [...carrito].map((k) => ACCESORIOS[k]);
            const total = items.reduce((s, x) => s + x[2], 0);
            res.innerHTML = `
                <span class="rsv-k">Tu selección</span>
                ${items.length ? `<dl class="rsv-totals">${items.map(([n, , p]) => `<div><dt>${n}</dt><dd>${mxn(p)}</dd></div>`).join('')}<div class="rsv-total"><dt>Total</dt><dd>${mxn(total)}</dd></div></dl>
                <button type="button" class="rsv-btn ac-go">Solicitar estos accesorios</button>` : '<p class="menu-empty" style="margin-top:14px">Toca un accesorio para agregarlo.</p>'}`;
        };
        el.addEventListener('click', (e) => {
            const it = e.target.closest('[data-ac]');
            if (it) {
                const k = Number(it.dataset.ac);
                carrito.has(k) ? carrito.delete(k) : carrito.add(k);
                it.classList.toggle('on', carrito.has(k));
                it.setAttribute('aria-pressed', carrito.has(k));
                it.querySelector('.ac-add').textContent = carrito.has(k) ? '✓ Agregado' : '+ Agregar';
                draw();
                return;
            }
            if (e.target.closest('.ac-go')) {
                const lista = [...carrito].map((k) => ACCESORIOS[k][0]).join(', ');
                el.innerHTML = `<p class="rsv-lead" style="margin-bottom:0">Accesorios elegidos: <b>${esc(lista)}</b>.</p>`;
                formContacto(el, '', 'Enviar solicitud', 'Un asesor confirmará tu pedido');
            }
        });
        draw();
    }
    const ZONAS = [
        ['Ciudad de México y área metropolitana', 0], ['Guadalajara y área metropolitana', 0], ['Monterrey y área metropolitana', 0],
        ['Puebla, Querétaro o Toluca', 4900], ['León, Aguascalientes o San Luis Potosí', 7900], ['Veracruz, Morelia o Acapulco', 8900],
        ['Mérida, Cancún o Villahermosa', 14900], ['Tijuana, Hermosillo o Chihuahua', 16900],
    ];
    function renderEntrega(el) {
        el.innerHTML = `
            <fieldset class="rsv-block"><legend><span>01</span> Cómo funciona</legend>
                <div class="sv-steps row g-3 row-cols-2 row-cols-lg-4">
                    <div class="col"><div class="sv-step"><i>1</i><b>Firma digital</b><p>Revisas y firmas tus documentos desde casa.</p></div></div>
                    <div class="col"><div class="sv-step"><i>2</i><b>Inspección final</b><p>Revisamos tu auto en 160 puntos antes de salir.</p></div></div>
                    <div class="col"><div class="sv-step"><i>3</i><b>Traslado cerrado</b><p>Viaja en plataforma cerrada y asegurada, sin sumar kilómetros.</p></div></div>
                    <div class="col"><div class="sv-step"><i>4</i><b>Entrega con asesor</b><p>Un asesor te explica cada función de tu auto en tu puerta.</p></div></div>
                </div>
            </fieldset>
            <fieldset class="rsv-block"><legend><span>02</span> Costo de envío</legend>
                <div class="rsv-grid">
                    <div class="rsv-field rsv-col-2"><label for="en-zona">¿Dónde lo recibes?</label><select id="en-zona">${ZONAS.map(([z], k) => `<option value="${k}">${z}</option>`).join('')}</select></div>
                </div>
                <div class="sv-cost" id="en-cost"></div>
            </fieldset>`;
        const pinta = () => {
            const [z, c] = ZONAS[Number(el.querySelector('#en-zona').value)];
            el.querySelector('#en-cost').innerHTML = `<span class="rsv-k">${esc(z)}</span><strong>${c === 0 ? 'Gratis' : mxn(c)}</strong><small>${c === 0 ? 'Entrega en 2 a 4 días hábiles' : 'Entrega en 4 a 8 días hábiles'}</small>`;
        };
        el.querySelector('#en-zona').addEventListener('change', pinta);
        pinta();
        formContacto(el, '', 'Solicitar entrega a domicilio', 'Coordinaremos la entrega contigo');
    }

    const TOOLS = {
        comparador: { titulo: 'Comparador de modelos', eyebrow: 'Cara a cara', lead: 'Elige hasta tres autos del catálogo y compara su potencia, aceleración, velocidad máxima, tracción y precio.', render: renderComparador },
        mantenimiento: { titulo: 'Guía de mantenimiento', eyebrow: 'Cuida tu auto', lead: 'Indica tu auto y tu kilometraje para ver qué servicios vienen y cuánto falta para cada uno.', render: renderMantenimiento },
        financiamiento: { titulo: 'Calculadora de financiamiento', eyebrow: 'Planea tu compra', lead: 'Elige auto, color, enganche y plazo para estimar tu mensualidad.', render: renderFinanciamiento },
        ficha: { titulo: (o) => esc(AUTOS[o.i || 0].nombre), miga: (o) => 'Modelos', eyebrow: (o) => `${AUTOS[o.i || 0].anio} · ${esc(AUTOS[o.i || 0].tipo)} · ${String((o.i || 0) + 1).padStart(2, '0')} / ${AUTOS.length}`, lead: (o) => DESCRIPCION[AUTOS[o.i || 0].modelo] || '', render: renderFicha },
        garantia: { titulo: 'Garantía', eyebrow: 'Servicios', lead: 'Maneja con tranquilidad: tu auto está protegido desde el primer kilómetro.', render: renderGarantia },
        seguro: { titulo: 'Seguro de auto', eyebrow: 'Servicios', lead: 'Conoce los tipos de cobertura y pide una cotización para tu auto.', render: renderSeguro },
        accesorios: { titulo: 'Accesorios', eyebrow: 'Servicios', lead: 'Personaliza y protege tu auto. Elige los accesorios que te interesan y pide tu cotización.', render: renderAccesorios },
        entrega: { titulo: 'Entrega a domicilio', eyebrow: 'Servicios', lead: 'Recibe tu auto nuevo en la puerta de tu casa, en cualquier parte del país.', render: renderEntrega },
        prueba: { titulo: 'Agendar prueba de manejo', eyebrow: 'Vive la experiencia', lead: 'Elige el auto y el horario. Un asesor confirmará tu cita.', render: renderPrueba },
    };

    // ---------- menú de index.html ----------
    const linkAuto = (a, i, extra = '') => `<a class="menu-link" href="${urlDe('ficha', { i })}" data-title="${esc(a.nombre)}" data-desc="${a.anio} · ${esc(a.tipo)} · desde ${mxn(precioDesde(a))}">${extra}<b>${String(i + 1).padStart(2, '0')}</b>${esc(a.nombre)}</a>`;
    const ulModels = document.getElementById('menu-models');
    const ulFavs = document.getElementById('menu-favs');
    if (ulModels) ulModels.innerHTML = AUTOS.map((a, i) => `<li>${linkAuto(a, i)}</li>`).join('');
    const drawFavs = () => {
        if (!ulFavs) return;
        const fav = favoritos().map(idx).filter((i) => i >= 0);
        ulFavs.innerHTML = fav.length
            ? fav.map((i) => `<li>${linkAuto(AUTOS[i], i, '<span aria-hidden="true" style="color:var(--accent)">♥</span>')}<button type="button" class="menu-fav-del" data-del="${AUTOS[i].modelo}" aria-label="Quitar ${esc(AUTOS[i].nombre)} de favoritos">✕</button></li>`).join('')
            : '<li class="menu-empty">Aún no tienes favoritos. Abre un auto y toca «♡ Guardar en favoritos».</li>';
    };
    drawFavs();
    window.addEventListener('a3d:fav', drawFavs);
    window.addEventListener('menu:open', drawFavs);
    const mega = document.getElementById('mega-menu');
    if (mega) mega.addEventListener('click', (e) => { const del = e.target.closest('[data-del]'); if (del) toggleFav(del.dataset.del); });

    // ---------- index.html: abrir un auto o la reserva que pidió otra página ----------
    if (!PAGE) {
        const q = new URLSearchParams(location.search);
        const ver = idx(q.get('ver')), res = idx(q.get('reservar'));
        if (ver >= 0 || res >= 0) history.replaceState(null, '', location.pathname);
        if (ver >= 0) {
            const color = q.get('color');
            const intenta = (n) => { if (API().openCar) API().openCar(ver, color || undefined); else if (n > 0) setTimeout(() => intenta(n - 1), 200); };
            setTimeout(() => intenta(50), 300);
        }
        if (res >= 0) {
            const a = AUTOS[res], pc = preciosColor(a);
            const c = pc.find((p) => p.nombre === q.get('color')) || pc.find((p) => p.nombre === a.colorInicial) || pc[0];
            setTimeout(() => window.dispatchEvent(new CustomEvent('a3d:reservar', { detail: { name: a.nombre, year: a.anio, variant: c.nombre, color: c.hex, price: c.precio, specs: a.specs } })), 400);
        }
    }

    // ---------- página propia de cada característica ----------
    if (PAGE && TOOLS[PAGE]) {
        const q = new URLSearchParams(location.search);
        const opts = {};
        const ai = idx(q.get('auto'));
        if (ai >= 0) opts.i = ai;
        if (q.get('comparar')) { const sel = q.get('comparar').split(',').map(idx).filter((x) => x >= 0); if (sel.length) opts.sel = sel; }
        if (PAGE === 'ficha' && opts.i == null) opts.i = 0;
        renderPage(PAGE, opts);
        // menú desplegable "Modelos" (oscuro, con los 11 autos)
        const btnM = document.getElementById('tp-modelos-btn');
        const panelM = document.getElementById('tp-modelos-panel');
        const listaM = document.getElementById('tp-modelos-lista');
        if (btnM && panelM && listaM) {
            const actual = PAGE === 'ficha' ? opts.i : null;
            listaM.innerHTML = AUTOS.map((a, i) => `<li><a href="${urlDe('ficha', { i })}"${i === actual ? ' class="on" aria-current="page"' : ''}>
                <b>${String(i + 1).padStart(2, '0')}</b><span>${esc(a.nombre)}</span><small>${esc(a.tipo)}</small></a></li>`).join('');
            const coloca = () => {
                const r = btnM.getBoundingClientRect();
                panelM.style.top = Math.round(r.bottom + 8) + 'px';
                panelM.style.left = Math.round(Math.max(12, Math.min(r.right - panelM.offsetWidth, window.innerWidth - panelM.offsetWidth - 12))) + 'px';
            };
            const abre = (si) => {
                panelM.hidden = !si;
                btnM.setAttribute('aria-expanded', String(si));
                btnM.classList.toggle('on', si);
                if (si) { coloca(); requestAnimationFrame(() => panelM.classList.add('open')); } else panelM.classList.remove('open');
            };
            btnM.addEventListener('click', (e) => { e.stopPropagation(); abre(panelM.hidden); });
            document.addEventListener('click', (e) => { if (!panelM.hidden && !panelM.contains(e.target)) abre(false); });
            document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panelM.hidden) { abre(false); btnM.focus(); } });
            window.addEventListener('resize', () => { if (!panelM.hidden) coloca(); });
            window.addEventListener('scroll', () => { if (!panelM.hidden) coloca(); }, { passive: true });
            document.querySelector('.tp-nav').addEventListener('scroll', () => { if (!panelM.hidden) coloca(); }, { passive: true });
        }
    }

    window.AutomobiliHerramientas = { open: openTool, close: closeTool, url: urlDe };
})();
