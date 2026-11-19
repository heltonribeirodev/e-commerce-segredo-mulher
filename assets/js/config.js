/* ==========================================================================
   SEGREDOS DE MULHER — config.js
   --------------------------------------------------------------------------
   TODAS as informações da loja ficam aqui. Para trocar telefone, nome,
   redes sociais ou textos da faixa do topo, edite SOMENTE este arquivo.
   (Veja o passo a passo em LEIAME-ATUALIZAR-CATALOGO.md)
   ========================================================================== */

const SITE_CONFIG = {
  /* ---------- Marca ---------- */
  storeName: 'Segredos de Mulher',
  // TODO(cliente): definir a frase de marca (aparece no hero, rodapé e menu)
  tagline: 'Peças que contam a sua história',
  // Endereço público do site, SEM barra no final (ex.: 'https://segredosdemulher.com.br').
  // Usado nos links das peças enviados pelo WhatsApp. Se vazio, usa o endereço atual.
  // TODO(cliente): preencher quando o domínio estiver definido.
  siteUrl: '',

  /* ---------- Contato ---------- */
  // Somente dígitos, com 55 + DDD + número. Ex.: '5541999998888'
  // TODO(cliente): número real do WhatsApp da loja
  whatsappNumber: '5541999999999',
  // Como o número aparece escrito no site
  whatsappDisplay: '(41) 99999-9999',
  instagramUrl: 'https://instagram.com/',   // TODO(cliente): link do perfil
  instagramHandle: '@segredosdemulher',     // TODO(cliente): @ do perfil
  tiktokUrl: '',                            // deixe vazio para esconder o ícone
  email: '',                                // deixe vazio para esconder
  address: '',                              // opcional, se houver loja física
  // TODO(cliente): horário de atendimento
  serviceHours: 'Segunda a sábado, das 9h às 19h',

  /* ---------- Loja ---------- */
  currency: 'BRL',
  locale: 'pt-BR',

  /* Faixa do topo — mensagens que se alternam a cada 4 segundos.
     Não prometa o que a loja não faz (frete grátis, parcelamento etc.). */
  announcement: [
    'Peça pelo WhatsApp e receba atendimento personalizado',
    'Novidades toda semana',
    'Enviamos para todo o Brasil — consulte o frete' // TODO(cliente): confirmar envio nacional
  ],

  /* ---------- Pedido pelo WhatsApp ----------
     {loja} é trocado automaticamente pelo nome da loja (storeName). */
  whatsappGreeting: 'Olá! Gostaria de fazer este pedido na {loja}:',
  whatsappDefaultMessage: 'Olá! Vim pelo site da {loja} e gostaria de atendimento.',
  whatsappVipMessage: 'Olá! Quero entrar na lista VIP da {loja} para receber as novidades em primeira mão.',
  orderFooterNote: '(valor sujeito a confirmação de estoque e frete)',
  askCustomerName: true,      // mostra os campos "Seu nome" e "Observações" na sacola
  maxItemsPerMessage: 25,     // acima disso, o pedido é dividido em partes
  maxMessageLength: 1800,     // limite prático de caracteres por mensagem

  /* ---------- Catálogo ---------- */
  productsPerPage: 12         // quantas peças aparecem antes do "Carregar mais"
};
