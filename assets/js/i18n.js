// =====================================================================
// VELOCE · Cambio de idioma ES / EN
// Traduce el texto visible de la página usando i18n-diccionario.js.
// Funciona también con lo que se dibuja después (garaje 3D, calculadoras,
// formularios), y al volver a ES restaura exactamente el texto original.
// =====================================================================
(function () {
    'use strict';
    var D = window.VELOCE_EN || {};
    var CLAVE = 'veloce-idioma';
    var NUM = /\d[\d,\.]*/g;
    var LETRA = /[A-Za-zÁÉÍÓÚáéíóúÑñ]/;
    var ATRIBUTOS = ['placeholder', 'title', 'aria-label', 'alt'];
    var BORDES = /^([\s·,.:;!?¡¿()«»"“”—–\-]*)([\s\S]*?)([\s·,.:;!?¡¿()«»"“”—–\-]*)$/;
    var DIAS = { lunes: 'Monday', martes: 'Tuesday', 'miércoles': 'Wednesday', jueves: 'Thursday', viernes: 'Friday', 'sábado': 'Saturday', domingo: 'Sunday' };
    var MESES = { enero: 'January', febrero: 'February', marzo: 'March', abril: 'April', mayo: 'May', junio: 'June', julio: 'July', agosto: 'August', septiembre: 'September', octubre: 'October', noviembre: 'November', diciembre: 'December' };
    var MESES_CORTOS = { ene: 'Jan', feb: 'Feb', mar: 'Mar', abr: 'Apr', may: 'May', jun: 'Jun', jul: 'Jul', ago: 'Aug', sep: 'Sep', sept: 'Sep', oct: 'Oct', nov: 'Nov', dic: 'Dec' };

    // Plantillas: "Entrega en {n} a {n} días hábiles" -> función que rellena números
    var PLANTILLAS = {};
    Object.keys(D).forEach(function (k) {
        if (k.indexOf('{n}') === -1) return;
        PLANTILLAS[k] = D[k];
    });

    function porPlantilla(t) {
        var nums = t.match(NUM);
        if (!nums) return null;
        var clave = t.replace(NUM, '{n}');
        var v = PLANTILLAS[clave];
        if (v === undefined) return null;
        var i = 0;
        return v.replace(/\{n\}/g, function () { return nums[i++] || ''; });
    }

    function fecha(t) {
        // "sábado, 31 de octubre" / "31 de octubre de 2026" / "25 oct 2026"
        var m = t.match(/^(lunes|martes|miércoles|jueves|viernes|sábado|domingo),?\s+(\d{1,2})\s+de\s+([a-záéíóú]+)(.*)$/i);
        if (m && MESES[m[3].toLowerCase()]) {
            var d = DIAS[m[1].toLowerCase()];
            return d + ', ' + MESES[m[3].toLowerCase()] + ' ' + m[2] + m[4];
        }
        m = t.match(/^(\d{1,2})\s+de\s+([a-záéíóú]+)(?:\s+de\s+(\d{4}))?(.*)$/i);
        if (m && MESES[m[2].toLowerCase()]) return MESES[m[2].toLowerCase()] + ' ' + m[1] + (m[3] ? ', ' + m[3] : '') + m[4];
        return null;
    }

    function nucleo(t) {
        if (D.hasOwnProperty(t)) return D[t];
        var p = porPlantilla(t);
        if (p !== null) return p;
        return fecha(t);
    }

    // Traduce un texto completo (sin espacios al borde)
    function traducir(t) {
        if (!t || !LETRA.test(t)) return t;
        var r = nucleo(t);
        if (r !== null && r !== undefined) return r;
        // quitar signos al borde: ". Enviamos el resumen a" -> "Enviamos el resumen a"
        var m = t.match(BORDES);
        if (m && (m[1] || m[3]) && m[2]) {
            r = nucleo(m[2]);
            if (r !== null && r !== undefined) return m[1] + r + m[3];
        }
        // textos compuestos: "2015 · Deportivo híbrido · 04 / 11", "Garantía | VELOCE"
        var seps = [' · ', ' | ', ' — '];
        for (var i = 0; i < seps.length; i++) {
            if (t.indexOf(seps[i]) !== -1) {
                var partes = t.split(seps[i]);
                var cambio = false;
                var res = partes.map(function (p) {
                    var q = p.trim();
                    var tq = q ? traducir(q) : q;
                    if (tq !== q) { cambio = true; return p.replace(q, tq); }
                    return p;
                });
                if (cambio) return res.join(seps[i]);
            }
        }
        // créditos de los modelos: · "2011 Ferrari 458 Italia" por
        if (/["”]\s+por$/.test(t)) return t.replace(/\s+por$/, ' by');
        // colores y nombres propios no se traducen
        return t;
    }

    function traducirConEspacios(s) {
        var m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
        var core = m[2].replace(/\s+/g, ' ');
        var tr = traducir(core);
        return tr === core ? null : m[1] + tr + m[3];
    }

    // ---------- Estado ----------
    var idioma = 'es';
    try { idioma = localStorage.getItem(CLAVE) === 'en' ? 'en' : 'es'; } catch (e) {}
    var textos = new Map();   // nodo de texto -> { es, en }
    var atribs = new Map();   // elemento -> { atributo: { es, en } }
    var tituloES = null;

    function procesarTexto(n) {
        var p = n.parentNode;
        if (!p || p.nodeType !== 1) return;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEXTAREA') return;
        if (p.closest && p.closest('[data-no-traducir]')) return;
        var reg = textos.get(n);
        var v = n.nodeValue;
        if (reg && (v === reg.en || v === reg.es)) {
            if (idioma === 'en' && v === reg.es && reg.en !== null) n.nodeValue = reg.en;
            return;
        }
        // texto nuevo (o la página lo cambió): es el nuevo original
        if (!LETRA.test(v)) { textos.delete(n); return; }
        var en = traducirConEspacios(v);
        textos.set(n, { es: v, en: en });
        if (idioma === 'en' && en !== null) n.nodeValue = en;
    }

    function procesarAtributos(el) {
        if (el.hasAttribute && el.hasAttribute('data-idioma-btn')) return;
        for (var i = 0; i < ATRIBUTOS.length; i++) {
            var a = ATRIBUTOS[i];
            if (!el.hasAttribute(a)) continue;
            var v = el.getAttribute(a);
            var regs = atribs.get(el) || {};
            var reg = regs[a];
            if (reg && (v === reg.en || v === reg.es)) {
                if (idioma === 'en' && v === reg.es && reg.en !== null) el.setAttribute(a, reg.en);
                continue;
            }
            if (!LETRA.test(v)) continue;
            var en = traducirConEspacios(v);
            regs[a] = { es: v, en: en };
            atribs.set(el, regs);
            if (idioma === 'en' && en !== null) el.setAttribute(a, en);
        }
    }

    function recorrer(raiz) {
        if (!raiz) return;
        if (raiz.nodeType === 3) { procesarTexto(raiz); return; }
        if (raiz.nodeType !== 1 && raiz.nodeType !== 9 && raiz.nodeType !== 11) return;
        if (raiz.nodeType === 1) procesarAtributos(raiz);
        var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        var n;
        while ((n = w.nextNode())) {
            if (n.nodeType === 3) procesarTexto(n); else procesarAtributos(n);
        }
    }

    function titulo() {
        if (tituloES === null || (document.title !== tituloES && document.title !== traducir(tituloES))) tituloES = document.title;
        var t = idioma === 'en' ? traducir(tituloES) : tituloES;
        if (document.title !== t) document.title = t;
    }

    function aplicar() {
        document.documentElement.lang = idioma;
        // restaurar o traducir lo ya registrado
        textos.forEach(function (reg, n) {
            if (!n.isConnected) { textos.delete(n); return; }
            var quiero = idioma === 'en' && reg.en !== null ? reg.en : reg.es;
            if (n.nodeValue !== quiero) n.nodeValue = quiero;
        });
        atribs.forEach(function (regs, el) {
            if (!el.isConnected) { atribs.delete(el); return; }
            Object.keys(regs).forEach(function (a) {
                var r = regs[a]; var quiero = idioma === 'en' && r.en !== null ? r.en : r.es;
                if (el.getAttribute(a) !== quiero) el.setAttribute(a, quiero);
            });
        });
        recorrer(document.body);
        titulo();
        botones();
        try { window.dispatchEvent(new CustomEvent('veloce:idioma', { detail: idioma })); } catch (e) {}
    }

    // ---------- Botón ES / EN ----------
    function botones() {
        var bs = document.querySelectorAll('[data-idioma-btn]');
        for (var i = 0; i < bs.length; i++) {
            var b = bs[i];
            b.setAttribute('data-no-traducir', '');
            b.innerHTML = '<span class="' + (idioma === 'es' ? 'on' : '') + '">ES</span><i aria-hidden="true">/</i><span class="' + (idioma === 'en' ? 'on' : '') + '">EN</span>';
            b.setAttribute('aria-label', idioma === 'es' ? 'Cambiar idioma a inglés' : 'Switch language to Spanish');
            b.setAttribute('title', idioma === 'es' ? 'English' : 'Español');
            b.setAttribute('lang', idioma === 'es' ? 'en' : 'es');
        }
    }

    function cambiar(nuevo) {
        idioma = nuevo === 'en' ? 'en' : 'es';
        try { localStorage.setItem(CLAVE, idioma); } catch (e) {}
        aplicar();
    }

    document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('[data-idioma-btn]');
        if (!b) return;
        e.preventDefault();
        cambiar(idioma === 'es' ? 'en' : 'es');
    });

    // API para el resto de la página (por ejemplo, la imagen para compartir)
    window.VeloceIdioma = {
        actual: function () { return idioma; },
        t: function (s) { return idioma === 'en' ? traducir(String(s)) : String(s); },
        cambiar: cambiar
    };

    // ---------- Seguir los cambios de la página ----------
    var pendientes = new Set(), programado = false;
    function vaciar() {
        programado = false;
        pendientes.forEach(function (n) { if (n.isConnected) recorrer(n); });
        pendientes.clear();
        titulo();
    }
    var obs = new MutationObserver(function (lista) {
        for (var i = 0; i < lista.length; i++) {
            var m = lista[i];
            if (m.type === 'characterData') pendientes.add(m.target);
            else if (m.type === 'attributes') pendientes.add(m.target);
            else for (var j = 0; j < m.addedNodes.length; j++) pendientes.add(m.addedNodes[j]);
        }
        if (!programado) { programado = true; (window.queueMicrotask || setTimeout)(vaciar); }
    });

    function iniciar() {
        aplicar();
        obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
        var t = document.querySelector('title');
        if (t) new MutationObserver(titulo).observe(t, { childList: true, characterData: true, subtree: true });
    }
    if (document.body) iniciar(); else document.addEventListener('DOMContentLoaded', iniciar);
    // los botones y el título se terminan de leer después de este script
    document.addEventListener('DOMContentLoaded', function () { botones(); titulo(); });
})();
