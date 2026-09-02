# Vue Flow · POC

Aplicação em **Vue 3 (Options API)** construída sobre o [Vue Flow](https://vueflow.dev/),
com duas telas:

- **Organograma IMAP** — organograma institucional real (Instituto Municipal de
  Administração Pública), com nós/edges customizados e exportação para impressão em PDF.
- **Playground Vue Flow** — POC livre para explorar as principais features da biblioteca
  (drag&drop, NodeToolbar, NodeResizer, edges customizadas, etc.).

## Como rodar

Este projeto usa [pnpm](https://pnpm.io/) (há `pnpm-workspace.yaml` e `pnpm-lock.yaml` no repo).

```bash
pnpm install
pnpm dev
```

Depois abra o endereço que o Vite mostrar no terminal (por padrão
`http://localhost:5173`).

Outros scripts disponíveis (`package.json`):

```bash
pnpm build     # gera o build de produção em dist/
pnpm preview   # serve o build de produção localmente
```

> Também é possível usar `npm install` / `npm run dev` (há `package-lock.json`
> versionado), mas o lockfile de referência é o do pnpm.

## Estrutura

```
.
├── index.html
├── package.json
├── vite.config.js
├── pdf/
│   └── Organograma IMAP.pdf   # referência oficial usada para reproduzir o layout
└── src/
    ├── main.js                # bootstrap da app + imports de CSS do Vue Flow
    ├── style.css               # tema visual do POC
    ├── App.vue                 # layout raiz: header + abas (Organograma / Playground)
    └── components/
        ├── OrgChart.vue        # organograma do IMAP (dados, nós e edges reais)
        ├── OrgNode.vue         # nó customizado do organograma (handles top/bottom)
        ├── PrintPreview.vue    # modal de pré-visualização e impressão/exportação em PDF
        ├── FlowCanvas.vue      # componente principal do playground Vue Flow
        ├── CustomNode.vue      # nó customizado + NodeToolbar
        ├── ResizableNode.vue   # nó com NodeResizer
        └── CustomEdge.vue      # edge customizada com label e botão de remover
```

## Nota sobre Options API + Vue Flow

O Vue Flow é construído em torno do composable `useVueFlow()`, que só
pode ser chamado dentro de um contexto de `setup()`. Nos componentes
deste projeto isso é resolvido assim: o `setup()` chama `useVueFlow()` e
**expõe** (via `return`) apenas as funções/refs necessárias; o resto
do componente (`data`, `methods`, `mounted`) continua em Options API
normal e acessa tudo via `this`.

## Organograma IMAP (`OrgChart.vue`)

- Estrutura organizacional definida em `NODES_DATA`, com posições (`x`/`y`/`width`)
  replicando o layout do organograma oficial em PDF (`pdf/Organograma IMAP.pdf`),
  base legal: Lei 7.671/1991, última alteração pelo Decreto 423/2026.
- Cada nó (`OrgNode.vue`) tem um `kind` (`root`, `super`, `director`, `coord`, `unit`,
  `gerencia`, `divisao`, `nucleo`, `staff`, `consultivo`) usado para estilização e
  para decidir quais `Handle`s extras o nó precisa (ex.: o Conselho Consultivo se
  liga à raiz por uma linha tracejada vinda de cima).
- Edges são do tipo `step`, com estilo tracejado apenas para a ligação com o
  Conselho Consultivo.
- Navegação/zoom via `Controls` e `MiniMap`; a legenda das cores fica em um `Panel`
  no canto superior direito.
- Botão **"Visualizar impressão"** abre o `PrintPreview.vue`.

## Pré-visualização e impressão (`PrintPreview.vue`)

- Captura o diagrama renderizado com [`html-to-image`](https://github.com/bubkoo/html-to-image)
  (`toPng` sobre o viewport do Vue Flow) e recorta o resultado em páginas físicas
  (A4/A3/A2, retrato/paisagem, com margem e escala configuráveis).
- Permite navegar entre as páginas geradas, ajustar a escala para caber em uma
  única folha e disparar a impressão do navegador (`window.print()`), que também
  serve para "Salvar como PDF".
- O conteúdo de impressão fica em um bloco dedicado, visível apenas em
  `@media print`, com uma `<div>` por página e `page-break-after` entre elas.

## Playground Vue Flow (`FlowCanvas.vue` e afins)

| Feature | Onde está |
|---|---|
| Nodes/edges básicos, tipos `input`/`default`/`output` | `FlowCanvas.vue` (dados iniciais) |
| Zoom & pan, `min-zoom`/`max-zoom`, `fitView` | `FlowCanvas.vue` (props do `<VueFlow>` + `onPaneReady`) |
| `Background` | `FlowCanvas.vue` |
| `Controls` (zoom in/out, fit view, lock) | `FlowCanvas.vue` |
| `MiniMap` | `FlowCanvas.vue` |
| `Panel` (UI flutuante sobre o canvas) | `FlowCanvas.vue` (painel "Último evento") |
| Nó customizado com `Handle` | `CustomNode.vue` |
| `NodeToolbar` (duplicar/excluir ao selecionar) | `CustomNode.vue` |
| `NodeResizer` (redimensionar nó) | `ResizableNode.vue` |
| Edge customizada com `EdgeLabelRenderer` + botão de remover | `CustomEdge.vue` |
| Criar conexão arrastando entre handles (`onConnect`) | `FlowCanvas.vue` |
| Drag & drop de um painel externo para o canvas | `App.vue` (origem) + `FlowCanvas.vue` (`onDrop`, `project`) |
| Eventos (`onNodeClick`, `onConnect`, `onPaneReady`) | `FlowCanvas.vue` |
| Adicionar/remover nós e edges em runtime | `CustomNode.vue`, `CustomEdge.vue`, `FlowCanvas.vue` |

## Próximos passos possíveis

- Persistir o grafo (salvar/restaurar `nodes`/`edges` em localStorage ou backend)
- Validação de conexões (`isValidConnection`)
- Sub-flows / grupos de nós
- Undo/redo
- Exportar o organograma diretamente como PDF real (ex.: `jspdf`), sem depender do
  diálogo de impressão do navegador