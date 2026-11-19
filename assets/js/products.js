/* ==========================================================================
   SEGREDOS DE MULHER — products.js
   --------------------------------------------------------------------------
   Catálogo da loja. Para adicionar, editar ou esgotar peças, edite este
   arquivo seguindo o passo a passo do LEIAME-ATUALIZAR-CATALOGO.md.

   ⚠ TODOS OS PRODUTOS ABAIXO SÃO EXEMPLOS (nomes, preços e fotos
     ilustrativas). Substitua pelas peças reais da loja.
   ========================================================================== */

/* --------------------------------------------------------------------------
   CATEGORIAS
   key   = identificador usado nos produtos e na URL (sem acento/espaço)
   label = nome que aparece no site
   image = foto de capa (quadrada)
   TODO(cliente): confirmar a lista de categorias.
   -------------------------------------------------------------------------- */
const CATEGORIES = [
  { key: 'vestidos',   label: 'Vestidos',        image: 'assets/img/categories/vestidos.svg' },
  { key: 'blusas',     label: 'Blusas',          image: 'assets/img/categories/blusas.svg' },
  { key: 'cropped',    label: 'Cropped',         image: 'assets/img/categories/cropped.svg' },
  { key: 'calcas',     label: 'Calças e Shorts', image: 'assets/img/categories/calcas.svg' },
  { key: 'saias',      label: 'Saias',           image: 'assets/img/categories/saias.svg' },
  { key: 'conjuntos',  label: 'Conjuntos',       image: 'assets/img/categories/conjuntos.svg' },
  { key: 'acessorios', label: 'Acessórios',      image: 'assets/img/categories/acessorios.svg' },
  // "sale" é especial: mostra automaticamente toda peça com originalPrice preenchido
  { key: 'sale',       label: 'Sale',            image: 'assets/img/categories/sale.svg', special: true }
];

/* --------------------------------------------------------------------------
   TABELAS DE MEDIDAS (em centímetros) — reaproveitadas por várias peças.
   Se uma peça tiver medidas diferentes, escreva a tabela dela direto no produto.
   -------------------------------------------------------------------------- */
const MEDIDAS = {
  vestidoMidi: {
    PP: { busto: 80, cintura: 62, quadril: 88,  comprimento: 112 },
    P:  { busto: 84, cintura: 66, quadril: 92,  comprimento: 113 },
    M:  { busto: 88, cintura: 70, quadril: 96,  comprimento: 114 },
    G:  { busto: 94, cintura: 76, quadril: 102, comprimento: 115 },
    GG: { busto: 100, cintura: 82, quadril: 108, comprimento: 116 }
  },
  blusa: {
    P:  { busto: 88, cintura: 80, quadril: 0, comprimento: 56 },
    M:  { busto: 92, cintura: 84, quadril: 0, comprimento: 57 },
    G:  { busto: 98, cintura: 90, quadril: 0, comprimento: 58 },
    GG: { busto: 104, cintura: 96, quadril: 0, comprimento: 59 }
  },
  cropped: {
    PP: { busto: 78, cintura: 64, quadril: 0, comprimento: 38 },
    P:  { busto: 82, cintura: 68, quadril: 0, comprimento: 39 },
    M:  { busto: 86, cintura: 72, quadril: 0, comprimento: 40 },
    G:  { busto: 92, cintura: 78, quadril: 0, comprimento: 41 }
  },
  calca: {
    36: { busto: 0, cintura: 66, quadril: 94,  comprimento: 104 },
    38: { busto: 0, cintura: 70, quadril: 98,  comprimento: 105 },
    40: { busto: 0, cintura: 74, quadril: 102, comprimento: 106 },
    42: { busto: 0, cintura: 78, quadril: 106, comprimento: 107 },
    44: { busto: 0, cintura: 82, quadril: 110, comprimento: 108 }
  },
  saia: {
    P:  { busto: 0, cintura: 66, quadril: 94,  comprimento: 72 },
    M:  { busto: 0, cintura: 70, quadril: 98,  comprimento: 73 },
    G:  { busto: 0, cintura: 76, quadril: 104, comprimento: 74 },
    GG: { busto: 0, cintura: 82, quadril: 110, comprimento: 75 }
  }
};

