/* ==========================================================================
   SEGREDOS DE MULHER — favoritos.js
   Lista as peças favoritadas (salvas no localStorage).
   ========================================================================== */
(function () {
  'use strict';
  const S = window.SDM;
  if (!S) return;
  const { $, icon } = S;

  function render() {
    const items = S.Favs.list().map(S.getProduct).filter(Boolean);
    const n = items.length;
    $('#favCount').textContent = n ? `${n} ${n === 1 ? 'peça salva' : 'peças salvas'}` : '';
    $('#favEmpty').hidden = n > 0;
    $('#favGrid').hidden = n === 0;
    const wa = $('#favWa');
    wa.hidden = n === 0;
    if (n) {
      const lines = items.map((p, i) => `${i + 1}) ${p.name} — ${S.fmt(p.price)}${S.absoluteProductUrl(p.id) ? '\n   ' + S.absoluteProductUrl(p.id) : ''}`).join('\n');
      wa.href = S.waHref(`Olá! Separei estas peças nos favoritos e gostaria de ajuda para escolher:\n\n${lines}`);
      wa.innerHTML = `${icon('whatsapp')}<span>Pedir ajuda com meus favoritos</span>`;
      S.renderCards($('#favGrid'), items, { eagerCount: 4, reveal: false });
    } else {
      $('#favEmpty').innerHTML = `<div class="empty-state">${icon('heart')}<h2>Nenhum favorito ainda</h2>
        <p>Toque no coração das peças que você amou para guardá-las aqui e decidir com calma.</p>
        <div class="empty-state__actions"><a class="btn" href="catalogo.html">Ver catálogo</a><a class="btn btn--outline" href="catalogo.html?colecao=novidades">Novidades</a></div></div>`;
    }
  }
  // Atualiza ao favoritar/desfavoritar (inclusive em outra aba)
  let raf;
  document.addEventListener('sdm:favs', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (S.Favs.list().length !== document.querySelectorAll('#favGrid .card').length) render(); }); });
  render();
})();
