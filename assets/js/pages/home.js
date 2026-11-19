/* ==========================================================================
   SEGREDOS DE MULHER — home.js
   Página inicial: carrossel do hero, categorias, novidades, mais vendidos,
   marquee e grade do Instagram.
   ========================================================================== */
(function () {
  'use strict';
  const S = window.SDM;
  if (!S) return;
  const { $, $$, icon, esc, CFG } = S;

  /* ---------- Ícones declarados no HTML (data-icon) ---------- */
  $$('.perk[data-icon]').forEach((el) => el.insertAdjacentHTML('afterbegin', icon(el.dataset.icon)));
  $$('.step[data-icon]').forEach((el) => el.insertAdjacentHTML('beforeend', icon(el.dataset.icon, 'step__icon')));
  $$('[data-stars]').forEach((el) => { el.innerHTML = icon('star').repeat(5); });

  /* ---------- Categorias (a partir de CATEGORIES) ---------- */
  const cats = $('#homeCats');
  if (cats) {
    cats.innerHTML = CATEGORIES.map((c) => `
      <li data-reveal><a class="cat" href="${c.key === 'sale' ? 'catalogo.html?sale=1' : 'catalogo.html?categoria=' + c.key}">
        <span class="cat__img"><img src="${esc(c.image)}" alt="" width="300" height="300" loading="lazy" decoding="async"></span>
        <span class="cat__label">${esc(c.label)}</span>
      </a></li>`).join('');
  }

  /* ---------- Trilhos de produtos ---------- */
  const byDate = (a, b) => String(b.createdAt).localeCompare(String(a.createdAt));
  const available = (p) => !S.isSoldOut(p);
  const news = PRODUCTS.filter((p) => p.badge === 'new' && available(p)).sort(byDate);
  // Completa com as peças mais recentes se houver poucas marcadas como "new"
  const newList = news.length >= 4 ? news : [...news, ...PRODUCTS.filter((p) => !news.includes(p) && available(p)).sort(byDate)].slice(0, 8);
  S.renderCards($('#homeNew'), newList.slice(0, 8));
  S.renderCards($('#homeBest'), PRODUCTS.filter((p) => p.bestseller && available(p)).slice(0, 8));
  S.observeReveal(document);
  S.initRails(document);

  // Setas dos trilhos
  $$('[data-rail-prev]').forEach((b) => { b.innerHTML = icon('arrowLeft'); });
  $$('[data-rail-next]').forEach((b) => { b.innerHTML = icon('arrowRight'); });

  /* ---------- Marquee (frase de marca) ---------- */
  const mq = $('#marquee');
  if (mq) {
    const phrase = ['Moda que revela você', 'Peça pelo WhatsApp', CFG.storeName, 'Novidades toda semana'];
    const item = `<span class="marquee__item">${phrase.map((t) => `<span>${esc(t)}</span>${icon('sparkle', 'sparkle')}`).join('')}</span>`;
    mq.innerHTML = item.repeat(4); // duplicado para o loop infinito sem emenda
  }

  /* ---------- Instagram (imagens locais, link para o perfil) ---------- */
  const ig = $('#homeInsta');
  if (ig) {
    const url = CFG.instagramUrl || '#';
    const igIcon = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/></svg>')}")`;
    ig.style.setProperty('--ig-icon', igIcon);
    ig.innerHTML = [1, 2, 3, 4, 5, 6].map((n) => `
      <a href="${esc(url)}" target="_blank" rel="noopener" data-reveal aria-label="Ver post ${n} no Instagram (abre em nova aba)">
        <img src="assets/img/instagram/insta-${n}.svg" alt="" width="300" height="300" loading="lazy" decoding="async">
      </a>`).join('');
    S.observeReveal(ig);
  }

  /* ---------- Mini card de produto no hero (dados de products.js) ---------- */
  $$('.hero__mini[data-product]').forEach((a) => {
    const p = S.getProduct(a.dataset.product);
    if (!p) { a.remove(); return; }
    const color = a.dataset.color || p.colors?.[0]?.name || '';
    a.href = S.productUrl(p.id, color && color !== p.colors?.[0]?.name ? color : '');
    a.setAttribute('aria-label', `${p.name}, ${S.fmt(p.price)}`);
    a.innerHTML = `${S.imgTag(S.imagesFor(p, color)[0], { alt: '', w: 300, h: 400, sizes: '160px' })}
      <span class="hero__mini-name">${esc(p.name)}</span>${S.priceHTML(p, 'hero__mini-price')}
      <span class="hero__mini-cta">Ver peça ${icon('arrowRight')}</span>`;
  });

  /* ---------- Carrossel do hero ---------- */
  const hero = $('#hero');
  if (!hero) return;
  const slides = $$('.hero__slide', hero);
  const dots = $$('.hero__dot', hero);
  const pauseBtn = $('#heroPause');
  $('#heroPrev').innerHTML = icon('arrowLeft', 'icon--sm');
  $('#heroNext').innerHTML = icon('arrowRight', 'icon--sm');
  let current = 0;
  let userPaused = S.reducedMotion(); // sem autoplay para quem prefere menos movimento
  let hoverPaused = false;
  let timer = null;

  function show(i, focus) {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, k) => {
      const on = k === current;
      s.classList.toggle('is-active', on);
      s.toggleAttribute('inert', !on);
      s.setAttribute('aria-hidden', String(!on));
    });
    dots.forEach((d, k) => (k === current ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
    if (focus) $('a', slides[current])?.focus({ preventScroll: true });
    restart();
  }
  function restart() {
    clearInterval(timer);
    if (!userPaused && !hoverPaused) timer = setInterval(() => !document.hidden && show(current + 1), 6500);
  }
  function renderPause() {
    pauseBtn.innerHTML = icon(userPaused ? 'play' : 'pause', 'icon--sm');
    pauseBtn.setAttribute('aria-label', userPaused ? 'Retomar troca automática' : 'Pausar troca automática');
  }
  pauseBtn.addEventListener('click', () => { userPaused = !userPaused; renderPause(); restart(); });
  $('#heroPrev').addEventListener('click', () => show(current - 1));
  $('#heroNext').addEventListener('click', () => show(current + 1));
  dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
  hero.addEventListener('mouseenter', () => { hoverPaused = true; restart(); });
  hero.addEventListener('mouseleave', () => { hoverPaused = false; restart(); });
  hero.addEventListener('focusin', () => { hoverPaused = true; restart(); });
  hero.addEventListener('focusout', (e) => { if (!hero.contains(e.relatedTarget)) { hoverPaused = false; restart(); } });
  hero.addEventListener('keydown', (e) => {
    if (e.target.closest('.hero__controls') && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) show(current + (e.key === 'ArrowRight' ? 1 : -1));
  });

  // Swipe no celular
  let x0 = null, y0 = null;
  hero.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  hero.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) show(current + (dx < 0 ? 1 : -1));
    x0 = null;
  }, { passive: true });

  renderPause();
  show(0);

  // Parallax suave na imagem do hero
  if (!S.reducedMotion()) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < hero.offsetHeight + 200) {
          const img = $('.hero__slide.is-active .hero__media img', hero);
          if (img) img.style.transform = `translate3d(0, ${Math.min(y * -0.08, 0)}px, 0)`;
        }
        ticking = false;
      });
    }, { passive: true });
  }
})();
