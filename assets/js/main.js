/* ==========================================================================
   SEGREDOS DE MULHER — main.js
   Núcleo compartilhado por todas as páginas:
   01 Utilitários · 02 Armazenamento · 03 Catálogo (helpers) · 04 Ícones
   05 Layout (header, menu, rodapé, camadas) · 06 Gerenciador de camadas
   07 Faixa superior · 08 Header · 09 Busca · 10 Favoritos · 11 WhatsApp
   12 Sacola · 13 Cards · 14 Escolha rápida · 15 Guia de medidas
   16 Interações gerais (toasts, ripple, reveal, trilhos, flutuantes)
   17 Inicialização
   Expõe window.SDM para os scripts de cada página.
   ========================================================================== */
(function () {
  'use strict';

  if (typeof SITE_CONFIG === 'undefined' || typeof PRODUCTS === 'undefined') {
    console.error('[Segredos de Mulher] config.js e products.js precisam ser carregados antes de main.js');
    return;
  }

  const CFG = SITE_CONFIG;
  const CATS = typeof CATEGORIES !== 'undefined' ? CATEGORIES : [];

  /* ---------- 01 UTILITÁRIOS ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** Escapa texto para uso seguro dentro de HTML */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const money = new Intl.NumberFormat(CFG.locale || 'pt-BR', { style: 'currency', currency: CFG.currency || 'BRL' });
  /** Formata número como moeda: 189.9 → "R$ 189,90" (com espaço comum) */
  const fmt = (v) => money.format(v || 0).replace(/ /g, ' ');

  /** Remove acentos e deixa minúsculo — usado na busca e nos filtros */
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  /** Troca {loja} pelo nome da loja */
  const tpl = (s) => String(s ?? '').replace(/\{loja\}/g, CFG.storeName);

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
  const debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  /* ---------- 02 ARMAZENAMENTO (localStorage com tratamento de erro) ---------- */
  const memory = {};
  const Store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) {
        return key in memory ? memory[key] : fallback;
      }
    },
    set(key, value) {
      memory[key] = value;
      try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    }
  };
  const KEYS = { bag: 'sdm:bag', bagExtra: 'sdm:bag-extra', favs: 'sdm:favs', catalog: 'sdm:catalog-view' };

  /* ---------- 03 CATÁLOGO (helpers) ---------- */
  const getProduct = (id) => PRODUCTS.find((p) => p.id === id);
  const getCategory = (key) => CATS.find((c) => c.key === key);
  const unavailable = (p) => p.unavailableSizes || [];
  const availableSizes = (p) => p.sizes.filter((s) => !unavailable(p).includes(s));
  const isSoldOut = (p) => availableSizes(p).length === 0;
  const discount = (p) => (p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0);
  const productUrl = (id, color) => `produto.html?id=${encodeURIComponent(id)}${color ? `&cor=${encodeURIComponent(color)}` : ''}`;

  /** Endereço base do site para links enviados no WhatsApp ('' quando aberto via file://) */
  function siteBase() {
    if (CFG.siteUrl) return CFG.siteUrl.replace(/\/+$/, '') + '/';
    if (/^https?:$/.test(location.protocol)) return location.origin + location.pathname.replace(/[^/]*$/, '');
    return '';
  }
  const absoluteProductUrl = (id) => (siteBase() ? siteBase() + productUrl(id) : '');

  /** Fotos de uma cor (ou as fotos gerais da peça se a cor não tiver fotos próprias) */
  function imagesFor(p, colorName) {
    const c = (p.colors || []).find((x) => x.name === colorName);
    return c && c.images && c.images.length ? c.images : p.images;
  }
  const imgSrc = (entry) => (typeof entry === 'string' ? entry : entry && entry.src) || '';

  /** Gera <img> com srcset (quando houver), lazy-loading e dimensões que evitam salto de layout */
  function imgTag(entry, o = {}) {
    const src = imgSrc(entry);
    const srcset = typeof entry === 'object' && entry && entry.srcset ? ` srcset="${esc(entry.srcset)}" sizes="${esc(o.sizes || '100vw')}"` : '';
    const loading = o.eager ? ' fetchpriority="high"' : ' loading="lazy"';
    return `<img class="${o.cls || ''}" src="${esc(src)}"${srcset} alt="${esc(o.alt || '')}" width="${o.w || 600}" height="${o.h || 800}" decoding="async"${loading}${o.attrs || ''}>`;
  }
  const CARD_SIZES = '(min-width: 1200px) 25vw, (min-width: 768px) 33vw, 50vw';

  const BADGES = { new: 'Novo', sale: 'Sale', low: 'Últimas peças', bestseller: 'Mais vendido' };
  function badgesHTML(p) {
    if (isSoldOut(p)) return '<span class="badge badge--soldout">Sem estoque</span>';
    const out = [];
    if (p.badge === 'sale' || discount(p)) out.push(`<span class="badge badge--sale">${discount(p) ? `-${discount(p)}%` : 'Sale'}</span>`);
    if (p.badge && p.badge !== 'sale') out.push(`<span class="badge badge--${p.badge}">${p.badge === 'bestseller' ? icon('sparkle', 'sparkle icon--fill') : ''}${BADGES[p.badge] || ''}</span>`);
    return out.join('');
  }
  function priceHTML(p, cls = '') {
    const off = discount(p);
    return `<p class="price ${cls}">${off ? `<span class="sr-only">De</span><s class="price__old">${fmt(p.originalPrice)}</s><span class="sr-only">por</span>` : ''}<span class="price__now">${fmt(p.price)}</span>${off ? `<span class="price__off">${off}% OFF</span>` : ''}</p>`;
  }

  /* ---------- 04 ÍCONES (SVG inline, traço estilo Tabler) ---------- */
  const P = {
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    heart: '<path d="M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572"/>',
    bag: '<path d="M6.331 8h11.339a2 2 0 0 1 1.977 2.304l-1.255 8.152A3 3 0 0 1 15.426 21H8.574a3 3 0 0 1-2.965-2.544l-1.255-8.152A2 2 0 0 1 6.331 8z"/><path d="M9 11V6a3 3 0 0 1 6 0v5"/>',
    bagPlus: '<path d="M6.331 8h11.339a2 2 0 0 1 1.977 2.304l-1.255 8.152A3 3 0 0 1 15.426 21H8.574a3 3 0 0 1-2.965-2.544l-1.255-8.152A2 2 0 0 1 6.331 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2M12 12v5M9.5 14.5h5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    chevronLeft: '<path d="m15 6-6 6 6 6"/>',
    chevronRight: '<path d="m9 6 6 6-6 6"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/>',
    whatsapp: '<path d="m3 21 1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3"/><path d="M16.5 7.5v.01"/>',
    tiktok: '<path d="M21 7.917v4.034a9.948 9.948 0 0 1-5-1.951v4.5a6.5 6.5 0 1 1-8-6.326v4.326a2.5 2.5 0 1 0 4 2V3h4.083A6.005 6.005 0 0 0 21 7.917z"/>',
    share: '<circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="m8.7 10.7 6.6-3.4M8.7 13.3l6.6 3.4"/>',
    link: '<path d="m9 15 6-6M11 6l.463-.536a5 5 0 0 1 7.071 7.072L18 13M13 18l-.397.534a5.068 5.068 0 0 1-7.127 0 4.972 4.972 0 0 1 0-7.071L6 11"/>',
    ruler: '<path d="M5 4h14a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-7a1 1 0 0 0-1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1M4 8h2M4 12h3M4 16h2M8 4v2M12 4v3M16 4v2"/>',
    truck: '<path d="M5 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0M15 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/><path d="M5 17H3V6a1 1 0 0 1 1-1h9v12m-4 0h6m4 0h2v-6h-8m0-5h5l3 5"/>',
    sparkle: '<path d="M12 2Q13.6 10.4 22 12 13.6 13.6 12 22 10.4 13.6 2 12 10.4 10.4 12 2Z"/>',
    star: '<path d="m12 17.75-6.172 3.245 1.179-6.873-5-4.867 6.9-1L12 2l3.086 6.253 6.9 1-5 4.867 1.179 6.873z"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    filter: '<path d="M14 6a2 2 0 1 0 4 0 2 2 0 1 0-4 0M4 6h10M18 6h2M6 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0M4 12h2M10 12h10M15 18a2 2 0 1 0 4 0 2 2 0 1 0-4 0M4 18h11M19 18h1"/>',
    message: '<path d="m3 20 1.3-3.9C1.976 12.663 2.874 8.228 6.4 5.726c3.526-2.501 8.59-2.296 11.845.48 3.255 2.777 3.695 7.266 1.029 10.501C16.608 19.942 11.659 20.922 7.7 19L3 20"/>',
    mail: '<path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/><path d="m3 7 9 6 9-6"/>',
    pin: '<path d="M9 11a3 3 0 1 0 6 0 3 3 0 0 0-6 0"/><path d="M17.657 16.657 13.414 20.9a2 2 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/>',
    clock: '<path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/><path d="M12 7v5l3 3"/>',
    hanger: '<path d="M14 6a2 2 0 1 0-4 0c0 1.667.67 3 2 4h-.008l7.971 4.428a2 2 0 0 1 1.029 1.749V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-.823a2 2 0 0 1 1.029-1.749L11.992 10"/>',
    refresh: '<path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>',
    expand: '<path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M16 4h2a2 2 0 0 1 2 2v2M16 20h2a2 2 0 0 0 2-2v-2"/>',
    pause: '<path d="M7 5h3v14H7zM14 5h3v14h-3z"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    alert: '<path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0M12 8v4M12 16h.01"/>',
    copy: '<path d="M8 10a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    gem: '<path d="M6 5h12l3 5-9 9.5L3 10z"/><path d="M10 12 8 8.5 6 10M3 10h18"/>'
  };
  /** Retorna o SVG de um ícone */
  function icon(name, cls = '') {
    const fill = name === 'sparkle' || name === 'star';
    return `<svg class="icon ${fill ? 'icon--fill ' : ''}${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${P[name] || ''}</svg>`;
  }

  /* ---------- 05 LAYOUT (um único template para todas as páginas) ---------- */
  /** Wordmark provisório: palavras curtas (de, da, do, e) em itálico + estrela dourada */
  function logoInner() {
    const words = esc(CFG.storeName).split(' ').map((w) => (/^(de|da|do|das|dos|e)$/i.test(w) ? `<em>${w}</em>` : w)).join(' ');
    return `<span>${words}</span>${icon('sparkle', 'sparkle')}`;
  }
  const waHref = (text) => `https://wa.me/${String(CFG.whatsappNumber).replace(/\D/g, '')}?text=${encodeURIComponent(tpl(text))}`;
  const catUrl = (params) => `catalogo.html${params ? '?' + params : ''}`;

  function socialsHTML() {
    const s = [];
    if (CFG.instagramUrl) s.push(`<a href="${esc(CFG.instagramUrl)}" target="_blank" rel="noopener" aria-label="Instagram (abre em nova aba)">${icon('instagram')}</a>`);
    if (CFG.tiktokUrl) s.push(`<a href="${esc(CFG.tiktokUrl)}" target="_blank" rel="noopener" aria-label="TikTok (abre em nova aba)">${icon('tiktok')}</a>`);
    s.push(`<a href="${waHref(CFG.whatsappDefaultMessage)}" target="_blank" rel="noopener" aria-label="WhatsApp (abre em nova aba)">${icon('whatsapp')}</a>`);
    return `<div class="socials">${s.join('')}</div>`;
  }

  function headerHTML() {
    const page = document.body.dataset.page;
    const params = new URLSearchParams(location.search);
    const cur = (cond) => (cond ? ' aria-current="page"' : '');
    const msgs = (CFG.announcement || []).map((m, i) =>
      `<p class="announce__msg${i === 0 ? ' is-active' : ''}"${i ? ' aria-hidden="true"' : ''}>${icon('sparkle', 'sparkle')}<span>${esc(tpl(m))}</span></p>`).join('');
    const realCats = CATS.filter((c) => !c.special);
    const megaLinks = realCats.map((c) => `<li><a href="${catUrl('categoria=' + c.key)}">${esc(c.label)}</a></li>`).join('');
    const promo = [PRODUCTS.find((p) => p.badge === 'new'), PRODUCTS.find((p) => p.bestseller)].filter(Boolean);
    return `
<div class="announce" role="region" aria-label="Avisos da loja" tabindex="0">${msgs}</div>
<header class="site-header" id="siteHeader">
  <div class="container site-header__bar">
    <div class="site-header__left">
      <button class="icon-btn" type="button" data-open="menuDrawer" aria-controls="menuDrawer" aria-expanded="false" aria-label="Abrir menu">${icon('menu')}</button>
      <button class="icon-btn" type="button" data-open="searchLayer" aria-controls="searchLayer" aria-expanded="false" aria-label="Buscar peças">${icon('search')}</button>
    </div>
    <a class="logo" href="index.html" aria-label="${esc(CFG.storeName)} — página inicial">${logoInner()}</a>
    <div class="site-header__right">
      <a class="icon-btn" href="favoritos.html" aria-label="Favoritos" data-fav-link>${icon('heart')}<span class="count-badge" data-fav-count aria-hidden="true"></span></a>
      <button class="icon-btn" type="button" id="bagBtn" data-open="bagDrawer" aria-controls="bagDrawer" aria-expanded="false" aria-label="Abrir sacola">${icon('bag')}<span class="count-badge" data-bag-count aria-hidden="true"></span></button>
    </div>
  </div>
  <nav class="main-nav" aria-label="Categorias">
    <ul class="container main-nav__list">
      <li class="has-mega">
        <button class="main-nav__link" type="button" aria-expanded="false" aria-controls="megaMenu">Comprar ${icon('chevronDown')}</button>
        <div class="mega" id="megaMenu">
          <div class="container mega__inner">
            <div><p class="mega__title">Categorias</p><ul class="mega__links">${megaLinks}</ul></div>
            <div><p class="mega__title">Destaques</p><ul class="mega__links">
              <li><a href="${catUrl('colecao=novidades')}">Novidades</a></li>
              <li><a href="${catUrl('colecao=mais-vendidos')}">Mais vendidos</a></li>
              <li><a href="${catUrl('sale=1')}">Sale</a></li>
              <li><a href="${catUrl()}">Ver tudo</a></li>
              <li><a href="favoritos.html">Meus favoritos</a></li></ul></div>
            <div class="mega__promo">${promo.map((p, i) => `<a href="${productUrl(p.id)}">${imgTag(p.images[0], { alt: p.name, sizes: '200px' })}<span>${i ? 'Mais vendido' : 'Novidade'}</span></a>`).join('')}</div>
          </div>
        </div>
      </li>
      <li><a class="main-nav__link" href="${catUrl('colecao=novidades')}"${cur(page === 'catalogo' && params.get('colecao') === 'novidades')}>Novidades</a></li>
      ${['vestidos', 'blusas', 'conjuntos'].map((k) => getCategory(k) ? `<li><a class="main-nav__link" href="${catUrl('categoria=' + k)}"${cur(page === 'catalogo' && params.get('categoria') === k)}>${esc(getCategory(k).label)}</a></li>` : '').join('')}
      <li><a class="main-nav__link" href="${catUrl('colecao=mais-vendidos')}"${cur(page === 'catalogo' && params.get('colecao') === 'mais-vendidos')}>Mais vendidos</a></li>
      <li><a class="main-nav__link main-nav__link--sale" href="${catUrl('sale=1')}"${cur(page === 'catalogo' && params.get('sale') === '1')}>Sale</a></li>
      <li><a class="main-nav__link" href="sobre.html#como-comprar"${cur(page === 'sobre')}>Como comprar</a></li>
    </ul>
  </nav>
</header>`;
  }

  function layersHTML() {
    const catLinks = CATS.map((c) => `<a href="${c.key === 'sale' ? catUrl('sale=1') : catUrl('categoria=' + c.key)}"${c.key === 'sale' ? ' class="is-sale"' : ''}>${esc(c.label)}${icon('arrowRight')}</a>`).join('');
    return `
<div class="scrim" id="scrim" aria-hidden="true"></div>

<aside class="layer drawer drawer--left" id="menuDrawer" role="dialog" aria-modal="true" aria-labelledby="menuTitle">
  <div class="layer__head"><p class="logo" id="menuTitle">${logoInner()}</p><button class="icon-btn" type="button" data-close aria-label="Fechar menu">${icon('x')}</button></div>
  <div class="layer__body">
    <button class="menu-search" type="button" data-open="searchLayer">${icon('search')}<span>O que você procura?</span></button>
    <p class="eyebrow eyebrow--line menu-label">Categorias</p>
    <nav class="menu-links" aria-label="Categorias">
      <a href="${catUrl('colecao=novidades')}">Novidades${icon('arrowRight')}</a>
      ${catLinks}
      <a href="${catUrl('colecao=mais-vendidos')}">Mais vendidos${icon('arrowRight')}</a>
    </nav>
    <p class="eyebrow eyebrow--line menu-label" style="margin-top:28px">A loja</p>
    <nav class="menu-links menu-links--small" aria-label="Institucional">
      <a href="favoritos.html">Meus favoritos${icon('heart')}</a>
      <a href="sobre.html">Quem somos${icon('arrowRight')}</a>
      <a href="sobre.html#como-comprar">Como comprar${icon('arrowRight')}</a>
      <a href="sobre.html#trocas">Trocas e devoluções${icon('arrowRight')}</a>
    </nav>
  </div>
  <div class="layer__foot menu-foot">
    <a class="btn btn--whatsapp btn--block" href="${waHref(CFG.whatsappDefaultMessage)}" target="_blank" rel="noopener">${icon('whatsapp')}<span>Falar no WhatsApp</span></a>
    ${socialsHTML()}
  </div>
</aside>

<aside class="layer drawer drawer--right" id="bagDrawer" role="dialog" aria-modal="true" aria-labelledby="bagTitle">
  <div class="layer__head"><h2 class="layer__title" id="bagTitle">Sacola <span class="muted" style="font-size:1rem" data-bag-count-text></span></h2><button class="icon-btn" type="button" data-close aria-label="Fechar sacola">${icon('x')}</button></div>
  <div class="layer__body" id="bagBody"></div>
  <div class="layer__foot" id="bagFoot"></div>
</aside>

<div class="layer search-layer" id="searchLayer" role="dialog" aria-modal="true" aria-label="Buscar na loja">
  <form class="container search-form" role="search" action="catalogo.html" id="searchForm">
    ${icon('search')}
    <label class="sr-only" for="searchInput">Buscar peças</label>
    <input class="search-input" id="searchInput" name="q" type="search" placeholder="Buscar vestidos, blusas, cores…" autocomplete="off" spellcheck="false"
      role="combobox" aria-expanded="false" aria-controls="searchResults" aria-autocomplete="list" data-autofocus>
    <button class="icon-btn" type="button" data-close aria-label="Fechar busca">${icon('x')}</button>
  </form>
  <div class="container search-body" id="searchBody">
    <div id="searchIdle">
      <p class="eyebrow">Buscas sugeridas</p>
      <div class="search-suggest">${['Vestido', 'Conjunto', 'Linho', 'Festa', 'Preto', 'Alfaiataria'].map((t) => `<button class="chip" type="button" data-suggest="${t}">${t}</button>`).join('')}</div>
      <p class="eyebrow" style="margin-top:24px">Categorias</p>
      <div class="search-suggest">${CATS.map((c) => `<a class="chip" href="${c.key === 'sale' ? catUrl('sale=1') : catUrl('categoria=' + c.key)}">${esc(c.label)}</a>`).join('')}</div>
    </div>
    <ul class="search-results" id="searchResults" role="listbox" aria-label="Resultados da busca"></ul>
    <p class="search-empty" id="searchEmpty" hidden></p>
    <p class="search-all" id="searchAll" hidden></p>
    <p class="sr-only" id="searchStatus" role="status" aria-live="polite"></p>
  </div>
</div>

<div class="layer sheet" id="quickSheet" role="dialog" aria-modal="true" aria-labelledby="quickTitle">
  <div class="layer__head"><h2 class="layer__title" id="quickTitle" style="font-size:1.3rem">Escolha cor e tamanho</h2><button class="icon-btn" type="button" data-close aria-label="Fechar">${icon('x')}</button></div>
  <div class="layer__body" id="quickBody"></div>
</div>

<div class="layer modal" id="sizeGuide" role="dialog" aria-modal="true" aria-labelledby="sizeGuideTitle">
  <div class="layer__head"><h2 class="layer__title" id="sizeGuideTitle">Guia de medidas</h2><button class="icon-btn" type="button" data-close aria-label="Fechar guia de medidas">${icon('x')}</button></div>
  <div class="layer__body" id="sizeGuideBody"></div>
</div>

<div class="fabs" id="fabs">
  <button class="fab fab--top" type="button" id="toTop" aria-label="Voltar ao topo" tabindex="-1">${icon('arrowUp', 'icon--sm')}</button>
  <a class="fab fab--wa" id="waFab" href="${waHref(CFG.whatsappDefaultMessage)}" target="_blank" rel="noopener" aria-label="Falar com a loja pelo WhatsApp (abre em nova aba)" tabindex="-1">${icon('whatsapp')}</a>
</div>
<div class="toasts" id="toasts" aria-live="polite" aria-atomic="false"></div>`;
  }

  function footerHTML() {
    const year = new Date().getFullYear();
    const contacts = [
      `<a href="${waHref(CFG.whatsappDefaultMessage)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(CFG.whatsappDisplay || CFG.whatsappNumber)}</a>`,
      CFG.email ? `<a href="mailto:${esc(CFG.email)}">${icon('mail')}${esc(CFG.email)}</a>` : '',
      CFG.address ? `<p>${icon('pin')}${esc(CFG.address)}</p>` : '',
      CFG.serviceHours ? `<p>${icon('clock')}${esc(CFG.serviceHours)}</p>` : ''
    ].join('');
    return `
<footer class="footer">
  <div class="container footer__grid">
    <div>
      <a class="logo" href="index.html" aria-label="${esc(CFG.storeName)} — página inicial">${logoInner()}</a>
      <p class="footer__tagline">${esc(CFG.tagline)}</p>
      <div class="footer__contacts">${contacts}</div>
      ${socialsHTML()}
    </div>
    <div>
      <h2 class="footer__title">Atendimento</h2>
      <ul class="footer__links">
        <li><a href="${waHref(CFG.whatsappDefaultMessage)}" target="_blank" rel="noopener">Falar no WhatsApp</a></li>
        <li><a href="sobre.html#como-comprar">Como comprar</a></li>
        <li><a href="sobre.html#duvidas">Dúvidas frequentes</a></li>
      </ul>
      <p class="footer__note" style="margin-top:12px">Formas de pagamento combinadas no atendimento pelo WhatsApp.</p>
    </div>
    <div>
      <h2 class="footer__title">Institucional</h2>
      <ul class="footer__links">
        <li><a href="sobre.html">Quem somos</a></li>
        <li><a href="catalogo.html">Catálogo completo</a></li>
        <li><a href="favoritos.html">Meus favoritos</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer__title">Políticas</h2>
      <ul class="footer__links">
        <li><a href="sobre.html#trocas">Trocas e devoluções</a></li>
        <li><a href="sobre.html#privacidade">Privacidade</a></li>
      </ul>
    </div>
  </div>
  <div class="footer__bottom">
    <div class="container">
      <p>© ${year} ${esc(CFG.storeName)}. Todos os direitos reservados.</p>
      <p>Desenvolvido por <a href="https://hrdev.com.br/" target="_blank" rel="noopener">HR | DEV</a></p>
    </div>
  </div>
</footer>`;
  }

  /** Substitui os marcadores #site-header e #site-footer pelo HTML compartilhado */
  function injectLayout() {
    const toNodes = (html) => document.createRange().createContextualFragment(html);
    const h = $('#site-header');
    if (h) h.replaceWith(toNodes(headerHTML()));
    const f = $('#site-footer');
    if (f) f.replaceWith(toNodes(footerHTML()));
    document.body.appendChild(toNodes(layersHTML()));

    // Preenche textos/links de configuração presentes no HTML de cada página
    $$('[data-cfg]').forEach((el) => { const v = CFG[el.dataset.cfg]; if (v) el.textContent = tpl(v); });
    $$('[data-wa]').forEach((el) => {
      const msg = { default: CFG.whatsappDefaultMessage, vip: CFG.whatsappVipMessage }[el.dataset.wa] || el.dataset.wa;
      el.href = waHref(msg); el.target = '_blank'; el.rel = 'noopener';
    });
    // Canonical (só quando o domínio estiver configurado em siteUrl)
    const page = document.body.dataset.page;
    if (CFG.siteUrl && !$('link[rel="canonical"]') && ['home', 'catalogo', 'sobre'].includes(page)) {
      const cat = new URLSearchParams(location.search).get('categoria');
      const file = page === 'home' ? '' : location.pathname.split('/').pop();
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = siteBase() + file + (page === 'catalogo' && cat ? `?categoria=${encodeURIComponent(cat)}` : '');
      document.head.appendChild(link);
    }
    $$('[data-cfg-href]').forEach((el) => {
      const v = CFG[el.dataset.cfgHref];
      if (v) el.href = v; else el.hidden = true;
    });
  }

  /* ---------- 06 GERENCIADOR DE CAMADAS (drawers, modais, sheets) ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const Layers = {
    stack: [],
    top() { return this.stack[this.stack.length - 1]; },
    isOpen(id) { return this.stack.some((s) => s.el.id === id); },
    open(id, trigger) {
      const el = document.getElementById(id);
      if (!el || this.isOpen(id)) return;
      if (el.dataset.dialogDynamic != null) { el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); }
      this.stack.push({ el, trigger: trigger || document.activeElement });
      el.classList.add('is-open');
      $('#scrim').classList.add('is-visible');
      document.body.classList.add('is-locked');
      $$(`[aria-controls="${id}"]`).forEach((t) => t.setAttribute('aria-expanded', 'true'));
      // Foco no primeiro campo relevante
      setTimeout(() => {
        const target = $('[data-autofocus]', el) || $$(FOCUSABLE, el).find((n) => n.offsetParent !== null);
        target && target.focus({ preventScroll: true });
      }, 60);
      el.dispatchEvent(new CustomEvent('layer:open'));
    },
    close(id) {
      const idx = id ? this.stack.findIndex((s) => s.el.id === id) : this.stack.length - 1;
      if (idx < 0) return;
      const [{ el, trigger }] = this.stack.splice(idx, 1);
      el.classList.remove('is-open');
      if (el.dataset.dialogDynamic != null) { el.removeAttribute('role'); el.removeAttribute('aria-modal'); }
      $$(`[aria-controls="${el.id}"]`).forEach((t) => t.setAttribute('aria-expanded', 'false'));
      if (!this.stack.length) {
        $('#scrim').classList.remove('is-visible');
        document.body.classList.remove('is-locked');
      }
      if (trigger && document.contains(trigger) && trigger.focus) trigger.focus({ preventScroll: true });
      el.dispatchEvent(new CustomEvent('layer:close'));
    },
    /** Mantém o foco dentro da camada aberta (focus trap) */
    trap(e) {
      const top = this.top();
      if (!top || e.key !== 'Tab') return;
      const items = $$(FOCUSABLE, top.el).filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (!top.el.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  function initLayers() {
    document.addEventListener('click', (e) => {
      const opener = e.target.closest('[data-open]');
      if (opener) {
        e.preventDefault();
        const id = opener.dataset.open;
        // Abrir a busca a partir do menu: fecha o menu primeiro
        if (Layers.isOpen('menuDrawer') && id !== 'menuDrawer') Layers.close('menuDrawer');
        Layers.open(id, opener.closest('.layer') ? null : opener);
        return;
      }
      const closer = e.target.closest('[data-close]');
      if (closer) { const layer = closer.closest('.layer, .filters'); Layers.close(layer && layer.id); }
    });
    $('#scrim').addEventListener('click', () => Layers.close());
    // Um único listener de teclado para Esc e Tab
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && Layers.top()) { e.preventDefault(); Layers.close(); return; }
      Layers.trap(e);
    });
  }

  /* ---------- 07 FAIXA SUPERIOR (rotação a cada 4 s, pausa no hover/foco) ---------- */
  function initAnnouncement() {
    const bar = $('.announce');
    if (!bar) return;
    const msgs = $$('.announce__msg', bar);
    if (msgs.length < 2) return;
    let i = 0, paused = false;
    const pause = (v) => () => { paused = v; };
    ['mouseenter', 'focusin'].forEach((ev) => bar.addEventListener(ev, pause(true)));
    ['mouseleave', 'focusout'].forEach((ev) => bar.addEventListener(ev, pause(false)));
    setInterval(() => {
      if (paused || document.hidden) return;
      const cur = msgs[i];
      i = (i + 1) % msgs.length;
      const next = msgs[i];
      cur.classList.remove('is-active'); cur.classList.add('is-leaving'); cur.setAttribute('aria-hidden', 'true');
      next.classList.remove('is-leaving'); next.classList.add('is-active'); next.removeAttribute('aria-hidden');
      setTimeout(() => cur.classList.remove('is-leaving'), 650);
    }, 4000);
  }

  /* ---------- 08 HEADER (compacta ao rolar + mega menu) ---------- */
  function initHeader() {
    const header = $('#siteHeader');
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        header && header.classList.toggle('is-scrolled', y > 12);
        $('#toTop') && $('#toTop').classList.toggle('is-visible', y > 700);
        const fabOn = y > 320;
        const wa = $('#waFab');
        if (wa) { wa.classList.toggle('is-visible', fabOn); wa.tabIndex = fabOn ? 0 : -1; }
        $('#toTop') && ($('#toTop').tabIndex = y > 700 ? 0 : -1);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    $('#toTop') && $('#toTop').addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
      $('.logo') && $('.logo').focus({ preventScroll: true });
    });

    // Mega menu: abre no hover (com atraso) e no clique/teclado
    const li = $('.has-mega');
    if (!li) return;
    const btn = $('button', li);
    let timer;
    const set = (open) => { li.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); };
    li.addEventListener('mouseenter', () => { clearTimeout(timer); timer = setTimeout(() => set(true), 120); });
    li.addEventListener('mouseleave', () => { clearTimeout(timer); timer = setTimeout(() => set(false), 180); });
    btn.addEventListener('click', () => set(!li.classList.contains('is-open')));
    li.addEventListener('focusout', (e) => { if (!li.contains(e.relatedTarget)) set(false); });
    li.addEventListener('keydown', (e) => { if (e.key === 'Escape' && li.classList.contains('is-open')) { e.stopPropagation(); set(false); btn.focus(); } });
  }

  /* ---------- 09 BUSCA (resultados ao vivo, tolerante a acentos, teclado) ---------- */
  /** Busca produtos por nome, categoria, cores e tags. Todas as palavras precisam aparecer. */
  function searchProducts(query) {
    const terms = norm(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return PRODUCTS.map((p) => {
      const name = norm(p.name);
      const hay = [name, norm(getCategory(p.category)?.label), ...(p.tags || []).map(norm), ...(p.colors || []).map((c) => norm(c.name)), norm(p.description)].join(' ');
      if (!terms.every((t) => hay.includes(t))) return null;
      let score = 0;
      terms.forEach((t) => { if (name.startsWith(t)) score += 6; else if (name.includes(t)) score += 4; else score += 1; });
      if (isSoldOut(p)) score -= 3;
      return { p, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).map((r) => r.p);
  }

  /** Destaca o termo buscado mantendo os acentos originais */
  function highlight(text, query) {
    const terms = norm(query).split(/\s+/).filter(Boolean);
    const chars = Array.from(text);
    const n = chars.map((c) => norm(c) || c).join('');
    if (n.length !== chars.length) return esc(text);
    const mark = new Array(chars.length).fill(false);
    terms.forEach((t) => { let i = n.indexOf(t); while (i > -1) { for (let k = i; k < i + t.length; k++) mark[k] = true; i = n.indexOf(t, i + 1); } });
    let out = '', open = false;
    chars.forEach((c, i) => {
      if (mark[i] && !open) { out += '<mark>'; open = true; }
      if (!mark[i] && open) { out += '</mark>'; open = false; }
      out += esc(c);
    });
    return out + (open ? '</mark>' : '');
  }

  function initSearch() {
    const input = $('#searchInput'), list = $('#searchResults'), idle = $('#searchIdle');
    const empty = $('#searchEmpty'), all = $('#searchAll'), status = $('#searchStatus');
    let active = -1, results = [];

    const setActive = (i) => {
      const opts = $$('[role="option"]', list);
      opts.forEach((o, k) => { o.classList.toggle('is-active', k === i); o.setAttribute('aria-selected', String(k === i)); });
      active = i;
      if (i > -1 && opts[i]) { input.setAttribute('aria-activedescendant', opts[i].id); opts[i].scrollIntoView({ block: 'nearest' }); }
      else input.removeAttribute('aria-activedescendant');
    };

    const render = () => {
      const q = input.value.trim();
      results = q ? searchProducts(q) : [];
      idle.hidden = !!q;
      list.innerHTML = results.slice(0, 8).map((p, i) => `
        <li role="option" id="sr-${i}" aria-selected="false">
          <a class="search-result" href="${productUrl(p.id)}" tabindex="-1">
            ${imgTag(p.images[0], { alt: '', w: 56, h: 74, sizes: '56px' })}
            <span><span class="search-result__name">${highlight(p.name, q)}</span><br><span class="muted" style="font-size:.85rem">${esc(getCategory(p.category)?.label || '')}${isSoldOut(p) ? ' · Esgotado' : ''}</span></span>
            <span class="price__now">${fmt(p.price)}</span>
          </a>
        </li>`).join('');
      input.setAttribute('aria-expanded', String(results.length > 0));
      empty.hidden = !(q && !results.length);
      if (q && !results.length) {
        empty.innerHTML = `Nenhuma peça encontrada para “${esc(q)}”. Tente outra palavra ou <a href="${waHref('Olá! Estou procurando: ' + q)}" target="_blank" rel="noopener" style="text-decoration:underline">pergunte pelo WhatsApp</a>.`;
      }
      all.hidden = !(results.length > 0);
      if (results.length) all.innerHTML = `<a class="link-arrow" href="${catUrl('q=' + encodeURIComponent(q))}">Ver ${results.length === 1 ? 'o resultado' : `todos os ${results.length} resultados`} ${icon('arrowRight')}</a>`;
      status.textContent = q ? (results.length ? `${results.length} ${results.length === 1 ? 'peça encontrada' : 'peças encontradas'}` : 'Nenhuma peça encontrada') : '';
      setActive(-1);
    };

    input.addEventListener('input', debounce(render, 90));
    input.addEventListener('keydown', (e) => {
      const n = Math.min(results.length, 8);
      if (e.key === 'ArrowDown' && n) { e.preventDefault(); setActive((active + 1) % n); }
      else if (e.key === 'ArrowUp' && n) { e.preventDefault(); setActive(active <= 0 ? n - 1 : active - 1); }
      else if (e.key === 'Enter' && active > -1) { e.preventDefault(); location.href = productUrl(results[active].id); }
    });
    $('#searchForm').addEventListener('submit', (e) => { if (!input.value.trim()) e.preventDefault(); });
    $$('[data-suggest]').forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.suggest; render(); input.focus(); }));
    $('#searchLayer').addEventListener('layer:open', () => { input.select(); });
    // Atalho "/" abre a busca
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !Layers.top() && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); Layers.open('searchLayer'); }
    });
  }

  /* ---------- 10 FAVORITOS ---------- */
  const Favs = {
    list() { return Store.get(KEYS.favs, []).filter((id) => getProduct(id)); },
    has(id) { return this.list().includes(id); },
    toggle(id) {
      const l = this.list();
      const on = !l.includes(id);
      Store.set(KEYS.favs, on ? [...l, id] : l.filter((x) => x !== id));
      this.sync();
      return on;
    },
    /** Atualiza corações e contador em toda a página */
    sync() {
      const l = this.list();
      $$('[data-fav]').forEach((b) => {
        const on = l.includes(b.dataset.fav);
        b.setAttribute('aria-pressed', String(on));
        const p = getProduct(b.dataset.fav);
        if (p) b.setAttribute('aria-label', `${on ? 'Remover dos' : 'Adicionar aos'} favoritos: ${p.name}`);
      });
      setCount('[data-fav-count]', l.length);
      const link = $('[data-fav-link]');
      if (link) link.setAttribute('aria-label', `Favoritos (${l.length})`);
      document.dispatchEvent(new CustomEvent('sdm:favs'));
    }
  };
  function setCount(sel, n, bump) {
    $$(sel).forEach((el) => {
      el.textContent = n > 99 ? '99+' : n;
      el.classList.toggle('has-items', n > 0);
      if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    });
  }

  /* ---------- 11 WHATSAPP (montagem das mensagens) ---------- */
  /** Abre o WhatsApp em nova aba (com noopener) */
  function openWhatsApp(text) {
    const a = document.createElement('a');
    a.href = `https://wa.me/${String(CFG.whatsappNumber).replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    document.body.appendChild(a); a.click(); a.remove();
  }

  /** Bloco de texto de um item do pedido */
  function orderItemText(n, item) {
    const p = getProduct(item.id);
    const lines = [`${n}) ${p.name}`];
    const parts = [];
    if (item.color) parts.push(`Cor: ${item.color}`);
    parts.push(`Tamanho: ${item.size}`, `Qtd: ${item.qty}`);
    lines.push('   ' + parts.join(' | '));
    lines.push('   ' + fmt(p.price * item.qty) + (item.qty > 1 ? ` (${item.qty} x ${fmt(p.price)})` : ''));
    const url = absoluteProductUrl(p.id);
    if (url) lines.push('   ' + url);
    return lines.join('\n');
  }

  /**
   * Monta o pedido completo. Se passar do limite de itens/caracteres,
   * divide em partes numeradas (cada parte é enviada com um clique).
   */
  function buildOrderMessages(items, name, notes) {
    const total = items.reduce((s, i) => s + getProduct(i.id).price * i.qty, 0);
    const count = items.reduce((s, i) => s + i.qty, 0);
    const footer = [
      '',
      `Total estimado: ${fmt(total)} (${count} ${count === 1 ? 'peça' : 'peças'})`,
      CFG.orderFooterNote || '',
      name ? `\nNome: ${name}` : '',
      notes ? `Obs.: ${notes}` : ''
    ].filter((l, i) => l !== '' || i === 0).join('\n');
    const head = tpl(CFG.whatsappGreeting);
    const max = CFG.maxMessageLength || 1800;
    const maxItems = CFG.maxItemsPerMessage || 25;

    const blocks = items.map((it, i) => orderItemText(i + 1, it));
    const parts = [];
    let cur = [];
    const size = (arr) => (head.length + footer.length + 40 + arr.join('\n\n').length);
    blocks.forEach((b) => {
      if (cur.length && (cur.length >= maxItems || size([...cur, b]) > max)) { parts.push(cur); cur = []; }
      cur.push(b);
    });
    if (cur.length) parts.push(cur);

    const totalParts = parts.length;
    return parts.map((blks, i) => {
      const title = totalParts > 1 ? (i === 0 ? `${head}\n(pedido em ${totalParts} partes — parte 1 de ${totalParts})` : `Continuação do pedido — parte ${i + 1} de ${totalParts}:`) : head;
      return `${title}\n\n${blks.join('\n\n')}${i === totalParts - 1 ? '\n' + footer : ''}`;
    });
  }

  /** Mensagem de uma peça (botão "Pedir agora pelo WhatsApp") */
  function singleOrderMessage(item) {
    return buildOrderMessages([item], '', '')[0];
  }

  /** Mensagem de dúvida sobre uma peça */
  function questionMessage(p, kind) {
    const url = absoluteProductUrl(p.id);
    const base = kind === 'restock'
      ? `Olá! A peça "${p.name}" está esgotada no site. Pode me avisar quando chegar?`
      : `Olá! Tenho uma dúvida sobre a peça "${p.name}" (${fmt(p.price)}).`;
    return base + (url ? `\n${url}` : '') + (kind === 'restock' ? '' : '\n\nMinha dúvida: ');
  }

  /* ---------- 12 SACOLA ---------- */
  const Bag = {
    items() {
      // Remove peças que não existem mais no catálogo
      return Store.get(KEYS.bag, []).filter((i) => i && getProduct(i.id) && i.qty > 0);
    },
    save(items) {
      if (!Store.set(KEYS.bag, items)) toast('Não foi possível salvar a sacola neste navegador (modo privado?). Ela ficará disponível só nesta página.', { type: 'error', icon: 'alert' });
      this.sync();
    },
    key: (i) => `${i.id}|${i.color || ''}|${i.size}`,
    add(id, color, size, qty = 1) {
      const items = this.items();
      const k = this.key({ id, color, size });
      const found = items.find((i) => this.key(i) === k);
      if (found) found.qty = Math.min(found.qty + qty, 20);
      else items.push({ id, color, size, qty, addedAt: Date.now() });
      this.lastAdded = k;
      this.save(items);
    },
    setQty(k, qty) {
      const items = this.items();
      const it = items.find((i) => this.key(i) === k);
      if (!it) return;
      it.qty = Math.max(1, Math.min(qty, 20));
      this.save(items);
    },
    remove(k) { this.save(this.items().filter((i) => this.key(i) !== k)); },
    clear() { this.save([]); Store.set(KEYS.bagExtra, {}); },
    count() { return this.items().reduce((s, i) => s + i.qty, 0); },
    total() { return this.items().reduce((s, i) => s + getProduct(i.id).price * i.qty, 0); },
    sync(bump) {
      const n = this.count();
      setCount('[data-bag-count]', n, bump);
      $$('[data-bag-count-text]').forEach((el) => { el.textContent = n ? `(${n})` : ''; });
      const btn = $('#bagBtn');
      if (btn) btn.setAttribute('aria-label', `Abrir sacola (${n} ${n === 1 ? 'peça' : 'peças'})`);
      if (Layers.isOpen('bagDrawer')) renderBag();
    }
  };

  let bagSentParts = null; // partes do último envio (quando o pedido foi dividido)
  function renderBag() {
    const body = $('#bagBody'), foot = $('#bagFoot');
    const items = Bag.items();
    if (!items.length) {
      body.innerHTML = `<div class="bag-empty">${icon('bag')}<p>Sua sacola está vazia</p><span class="muted">Escolha suas peças favoritas e envie o pedido pelo WhatsApp.</span><a class="btn" href="catalogo.html">Ver peças</a></div>`;
      foot.hidden = true;
      bagSentParts = null;
      return;
    }
    const extra = Store.get(KEYS.bagExtra, {});
    body.innerHTML = `<ul class="bag-list">${items.map((i) => {
      const p = getProduct(i.id);
      const k = Bag.key(i);
      const out = unavailable(p).includes(i.size);
      const img = imagesFor(p, i.color)[0];
      return `<li class="bag-item${Bag.lastAdded === k ? ' is-new' : ''}" data-key="${esc(k)}">
        <a href="${productUrl(p.id, i.color)}">${imgTag(img, { cls: 'bag-item__img', alt: p.name, w: 84, h: 112, sizes: '84px' })}</a>
        <div>
          <div class="bag-item__top"><a class="bag-item__name" href="${productUrl(p.id, i.color)}">${esc(p.name)}</a>
            <button class="bag-item__remove" type="button" data-bag-remove aria-label="Remover ${esc(p.name)} da sacola">${icon('trash', 'icon--sm')}</button></div>
          <p class="bag-item__meta">${i.color ? esc(i.color) + ' · ' : ''}Tam. ${esc(i.size)}${out ? ' · <strong style="color:var(--danger)">tamanho esgotado no momento</strong>' : ''}</p>
          <div class="bag-item__row">
            <div class="qty" role="group" aria-label="Quantidade de ${esc(p.name)}">
              <button type="button" data-bag-qty="-1" aria-label="Diminuir quantidade" ${i.qty <= 1 ? 'disabled' : ''}>${icon('minus')}</button>
              <output aria-live="polite">${i.qty}</output>
              <button type="button" data-bag-qty="1" aria-label="Aumentar quantidade" ${i.qty >= 20 ? 'disabled' : ''}>${icon('plus')}</button>
            </div>
            <span class="price__now">${fmt(p.price * i.qty)}</span>
          </div>
        </div>
      </li>`;
    }).join('')}</ul>
    ${CFG.askCustomerName ? `<details class="bag-extra"${extra.name || extra.notes ? ' open' : ''}>
      <summary>Adicionar nome e observações (opcional)</summary>
      <div class="field"><label for="bagName">Seu nome</label><input class="input" id="bagName" autocomplete="given-name" maxlength="60" value="${esc(extra.name || '')}"></div>
      <div class="field"><label for="bagNotes">Observações</label><textarea class="textarea" id="bagNotes" maxlength="300" placeholder="Ex.: se não tiver M, aceito G; dúvida sobre o tecido…">${esc(extra.notes || '')}</textarea></div>
    </details>` : ''}`;
    Bag.lastAdded = null;

    foot.hidden = false;
    const partsHTML = bagSentParts && bagSentParts.length > 1 ? `<div class="bag-parts" role="group" aria-label="Partes do pedido">
      <p>Seu pedido ficou grande e foi dividido em <strong>${bagSentParts.length} mensagens</strong>. Envie cada parte na ordem:</p>
      ${bagSentParts.map((m, i) => `<button class="btn btn--sm btn--outline" type="button" data-send-part="${i}">${bagSentParts.sent && bagSentParts.sent.includes(i) ? icon('check') : icon('whatsapp')}<span>Enviar parte ${i + 1} de ${bagSentParts.length}</span></button>`).join('')}
    </div>` : '';
    foot.innerHTML = `
      ${bagSentParts && bagSentParts.done ? `<div class="bag-sent" role="status">${icon('check')}<span>Pedido enviado! Continue a conversa no WhatsApp. Sua sacola continua salva aqui até você limpar.</span></div>` : ''}
      ${partsHTML}
      <div class="bag-total"><span>Total estimado</span><strong>${fmt(Bag.total())}</strong></div>
      <p class="bag-note">Valor sujeito a confirmação de estoque. Frete e pagamento são combinados no WhatsApp.</p>
      <div class="bag-actions">
        <button class="btn btn--whatsapp btn--block" type="button" id="bagSend">${icon('whatsapp')}<span>Enviar pedido pelo WhatsApp</span></button>
        <div class="bag-secondary">
          <button class="text-btn" type="button" data-close>Continuar escolhendo</button>
          <button class="text-btn" type="button" id="bagClear">Limpar sacola</button>
        </div>
      </div>`;
  }

  function initBag() {
    const body = $('#bagBody'), foot = $('#bagFoot');
    $('#bagDrawer').addEventListener('layer:open', renderBag);
    body.addEventListener('click', (e) => {
      const li = e.target.closest('.bag-item');
      if (!li) return;
      const k = li.dataset.key;
      if (e.target.closest('[data-bag-remove]')) {
        li.classList.add('is-removing');
        setTimeout(() => { Bag.remove(k); toast('Peça removida da sacola', { icon: 'trash' }); $('#bagDrawer .layer__head button').focus(); }, reducedMotion() ? 0 : 280);
      }
      const q = e.target.closest('[data-bag-qty]');
      if (q) {
        const it = Bag.items().find((i) => Bag.key(i) === k);
        if (it) { Bag.setQty(k, it.qty + Number(q.dataset.bagQty)); requestAnimationFrame(() => { const nli = $(`.bag-item[data-key="${CSS.escape(k)}"] [data-bag-qty="${q.dataset.bagQty}"]`); nli && !nli.disabled ? nli.focus() : $(`.bag-item[data-key="${CSS.escape(k)}"] output`)?.focus?.(); }); }
      }
    });
    // Nome e observações salvos automaticamente
    body.addEventListener('input', debounce((e) => {
      if (!e.target.matches('#bagName, #bagNotes')) return;
      Store.set(KEYS.bagExtra, { name: $('#bagName')?.value.trim() || '', notes: $('#bagNotes')?.value.trim() || '' });
    }, 250));

    foot.addEventListener('click', (e) => {
      if (e.target.closest('#bagSend')) sendBag(e.target.closest('#bagSend'));
      if (e.target.closest('#bagClear')) {
        if (confirm('Deseja esvaziar a sacola?')) { Bag.clear(); bagSentParts = null; toast('Sacola esvaziada', { icon: 'trash' }); }
      }
      const part = e.target.closest('[data-send-part]');
      if (part && bagSentParts) {
        const i = Number(part.dataset.sendPart);
        openWhatsApp(bagSentParts[i]);
        bagSentParts.sent = [...new Set([...(bagSentParts.sent || []), i])];
        if (bagSentParts.sent.length === bagSentParts.length) bagSentParts.done = true;
        renderBag();
        $(`[data-send-part="${Math.min(i + 1, bagSentParts.length - 1)}"]`)?.focus();
      }
    });
  }

  function sendBag(btn) {
    const items = Bag.items();
    if (!items.length) return;
    const name = $('#bagName')?.value.trim() || '';
    const notes = $('#bagNotes')?.value.trim() || '';
    Store.set(KEYS.bagExtra, { name, notes });
    const msgs = buildOrderMessages(items, name, notes);
    if (msgs.length === 1) {
      btn.classList.add('is-loading');
      openWhatsApp(msgs[0]);
      setTimeout(() => {
        bagSentParts = Object.assign([msgs[0]], { done: true, sent: [0] });
        renderBag();
        toast('Pedido enviado! Continue a conversa no WhatsApp.', { icon: 'check' });
      }, 900);
    } else {
      // Pedido grande: mostra os botões para enviar cada parte (um clique por parte evita bloqueio de pop-up)
      bagSentParts = Object.assign(msgs, { sent: [], done: false });
      renderBag();
      $('[data-send-part="0"]')?.focus();
    }
  }

  /** Animação da foto "voando" até o ícone da sacola */
  function flyToBag(imgEl) {
    const target = $('#bagBtn');
    if (!imgEl || !target || reducedMotion()) { Bag.sync(true); bumpBagIcon(); return; }
    const a = imgEl.getBoundingClientRect(), b = target.getBoundingClientRect();
    if (!a.width) { Bag.sync(true); bumpBagIcon(); return; }
    const clone = document.createElement('img');
    clone.src = imgEl.currentSrc || imgEl.src;
    clone.className = 'fly-img';
    clone.alt = '';
    Object.assign(clone.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(clone);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const s = 28 / a.width;
      clone.style.transform = `translate(${b.left + b.width / 2 - a.left - a.width / 2}px, ${b.top + b.height / 2 - a.top - a.height / 2}px) scale(${s})`;
      clone.style.opacity = '.3';
    }));
    setTimeout(() => { clone.remove(); Bag.sync(true); bumpBagIcon(); }, 780);
  }
  function bumpBagIcon() {
    const b = $('#bagBtn');
    if (!b) return;
    b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  }

  /** Adiciona à sacola com animação e aviso */
  function addToBag(p, color, size, qty, imgEl) {
    Bag.add(p.id, color, size, qty);
    flyToBag(imgEl);
    toast(`${p.name} (${size}) foi para a sacola`, { icon: 'bag', action: { label: 'Ver sacola', onClick: () => Layers.open('bagDrawer') } });
  }

  /* ---------- 13 CARDS DE PRODUTO ---------- */
  function sizesLine(p) {
    return p.sizes.map((s) => (unavailable(p).includes(s) ? `<s><span class="sr-only">${esc(s)} esgotado</span><span aria-hidden="true">${esc(s)}</span></s>` : esc(s))).join(' · ');
  }
  /** HTML do card. opts.eager = carrega a imagem sem lazy (cards acima da dobra) */
  function cardHTML(p, opts = {}) {
    const sold = isSoldOut(p);
    const [img1, img2] = p.images;
    const url = productUrl(p.id);
    const multiColor = (p.colors || []).length > 1;
    const swatches = multiColor ? `<div class="swatches" role="group" aria-label="Cores de ${esc(p.name)}">${p.colors.map((c, i) =>
      `<button class="swatch" type="button" style="--sw:${esc(c.hex)}" data-swatch="${i}" aria-pressed="${i === 0}" aria-label="${esc(c.name)}" title="${esc(c.name)}"></button>`).join('')}</div>`
      : `<p class="card__cat">${esc(p.colors?.[0]?.name || '')}</p>`;
    return `<article class="card${sold ? ' is-soldout' : ''}${opts.reveal === false ? '' : ' reveal'}" data-card="${esc(p.id)}">
      <div class="card__media is-loading">
        <a class="card__link" href="${url}" tabindex="-1" aria-hidden="true">
          ${imgTag(img1, { cls: 'card__img card__img--main' + (img2 ? ' has-alt' : ''), alt: `${p.name}${p.colors?.[0] ? ' — ' + p.colors[0].name : ''}`, sizes: CARD_SIZES, eager: opts.eager })}
          ${img2 ? imgTag(img2, { cls: 'card__img card__img--alt', alt: '', sizes: CARD_SIZES }) : ''}
        </a>
        <div class="card__badges">${badgesHTML(p)}</div>
        <button class="fav-btn" type="button" data-fav="${esc(p.id)}" aria-pressed="false" aria-label="Adicionar aos favoritos: ${esc(p.name)}">${icon('heart')}</button>
      </div>
      <div class="card__info">
        ${swatches}
        <h3 class="card__name"><a href="${url}">${esc(p.name)}</a></h3>
        ${priceHTML(p)}
        <p class="card__sizes">${sold ? 'Sem estoque' : sizesLine(p)}</p>
        ${sold ? `<a class="btn btn--sm card__buy card__buy--out" href="${waHref(questionMessage(p, 'restock'))}" target="_blank" rel="noopener">Avise-me</a>`
               : `<button class="btn btn--sm card__buy" type="button" data-quick="${esc(p.id)}" aria-label="Comprar ${esc(p.name)}">Comprar</button>`}
      </div>
    </article>`;
  }

  /** Renderiza cards dentro de um container e ativa imagens/favoritos/animação */
  function renderCards(container, products, opts = {}) {
    if (!container) return;
    container.innerHTML = products.map((p, i) => cardHTML(p, { eager: opts.eagerCount > i, reveal: opts.reveal })).join('');
    hydrateCards(container);
  }
  function hydrateCards(root) {
    $$('.card__img--main', root).forEach((img) => {
      const done = () => img.closest('.card__media')?.classList.remove('is-loading');
      if (img.complete) done(); else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }
    });
    Favs.sync();
    observeReveal(root);
  }

  function initCardEvents() {
    document.addEventListener('click', (e) => {
      // Favoritar
      const fav = e.target.closest('[data-fav]');
      if (fav) {
        e.preventDefault();
        const on = Favs.toggle(fav.dataset.fav);
        fav.classList.remove('pop'); void fav.offsetWidth; fav.classList.add('pop');
        toast(on ? 'Adicionado aos favoritos' : 'Removido dos favoritos', { icon: 'heart', action: on ? { label: 'Ver favoritos', href: 'favoritos.html' } : null });
        return;
      }
      // Trocar cor no card → troca as fotos e o link
      const sw = e.target.closest('.card [data-swatch]');
      if (sw) {
        const card = sw.closest('.card');
        const p = getProduct(card.dataset.card);
        const c = p.colors[Number(sw.dataset.swatch)];
        $$('[data-swatch]', card).forEach((b) => b.setAttribute('aria-pressed', String(b === sw)));
        const imgs = imagesFor(p, c.name);
        const main = $('.card__img--main', card), alt = $('.card__img--alt', card);
        const setImg = (el, entry) => {
          if (!el || !entry) return;
          el.src = imgSrc(entry);
          if (typeof entry === 'object' && entry.srcset) el.srcset = entry.srcset; else el.removeAttribute('srcset');
        };
        setImg(main, imgs[0]); setImg(alt, imgs[1]);
        if (main) main.alt = `${p.name} — ${c.name}`;
        card.dataset.color = c.name;
        $$('a[href^="produto.html"]', card).forEach((a) => { a.href = productUrl(p.id, c.name); });
        return;
      }
      // Escolha rápida de tamanho
      const q = e.target.closest('[data-quick]');
      if (q) {
        e.preventDefault();
        const card = q.closest('.card');
        openQuick(q.dataset.quick, card?.dataset.color, q);
      }
    });
  }

  /* ---------- 14 ESCOLHA RÁPIDA (bottom sheet no mobile) ---------- */
  /** Seletor de tamanhos acessível (radiogroup com setas) */
  function sizesHTML(p, selected, idPrefix) {
    return `<div class="sizes" role="radiogroup" aria-labelledby="${idPrefix}-size-label" data-sizes>${p.sizes.map((s) => {
      const out = unavailable(p).includes(s);
      return `<button class="size" type="button" role="radio" data-size="${esc(s)}" aria-checked="${s === selected}" ${out ? 'disabled aria-disabled="true"' : ''} tabindex="-1" aria-label="${esc(s)}${out ? ' — esgotado' : ''}">${esc(s)}</button>`;
    }).join('')}</div>`;
  }
  function colorsHTML(p, selected) {
    return `<div class="swatches" role="radiogroup" aria-label="Cor" data-colors>${p.colors.map((c) =>
      `<button class="swatch swatch--lg" type="button" role="radio" style="--sw:${esc(c.hex)}" data-color="${esc(c.name)}" aria-checked="${c.name === selected}" aria-label="${esc(c.name)}" title="${esc(c.name)}" tabindex="-1"></button>`).join('')}</div>`;
  }
  /** Liga um radiogroup: clique, setas e roving tabindex. onChange(valor) */
  function bindRadioGroup(group, attr, onChange) {
    if (!group) return;
    const radios = () => $$('[role="radio"]:not([disabled])', group);
    const fixTab = () => {
      const r = radios();
      const cur = r.find((x) => x.getAttribute('aria-checked') === 'true') || r[0];
      r.forEach((x) => { x.tabIndex = x === cur ? 0 : -1; });
    };
    const select = (btn) => {
      $$('[role="radio"]', group).forEach((x) => x.setAttribute('aria-checked', String(x === btn)));
      fixTab();
      onChange(btn.dataset[attr], btn);
    };
    group.addEventListener('click', (e) => { const b = e.target.closest('[role="radio"]:not([disabled])'); if (b) select(b); });
    group.addEventListener('keydown', (e) => {
      const r = radios(); const i = r.indexOf(document.activeElement);
      if (i < 0) return;
      let n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = r[(i + 1) % r.length];
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = r[(i - 1 + r.length) % r.length];
      if (n) { e.preventDefault(); n.focus(); select(n); }
    });
    fixTab();
  }

  function openQuick(id, color, trigger) {
    const p = getProduct(id);
    if (!p) return;
    let sel = { color: color || p.colors?.[0]?.name || '', size: availableSizes(p).length === 1 && p.sizes.length === 1 ? p.sizes[0] : null };
    const body = $('#quickBody');
    const img = () => imagesFor(p, sel.color)[0];
    body.innerHTML = `
      <div class="quick">
        ${imgTag(img(), { alt: p.name, w: 96, h: 128, sizes: '96px', attrs: ' id="quickImg"' })}
        <div><p class="quick__name">${esc(p.name)}</p>${priceHTML(p)}<a class="quick__more" href="${productUrl(p.id, sel.color)}">Ver detalhes da peça</a></div>
      </div>
      ${p.colors?.length ? `<div class="quick-section"><p class="field-label color-label" id="q-color-label">Cor: <span>${esc(sel.color)}</span></p>${colorsHTML(p, sel.color)}</div>` : ''}
      <div class="quick-section">
        <div class="option-head"><p class="field-label" id="q-size-label">Tamanho</p>${p.measures ? `<button class="size-guide-btn" type="button" data-size-guide="${esc(p.id)}">${icon('ruler')}Guia de medidas</button>` : ''}</div>
        ${sizesHTML(p, sel.size, 'q')}
        <p class="field-error" id="q-size-error" hidden>${icon('alert')}Escolha um tamanho para continuar.</p>
      </div>
      <div class="bag-actions">
        <button class="btn btn--block" type="button" id="quickAdd">${icon('bag')}<span>Adicionar à sacola</span></button>
        <button class="btn btn--whatsapp btn--block" type="button" id="quickWa">${icon('whatsapp')}<span>Pedir agora pelo WhatsApp</span></button>
      </div>`;
    bindRadioGroup($('[data-colors]', body), 'color', (v) => {
      sel.color = v;
      $('#q-color-label span').textContent = v;
      const i = $('#quickImg'); const e = img();
      i.src = imgSrc(e); if (typeof e === 'object' && e.srcset) i.srcset = e.srcset; else i.removeAttribute('srcset');
      $('.quick__more', body).href = productUrl(p.id, v);
    });
    bindRadioGroup($('[data-sizes]', body), 'size', (v) => { sel.size = v; $('#q-size-error').hidden = true; $('[data-sizes]', body).classList.remove('is-invalid'); });
    const validate = () => {
      if (sel.size) return true;
      const g = $('[data-sizes]', body);
      $('#q-size-error').hidden = false;
      g.classList.remove('is-invalid'); void g.offsetWidth; g.classList.add('is-invalid');
      $('[role="radio"]:not([disabled])', g)?.focus();
      return false;
    };
    $('#quickAdd').addEventListener('click', () => {
      if (!validate()) return;
      const cardImg = trigger?.closest('.card')?.querySelector('.card__img--main');
      Layers.close('quickSheet');
      addToBag(p, sel.color, sel.size, 1, cardImg || $('#quickImg'));
    });
    $('#quickWa').addEventListener('click', () => {
      if (!validate()) return;
      openWhatsApp(singleOrderMessage({ id: p.id, color: sel.color, size: sel.size, qty: 1 }));
    });
    Layers.open('quickSheet', trigger);
  }

  /* ---------- 15 GUIA DE MEDIDAS ---------- */
  const MEASURE_LABELS = { busto: 'Busto', cintura: 'Cintura', quadril: 'Quadril', comprimento: 'Compr.' };
  function openSizeGuide(id, selected, trigger) {
    const p = getProduct(id);
    if (!p || !p.measures) return;
    const sizes = Object.keys(p.measures);
    const cols = Object.keys(MEASURE_LABELS).filter((k) => sizes.some((s) => p.measures[s][k]));
    $('#sizeGuideBody').innerHTML = `
      <p class="muted" style="margin-bottom:16px">${esc(p.name)} — medidas da peça em centímetros.</p>
      <div class="table-scroll"><table class="measures">
        <caption>Medidas aproximadas; pode haver variação de 1 a 2 cm.</caption>
        <thead><tr><th scope="col">Tam.</th>${cols.map((c) => `<th scope="col">${MEASURE_LABELS[c]}</th>`).join('')}</tr></thead>
        <tbody>${sizes.map((s) => `<tr${s === selected ? ' class="is-selected"' : ''}><th scope="row">${esc(s)}</th>${cols.map((c) => `<td>${p.measures[s][c] || '—'}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
      <div class="how-to-measure">
        <h3>Como se medir</h3>
        <ul class="prose"><li><strong>Busto:</strong> passe a fita na parte mais cheia do busto, sem apertar.</li>
        <li><strong>Cintura:</strong> meça a parte mais fina do tronco, logo acima do umbigo.</li>
        <li><strong>Quadril:</strong> meça a parte mais larga do quadril, com os pés juntos.</li>
        <li><strong>Comprimento:</strong> do ponto mais alto do ombro (ou do cós) até a barra.</li></ul>
        <p>Ficou entre dois tamanhos? <a href="${waHref(questionMessage(p))}" target="_blank" rel="noopener" style="text-decoration:underline">Fale com a gente no WhatsApp</a> que ajudamos a escolher.</p>
      </div>`;
    Layers.open('sizeGuide', trigger);
  }
  function initSizeGuide() {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-size-guide]');
      if (!b) return;
      const scope = b.closest('.layer__body, .pdp__info') || document;
      const sel = $('[data-sizes] [aria-checked="true"]', scope)?.dataset.size;
      openSizeGuide(b.dataset.sizeGuide, sel, b);
    });
  }

  /* ---------- 16 INTERAÇÕES GERAIS ---------- */
  /** Toasts empilháveis e acessíveis (role="status") */
  function toast(message, o = {}) {
    const wrap = $('#toasts');
    if (!wrap) return;
    const t = document.createElement('div');
    t.className = 'toast' + (o.type === 'error' ? ' toast--error' : '');
    t.setAttribute('role', o.type === 'error' ? 'alert' : 'status');
    t.innerHTML = `${icon(o.icon || 'check')}<span>${esc(message)}</span>`;
    if (o.action) {
      const a = document.createElement(o.action.href ? 'a' : 'button');
      a.className = 'toast__action';
      a.textContent = o.action.label;
      if (o.action.href) a.href = o.action.href; else { a.type = 'button'; a.addEventListener('click', () => { o.action.onClick(); dismiss(); }); }
      t.appendChild(a);
    }
    wrap.appendChild(t);
    while (wrap.children.length > 3) wrap.firstElementChild.remove();
    let timer = setTimeout(dismiss, o.duration || 3800);
    t.addEventListener('mouseenter', () => clearTimeout(timer));
    t.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 1500); });
    function dismiss() { t.classList.add('is-leaving'); setTimeout(() => t.remove(), 300); }
  }

  /** Ripple sutil nos botões */
  function initRipple() {
    if (reducedMotion()) return;
    document.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('.btn');
      if (!b || b.disabled) return;
      const r = b.getBoundingClientRect();
      const s = Math.max(r.width, r.height);
      const span = document.createElement('span');
      span.className = 'ripple';
      Object.assign(span.style, { width: s + 'px', height: s + 'px', left: e.clientX - r.left - s / 2 + 'px', top: e.clientY - r.top - s / 2 + 'px' });
      b.appendChild(span);
      setTimeout(() => span.remove(), 650);
    });
  }

  /** Revelação ao rolar (fade + subida) com escalonamento nos grids */
  let revealObserver = null;
  function observeReveal(root = document) {
    $$('[data-reveal]', root).forEach((el) => el.classList.add('reveal'));
    $$('[data-stagger]', root).forEach((g) => $$(':scope > .reveal, :scope > * > .reveal', g).forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 8) * 0.07}s`)));
    const els = $$('.reveal:not(.is-in)', root);
    if (!('IntersectionObserver' in window) || reducedMotion()) { els.forEach((el) => el.classList.add('is-in')); return; }
    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); revealObserver.unobserve(en.target); }
      }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    }
    els.forEach((el) => revealObserver.observe(el));
  }

  /** Setas dos trilhos horizontais (carrosséis) */
  function initRails(root = document) {
    $$('.rail', root).forEach((rail) => {
      if (rail.dataset.ready) return;
      rail.dataset.ready = '1';
      const track = $('.rail__track', rail);
      const prev = $('[data-rail-prev]', rail.parentElement), next = $('[data-rail-next]', rail.parentElement);
      if (!track) return;
      const update = () => {
        if (prev) prev.disabled = track.scrollLeft <= 4;
        if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      };
      const go = (dir) => track.scrollBy({ left: dir * track.clientWidth * 0.9, behavior: reducedMotion() ? 'auto' : 'smooth' });
      prev && prev.addEventListener('click', () => go(-1));
      next && next.addEventListener('click', () => go(1));
      track.addEventListener('scroll', debounce(update, 60), { passive: true });
      window.addEventListener('resize', debounce(update, 150));
      update();
    });
  }

  /** Sincroniza sacola e favoritos entre abas abertas */
  function initStorageSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === KEYS.bag) Bag.sync();
      if (e.key === KEYS.favs) Favs.sync();
    });
  }

  /* ---------- 17 INICIALIZAÇÃO ---------- */
  function init() {
    injectLayout();
    initLayers();
    initAnnouncement();
    initHeader();
    initSearch();
    initBag();
    initCardEvents();
    initSizeGuide();
    initRipple();
    initStorageSync();
    Bag.sync();
    Favs.sync();
    observeReveal();
    initRails();
  }

  // API pública para os scripts das páginas
  window.SDM = {
    CFG, $, $$, esc, fmt, norm, tpl, debounce, reducedMotion, isDesktop, icon, Store, KEYS,
    getProduct, getCategory, availableSizes, isSoldOut, discount, unavailable, productUrl, absoluteProductUrl,
    imagesFor, imgSrc, imgTag, badgesHTML, priceHTML, cardHTML, renderCards, hydrateCards, CARD_SIZES,
    Layers, Favs, Bag, addToBag, openWhatsApp, waHref, buildOrderMessages, singleOrderMessage, questionMessage,
    sizesHTML, colorsHTML, bindRadioGroup, openQuick, openSizeGuide, toast, observeReveal, initRails, searchProducts
  };

  init();
})();
