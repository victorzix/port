# Diferenciação de versões por tier (major/minor/patch) na timeline

- **Data:** 2026-08-13
- **Status:** Aprovado (design) — pendente escrita do plano de implementação
- **Branch:** `feat/release-tiers`

## Contexto e objetivo

Hoje toda release renderiza igual na timeline da página de detalhe do projeto
(`vX.Y.Z` em brand + data + mudanças tipadas). Nada distingue um major de um patch.

Objetivo: diferenciar visualmente cada release pelo **tipo de bump** derivado da
numeração, e **colapsar os patches** sob seu minor pai para reduzir ruído — mantendo
a timeline escaneável, com uma linha por release que traz feature (major/minor).

## Escopo

**Dentro:**
- Derivação pura do tier (major/minor/patch/initial) a partir da numeração.
- Agrupamento de patches sob o minor pai (colapsável, fechado por padrão).
- Tratamento visual: escala tipográfica do número + selo mono, ambos na cor do tier.
- Índice de versões (TOC) inline no topo da seção, clicável, âncora suave.
- i18n (`en`/`pt`/`es`) dos rótulos e do toggle.
- Testes unitários dos helpers puros.

**Fora (escopo negativo):**
- **Nenhuma** mudança de banco, API, schema ou migração.
- **Nenhum** tipo de change novo (não existe conceito de "breaking"; os tipos
  seguem `added`/`changed`/`fixed`/`removed`/`deprecated`/`security`).
- Nada de regra semântica especial pra `0.x` — a derivação é **puramente
  posicional** (qual componente da versão mudou).

## Derivação do tier

Novo módulo puro `src/lib/version-bump.ts`:

```ts
export type BumpTier = "major" | "minor" | "patch" | "initial";
export function bumpTier(version: string, previousVersion: string | null): BumpTier;
```

Algoritmo:
- `previousVersion === null` → `"initial"` (a release mais antiga do projeto).
- Caso contrário, divide ambas as versões em componentes inteiros (`split(".")`),
  faz zero-pad no array mais curto até igualar o comprimento, e acha o **primeiro
  índice que difere**:
  - índice `0` → `"major"`
  - índice `1` → `"minor"`
  - índice `>= 2` → `"patch"`
- Se não houver diferença (versões iguais — não deve ocorrer com versões únicas)
  → `"patch"` como fallback seguro.

"Versão anterior" = a próxima release mais antiga na lista ordenada por `versionKey`
desc (a mesma ordem que o serviço já devolve).

Exemplos:

| version | previous | tier |
|---|---|---|
| `2.0.0` | `1.4.0` | major |
| `1.4.0` | `1.3.5` | minor |
| `1.4.1` | `1.4.0` | patch |
| `1.4.2` | `1.4.1` | patch |
| `2` | `1.9` | major |
| `1.2.1` | `1.2` | patch |
| `0.2.0` | `0.1.0` | minor (posicional — sem regra especial de 0.x) |
| `1.0.0` | `null` | initial |

## Agrupamento de patches

Novo módulo puro `src/lib/release-grouping.ts`:

```ts
export interface ReleaseGroup {
  anchor: ReleaseView;      // a release mostrada na linha principal
  tier: BumpTier;           // tier do anchor (vs. a release imediatamente anterior)
  patches: ReleaseView[];   // patches colapsados sob o anchor, desc
}
export function groupReleases(releases: ReleaseView[]): ReleaseGroup[];
```

Algoritmo (recebe releases já ordenadas desc por `versionKey`):
- **Chave de linha** de uma release = `major.minor` (os dois primeiros componentes;
  componente ausente conta como `0` — ex.: `"2"` → `"2.0"`).
- Agrupa por chave de linha, preservando a ordem desc.
- Dentro de cada grupo:
  - **anchor** = a release com componente de patch `== 0` (o `x.y.0`), se existir;
    senão a release **mais antiga** do grupo (menor `versionKey`).
  - **patches** = as demais releases do grupo, ordenadas desc.
- **tier do anchor** = `bumpTier(anchor.version, <release imediatamente anterior ao
  anchor na lista desc completa>)`. Isso dá `major`/`minor`/`initial` corretamente
  para o anchor.
- Ordena os grupos por `versionKey` do anchor, desc.

Casos de borda:
- Grupo sem `x.y.0` (ex.: só existe `1.4.1`): o anchor vira a release mais antiga do
  grupo e ela aparece na linha principal (não há patch "órfão" escondido).
- Grupo com só o `x.y.0`: `patches` vazio → sem colapsável.
- Release mais antiga do projeto: anchor com tier `initial`.

## UI e estilo

### Tier → estilo

Config central (mapa `tier → { versionClasses, colorClass }`), proposta (px exatos
podem ser afinados no plano):

| tier | número da versão | cor |
|---|---|---|
| major / initial | maior + bold (`~text-[19px] sm:text-[22px] font-bold`) | `text-brand` |
| minor | médio (`~text-[15px] font-semibold`) | `text-foreground` |
| patch | compacto (dentro do colapsável) | `text-muted-foreground` |

As cores usam tokens existentes (`brand`/`foreground`/`muted-foreground`), que já
funcionam em light/dark.

### Selo (tag)

