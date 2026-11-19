/* ==========================================================================
   SEGREDOS DE MULHER — produto.js
   Página da peça: galeria (zoom/swipe/pinça), cor, tamanho, quantidade,
   pedido pelo WhatsApp, sacola, guia de medidas, compartilhar, JSON-LD,
   "Complete o look", "Você também pode gostar" e barra fixa no celular.
   ========================================================================== */
(function () {
  'use strict';
  const S = window.SDM;
  if (!S) return;
  const { $, $$, esc, icon, fmt, CFG } = S;

  const params = new URLSearchParams(location.search);
  const p = S.getProduct(params.get('id'));
  const root = $('#pdp');

  /* ---------- Peça não encontrada ---------- */
  if (!p) {
    document.title = `Peça não encontrada — ${CFG.storeName}`;
    const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex'; document.head.appendChild(robots);
    root.outerHTML = `<div class="empty-state" style="margin:24px 0 64px">${icon('hanger')}<h1 class="page-title">Peça não encontrada</h1>
      <p>Ela pode ter saído do catálogo ou o link está incompleto. Que tal ver as novidades?</p>
      <div class="empty-state__actions"><a class="btn" href="catalogo.html">Ver catálogo</a><a class="btn btn--whatsapp" href="${S.waHref(CFG.whatsappDefaultMessage)}" target="_blank" rel="noopener">${icon('whatsapp')}<span>Falar no WhatsApp</span></a></div></div>`;
    return;
  }

  const cat = S.getCategory(p.category);
  const sold = S.isSoldOut(p);
  const urlColor = params.get('cor');
  const sel = {
    color: (p.colors || []).some((c) => c.name === urlColor) ? urlColor : p.colors?.[0]?.name || '',
    size: p.sizes.length === 1 && !sold ? p.sizes[0] : null,
    qty: 1
  };

  /* ---------- Meta tags, canonical e dados estruturados ---------- */
  function setMeta() {
    document.title = `${p.name} — ${CFG.storeName}`;
    const desc = `${p.name} por ${fmt(p.price)}. ${p.description || ''}`.slice(0, 158);
    $('meta[name="description"]').setAttribute('content', desc);
    $('meta[property="og:title"]')?.setAttribute('content', `${p.name} — ${CFG.storeName}`);
    $('meta[property="og:description"]')?.setAttribute('content', desc);
    const abs = S.absoluteProductUrl(p.id);
    if (CFG.siteUrl) {
      const link = document.createElement('link'); link.rel = 'canonical'; link.href = abs; document.head.appendChild(link);
    }
    const base = abs ? abs.replace(/produto\.html.*$/, '') : '';
    const ld = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: p.name,
      sku: p.id,
      description: p.description,
      image: p.images.map((i) => (base ? base + S.imgSrc(i) : S.imgSrc(i))),
      brand: { '@type': 'Brand', name: CFG.storeName },
      category: cat?.label,
      color: (p.colors || []).map((c) => c.name).join(', '),
      offers: {
        '@type': 'Offer',
        priceCurrency: CFG.currency || 'BRL',
        price: p.price.toFixed(2),
        availability: sold ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        ...(abs ? { url: abs } : {})
      }
    };
    const s = document.createElement('script'); s.type = 'application/ld+json'; s.textContent = JSON.stringify(ld); document.head.appendChild(s);
  }

  /* ---------- Render da página ---------- */
  const images = () => S.imagesFor(p, sel.color);
  function galleryHTML() {
    const imgs = images();
    return `
      <div class="gallery__thumbs" role="group" aria-label="Miniaturas">${imgs.map((im, i) => `<button type="button" data-thumb="${i}" aria-label="Ver foto ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}>${S.imgTag(im, { alt: '', sizes: '84px' })}</button>`).join('')}</div>
      <div class="gallery__main">
        <div class="gallery__badges">${S.badgesHTML(p)}</div>
        <button class="icon-btn gallery__expand" type="button" id="galExpand" aria-label="Ampliar fotos">${icon('expand', 'icon--sm')}</button>
        <div class="gallery__track" id="galTrack" tabindex="0" aria-label="Fotos de ${esc(p.name)}. Use as setas para navegar.">
          ${imgs.map((im, i) => `<div class="gallery__slide" data-slide="${i}">${S.imgTag(im, { alt: `${p.name} — ${sel.color}, foto ${i + 1} de ${imgs.length}`, eager: i === 0, sizes: '(min-width: 900px) 55vw, 100vw', w: 900, h: 1200 })}</div>`).join('')}
        </div>
        <span class="gallery__counter" id="galCounter" aria-hidden="true">1 / ${imgs.length}</span>
      </div>
      <div class="gallery__dots" role="group" aria-label="Escolher foto">${imgs.map((_, i) => `<button type="button" data-dot="${i}" aria-label="Foto ${i + 1}"${i === 0 ? ' aria-current="true"' : ''}></button>`).join('')}</div>`;
  }

  function buyHTML() {
    if (sold) {
      return `<div class="pdp__buy" id="pdpBuy">
        <p class="field-error" style="margin:0">${icon('alert')}Esta peça está esgotada no momento.</p>
        <a class="btn btn--whatsapp btn--block" href="${S.waHref(S.questionMessage(p, 'restock'))}" target="_blank" rel="noopener">${icon('whatsapp')}<span>Avise-me quando chegar</span></a>
        <a class="btn btn--outline btn--block" href="catalogo.html?categoria=${esc(p.category)}&disponivel=1">Ver peças parecidas</a></div>`;
    }
    return `<div class="pdp__buy" id="pdpBuy">
      <button class="btn btn--whatsapp btn--block" type="button" id="buyWa">${icon('whatsapp')}<span>Pedir agora pelo WhatsApp</span></button>
      <div class="pdp__buy-row">
        <div class="qty qty--lg" role="group" aria-label="Quantidade">
          <button type="button" data-qty="-1" aria-label="Diminuir quantidade" disabled>${icon('minus')}</button>
          <output id="qtyOut" aria-live="polite">1</output>
          <button type="button" data-qty="1" aria-label="Aumentar quantidade">${icon('plus')}</button>
        </div>
        <button class="btn btn--outline btn--block" type="button" id="buyBag">${icon('bag')}<span>Adicionar à sacola</span></button>
      </div>
    </div>`;
  }

  function render() {
    const details = (p.details || []).map((d) => `<li>${esc(d)}</li>`).join('');
    root.innerHTML = `
      <div class="gallery" id="gallery">${galleryHTML()}</div>
      <div class="pdp__info">
        <div class="pdp__head">
          <a class="eyebrow eyebrow--line" href="catalogo.html?categoria=${esc(p.category)}">${esc(cat?.label || '')}</a>
          <h1 class="pdp__title">${esc(p.name)}</h1>
          ${S.priceHTML(p, 'pdp__price')}
          <p class="pdp__desc">${esc(p.description || '')}</p>
        </div>
        ${p.colors?.length ? `<div><p class="field-label color-label" id="pdp-color-label">Cor:<span id="colorName">${esc(sel.color)}</span></p>${S.colorsHTML(p, sel.color)}</div>` : ''}
        <div>
          <div class="option-head"><p class="field-label" id="pdp-size-label">Tamanho${sel.size ? `<span id="sizeName">${esc(sel.size)}</span>` : '<span id="sizeName"></span>'}</p>
            ${p.measures ? `<button class="size-guide-btn" type="button" data-size-guide="${esc(p.id)}">${icon('ruler')}Guia de medidas</button>` : ''}</div>
          ${S.sizesHTML(p, sel.size, 'pdp')}
          <p class="field-error" id="sizeError" role="alert" hidden>${icon('alert')}Escolha um tamanho para continuar.</p>
          ${S.unavailable(p).length && !sold ? '<p class="muted" style="font-size:.85rem;margin-top:8px">Tamanhos riscados estão esgotados. <a style="text-decoration:underline" target="_blank" rel="noopener" href="' + S.waHref(S.questionMessage(p, 'restock')) + '">Avise-me quando voltar</a></p>' : ''}
        </div>
        ${buyHTML()}
        <div class="pdp__links">
          <a class="pdp__ask" href="${S.waHref(S.questionMessage(p))}" target="_blank" rel="noopener">${icon('message')}Tirar dúvida sobre esta peça</a>
          <button class="pdp__ask" type="button" id="shareBtn">${icon('share')}Compartilhar</button>
          <button class="pdp__ask" type="button" data-fav="${esc(p.id)}" aria-pressed="false">${icon('heart')}<span>Favoritar</span></button>
        </div>
        <ul class="pdp__assure">
          <li>${icon('whatsapp')}<span>Atendimento personalizado pelo WhatsApp</span></li>
          <li>${icon('truck')}<span>Frete e forma de pagamento combinados na conversa</span></li>
          <!-- TODO(cliente): confirmar a política de trocas -->
          <li>${icon('refresh')}<span>Trocas: <a href="sobre.html#trocas" style="text-decoration:underline">consulte as condições</a></span></li>
        </ul>
        <div class="accordion">
          ${details ? `<details open><summary>Detalhes da peça ${icon('plus')}</summary><div class="accordion__body"><ul>${details}</ul></div></details>` : ''}
          ${p.measures ? `<details><summary>Medidas ${icon('plus')}</summary><div class="accordion__body"><p>Confira a tabela completa de medidas antes de escolher. <button class="size-guide-btn" type="button" data-size-guide="${esc(p.id)}">${icon('ruler')}Abrir guia de medidas</button></p></div></details>` : ''}
          <details><summary>Como comprar ${icon('plus')}</summary><div class="accordion__body"><ol style="list-style:decimal;padding-left:18px"><li>Escolha cor e tamanho.</li><li>Toque em “Pedir agora pelo WhatsApp” ou junte mais peças na sacola.</li><li>Confirmamos estoque, frete e pagamento na conversa.</li></ol></div></details>
        </div>
        <nav class="pdp__pager" aria-label="Outras peças" id="pager"></nav>
      </div>`;

    bindGallery();
    S.bindRadioGroup($('[data-colors]', root), 'color', (v) => {
      sel.color = v;
      $('#colorName').textContent = v;
      $('#gallery').innerHTML = galleryHTML();
      bindGallery();
      history.replaceState(null, '', S.productUrl(p.id, v === p.colors[0].name ? '' : v));
      renderBuybar();
    });
    S.bindRadioGroup($('[data-sizes]', root), 'size', (v) => {
      sel.size = v;
      $('#sizeName').textContent = v;
      $('#sizeError').hidden = true;
      $('[data-sizes]', root).classList.remove('is-invalid');
    });
    bindBuy();
    renderPager();
    S.Favs.sync();
  }

  /* ---------- Galeria: swipe, miniaturas, zoom no hover ---------- */
  function bindGallery() {
    const track = $('#galTrack');
    const slides = $$('.gallery__slide', track);
    const goTo = (i, smooth = true) => track.scrollTo({ left: track.clientWidth * i, behavior: smooth && !S.reducedMotion() ? 'smooth' : 'auto' });
    const current = () => Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    const mark = () => {
      const i = current();
      $$('[data-thumb]').forEach((b) => (Number(b.dataset.thumb) === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      $$('[data-dot]').forEach((b) => (Number(b.dataset.dot) === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      $('#galCounter').textContent = `${i + 1} / ${slides.length}`;
    };
    track.addEventListener('scroll', S.debounce(mark, 50), { passive: true });
    $$('[data-thumb]').forEach((b) => b.addEventListener('click', () => goTo(Number(b.dataset.thumb))));
    $$('[data-dot]').forEach((b) => b.addEventListener('click', () => goTo(Number(b.dataset.dot))));
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(Math.min(current() + 1, slides.length - 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(Math.max(current() - 1, 0)); }
      if (e.key === 'Enter') openLightbox(current());
    });
    $('#galExpand').addEventListener('click', (e) => openLightbox(current(), e.currentTarget));

    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    slides.forEach((s, i) => {
      if (canHover) {
        s.addEventListener('mouseenter', () => s.classList.add('is-zoomed'));
        s.addEventListener('mouseleave', () => s.classList.remove('is-zoomed'));
        s.addEventListener('mousemove', (e) => {
          const r = s.getBoundingClientRect();
          s.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
          s.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
        });
      }
      s.addEventListener('click', () => openLightbox(i, track));
    });
  }

  /* ---------- Lightbox com pinça (pointer events) ---------- */
  const lb = { i: 0, scale: 1, x: 0, y: 0, pointers: new Map(), start: null };
  const lbImg = $('#lbImg');
  $('#lbClose').innerHTML = icon('x');
  $('#lbPrev').innerHTML = icon('chevronLeft');
  $('#lbNext').innerHTML = icon('chevronRight');
  function lbApply() { lbImg.style.transform = `translate(${lb.x}px, ${lb.y}px) scale(${lb.scale})`; }
  function lbReset() { lb.scale = 1; lb.x = 0; lb.y = 0; lbApply(); }
  function lbShow(i) {
    const imgs = images();
    lb.i = (i + imgs.length) % imgs.length;
    const entry = imgs[lb.i];
    lbImg.src = S.imgSrc(entry);
    if (typeof entry === 'object' && entry.srcset) { lbImg.srcset = entry.srcset; lbImg.sizes = '100vw'; } else lbImg.removeAttribute('srcset');
    lbImg.alt = `${p.name} — foto ${lb.i + 1} de ${imgs.length}`;
    $('#lbCounter').textContent = `${lb.i + 1} / ${imgs.length}`;
    const multi = imgs.length > 1;
    $('#lbPrev').hidden = !multi; $('#lbNext').hidden = !multi;
    lbReset();
  }
  function openLightbox(i, trigger) { lbShow(i); S.Layers.open('lightbox', trigger); }
  lbImg.style.transformOrigin = '50% 50%';
  lbImg.style.transition = 'transform .15s ease-out';
  $('#lbPrev').addEventListener('click', () => lbShow(lb.i - 1));
  $('#lbNext').addEventListener('click', () => lbShow(lb.i + 1));
  $('#lightbox').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') lbShow(lb.i + 1);
    if (e.key === 'ArrowLeft') lbShow(lb.i - 1);
  });
  const stage = $('#lbStage');
  const dist = () => { const [a, b] = [...lb.pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    stage.setPointerCapture(e.pointerId);
    lb.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    lbImg.style.transition = 'none';
    lb.start = { x: e.clientX, y: e.clientY, tx: lb.x, ty: lb.y, scale: lb.scale, d: lb.pointers.size === 2 ? dist() : 0, t: Date.now() };
  });
  stage.addEventListener('pointermove', (e) => {
    if (!lb.pointers.has(e.pointerId)) return;
    lb.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (lb.pointers.size === 2) {
      if (!lb.start.d) lb.start.d = dist();
      lb.scale = Math.min(4, Math.max(1, lb.start.scale * (dist() / lb.start.d)));
    } else if (lb.scale > 1) {
      lb.x = lb.start.tx + (e.clientX - lb.start.x);
      lb.y = lb.start.ty + (e.clientY - lb.start.y);
    }
    lbApply();
  });
  const end = (e) => {
    if (!lb.pointers.has(e.pointerId)) return;
    lb.pointers.delete(e.pointerId);
    lbImg.style.transition = 'transform .15s ease-out';
    if (lb.scale <= 1.02) {
      // Sem zoom: arrastar para os lados troca a foto
      const dx = e.clientX - lb.start.x;
      if (Math.abs(dx) > 60 && lb.pointers.size === 0) lbShow(lb.i + (dx < 0 ? 1 : -1)); else lbReset();
    }
    if (lb.pointers.size === 1) { const [pt] = [...lb.pointers.values()]; lb.start = { x: pt.x, y: pt.y, tx: lb.x, ty: lb.y, scale: lb.scale, d: 0 }; }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  // Toque duplo / clique duplo alterna o zoom
  stage.addEventListener('dblclick', (e) => {
    if (e.target.closest('button')) return;
    if (lb.scale > 1) lbReset(); else { lb.scale = 2.5; lbApply(); }
  });
  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    lb.scale = Math.min(4, Math.max(1, lb.scale - e.deltaY * 0.002));
    if (lb.scale === 1) { lb.x = 0; lb.y = 0; }
    lbApply();
  }, { passive: false });

  /* ---------- Compra ---------- */
  function validate() {
    if (sel.size) return true;
    const g = $('[data-sizes]', root);
    $('#sizeError').hidden = false;
    g.classList.remove('is-invalid'); void g.offsetWidth; g.classList.add('is-invalid');
    g.scrollIntoView({ block: 'center', behavior: S.reducedMotion() ? 'auto' : 'smooth' });
    setTimeout(() => $('[role="radio"]:not([disabled])', g)?.focus({ preventScroll: true }), 250);
    return false;
  }
  function orderWhatsApp(btn) {
    if (!validate()) return;
    btn && btn.classList.add('is-loading');
    S.openWhatsApp(S.singleOrderMessage({ id: p.id, color: sel.color, size: sel.size, qty: sel.qty }));
    setTimeout(() => btn && btn.classList.remove('is-loading'), 1200);
  }
  function bindBuy() {
    if (sold) return;
    $('#buyWa').addEventListener('click', (e) => orderWhatsApp(e.currentTarget));
    $('#buyBag').addEventListener('click', () => {
      if (!validate()) return;
      S.addToBag(p, sel.color, sel.size, sel.qty, $('.gallery__slide img', root));
    });
    $$('[data-qty]', root).forEach((b) => b.addEventListener('click', () => {
      sel.qty = Math.max(1, Math.min(10, sel.qty + Number(b.dataset.qty)));
      $('#qtyOut').textContent = sel.qty;
      $('[data-qty="-1"]', root).disabled = sel.qty <= 1;
      $('[data-qty="1"]', root).disabled = sel.qty >= 10;
    }));
  }

  /* ---------- Compartilhar (Web Share API, com fallback para copiar) ---------- */
  document.addEventListener('click', async (e) => {
    if (!e.target.closest('#shareBtn')) return;
    const url = S.absoluteProductUrl(p.id) || location.href;
    const data = { title: `${p.name} — ${CFG.storeName}`, text: `Olha que linda esta peça: ${p.name}`, url };
    if (navigator.share) {
      try { await navigator.share(data); } catch (err) { /* cancelado */ }
      return;
    }
    try { await navigator.clipboard.writeText(url); S.toast('Link copiado! Agora é só colar onde quiser.', { icon: 'link' }); }
    catch (err) {
      const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select();
      const ok = document.execCommand && document.execCommand('copy'); t.remove();
      S.toast(ok ? 'Link copiado!' : 'Não foi possível copiar. Copie o endereço na barra do navegador.', { icon: ok ? 'link' : 'alert' });
    }
  });

  /* ---------- Anterior / próxima peça ---------- */
  function renderPager() {
    const i = PRODUCTS.indexOf(p);
    const prev = PRODUCTS[(i - 1 + PRODUCTS.length) % PRODUCTS.length];
    const next = PRODUCTS[(i + 1) % PRODUCTS.length];
    $('#pager').innerHTML = `<a href="${S.productUrl(prev.id)}" rel="prev">${icon('arrowLeft', 'icon--sm')}<span>${esc(prev.name)}</span></a>
      <a href="${S.productUrl(next.id)}" rel="next" style="text-align:right"><span>${esc(next.name)}</span>${icon('arrowRight', 'icon--sm')}</a>`;
  }

  /* ---------- Barra fixa inferior (celular) ---------- */
  const bar = $('#buybar');
  function renderBuybar() {
    if (sold) { bar.remove(); return; }
    bar.innerHTML = `<div class="buybar__info"><p class="buybar__name">${esc(p.name)}${sel.color ? ' · ' + esc(sel.color) : ''}</p>${S.priceHTML(p)}</div>
      <button class="btn btn--whatsapp" type="button" id="buybarWa" tabindex="-1">${icon('whatsapp')}<span>Pedir</span></button>`;
    $('#buybarWa').addEventListener('click', (e) => orderWhatsApp(e.currentTarget));
  }
  /* Mostra a barra quando os botões de compra já passaram para cima da tela.
     Usa scroll + rAF (e não IntersectionObserver) porque uma rolagem rápida
     pode "pular" os botões sem gerar evento de interseção. */
  function initBuybar() {
    if (sold) return;
    const target = $('#pdpBuy');
    let visible = null, ticking = false;
    const check = () => {
      ticking = false;
      const show = window.innerWidth < 900 && target.getBoundingClientRect().bottom < 0;
      if (show === visible) return;
      visible = show;
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', String(!show));
      $('#buybarWa') && ($('#buybarWa').tabIndex = show ? 0 : -1);
      // Sobe os botões flutuantes para não cobrir a barra
      document.body.style.setProperty('--fab-offset', show ? '76px' : '0px');
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    check();
  }

  /* ---------- Sugestões ---------- */
  function renderSuggestions() {
    const exclude = new Set([p.id]);
    let look = (p.completeLook || []).map(S.getProduct).filter(Boolean);
    if (!look.length) look = PRODUCTS.filter((x) => x.category !== p.category && (x.tags || []).some((t) => (p.tags || []).includes(t)));
    look = look.filter((x) => !exclude.has(x.id)).slice(0, 6);
    look.forEach((x) => exclude.add(x.id));
    if (look.length) { $('#lookSection').hidden = false; S.renderCards($('#lookTrack'), look); }

    const score = (x) => (x.category === p.category ? 3 : 0) + (x.tags || []).filter((t) => (p.tags || []).includes(t)).length - (S.isSoldOut(x) ? 5 : 0);
    const related = PRODUCTS.filter((x) => !exclude.has(x.id) && score(x) > 0).sort((a, b) => score(b) - score(a)).slice(0, 8);
    if (related.length) { $('#relatedSection').hidden = false; S.renderCards($('#relatedTrack'), related); }
    $$('[data-rail-prev]').forEach((b) => { b.innerHTML = icon('arrowLeft'); });
    $$('[data-rail-next]').forEach((b) => { b.innerHTML = icon('arrowRight'); });
    S.initRails(document);
  }

  /* ---------- Migalhas ---------- */
  $('#pdpCrumbs').innerHTML = `<li><a href="index.html">Início</a></li><li><a href="catalogo.html?categoria=${esc(p.category)}">${esc(cat?.label || 'Catálogo')}</a></li><li aria-current="page">${esc(p.name)}</li>`;

  setMeta();
  render();
  renderBuybar();
  initBuybar();
  renderSuggestions();
})();
