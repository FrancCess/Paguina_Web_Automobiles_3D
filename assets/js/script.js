document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. HEADER DINÁMICO AL HACER SCROLL
    // ==========================================
    const header = document.getElementById('main-header');
    const updateHeader = () => header.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();

    // ==========================================
    // 2. MENÚ A PANTALLA COMPLETA Y CAMBIO DE IMÁGENES
    // ==========================================
    const openMenuBtn = document.getElementById('open-menu');
    const closeMenuBtn = document.getElementById('close-menu');
    const megaMenu = document.getElementById('mega-menu');
    const menuLinks = document.querySelectorAll('.menu-link[href^="#"]');
    const dynamicImage = document.getElementById('menu-dynamic-image');
    const captionTitle = document.getElementById('menu-caption-title');
    const captionDesc = document.getElementById('menu-caption-desc');

    const openMenu = () => {
        megaMenu.classList.add('open');
        document.body.style.overflow = 'hidden';
        window.dispatchEvent(new CustomEvent('menu:open'));
    };
    const closeMenu = () => {
        megaMenu.classList.remove('open');
        document.body.style.overflow = '';
    };
    window.AutomobiliMenu = { open: openMenu, close: closeMenu };

    openMenuBtn.addEventListener('click', openMenu);
    closeMenuBtn.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && megaMenu.classList.contains('open')) closeMenu();
    });

    // Los capítulos de la historia cierran el menú y bajan a su sección
    menuLinks.forEach(link => link.addEventListener('click', closeMenu));

    // Al pasar el mouse (o enfocar) cualquier opción, cambia la imagen y el texto de la derecha
    let lastImg = dynamicImage.getAttribute('src');
    const preview = (el) => {
        const img = el.getAttribute('data-img');
        if (el.dataset.title) captionTitle.textContent = el.dataset.title;
        if (el.dataset.desc) captionDesc.textContent = el.dataset.desc;
        if (img && img !== lastImg) {
            lastImg = img;
            dynamicImage.classList.add('fade');
            setTimeout(() => { dynamicImage.src = img; dynamicImage.classList.remove('fade'); }, 250);
        }
    };
    megaMenu.addEventListener('mouseover', (e) => { const el = e.target.closest('.menu-link'); if (el) preview(el); });
    megaMenu.addEventListener('focusin', (e) => { const el = e.target.closest('.menu-link'); if (el) preview(el); });

    // ==========================================
    // 3. BOTÓN "MODELOS" -> regresa al garaje 3D
    // ==========================================
    const modelsBtn = document.getElementById('models-btn');
    if (modelsBtn) modelsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ==========================================
    // 4. BOTÓN "CONFIGURA EL TUYO" -> abre la ficha 3D
    // ==========================================
    const configBtn = document.getElementById('config-btn');
    if (configBtn) configBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.Automobili3D) window.Automobili3D.openConfigurator();
    });

    // ==========================================
    // 5. ANIMACIONES DE APARICIÓN (Scroll Reveal)
    // ==========================================
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('active');
        });
    }, { root: null, rootMargin: '0px 0px -15% 0px', threshold: 0 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // ==========================================
    // 6. "SABER MÁS" -> despliega el texto ampliado de cada época
    // ==========================================
    document.querySelectorAll('.era-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const more = btn.parentElement.querySelector('.era-more');
            if (!more) return;
            const open = btn.getAttribute('aria-expanded') === 'true';
            more.hidden = open;
            btn.setAttribute('aria-expanded', String(!open));
            btn.textContent = open ? btn.dataset.label : 'Ver menos';
        });
    });

    // ==========================================
    // 7. DETECCIÓN DE SECCIÓN (resalta el capítulo en el menú)
    // ==========================================
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            menuLinks.forEach(link => {
                link.classList.toggle('active-link', link.getAttribute('href') === `#${id}`);
            });
        });
    }, { root: null, rootMargin: '-40% 0px -60% 0px', threshold: 0 });

    document.querySelectorAll('.era-card[id]').forEach(card => sectionObserver.observe(card));
});

// ==========================================
// 8. INTRO: avanza mientras cargan los autos que se ven al entrar
// ==========================================
(function () {
    const intro = document.getElementById('intro');
    if (!intro) return;
    const barra = document.getElementById('intro-bar');
    const texto = document.getElementById('intro-txt');
    const inicio = performance.now();
    const MINIMO = 2600, MAXIMO = 7000;
    let terminado = false;

    const avance = () => {
        const api = window.Automobili3D;
        if (!api || !api.estado) return { hechos: 0, total: 1 };
        const e = api.estado();
        const lista = (e.cerca || []).filter(k => k !== 'ferrari');
        const hechos = lista.filter(k => e.modelos[k] === 'ok' || e.modelos[k] === 'error' || (window.__MODELS__ && window.__MODELS__[k])).length;
        return { hechos, total: Math.max(1, lista.length) };
    };

    const cerrar = () => {
        if (terminado) return;
        terminado = true;
        window.__introFin = Math.round(performance.now() - inicio);
        barra.style.transform = 'scaleX(1)';
        try { sessionStorage.setItem('automobili-intro', '1'); } catch (e) {}
        setTimeout(() => {
            intro.classList.add('fin');
            document.documentElement.classList.remove('con-intro');
            setTimeout(() => intro.remove(), 1000);
        }, 350);
    };

    const paso = () => {
        if (terminado) return;
        const t = performance.now() - inicio;
        const { hechos, total } = avance();
        const p = Math.min(1, 0.12 + 0.88 * (hechos / total));
        barra.style.transform = 'scaleX(' + Math.max(p, Math.min(0.9, t / MAXIMO)).toFixed(3) + ')';
        if (texto && t > 1100) texto.textContent = 'Preparando el showroom · ' + hechos + ' / ' + total;
        if ((hechos >= total && t >= MINIMO) || t >= MAXIMO) return cerrar();
        setTimeout(paso, 200);
    };
    paso();
    intro.addEventListener('click', () => { if (performance.now() - inicio > 1200) cerrar(); });
})();
