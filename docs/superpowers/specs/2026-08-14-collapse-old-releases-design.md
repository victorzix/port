# Collapse older releases on the timeline

- **Data:** 2026-08-14
- **Status:** Aprovado (design) — pendente escrita do plano
- **Branch:** `feat/collapse-old-releases`

## Contexto e objetivo

A timeline de versões hoje renderiza **todas** as releases (major/minor) totalmente
expandidas — título, mudanças e notas — uma embaixo da outra; só os patches ficam
colapsados sob o minor pai. Com muitas versões, isso vira uma parede de texto.

Objetivo: manter só a release **mais nova** aberta por padrão e transformar toda
release **mais antiga** num cabeçalho clicável (mudanças/notas escondidas até
expandir). Os patches seguem como o colapsável aninhado que já existe.

## Escopo

**Dentro:**
- Release mais recente aberta por padrão; releases anteriores colapsadas a um
  cabeçalho, expansíveis por clique.
- Título visível no cabeçalho colapsado (contexto); só mudanças+notas escondem.
- Auto-expand por hash: se a URL aponta para a âncora de uma release (índice de
  versões ou deep link), essa release abre sozinha.
- i18n (`en`/`pt`/`es`) dos rótulos de expandir/recolher.

**Fora (escopo negativo):**
- **Sem** mudança em `groupReleases` / `version-bump` — o agrupamento e a
  derivação de tier já entregam os grupos ordenados; isto é 100% renderização.
- **Sem** mudança em banco, API, schema, `page.tsx`, tipos de change, ou no
  colapsável de patches (`ReleasePatchGroup` fica como está).

## Comportamento

- A timeline recebe os grupos já ordenados desc (mais novo primeiro). O grupo de
  **índice 0** (release mais nova) começa **aberto**; todos os outros começam
  **fechados**.
- Cada anchor vira um bloco com:
  - **cabeçalho sempre visível:** link `v{version}` (âncora), selo de tier, data e
    o **título** (quando houver), + um botão chevron de expandir/recolher.
  - **corpo colapsável:** a lista de mudanças (`ReleaseChangeList`) e as notas
    (`MarkdownContent`), mostradas só quando aberto.
- O colapsável de **patches** (`ReleasePatchGroup`) continua sendo renderizado
  pela timeline como irmão do anchor, independente do estado aberto/fechado do
  anchor (igual hoje).
- **Auto-expand por hash:** ao montar e a cada `hashchange`, se
  `window.location.hash === "#" + anchorId`, o bloco abre. Nunca força fechar —
  então o mais novo (default aberto) e um alvo de hash podem ficar ambos abertos.

## Componentes e dados

Novo client component `src/components/releases/release-disclosure.tsx`:

```ts
interface ReleaseDisclosureProps {
  defaultOpen: boolean;
  /** Anchor id of this release (e.g. "v2-0-0"); drives hash auto-expand. */
  anchorId: string;
  labels: { expand: string; collapse: string };
  /** Always-visible header (version link + tier tag + date + title). */
  header: React.ReactNode;
  /** Collapsible body (changes + notes). */
  children: React.ReactNode;
}
```

- `useState(defaultOpen)` for open state; `useEffect` subscribes to `hashchange`
  and checks the initial hash, opening when it matches `#${anchorId}`.
- Renders a top row: the `header` (flex-1) plus a chevron `<button>` with
  `aria-expanded` and an sr-only `expand`/`collapse` label; then `{open && children}`.
- The version stays an `<a href="#…">` inside `header` (deep link); the **chevron
  button** is the toggle — the two are siblings, never nested (`<a>` in `<button>`
  is invalid).

`src/components/releases/release-item.tsx` (server, modified):
- Gains a required `defaultOpen: boolean` prop.
- Reads `useTranslations("ProjectDetail")` for the expand/collapse labels.
- Composes `header` (the existing version/tag/date row **plus** the title `<h3>`)
  and passes the change list + notes as `children` to `ReleaseDisclosure`. The
  body stays server-rendered — only show/hide is client.
- Keeps the `Reveal` wrapper, the `id={anchor}` and `scroll-mt-28` (so anchors and
  the reveal stagger still work).

`src/components/releases/release-timeline.tsx` (modified):
- For each group, passes `defaultOpen={index === 0}` to `ReleaseItem`. Everything
  else (mapping groups → `ReleaseItem` + `ReleasePatchGroup`, empty state) unchanged.

`groupReleases`, `version-bump`, `page.tsx`, view-models, services, schema: **untouched.**

## i18n

New keys in the existing `ProjectDetail` namespace, all three locales:
- `releaseExpand` — en `Show changes`, pt `Mostrar mudanças`, es `Mostrar cambios`.
- `releaseCollapse` — en `Hide changes`, pt `Ocultar mudanças`, es `Ocultar cambios`.

## Acessibilidade

- Chevron toggle is a real `<button>` with `aria-expanded` and an sr-only label
  (`releaseExpand`/`releaseCollapse`).
- The version deep link stays a normal `<a>`, separate from the toggle.
- Auto-expand on hash means an index click lands the reader on open content.

## Testes

Nenhum teste unitário novo — não há lógica pura nova (o disclosure é um client
component; o ambiente Vitest é `node`, sem jsdom). Verificação: `npx tsc --noEmit`,
`npm run lint`, `npm run build` (rotas de projeto seguem dinâmicas `ƒ`).

## Arquivos afetados

**Novos:**
- `src/components/releases/release-disclosure.tsx`

**Editados:**
- `src/components/releases/release-item.tsx` (prop `defaultOpen`, cabeçalho c/ título, corpo no disclosure)
- `src/components/releases/release-timeline.tsx` (passa `defaultOpen={index === 0}`)
- `messages/en.json`, `messages/pt.json`, `messages/es.json` (`releaseExpand`/`releaseCollapse`)

## Decisões confirmadas

- Só a release mais nova aberta; anteriores colapsadas a cabeçalho clicável.
- Título visível no cabeçalho colapsado.
- Auto-expand por hash (índice/deep link abre a release alvo).
- Patches seguem no colapsável próprio, independente do anchor.
- Sem mudança de agrupamento/dados/banco.
