# Como atualizar o site da Segredos de Mulher

Este guia explica, passo a passo, as alterações do dia a dia. Você só vai mexer em **dois arquivos**:

| O que você quer mudar | Arquivo |
|---|---|
| Telefone do WhatsApp, nome da loja, Instagram, horário, textos da faixa do topo | `assets/js/config.js` |
| Peças: adicionar, trocar foto, mudar preço, marcar esgotado | `assets/js/products.js` |

> **Dica:** abra os arquivos no **VS Code** (gratuito) ou no Bloco de Notas. Antes de editar, faça uma cópia do arquivo. Se algo der errado, é só voltar a cópia.

### Regras de ouro ao editar
- Textos ficam **entre aspas simples**: `'Vestido Aurora'`.
- Preços usam **ponto**, sem "R$": `189.90`.
- Toda linha de informação termina com **vírgula**.
- Não apague chaves `{ }` nem colchetes `[ ]`.
- Depois de salvar, abra o site e confira. Se a página ficar em branco, faltou uma vírgula ou uma aspa.

---

## 1. Trocar o número do WhatsApp

Abra `assets/js/config.js` e altere:

```js
whatsappNumber: '5541999999999',     // 55 + DDD + número, só números
whatsappDisplay: '(41) 99999-9999',  // como aparece escrito no site
```

Pronto. Todos os botões do site passam a usar o novo número.

No mesmo arquivo você também troca `storeName` (nome da loja), `instagramUrl`, `instagramHandle`, `serviceHours` (horário) e as frases de `announcement` (faixa preta do topo).

---

## 2. Mudar o preço de uma peça

Em `assets/js/products.js`, procure o nome da peça (Ctrl+F) e altere:

```js
price: 189.90,
```

**Colocar em promoção:** preencha o preço antigo, e o site mostra o valor riscado, a porcentagem de desconto e coloca a peça no filtro **Sale** automaticamente:

```js
price: 149.90,
originalPrice: 189.90,
```

**Tirar da promoção:** volte para `originalPrice: null,`

---

## 3. Marcar um tamanho (ou a peça toda) como esgotado

```js
sizes: ['P', 'M', 'G', 'GG'],
unavailableSizes: ['M'],          // M aparece riscado
```

- **Peça toda esgotada:** coloque todos os tamanhos em `unavailableSizes`. Ela aparece com o selo "Esgotado" e o botão "Avise-me quando chegar".
- **Voltou ao estoque:** deixe `unavailableSizes: [],`

---

## 4. Trocar a foto de uma peça

1. Prepare a foto (veja o item 6).
2. Coloque o arquivo na pasta `assets/img/products/`.
3. No produto, troque o caminho da foto:

```js
images: ['assets/img/products/vestido-aurora-1.webp', 'assets/img/products/vestido-aurora-2.webp'],
```

A **1ª foto** aparece no card. A **2ª** aparece quando a cliente passa o mouse, e todas aparecem na página da peça.

**Fotos por cor:** se a peça tem fotos diferentes para cada cor, coloque-as em `images` da cor. Quando a cliente escolhe a cor, as fotos trocam sozinhas:

```js
colors: [
  { name: 'Terracota', hex: '#C8623A', images: ['assets/img/products/vestido-aurora-terracota-1.webp'] },
  { name: 'Preto',     hex: '#1C1A19', images: ['assets/img/products/vestido-aurora-preto-1.webp'] }
],
```

`hex` é a cor da bolinha. Para descobrir o código de uma cor, pesquise "seletor de cores" no Google.

---

## 5. Adicionar uma peça nova

1. Copie um produto inteiro em `products.js`, desde a `{` até a `},` correspondente.
2. Cole logo abaixo de outro produto.
3. Altere os dados. O mais importante:

```js
{
  id: 'blusa-margarida',          // único, minúsculas, sem acento e sem espaço (use hífen)
  name: 'Blusa Margarida',
  category: 'blusas',             // vestidos, blusas, cropped, calcas, saias, conjuntos, acessorios
  price: 129.90,
  originalPrice: null,
  badge: 'new',                   // 'new' (Novo), 'low' (Últimas peças), 'bestseller', 'sale' ou null
  images: ['assets/img/products/blusa-margarida-1.webp', 'assets/img/products/blusa-margarida-2.webp'],
  colors: [{ name: 'Branco', hex: '#FFFFFF', images: [] }],
  sizes: ['P', 'M', 'G'],
  unavailableSizes: [],
  description: 'Texto curto sobre a peça.',
  details: ['Tecido: ...', 'Modelagem: ...', 'Cuidados: ...'],
  measures: MEDIDAS.blusa,        // tabela de medidas pronta (ou null)
  tags: ['verão', 'básico'],      // palavras que ajudam na busca
  completeLook: [],               // ids de peças que combinam
  featured: false,                // true = destaque na página inicial
  bestseller: false,              // true = aparece em "Mais vendidos"
  createdAt: '2026-11-20'         // data de cadastro (ano-mês-dia)
},
```

O link da peça fica `produto.html?id=blusa-margarida`, pronto para compartilhar no Instagram.

**Remover uma peça:** apague o bloco dela, da `{` até a `},`.

---

## 6. Como preparar as fotos

- **Proporção 3:4 em pé** (ex.: 1200 × 1600 px). Mínimo de 1200 px de largura.
- Formato **WebP** (carrega muito mais rápido). Converta de graça em **squoosh.app**: escolha WebP, qualidade 80.
- Peso ideal: **até 200 KB** por foto.
- Nomeie assim: `nome-da-peca-1.webp`, `nome-da-peca-2.webp` (minúsculas, sem acento, sem espaço).
- Fundo claro e luz natural valorizam a peça.
- **Foto do topo da página inicial (hero):** retrato 4:5 (ex.: 1200 × 1500 px), em `assets/img/hero/`.
- **Categorias e Instagram:** quadradas (ex.: 600 × 600 px), em `assets/img/categories/` e `assets/img/instagram/`.

---

## 7. Quando o site tiver domínio próprio

1. Em `config.js`, preencha `siteUrl: 'https://seudominio.com.br'` (sem barra no final). Assim os links das peças aparecem nas mensagens do WhatsApp.
2. No VS Code, use **Editar → Substituir nos arquivos** (Ctrl+Shift+H) e troque `SEU-DOMINIO.com.br` pelo domínio real, em todos os arquivos de uma vez.

---

Dúvidas técnicas: **HR | DEV**.
