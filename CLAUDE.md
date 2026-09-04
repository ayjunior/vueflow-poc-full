# CLAUDE.md

Este arquivo fornece orientações para o Claude Code (claude.ai/code) ao trabalhar com código neste repositório.

## Projeto

Uma POC explorando as funcionalidades do [Vue Flow](https://vueflow.dev/) (vueflow.dev) em Vue 3, usando **Options API** em todo o projeto (não `<script setup>`). Duas telas, alternadas por abas em `App.vue`:

- **Organograma IMAP** (`OrgChart.vue`) — um organograma institucional real do IMAP (Instituto Municipal de Administração Pública, Curitiba), reproduzindo o layout do PDF oficial em `pdf/Organograma IMAP.pdf`, com nós/edges customizados e um fluxo de exportação para impressão/PDF.
- **Playground Vue Flow** (`FlowCanvas.vue`) — uma POC livre cobrindo drag&drop, `NodeToolbar`, `NodeResizer`, edges customizadas, etc.

Comentários no código-fonte e textos da interface estão em português (pt-BR).

## Comandos

O gerenciador de pacotes é o npm (`package-lock.json` é o lockfile de referência; `pnpm-lock.yaml`/`pnpm-workspace.yaml` também existem no repositório, então `pnpm install`/`pnpm dev` também funcionam).

```bash
npm install
npm run dev       # servidor de desenvolvimento do vite na porta 5173 (ver vite.config.js)
npm run build     # build de produção em dist/
npm run preview   # serve o build de produção localmente
```

Não há suíte de testes, linter ou type checker configurados neste repositório.

## Arquitetura

### Options API + composables do Vue Flow

O Vue Flow é construído em torno do composable `useVueFlow()`, que só funciona dentro de `setup()`. Todo componente que precisa dele (`OrgChart.vue`, `FlowCanvas.vue`, `PrintPreview.vue`) segue o mesmo padrão: uma função `setup()` chama `useVueFlow()` e **retorna** apenas os refs/funções necessários (geralmente renomeados com sufixo `Fn`/`Ref`, ex.: `onNodeDrag: onNodeDragFn`), enquanto o restante do componente (`data`, `methods`, `mounted`) permanece em Options API normal, acessando tudo via `this`. Ao adicionar novas interações com o Vue Flow, estenda essa mesma lista de retorno do `setup()` em vez de introduzir `<script setup>`.

### Modelo de nós/edges

Tanto `OrgChart.vue` quanto `FlowCanvas.vue` mantêm `nodes`/`edges` como arrays em `data()` do componente, vinculados via `v-model:nodes` / `v-model:edges` no `<VueFlow>`. Tipos customizados de nó/edge são registrados via slots nomeados (`#node-<type>`, `#edge-<type>`), não por um mapa `nodeTypes`:

```html
<template #node-org="props"><OrgNode v-bind="props" /></template>
<template #edge-custom="props"><CustomEdge v-bind="props" /></template>
```

### Detalhes de OrgChart.vue

- Todos os dados organizacionais vivem em um único array `NODES_DATA` no topo do arquivo: cada item tem `id`, `label`, `parentId`, um `kind` (`root`, `super`, `director`, `coord`, `unit`, `gerencia`, `divisao`, `nucleo`, `staff`, `consultivo`) e `x`/`y`/`width` explícitos, replicando o layout do PDF oficial. `ORG_NODES`/`ORG_EDGES` são derivados desse array no carregamento do módulo (as edges conectam cada nó ao seu `parentId`).
- O `kind` define o estilo do nó (`OrgNode.vue`) e quais `Handle`s extras o nó recebe — por exemplo, só a raiz ganha um handle de origem no topo e só o `conselho` (kind `consultivo`) ganha um handle de destino embaixo, permitindo que um único nó trace uma linha tracejada para cima até o Conselho Consultivo enquanto todas as outras edges fluem de cima para baixo (`type: 'step'`).
- Os nós são selecionáveis/redimensionáveis (`NodeResizer` dentro de `OrgNode.vue`), mas `nodes-connectable` e `edges-updatable` estão desabilitados no `<VueFlow>` — este organograma serve para reposicionar/redimensionar a estrutura existente, não para desenhar novas conexões.
- **Alinhamento/encaixe**: tanto `OrgChart.vue` quanto `FlowCanvas.vue` conectam `onNodeDrag`/`onNodeDragStop` a `getHelperLines()` (`src/utils/helperLines.js`), um sistema de linhas-guia estilo Figma que encontra o alinhamento de borda/centro mais próximo em relação aos outros nós dentro de um raio em pixels, encaixa a posição do nó arrastado via `updateNode` e renderiza as linhas-guia através do slot `#zoom-pane`. Reutilize esse mesmo helper para qualquer novo canvas com nós arrastáveis.
- **Persistência de layout**: `saveLayout`/`restoreFromHistory`/`deleteFromHistory` serializam o flow inteiro via `toObject()`/`fromObject()` (a (de)serialização de grafo nativa do Vue Flow) no `localStorage`, sob a chave `imap-orgchart-flow-history`, exibido em `LayoutHistoryPanel.vue`. Esse é o padrão a seguir para qualquer futura funcionalidade de salvar/restaurar — não serialize nós/edges manualmente.

### Fluxo de impressão/exportação (PrintPreview.vue)

Rasteriza o viewport ao vivo do Vue Flow com o `toPng` do `html-to-image`, depois recorta a imagem resultante em páginas físicas (A4/A3/A2, retrato/paisagem, margem/escala configuráveis) usando uma conversão px-por-mm a 96dpi. A paginação é feita injetando dinamicamente um elemento `<style>` de `@media print` (`pageSizeStyleEl`) dimensionado para o papel escolhido, com uma `<div>` por página e `page-break-after`; a impressão/"Salvar como PDF" é feita via `window.print()`, sem depender de uma biblioteca de geração de PDF.

### Playground (FlowCanvas.vue)

Demonstra, em um único arquivo: nós tipados (`input`/`default`/`output`/custom/resizable), `Background`/`Controls`/`MiniMap`, um `Panel` mostrando o último evento de interação, `onConnect` (novas edges usam por padrão o tipo de edge customizada), `onNodeClick`, drag&drop externo a partir da paleta em `App.vue` (chave `application/vueflow` do `dataTransfer`, posicionado via `project()`), e o mesmo encaixe por linhas-guia de `OrgChart.vue`. `CustomNode.vue` exibe uma `NodeToolbar` para duplicar/excluir ao selecionar; `CustomEdge.vue` exibe um label baseado em `EdgeLabelRenderer` com botão de remover; `ResizableNode.vue` envolve o `NodeResizer`.