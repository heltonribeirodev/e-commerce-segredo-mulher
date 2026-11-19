/* ==========================================================================
   SEGREDOS DE MULHER — catalogo.js
   Listagem com filtros, ordenação, chips, estado na URL e "Carregar mais".
   URL aceita: ?categoria=vestidos&tamanho=M,G&cor=Preto&preco=100-200
               &ordem=menor-preco&q=texto&sale=1&disponivel=1&colecao=novidades
   ========================================================================== */
(function () {
  'use strict';
  const S = window.SDM;
  if (!S) return;
  const { $, $$, esc, icon, norm, CFG } = S;

  const PER_PAGE = CFG.productsPerPage || 12;
  const SIZE_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG', 'G1', 'G2', 'G3', '34', '36', '38', '40', '42', '44', '46', '48', 'Único'];
  const PRICE_RANGES = [
    { key: 'ate-100', label: 'Até R$ 100', test: (v) => v <= 100 },
    { key: '100-200', label: 'R$ 100 a R$ 200', test: (v) => v > 100 && v <= 200 },
    { key: '200-mais', label: 'Acima de R$ 200', test: (v) => v > 200 }
  ];
  const COLLECTIONS = {
    novidades: { label: 'Novidades', test: (p) => p.badge === 'new' },
    'mais-vendidos': { label: 'Mais vendidos', test: (p) => p.bestseller || p.badge === 'bestseller' }
  };
  const SORTS = ['relevancia', 'novos', 'menor-preco', 'maior-preco'];

  /* ---------- Estado (lido da URL) ---------- */
  const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
  function readState() {
    const q = new URLSearchParams(location.search);
    return {
      categoria: q.get('categoria') || '',
      tamanho: list(q.get('tamanho')),
      cor: list(q.get('cor')),
      preco: q.get('preco') || '',
      ordem: SORTS.includes(q.get('ordem')) ? q.get('ordem') : 'relevancia',
      q: (q.get('q') || '').trim(),
      sale: q.get('sale') === '1' || q.get('categoria') === 'sale',
      disponivel: q.get('disponivel') === '1',
      colecao: COLLECTIONS[q.get('colecao')] ? q.get('colecao') : ''
    };
  }
  let state = readState();
  if (state.categoria === 'sale') state.categoria = '';

  function writeState() {
    const q = new URLSearchParams();
    if (state.q) q.set('q', state.q);
    if (state.colecao) q.set('colecao', state.colecao);
    if (state.categoria) q.set('categoria', state.categoria);
    if (state.tamanho.length) q.set('tamanho', state.tamanho.join(','));
    if (state.cor.length) q.set('cor', state.cor.join(','));
    if (state.preco) q.set('preco', state.preco);
    if (state.sale) q.set('sale', '1');
    if (state.disponivel) q.set('disponivel', '1');
    if (state.ordem !== 'relevancia') q.set('ordem', state.ordem);
    const qs = q.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
  }

  /* ---------- Filtragem e ordenação ---------- */
  const searchRank = new Map();
  function matches(p, st, skip) {
    if (st.q && !searchRank.has(p.id)) return false;
    if (st.colecao && !COLLECTIONS[st.colecao].test(p)) return false;
    if (skip !== 'categoria' && st.categoria && p.category !== st.categoria) return false;
    if (st.tamanho.length && !st.tamanho.some((s) => S.availableSizes(p).includes(s))) return false;
    if (st.cor.length && !st.cor.some((c) => (p.colors || []).some((x) => norm(x.name) === norm(c)))) return false;
    if (st.preco) { const r = PRICE_RANGES.find((x) => x.key === st.preco); if (r && !r.test(p.price)) return false; }
    if (st.sale && !S.discount(p)) return false;
    if (st.disponivel && S.isSoldOut(p)) return false;
    return true;
  }
  function results() {
    searchRank.clear();
    if (state.q) S.searchProducts(state.q).forEach((p, i) => searchRank.set(p.id, i));
    const out = PRODUCTS.filter((p) => matches(p, state));
    const rel = (p) => (p.featured ? 2 : 0) + (p.bestseller ? 1 : 0);
    const sorters = {
      relevancia: (a, b) => (state.q ? searchRank.get(a.id) - searchRank.get(b.id) : rel(b) - rel(a) || String(b.createdAt).localeCompare(String(a.createdAt))),
      novos: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
      'menor-preco': (a, b) => a.price - b.price,
      'maior-preco': (a, b) => b.price - a.price
    };
    // Esgotados sempre por último
    return out.sort((a, b) => (S.isSoldOut(a) - S.isSoldOut(b)) || sorters[state.ordem](a, b));
  }

  /* ---------- Opções disponíveis no catálogo ---------- */
  const allSizes = [...new Set(PRODUCTS.flatMap((p) => p.sizes))].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a), ib = SIZE_ORDER.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || String(a).localeCompare(String(b));
  });
  const allColors = [];
  PRODUCTS.forEach((p) => (p.colors || []).forEach((c) => { if (!allColors.some((x) => norm(x.name) === norm(c.name))) allColors.push(c); }));
  const realCats = CATEGORIES.filter((c) => !c.special);

  /* ---------- Formulário de filtros ---------- */
  const form = $('#filterForm');
  $('#filtersClose').innerHTML = icon('x');
  $('#filterBtn').insertAdjacentHTML('afterbegin', icon('filter', 'icon--sm'));

  function renderForm() {
    const catCount = (key) => PRODUCTS.filter((p) => p.category === key && matches(p, state, 'categoria')).length;
    const allCount = PRODUCTS.filter((p) => matches(p, state, 'categoria')).length;
    form.innerHTML = `
      <details class="filters__group" open><summary>Categoria ${icon('chevronDown')}</summary>
        <div class="filters__body">
          <label class="opt"><input type="radio" name="categoria" value="" ${!state.categoria ? 'checked' : ''}>Todas<small>${allCount}</small></label>
          ${realCats.map((c) => `<label class="opt"><input type="radio" name="categoria" value="${esc(c.key)}" ${state.categoria === c.key ? 'checked' : ''}>${esc(c.label)}<small>${catCount(c.key)}</small></label>`).join('')}
        </div></details>
      <details class="filters__group" open><summary>Tamanho ${icon('chevronDown')}</summary>
        <div class="filters__body"><div class="opt-sizes" role="group" aria-label="Tamanhos">
          ${allSizes.map((s) => `<label class="opt-size"><input type="checkbox" name="tamanho" value="${esc(s)}" ${state.tamanho.includes(s) ? 'checked' : ''}><span>${esc(s)}</span></label>`).join('')}
        </div></div></details>
      <details class="filters__group" open><summary>Cor ${icon('chevronDown')}</summary>
        <div class="filters__body"><div class="opt-colors" role="group" aria-label="Cores">
          ${allColors.map((c) => `<label class="opt-color"><input type="checkbox" name="cor" value="${esc(c.name)}" ${state.cor.some((x) => norm(x) === norm(c.name)) ? 'checked' : ''}><span style="--sw:${esc(c.hex)}" aria-hidden="true"></span><span>${esc(c.name)}</span></label>`).join('')}
        </div></div></details>
      <details class="filters__group" open><summary>Preço ${icon('chevronDown')}</summary>
        <div class="filters__body">
          <label class="opt"><input type="radio" name="preco" value="" ${!state.preco ? 'checked' : ''}>Qualquer preço</label>
          ${PRICE_RANGES.map((r) => `<label class="opt"><input type="radio" name="preco" value="${r.key}" ${state.preco === r.key ? 'checked' : ''}>${r.label}</label>`).join('')}
        </div></details>
      <label class="switch-opt">Apenas em promoção<input type="checkbox" name="sale" role="switch" ${state.sale ? 'checked' : ''}></label>
      <label class="switch-opt">Apenas disponíveis<input type="checkbox" name="disponivel" role="switch" ${state.disponivel ? 'checked' : ''}></label>`;
  }

  form.addEventListener('change', (e) => {
    const f = e.target;
    if (f.name === 'categoria') state.categoria = f.value;
    if (f.name === 'preco') state.preco = f.value;
    if (f.name === 'sale') state.sale = f.checked;
    if (f.name === 'disponivel') state.disponivel = f.checked;
    if (f.name === 'tamanho' || f.name === 'cor') state[f.name] = $$(`input[name="${f.name}"]:checked`, form).map((i) => i.value);
    shown = PER_PAGE;
    update({ keepFocus: f.name });
  });
  $('#sortSelect').addEventListener('change', (e) => { state.ordem = e.target.value; update(); });
  $('#filtersClear').addEventListener('click', () => clearAll());

  function clearAll() {
    state = { ...state, categoria: '', tamanho: [], cor: [], preco: '', sale: false, disponivel: false, colecao: '', q: '' };
    shown = PER_PAGE;
    update();
  }

  /* ---------- Chips dos filtros ativos ---------- */
  function renderChips() {
    const chips = [];
    const chip = (label, fn) => chips.push({ label, fn });
    if (state.q) chip(`Busca: “${state.q}”`, () => { state.q = ''; });
    if (state.colecao) chip(COLLECTIONS[state.colecao].label, () => { state.colecao = ''; });
    if (state.categoria) chip(S.getCategory(state.categoria)?.label || state.categoria, () => { state.categoria = ''; });
    state.tamanho.forEach((s) => chip(`Tam. ${s}`, () => { state.tamanho = state.tamanho.filter((x) => x !== s); }));
    state.cor.forEach((c) => chip(c, () => { state.cor = state.cor.filter((x) => x !== c); }));
    if (state.preco) chip(PRICE_RANGES.find((r) => r.key === state.preco)?.label || state.preco, () => { state.preco = ''; });
    if (state.sale) chip('Em promoção', () => { state.sale = false; });
    if (state.disponivel) chip('Disponíveis', () => { state.disponivel = false; });

    const box = $('#activeChips');
    box.innerHTML = chips.map((c, i) => `<button class="chip chip--remove" type="button" data-chip="${i}" aria-label="Remover filtro ${esc(c.label)}">${esc(c.label)}${icon('x')}</button>`).join('')
      + (chips.length > 1 ? '<button class="chip chip--clear" type="button" data-chip="all">Limpar tudo</button>' : '');
    box.onclick = (e) => {
      const b = e.target.closest('[data-chip]');
      if (!b) return;
      if (b.dataset.chip === 'all') clearAll();
      else { chips[Number(b.dataset.chip)].fn(); shown = PER_PAGE; update(); }
      ($('#activeChips [data-chip]') || $('#catTitle')).focus?.();
    };
    const n = chips.length;
    $('#filterBtn').innerHTML = `${icon('filter', 'icon--sm')}Filtrar${n ? ` <span class="filter-count">${n}</span>` : ''}`;
    $('#filterBtn').setAttribute('aria-label', n ? `Filtrar (${n} ativos)` : 'Filtrar');
  }

  /* ---------- Título, migalhas e meta ---------- */
  function renderHead(total) {
    const cat = S.getCategory(state.categoria);
    let title = 'Todas as peças';
    if (state.q) title = `Resultados para “${state.q}”`;
    else if (state.colecao) title = COLLECTIONS[state.colecao].label + (cat ? ` · ${cat.label}` : '');
    else if (cat) title = cat.label;
    else if (state.sale) title = 'Sale';
    $('#catTitle').textContent = title;
    const count = `${total} ${total === 1 ? 'peça' : 'peças'}`;
    $('#catCount').textContent = count;
    $('#toolbarCount').textContent = `${count} encontrada${total === 1 ? '' : 's'}`;
    $('#filtersApply').textContent = total ? `Ver ${count}` : 'Nenhuma peça';
    $('#crumbs').innerHTML = `<li><a href="index.html">Início</a></li>${title === 'Todas as peças' ? '<li aria-current="page">Catálogo</li>' : `<li><a href="catalogo.html">Catálogo</a></li><li aria-current="page">${esc(title)}</li>`}`;
    document.title = `${title} — ${CFG.storeName}`;
  }

  /* ---------- Grade e paginação ---------- */
  const grid = $('#catGrid');
  const viewKey = () => S.KEYS.catalog + ':' + location.search;
  let shown = Math.max(PER_PAGE, Number(sessionStorage.getItem(viewKey()) || 0) || PER_PAGE);

  function renderEmpty() {
    const box = $('#catEmpty');
    const msg = `Olá! Procurei no site e não encontrei${state.q ? ` "${state.q}"` : ' o que queria'}. Vocês podem me ajudar?`;
    box.innerHTML = `<div class="empty-state">${icon('search')}<h2>Nenhuma peça encontrada</h2>
      <p>Tente remover alguns filtros ou buscar por outra palavra. Se preferir, fale com a gente: podemos ter a peça que você procura.</p>
      <div class="empty-state__actions"><button class="btn btn--outline" type="button" id="emptyClear">Limpar filtros</button>
      <a class="btn btn--whatsapp" href="${S.waHref(msg)}" target="_blank" rel="noopener">${icon('whatsapp')}<span>Pedir ajuda no WhatsApp</span></a></div></div>`;
    $('#emptyClear').addEventListener('click', clearAll);
  }

  function update(o = {}) {
    writeState();
    const res = results();
    renderHead(res.length);
    renderChips();
    // Re-renderiza o formulário (contagens) preservando o foco
    const active = document.activeElement;
    const focusSel = active && form.contains(active) ? `input[name="${active.name}"][value="${CSS.escape(active.value)}"]` : null;
    renderForm();
    if (focusSel) { const el = $(focusSel, form) || $(`input[name="${o.keepFocus}"]`, form); el && el.focus({ preventScroll: true }); }
    $('#sortSelect').value = state.ordem;

    const empty = res.length === 0;
    $('#catEmpty').hidden = !empty;
    if (empty) renderEmpty();
    const slice = res.slice(0, shown);
    S.renderCards(grid, slice, { eagerCount: 4 });
    const lm = $('#loadMore');
    lm.hidden = res.length <= shown;
    $('#loadMoreText').textContent = `Mostrando ${slice.length} de ${res.length} peças`;
    $('#loadMoreBar').style.width = `${(slice.length / Math.max(res.length, 1)) * 100}%`;
    try { sessionStorage.setItem(viewKey(), String(shown)); } catch (e) { /* modo privado */ }
  }

  $('#loadMoreBtn').addEventListener('click', () => {
    const before = shown;
    shown += PER_PAGE;
    update();
    // Leva o foco ao primeiro card novo (acessibilidade)
    const first = $$('.card', grid)[before];
    first && $('.card__name a', first)?.focus({ preventScroll: true });
    first && first.scrollIntoView({ block: 'nearest', behavior: S.reducedMotion() ? 'auto' : 'smooth' });
  });

  // Painel de filtros só é "modal" no celular; ao ir para desktop, fecha
  window.addEventListener('resize', S.debounce(() => { if (S.isDesktop() && S.Layers.isOpen('filters')) S.Layers.close('filters'); }, 200));

  update();
})();