/* --------------------------------------------------------------------------
   PRODUTOS
   Campos:
   id              identificador único (vai na URL). Só letras minúsculas, números e hífen.
   name            nome da peça
   category        key de uma categoria acima
   price           preço atual (use ponto: 189.90)
   originalPrice   preço "de" (riscado). Deixe null se não estiver em promoção.
   badge           'new' (Novo) | 'sale' (% OFF) | 'low' (Últimas peças) | 'bestseller' | null
   images          fotos da peça. A 1ª aparece no card; a 2ª aparece ao passar o mouse.
   colors          cores. "images" da cor troca as fotos quando a cliente escolhe a cor.
   sizes           tamanhos oferecidos
   unavailableSizes tamanhos esgotados (se todos estiverem aqui, a peça aparece "Esgotada")
   description     texto da peça
   details         lista de detalhes (tecido, modelagem, cuidados)
   measures        tabela de medidas (use uma de MEDIDAS ou escreva a sua). null = sem tabela.
   tags            palavras que ajudam na busca e nas sugestões
   completeLook    ids de peças que combinam (aparecem em "Complete o look")
   featured        true = aparece em destaque na página inicial
   bestseller      true = aparece em "Mais vendidos"
   createdAt       data de cadastro (AAAA-MM-DD), usada em "Mais novos"
   -------------------------------------------------------------------------- */
