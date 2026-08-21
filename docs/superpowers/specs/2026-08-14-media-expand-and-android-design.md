# Detail page refinements: header-click expand, image lightbox, Android fix

- **Data:** 2026-08-14
- **Status:** Aprovado (design) — pendente escrita do plano
- **Branch:** `feat/media-expand-and-android`

## Contexto

Três problemas relatados na página de detalhe do projeto (verificados ao vivo em
`/projects/docobra`):

1. **Expandir versão** só acontece ao clicar num chevron pequeno — pouco descobrível.
2. **Moldura Android quebrada:** ela desenha a imagem via `<image>` de SVG com um clip
   deslocado (diferente do iPhone/Safari, que usam `<img>` HTML num contêiner
   posicionado e clipado). Resultado: `frame: "android"` renderiza errado — confirmado
   que o conteúdo publicado hoje não usa android (foi revertido pra iphone), e o DOM
   não tem nenhuma moldura Android.
3. **Prints ilegíveis:** os desktop nas molduras aparecem pequenos e cortados
   (`object-cover`). A qualidade da fonte não é o problema (PNG FullHD) — é
   tamanho/corte. As imagens **por-change** (o que o projeto usa) não têm lightbox
   (só a galeria de projeto tinha).

## Escopo (decisões confirmadas)

1. **Cabeçalho da release inteiro clicável** para expandir/recolher; o chevron vira só
   indicador; o link da versão continua clicável (deep-link) sem disparar o toggle.
2. **Consertar a moldura Android** — renderizar a mídia como o iPhone (um `<div>`
   absoluto com `<img>`/`<video>`, clipado à área da tela com border-radius), mantendo
   os paths do SVG do aparelho.
3. **Lightbox de imagem em todas as molduras** (banner, galeria, por-change): clicar
   abre a imagem **inteira e sem corte** (object-contain), grande, sem precisar dar
   zoom. Além disso, **aumentar um pouco** a largura máxima das molduras de desktop
   inline.

**Fora (escopo negativo):** sem mudança em banco, API, schema, agrupamento, tiers, ou
no comportamento de hash/índice. Sem mexer na qualidade dos arquivos de imagem.

## Design

### 1. Cabeçalho clicável (`release-disclosure.tsx`)

Hoje o toggle é um `<button>` (chevron) ao lado do `header`. Passa a ser: o **cabeçalho
inteiro** vira a área de clique — um contêiner com `role="button"`, `tabIndex={0}`,
`aria-expanded`, handlers de clique e de teclado (Enter/Espaço) que alternam `open`. O
chevron permanece como indicador visual (`aria-hidden`, rotaciona com `open`). O link
`<a>` da versão dentro do header chama `stopPropagation` no clique, para continuar
funcionando como deep-link sem alternar o disclosure. (Não se aninha `<a>`/`<h3>`
dentro de `<button>` — por isso `role="button"` num `div`, não um `<button>` real.)

### 2. Moldura Android (`device-frames/android.tsx`)

Remover o `<image>`/`<foreignObject>` de SVG. Renderizar a mídia como no iPhone: um
`<div>` posicionado por porcentagens sobre a área da tela do aparelho (derivadas da
geometria do SVG do Android), com `overflow-hidden` + `border-radius`, contendo um
`<img className="block size-full object-cover object-top">` (ou `<video>` quando
`videoSrc`). O restante do componente (paths do frame, botões, câmera) permanece. Assume
o wrapper responsivo já existente (`h-auto w-full` vindo do `device-mockup`).

### 3. Lightbox + molduras clicáveis

**`media-lightbox.tsx`** (novo client component; generaliza o atual `gallery-lightbox`):
mostra a **imagem crua inteira** (`<img>`/`<video>` com `object-contain`, sem moldura de
aparelho, `max-h` ~85vh, largura fluida) para leitura sem zoom, com legenda opcional,
botão fechar (Esc / clique fora), e **prev/next opcionais** (`hasMany` + `onPrev`/`onNext`)
para a galeria. Lê os próprios rótulos via `useTranslations("ProjectDetail")`
(`galleryPrev`/`galleryNext`/`galleryClose`), removendo o repasse de labels. Trava o
scroll do body enquanto aberto e escuta teclado (Esc/setas).

**`expandable-mockup.tsx`** (novo client component): um `<button>` que embrulha um
`DeviceMockup` (a miniatura emoldurada) e, ao clicar, abre o `media-lightbox` para
**uma** imagem. `aria-label` = `ProjectDetail.mediaExpand`. Usado pelo banner e pelas
imagens por-change (ilhas client dentro de componentes server; recebem a `ResolvedImage`).

**Uso:**
- `project-banner.tsx` — embrulha o `DeviceMockup` num `ExpandableMockup`.
- `release-change-list.tsx` — idem para a imagem do change; e **aumenta** a largura
  máxima inline de desktop (`max-w-[440px]` → `max-w-[600px]`; telefone segue ~`max-w-[200px]`).
- `project-gallery.tsx` — troca `GalleryLightbox` por `MediaLightbox` (multi-imagem,
  com `hasMany`/`onPrev`/`onNext`); mantém o marquee/accordion como está.
- `gallery-lightbox.tsx` — removido (substituído por `media-lightbox`).

**Legibilidade:** o ponto-chave é o lightbox mostrar a imagem **sem corte** — a moldura
de aparelho é só a miniatura; para ler, mostra-se o print inteiro.

### i18n

Nova chave `ProjectDetail.mediaExpand` (aria-label do botão de ampliar), en/pt/es:
en `Enlarge image`, pt `Ampliar imagem`, es `Ampliar imagen`. As chaves
`galleryPrev`/`galleryNext`/`galleryClose`/`galleryHeading`/`galleryShow`/`galleryHide`
já existem e são reutilizadas.

## Acessibilidade

- Cabeçalho como `role="button"` + teclado + `aria-expanded`; link da versão preserva o deep-link.
- `ExpandableMockup` é um `<button>` com `aria-label`; o lightbox é `role="dialog"
  aria-modal`, fecha no Esc, navega por setas, trava o scroll.
- Molduras/nós/frames continuam decorativos.

## Testes

Sem lógica pura nova → sem testes unitários (Vitest env `node`, sem jsdom). Verificação:
`npx tsc --noEmit`, `npm run lint`, `npm run build` (rotas dinâmicas `ƒ`) + conferência
visual (mobile/desktop, light/dark): Android renderiza a imagem; lightbox abre inteiro
e legível; cabeçalho clica pra expandir.

## Arquivos afetados

**Novos:** `src/components/projects/media-lightbox.tsx`, `src/components/projects/expandable-mockup.tsx`.
**Editados:** `device-frames/android.tsx`, `projects/project-banner.tsx`,
`projects/project-gallery.tsx`, `releases/release-change-list.tsx`,
`releases/release-disclosure.tsx`, `messages/{en,pt,es}.json`.
**Removidos:** `src/components/projects/gallery-lightbox.tsx`.
**Não tocados:** `app/[locale]/projects/[slug]/page.tsx` — o `MediaLightbox` lê os
próprios rótulos, então o repasse de labels da página segue como está (a `ProjectGallery`
ignora prev/next/close, usa só heading/show/hide).
**Não tocados:** dados, schema, API, agrupamento/tiers, hash/índice.

## Decisões confirmadas

- Cabeçalho inteiro clicável (chevron vira indicador; link de versão preservado).
- Android renderiza mídia como o iPhone (fix do bug).
- Lightbox com imagem inteira/sem corte em banner, galeria e por-change; inline de desktop um pouco maior.
