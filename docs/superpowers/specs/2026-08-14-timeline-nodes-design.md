# Release timeline as a quiet vertical timeline (nodes + rail)

- **Data:** 2026-08-14
- **Status:** Aprovado (design — Variante D do mockup) — pendente escrita do plano
- **Branch:** `feat/timeline-nodes`
- **Mockup de referência:** artifact "Release Timeline Redesign", Variante D.

## Contexto e objetivo

A timeline de versões hoje separa releases só por uma borda superior, e os patches
ficam quase no mesmo nível visual das mudanças normais (borda + leve indentação).
Falta hierarquia (o "pai" dos patches) e ritmo (respiro entre grupos vs. dentro).

Objetivo: reenquadrar a timeline como uma **linha do tempo discreta** — um trilho
vertical fino à esquerda, com um **nó** marcando cada release; os patches aninhados
sob a release-pai num **trilho secundário** com nós menores e apagados. Metáfora de
timeline (honesta para um changelog) com a sobriedade do resto do site.

## Escopo

**Dentro (apresentação/CSS):**
- Trilho vertical na coluna de releases; nó cheio (brand) por release.
- Patches aninhados sob a release-pai com trilho secundário + nó menor/apagado por patch.
- Substituir as bordas superiores (`border-t`) por esse trilho como elemento de
  conexão; ajustar espaçamento (mais respiro entre grupos, mais junto dentro).

**Fora (escopo negativo):**
- **Sem** mudança de comportamento: o colapso (release mais nova aberta, antigas em
  cabeçalho clicável), o auto-expand por hash, o índice de versões, os selos de tier
  e o colapsável de patches continuam funcionando igual.
- **Sem** mudança em dados, agrupamento (`groupReleases`), schema, API, i18n, ou nos
  view-models.

## Design (Variante D)

Cores por token (funcionam em light/dark): trilho `--border`/`--border-2`, nó de
release `--brand`, nó de patch `--muted-foreground`/faint. Nada de cor literal.

**Trilho + coluna** (`ReleaseTimeline`): a lista de releases vira um container
`relative` com recuo à esquerda para o trilho; uma linha vertical fina
(≈1.5px, cor `--border-2`) desce pela coluna, com um pequeno inset no topo/base para
não ultrapassar o primeiro/último nó. As bordas `border-t` some das releases — o
trilho passa a ser o separador; o espaçamento entre releases vem de padding/gap.

**Nó da release** (`ReleaseItem`): a `<article>` (wrapper `Reveal`) ganha `relative`
e um nó decorativo (pseudo-elemento) — círculo ≈8px, `bg-brand`, posicionado **sobre
o trilho** e alinhado verticalmente com a linha da versão (topo do cabeçalho). Remove
`border-t border-border`; mantém `scroll-mt-28`, o `id={anchor}`, o stagger do reveal,
e todo o conteúdo (link de versão, selo, data, título, disclosure com mudanças/notas).

**Zona de patches** (`ReleasePatchGroup`): em vez da borda superior + `pl-4` atuais,
os patches ficam indentados sob o anchor com um **trilho secundário** (borda esquerda
fina, cor `--border`), o toggle "N patches" no topo, e cada patch com um **nó menor
apagado** (≈6px, cor faint/`--muted-foreground`) sobre esse trilho secundário. O
conteúdo do patch (versão, data, `ReleaseChangeList`) e o comportamento colapsável
seguem iguais.

**Ritmo:** aumentar o respiro entre grupos de release; manter itens relacionados
(mudanças de uma mesma release) mais próximos. Valores exatos (px de recuo, posição
dos nós, gaps) saem do mockup Variante D e serão afinados no plano/implementação com
verificação visual.

**Implementação:** classes utilitárias Tailwind com `before:`/`relative` nos próprios
componentes (o trilho principal como pseudo no container da timeline; os nós como
pseudo nos elementos de release/patch). Sem novo CSS global previsto; se o
posicionamento pedir, um bloco pequeno em `globals.css` é aceitável.

## Acessibilidade

- Trilho e nós são **decorativos** (pseudo-elementos) — não adicionam conteúdo a leitores de tela.
- O toggle de disclosure e o de patches seguem como `<button aria-expanded>` (inalterados).
- Contraste: nó brand e trilho legíveis em light e dark (tokens existentes).

## Testes

Nenhum teste unitário novo — mudança puramente visual, sem lógica pura (ambiente
Vitest é `node`, sem jsdom). Verificação: `npx tsc --noEmit`, `npm run lint`,
`npm run build` (rotas de projeto seguem dinâmicas `ƒ`), + conferência visual em
mobile e desktop, light e dark.

## Arquivos afetados

**Editados:**
- `src/components/releases/release-timeline.tsx` (container do trilho + layout)
- `src/components/releases/release-item.tsx` (nó da release; remove `border-t`; espaçamento)
- `src/components/releases/release-patch-group.tsx` (trilho secundário + nó por patch; espaçamento)
- (possível) `src/app/globals.css` — só se o trilho/nós pedirem um bloco de CSS além do Tailwind.

**Não tocados:** `groupReleases`, `version-bump`, `release-index.tsx`, `release-disclosure.tsx` (comportamento), `page.tsx`, view-models, services, schema, mensagens i18n.

## Decisões confirmadas

- Variante D (timeline discreta) aprovada — meio-termo entre A (trilho simples) e C (nós grandes).
- Aplicada à timeline inteira (cada release um nó), não só ao bloco de patches.
- Bordas superiores substituídas pelo trilho; nós decorativos por token.
- Sem mudança de comportamento ou de dados.