const PRODUCTS = [
  {
    id: 'vestido-aurora',
    name: 'Vestido Aurora',
    category: 'vestidos',
    price: 189.90,
    originalPrice: null,
    badge: 'new',
    images: ['assets/img/products/vestido-aurora-terracota-1.svg', 'assets/img/products/vestido-aurora-terracota-2.svg'],
    colors: [
      { name: 'Terracota', hex: '#C8623A', images: ['assets/img/products/vestido-aurora-terracota-1.svg', 'assets/img/products/vestido-aurora-terracota-2.svg'] },
      { name: 'Preto', hex: '#1C1A19', images: ['assets/img/products/vestido-aurora-preto-1.svg', 'assets/img/products/vestido-aurora-preto-2.svg'] }
    ],
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
    unavailableSizes: ['PP'],
    description: 'Vestido midi de alcinha com cintura marcada e saia evasê que acompanha o movimento. Do almoço de domingo ao jantar especial.',
    details: ['Tecido: viscose com toque macio', 'Modelagem: evasê, cintura marcada', 'Alças finas reguláveis', 'Cuidados: lavar à mão, secar à sombra'],
    measures: MEDIDAS.vestidoMidi,
    tags: ['festa', 'verão', 'midi', 'alcinha'],
    completeLook: ['bolsa-mini-estrela', 'brinco-gota-dourado'],
    featured: true, bestseller: true, createdAt: '2026-11-10'
  },
  {
    id: 'vestido-serena',
    name: 'Vestido Serena Longo',
    category: 'vestidos',
    price: 229.90,
    originalPrice: 279.90,
    badge: 'sale',
    images: ['assets/img/products/vestido-serena-peach-1.svg', 'assets/img/products/vestido-serena-peach-2.svg'],
    colors: [
      { name: 'Peach', hex: '#F2B597', images: ['assets/img/products/vestido-serena-peach-1.svg', 'assets/img/products/vestido-serena-peach-2.svg'] },
      { name: 'Verde Oliva', hex: '#6A6B3D', images: ['assets/img/products/vestido-serena-verde-oliva-1.svg', 'assets/img/products/vestido-serena-verde-oliva-2.svg'] }
    ],
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
    unavailableSizes: [],
    description: 'Longo fluido com decote suave e fenda discreta. Leve, elegante e perfeito para casamentos ao ar livre e viagens.',
    details: ['Tecido: crepe de viscose', 'Modelagem: fluida, comprimento longo', 'Fenda lateral discreta', 'Cuidados: lavar à mão, não torcer'],
    measures: MEDIDAS.vestidoMidi,
    tags: ['festa', 'casamento', 'longo', 'viagem'],
    completeLook: ['brinco-gota-dourado', 'bolsa-mini-estrela'],
    featured: true, bestseller: true, createdAt: '2026-09-20'
  },
  {
    id: 'vestido-lirio',
    name: 'Vestido Lírio Curto',
    category: 'vestidos',
    price: 159.90,
    originalPrice: null,
    badge: 'low',
    images: ['assets/img/products/vestido-lirio-off-white-1.svg', 'assets/img/products/vestido-lirio-off-white-2.svg'],
    colors: [
      { name: 'Off-white', hex: '#EFE6D8', images: ['assets/img/products/vestido-lirio-off-white-1.svg', 'assets/img/products/vestido-lirio-off-white-2.svg'] },
      { name: 'Rosa Queimado', hex: '#D38C7F', images: ['assets/img/products/vestido-lirio-rosa-queimado-1.svg', 'assets/img/products/vestido-lirio-rosa-queimado-2.svg'] }
    ],
    sizes: ['P', 'M', 'G', 'GG'],
    unavailableSizes: ['P', 'GG'],
    description: 'Curtinho com mangas bufantes e franzido delicado no busto. Romântico na medida certa.',
    details: ['Tecido: tricoline de algodão', 'Mangas bufantes com elástico', 'Forro no busto', 'Cuidados: lavar à máquina no ciclo delicado'],
    measures: MEDIDAS.vestidoMidi,
    tags: ['romântico', 'curto', 'verão', 'manga bufante'],
    completeLook: ['bolsa-mini-estrela'],
    featured: true, bestseller: false, createdAt: '2026-10-28'
  },
  {
    id: 'blusa-lua',
    name: 'Blusa Lua Manga Bufante',
    category: 'blusas',
    price: 119.90,
    originalPrice: null,
    badge: 'bestseller',
    images: ['assets/img/products/blusa-lua-off-white-1.svg', 'assets/img/products/blusa-lua-off-white-2.svg'],
    colors: [
      { name: 'Off-white', hex: '#F4EEE4', images: ['assets/img/products/blusa-lua-off-white-1.svg', 'assets/img/products/blusa-lua-off-white-2.svg'] },
      { name: 'Preto', hex: '#1C1A19', images: ['assets/img/products/blusa-lua-preto-1.svg', 'assets/img/products/blusa-lua-preto-2.svg'] }
    ],
    sizes: ['P', 'M', 'G', 'GG'],
    unavailableSizes: [],
    description: 'Blusa de mangas bufantes e decote redondo, que vai do jeans à saia de alfaiataria.',
    details: ['Tecido: viscolinho', 'Modelagem: soltinha', 'Botões nas costas', 'Cuidados: lavar à mão'],
    measures: MEDIDAS.blusa,
    tags: ['básico', 'trabalho', 'romântico'],
    completeLook: ['calca-pantalona-areia', 'saia-midi-plissada'],
    featured: false, bestseller: true, createdAt: '2026-08-15'
  },
  {
    id: 't-shirt-essencial',
    name: 'T-shirt Essencial',
    category: 'blusas',
    price: 69.90,
    originalPrice: null,
    badge: null,
    // Foto real convertida em WebP com versões responsivas (srcset)
    images: [
      { src: 'assets/img/products/t-shirt-essencial-1-776.webp', srcset: 'assets/img/products/t-shirt-essencial-1-480.webp 480w, assets/img/products/t-shirt-essencial-1-776.webp 776w' },
      'assets/img/products/t-shirt-essencial-2-480.webp'
    ],
    colors: [{ name: 'Off-white', hex: '#F1ECE2', images: [] }],
    sizes: ['P', 'M', 'G', 'GG'],
    unavailableSizes: [],
    description: 'A camiseta que combina com tudo: algodão macio, gola redonda e caimento reto.',
    details: ['Tecido: 100% algodão penteado', 'Modelagem: reta', 'Cuidados: lavar à máquina, não usar alvejante'],
    measures: MEDIDAS.blusa,
    tags: ['básico', 'algodão', 'dia a dia', 'camiseta'],
    completeLook: ['short-linho-terracota', 'saia-envelope-noite'],
    featured: false, bestseller: true, createdAt: '2026-07-01'
  },
  {
    id: 'moletom-rose',
    name: 'Moletom Rosé',
    category: 'blusas',
    price: 139.90,
    originalPrice: 179.90,
    badge: 'sale',
    images: [
      { src: 'assets/img/products/moletom-rose-1-766.webp', srcset: 'assets/img/products/moletom-rose-1-480.webp 480w, assets/img/products/moletom-rose-1-766.webp 766w' },
      'assets/img/products/moletom-rose-2-480.webp'
    ],
    colors: [{ name: 'Rosa Queimado', hex: '#C27F86', images: [] }],
    sizes: ['P', 'M', 'G', 'GG'],
    unavailableSizes: ['GG'],
    description: 'Moletom flanelado por dentro, quentinho e com modelagem ampla para os dias frios.',
    details: ['Tecido: moletom flanelado', 'Modelagem: ampla', 'Punhos e barra canelados', 'Cuidados: lavar do avesso'],
    measures: MEDIDAS.blusa,
    tags: ['inverno', 'conforto', 'básico'],
    completeLook: ['calca-pantalona-areia'],
    featured: false, bestseller: false, createdAt: '2026-06-10'
  },
  {
    id: 'cropped-flor-de-lis',
    name: 'Cropped Flor de Lis',
    category: 'cropped',
    price: 79.90,
    originalPrice: null,
    badge: 'new',
    images: ['assets/img/products/cropped-flor-de-lis-rosa-queimado-1.svg', 'assets/img/products/cropped-flor-de-lis-rosa-queimado-2.svg'],
    colors: [
      { name: 'Rosa Queimado', hex: '#D38C7F', images: ['assets/img/products/cropped-flor-de-lis-rosa-queimado-1.svg', 'assets/img/products/cropped-flor-de-lis-rosa-queimado-2.svg'] },
      { name: 'Preto', hex: '#1C1A19', images: ['assets/img/products/cropped-flor-de-lis-preto-1.svg', 'assets/img/products/cropped-flor-de-lis-preto-2.svg'] },
      { name: 'Peach', hex: '#F6BFA2', images: ['assets/img/products/cropped-flor-de-lis-peach-1.svg', 'assets/img/products/cropped-flor-de-lis-peach-2.svg'] }
    ],
    sizes: ['PP', 'P', 'M', 'G'],
    unavailableSizes: [],
    description: 'Cropped de manguinha com textura canelada e ajuste perfeito ao corpo.',
    details: ['Tecido: malha canelada com elastano', 'Modelagem: justa', 'Cuidados: lavar à mão'],
    measures: MEDIDAS.cropped,
    tags: ['verão', 'básico', 'canelado'],
    completeLook: ['saia-midi-plissada', 'calca-pantalona-areia'],
    featured: true, bestseller: false, createdAt: '2026-11-12'
  },
  {
    id: 'cropped-trico-mel',
    name: 'Cropped Tricô Mel',
    category: 'cropped',
    price: 89.90,
    originalPrice: 119.90,
    badge: 'sale',
    images: ['assets/img/products/cropped-trico-mel-mel-1.svg', 'assets/img/products/cropped-trico-mel-mel-2.svg'],
    colors: [
      { name: 'Mel', hex: '#C9A15B', images: ['assets/img/products/cropped-trico-mel-mel-1.svg', 'assets/img/products/cropped-trico-mel-mel-2.svg'] },
      { name: 'Off-white', hex: '#F1E9DC', images: ['assets/img/products/cropped-trico-mel-off-white-1.svg', 'assets/img/products/cropped-trico-mel-off-white-2.svg'] }
    ],
    sizes: ['P', 'M', 'G'],
    unavailableSizes: [],
    description: 'Tricô leve de trama aberta, ideal para meia-estação.',
    details: ['Tecido: tricô de fio misto', 'Modelagem: reta, comprimento cropped', 'Cuidados: lavar à mão, secar na horizontal'],
    measures: MEDIDAS.cropped,
    tags: ['tricô', 'meia-estação'],
    completeLook: ['saia-envelope-noite'],
    featured: false, bestseller: false, createdAt: '2026-09-02'
  },
  {
    id: 'calca-pantalona-areia',
    name: 'Calça Pantalona Areia',
    category: 'calcas',
    price: 199.90,
    originalPrice: null,
    badge: 'bestseller',
    images: ['assets/img/products/calca-pantalona-areia-areia-1.svg', 'assets/img/products/calca-pantalona-areia-areia-2.svg'],
    colors: [
      { name: 'Areia', hex: '#D9C7A7', images: ['assets/img/products/calca-pantalona-areia-areia-1.svg', 'assets/img/products/calca-pantalona-areia-areia-2.svg'] },
      { name: 'Preto', hex: '#1C1A19', images: ['assets/img/products/calca-pantalona-areia-preto-1.svg', 'assets/img/products/calca-pantalona-areia-preto-2.svg'] }
    ],
    sizes: ['36', '38', '40', '42', '44'],
    unavailableSizes: ['44'],
    description: 'Pantalona de cintura alta e pernas amplas, com caimento que alonga a silhueta.',
    details: ['Tecido: alfaiataria com elastano', 'Cintura alta com passantes', 'Bolsos laterais', 'Cuidados: lavar à máquina no ciclo delicado'],
    measures: MEDIDAS.calca,
    tags: ['alfaiataria', 'trabalho', 'cintura alta'],
    completeLook: ['blusa-lua', 'cropped-flor-de-lis'],
    featured: true, bestseller: true, createdAt: '2026-08-30'
  },
  {
    id: 'short-linho-terracota',
    name: 'Short Linho Terracota',
    category: 'calcas',
    price: 129.90,
    originalPrice: 159.90,
    badge: 'sale',
    images: [
      { src: 'assets/img/products/short-linho-terracota-1-750.webp', srcset: 'assets/img/products/short-linho-terracota-1-480.webp 480w, assets/img/products/short-linho-terracota-1-750.webp 750w' },
      'assets/img/products/short-linho-terracota-2-480.webp'
    ],
    colors: [{ name: 'Terracota', hex: '#B5603F', images: [] }],
    sizes: ['36', '38', '40', '42', '44'],
    unavailableSizes: [],
    description: 'Short de linho com cordão e bolsos, fresquinho para os dias de calor.',
    details: ['Tecido: linho misto', 'Cós com elástico e cordão', 'Bolsos frontais', 'Cuidados: lavar à mão'],
    measures: MEDIDAS.calca,
    tags: ['linho', 'verão', 'conforto'],
    completeLook: ['t-shirt-essencial', 'cropped-flor-de-lis'],
    featured: false, bestseller: false, createdAt: '2026-10-05'
  },
  {
    id: 'saia-midi-plissada',
    name: 'Saia Midi Plissada',
    category: 'saias',
    price: 169.90,
    originalPrice: null,
    badge: 'new',
    images: ['assets/img/products/saia-midi-plissada-rosa-queimado-1.svg', 'assets/img/products/saia-midi-plissada-rosa-queimado-2.svg'],
    colors: [
      { name: 'Rosa Queimado', hex: '#D38C7F', images: ['assets/img/products/saia-midi-plissada-rosa-queimado-1.svg', 'assets/img/products/saia-midi-plissada-rosa-queimado-2.svg'] },
      { name: 'Verde Oliva', hex: '#6A6B3D', images: ['assets/img/products/saia-midi-plissada-verde-oliva-1.svg', 'assets/img/products/saia-midi-plissada-verde-oliva-2.svg'] }
    ],
    sizes: ['P', 'M', 'G', 'GG'],
    unavailableSizes: [],
    description: 'Saia midi plissada com cós de elástico embutido. Movimento leve a cada passo.',
    details: ['Tecido: cetim plissado', 'Cós com elástico embutido', 'Forro interno', 'Cuidados: lavar à mão, não passar ferro direto'],
    measures: MEDIDAS.saia,
    tags: ['midi', 'plissado', 'festa', 'trabalho'],
    completeLook: ['blusa-lua', 'cropped-flor-de-lis'],
    featured: true, bestseller: false, createdAt: '2026-11-05'
  },
  {
    id: 'saia-envelope-noite',
    name: 'Saia Envelope Noite',
    category: 'saias',
    price: 139.90,
    originalPrice: null,
    badge: null,
    images: ['assets/img/products/saia-envelope-noite-1.svg', 'assets/img/products/saia-envelope-noite-2.svg'],
    colors: [{ name: 'Preto', hex: '#1C1A19', images: [] }],
    sizes: ['P', 'M', 'G', 'GG'],
    unavailableSizes: ['P', 'M', 'G', 'GG'], // exemplo de peça ESGOTADA
    description: 'Saia curta transpassada com amarração lateral.',
    details: ['Tecido: crepe', 'Amarração lateral', 'Cuidados: lavar à mão'],
    measures: MEDIDAS.saia,
    tags: ['noite', 'curta', 'envelope'],
    completeLook: ['cropped-trico-mel'],
    featured: false, bestseller: false, createdAt: '2026-07-20'
  },
  {
    id: 'conjunto-alfaiataria-rose',
    name: 'Conjunto Alfaiataria Rosé',
    category: 'conjuntos',
    price: 289.90,
    originalPrice: null,
    badge: 'new',
    images: ['assets/img/products/conjunto-alfaiataria-rose-1.svg', 'assets/img/products/conjunto-alfaiataria-rose-2.svg'],
    colors: [{ name: 'Rosé', hex: '#C98B7E', images: [] }],
    sizes: ['P', 'M', 'G', 'GG'],
    unavailableSizes: [],
    description: 'Blazer de lapela clássica e calça reta. Use junto ou separado: são várias produções em uma.',
    details: ['Tecido: alfaiataria leve', 'Blazer com forro', 'Calça com cós alto e zíper lateral', 'Cuidados: lavagem a seco recomendada'],
    measures: MEDIDAS.blusa,
    tags: ['alfaiataria', 'trabalho', 'conjunto', 'blazer'],
    completeLook: ['brinco-gota-dourado', 'bolsa-mini-estrela'],
    featured: true, bestseller: false, createdAt: '2026-11-15'
  },
  {
    id: 'conjunto-linho-verao',
    name: 'Conjunto Linho Verão',
    category: 'conjuntos',
    price: 249.90,
    originalPrice: 299.90,
    badge: 'sale',
    images: ['assets/img/products/conjunto-linho-verao-off-white-1.svg', 'assets/img/products/conjunto-linho-verao-off-white-2.svg'],
    colors: [
      { name: 'Off-white', hex: '#F1E9DC', images: ['assets/img/products/conjunto-linho-verao-off-white-1.svg', 'assets/img/products/conjunto-linho-verao-off-white-2.svg'] },
      { name: 'Terracota', hex: '#C8623A', images: ['assets/img/products/conjunto-linho-verao-terracota-1.svg', 'assets/img/products/conjunto-linho-verao-terracota-2.svg'] }
    ],
    sizes: ['P', 'M', 'G'],
    unavailableSizes: ['G'],
    description: 'Camisa de linho e calça pantacourt de cós elástico. Elegância despretensiosa para o calor.',
    details: ['Tecido: linho com viscose', 'Camisa com botões de madrepérola', 'Calça com cós elástico', 'Cuidados: lavar à mão'],
    measures: MEDIDAS.blusa,
    tags: ['linho', 'verão', 'conjunto', 'viagem'],
    completeLook: ['bolsa-mini-estrela'],
    featured: false, bestseller: true, createdAt: '2026-10-12'
  },
  {
    id: 'bolsa-mini-estrela',
    name: 'Bolsa Mini Estrela',
    category: 'acessorios',
    price: 119.90,
    originalPrice: null,
    badge: null,
    images: ['assets/img/products/bolsa-mini-estrela-preto-1.svg', 'assets/img/products/bolsa-mini-estrela-preto-2.svg'],
    colors: [
      { name: 'Preto', hex: '#1C1A19', images: ['assets/img/products/bolsa-mini-estrela-preto-1.svg', 'assets/img/products/bolsa-mini-estrela-preto-2.svg'] },
      { name: 'Caramelo', hex: '#A0613A', images: ['assets/img/products/bolsa-mini-estrela-caramelo-1.svg', 'assets/img/products/bolsa-mini-estrela-caramelo-2.svg'] }
    ],
    sizes: ['Único'],
    unavailableSizes: [],
    description: 'Mini bolsa estruturada com alça de mão e detalhe dourado em formato de estrela.',
    details: ['Material: couro sintético', 'Medidas: 22 x 16 x 8 cm', 'Alça de ombro removível', 'Forro interno com bolso'],
    measures: null,
    tags: ['bolsa', 'presente', 'festa'],
    completeLook: ['vestido-aurora', 'brinco-gota-dourado'],
    featured: false, bestseller: true, createdAt: '2026-09-15'
  },
  {
    id: 'brinco-gota-dourado',
    name: 'Brinco Gota Dourado',
    category: 'acessorios',
    price: 59.90,
    originalPrice: null,
    badge: 'low',
    images: ['assets/img/products/brinco-gota-dourado-1.svg', 'assets/img/products/brinco-gota-dourado-2.svg'],
    colors: [{ name: 'Dourado', hex: '#D4AF37', images: [] }],
    sizes: ['Único'],
    unavailableSizes: [],
    description: 'Brinco em formato de gota com banho dourado. Leve e delicado para todas as ocasiões.',
    details: ['Material: metal com banho dourado', 'Fecho: tarraxa', 'Comprimento: 4 cm', 'Cuidados: evitar contato com perfume e água'],
    measures: null,
    tags: ['bijuteria', 'presente', 'dourado'],
    completeLook: ['vestido-serena', 'bolsa-mini-estrela'],
    featured: false, bestseller: false, createdAt: '2026-10-20'
  }
];