Novo `src/components/releases/release-tier-tag.tsx` (server component): rótulo mono
maiúsculo (`MAJOR`/`MINOR`/`PATCH`/`INITIAL`) na cor do tier, precedido por um
separador sutil (`│`), no mesmo idioma visual dos labels mono já usados no site.
Renderizado ao lado do número da versão no header do `ReleaseItem`.

### Componentes

- `ReleaseItem` ganha a prop `tier: BumpTier`. Aplica as classes de escala/cor ao
  link `v{version}` e renderiza `<ReleaseTierTag tier={tier} />` ao lado.
- Novo `src/components/releases/release-patch-group.tsx` (**client component**,
  `"use client"`): o colapsável "N patches", **fechado por padrão**. Ao expandir,
  lista os patches de forma compacta (`v{version}` · data · mudanças). Botão com
  `aria-expanded` e rótulo acessível.
- A página de detalhe monta `groupReleases(project.releases)` **uma vez** e passa os
  `groups` tanto pro `ReleaseIndex` quanto pro `ReleaseTimeline` (fonte única, sem
  recomputar).
- `ReleaseTimeline` passa a receber `groups` e, para cada grupo, renderiza o
  `ReleaseItem` do anchor seguido do `ReleasePatchGroup` (quando houver patches),
  visualmente aninhado (indentado, sem borda de topo própria). O estado vazio passa
  a checar `groups.length === 0`.

### Índice de versões (TOC)

Novo `src/components/releases/release-index.tsx` (server component). Recebe os
`groups` e renderiza uma lista com wrap de links clicáveis — **um por anchor**
(major/minor/initial; patches não entram, coerente com o colapso). Cada link aponta
pra `#${versionAnchor(version)}` (âncoras já existentes; scroll suave já ligado
globalmente; `scroll-mt-28` já nos itens). Estilo mono pequeno; cada entrada tinge
na cor do seu tier, amarrando o índice ao estilo da timeline.

- Fica na seção "Versões", **logo abaixo do heading e antes da timeline**.
- Renderiza só quando há **2+ anchors** (`groups.length >= 2`) — com um só, não há o
  que indexar.
- Envolto em `<nav aria-label={t("releaseIndexLabel")}>` (landmark acessível); sem
  sub-heading visível, pra não duplicar o "Versões".

### Responsivo / motion

- Mantém o layout mobile-first atual do header (coluna no mobile, `sm:` em linha).
- O colapsável é discreto; nada de animação obrigatória. Transição de rotação do
  chevron é puramente cosmética.

## i18n

Novo namespace `ReleaseBump` em `messages/{en,pt,es}.json`:

- `major`, `minor`, `patch`, `initial` — rótulos do selo.
- `patchesToggle` — toggle do grupo, com plural ICU:
  `"{count, plural, one {# patch} other {# patches}}"`.
- `patchesExpand` / `patchesCollapse` — aria-labels do botão.

No namespace `ProjectDetail` existente:

- `releaseIndexLabel` — aria-label do `<nav>` do índice (ex.: en `Version index`,
  pt `Índice de versões`, es `Índice de versiones`).

**Decisão de rótulos:** manter `MAJOR`/`MINOR`/`PATCH`/`INITIAL` em inglês nos três
locales (jargão semver reconhecido universalmente), porém **roteados pelo i18n** —
cumpre a regra de i18n e deixa trivial trocar por traduções depois se desejado.

## Acessibilidade

- O toggle de patches é um `<button>` com `aria-expanded` e rótulo via
  `patchesExpand`/`patchesCollapse`.
- O selo de tier é texto (não só cor), então a informação não depende de cor.

## Testes

`src/lib/version-bump.test.ts`:
- major/minor/patch/initial; comprimentos diferentes (`2` vs `1.9`, `1.2.1` vs
  `1.2`); multi-dígito (`1.10.0` vs `1.9.0`); posicional em 0.x (`0.2.0` vs `0.1.0`).

`src/lib/release-grouping.test.ts`:
- patches agrupados sob o minor; seleção do anchor (`x.y.0` presente vs ausente);
  ordenação dos grupos e dos patches; release inicial; grupo só com anchor
  (sem patches); versões multi-dígito.

## Arquivos afetados

**Novos:**
- `src/lib/version-bump.ts` (+ teste)
- `src/lib/release-grouping.ts` (+ teste)
- `src/components/releases/release-tier-tag.tsx`
- `src/components/releases/release-patch-group.tsx`
- `src/components/releases/release-index.tsx`

**Editados:**
- `src/app/[locale]/projects/[slug]/page.tsx` (monta `groups` uma vez; renderiza o
  `ReleaseIndex` antes da timeline)
- `src/components/releases/release-timeline.tsx` (recebe `groups`)
- `src/components/releases/release-item.tsx` (prop `tier` + escala + selo)
- `messages/en.json`, `messages/pt.json`, `messages/es.json` (namespace `ReleaseBump`
  + chave `ProjectDetail.releaseIndexLabel`)

**Não tocados:** banco, API, `schema.ts`, migrações, tipos de change, view-models,
services.

## Decisões confirmadas

- Sem conceito de "breaking"; tier é 100% posicional a partir da numeração.
- Combinar selo + escala tipográfica.
- Colapsar **apenas patches** sob o minor; major e minor sempre visíveis.
- Patches colapsados por padrão.
- Índice de versões inline no topo da seção (só anchors major/minor), scroll suave.
