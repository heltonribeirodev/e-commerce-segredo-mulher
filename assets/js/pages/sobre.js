/* ==========================================================================
   SEGREDOS DE MULHER — sobre.js
   Ícones da página institucional.
   ========================================================================== */
(function () {
  'use strict';
  const S = window.SDM;
  if (!S) return;
  const { $$, icon } = S;
  $$('.step[data-icon]').forEach((el) => el.insertAdjacentHTML('beforeend', icon(el.dataset.icon, 'step__icon')));
  $$('.contact-card [data-icon]').forEach((el) => { el.outerHTML = icon(el.dataset.icon); });
  $$('[data-plus]').forEach((el) => { el.outerHTML = icon('plus'); });
})();
