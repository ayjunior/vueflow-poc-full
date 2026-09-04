<script>
import { VueFlow, useVueFlow, Panel, MarkerType } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import CustomNode from './CustomNode.vue'
import ResizableNode from './ResizableNode.vue'
import CustomEdge from './CustomEdge.vue'
import { getHelperLines } from '../utils/helperLines'

let dndCounter = 100

export default {
  name: 'FlowCanvas',
  components: {
    VueFlow,
    Background,
    Controls,
    MiniMap,
    Panel,
    CustomNode,
    ResizableNode,
    CustomEdge,
  },
  data() {
    return {
      nodes: [
        { id: '1', type: 'input', position: { x: 40, y: 60 }, data: { label: 'Início' } },
        { id: '2', position: { x: 300, y: 20 }, data: { label: 'Nó padrão' } },
        { id: '3', type: 'custom', position: { x: 300, y: 180 }, data: { label: 'Nó customizado' } },
        {
          id: '4',
          type: 'resizable',
          position: { x: 580, y: 20 },
          data: { label: 'Nó redimensionável' },
          style: { width: '180px', height: '80px' },
        },
        { id: '5', type: 'output', position: { x: 580, y: 220 }, data: { label: 'Fim' } },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', animated: true },
        { id: 'e1-3', source: '1', target: '3' },
        { id: 'e2-4', source: '2', target: '4', type: 'custom', data: { label: 'condição' } },
        { id: 'e3-5', source: '3', target: '5', markerEnd: MarkerType.ArrowClosed },
      ],
      lastEvent: 'Nenhum evento ainda — interaja com o canvas',
      helperLineHorizontal: undefined,
      helperLineVertical: undefined,
    }
  },
  setup() {
    // Composable exclusivo da Vue Flow: precisa rodar dentro de setup().
    // Os refs/métodos são expostos ao restante do componente (Options API) via `this`.
    const {
      onConnect,
      addEdges,
      addNodes,
      project,
      onNodeClick,
      onPaneReady,
      vueFlowRef,
      fitView,
      onNodeDrag,
      onNodeDragStop,
      updateNode,
      getNodes,
    } = useVueFlow()

    return {
      onConnectFn: onConnect,
      addEdgesFn: addEdges,
      addNodesFn: addNodes,
      projectFn: project,
      onNodeClickFn: onNodeClick,
      onPaneReadyFn: onPaneReady,
      vueFlowRef,
      fitViewFn: fitView,
      onNodeDragFn: onNodeDrag,
      onNodeDragStopFn: onNodeDragStop,
      updateNodeFn: updateNode,
      getNodesFn: getNodes,
    }
  },
  mounted() {
    // Evento: nova conexão feita arrastando de um handle a outro
    this.onConnectFn((params) => {
      this.addEdgesFn([{ ...params, type: 'custom', data: { label: 'nova ligação' } }])
      this.lastEvent = `Conexão criada: ${params.source} → ${params.target}`
    })

    // Evento: clique em um nó
    this.onNodeClickFn(({ node }) => {
      this.lastEvent = `Nó clicado: ${node.data?.label || node.id}`
    })

    // Evento: canvas pronto -> centraliza a view
    this.onPaneReadyFn(() => {
      this.fitViewFn({ padding: 0.2 })
    })

    // Alinhamento estilo Figma: ao arrastar, encaixa o nó nas bordas/centro
    // dos demais e mostra linhas-guia enquanto o encaixe estiver ativo.
    this.onNodeDragFn(({ node }) => {
      const result = getHelperLines(node, this.getNodesFn, 8)
      this.helperLineHorizontal = result.horizontal
      this.helperLineVertical = result.vertical

      if (result.snapPosition.x !== undefined || result.snapPosition.y !== undefined) {
        this.updateNodeFn(node.id, {
          position: {
            x: result.snapPosition.x ?? node.position.x,
            y: result.snapPosition.y ?? node.position.y,
          },
        })
      }
    })
    this.onNodeDragStopFn(() => {
      this.helperLineHorizontal = undefined
      this.helperLineVertical = undefined
    })
  },
  methods: {
    onDragOver(event) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
    },
    onDrop(event) {
      const type = event.dataTransfer.getData('application/vueflow')
      if (!type) return

      const bounds = this.vueFlowRef.getBoundingClientRect()
      const position = this.projectFn({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })

      dndCounter += 1
      this.addNodesFn([
        {
          id: `dnd-${dndCounter}`,
          type: type === 'default' ? undefined : type,
          position,
          data: { label: `Nó ${dndCounter}` },
          style: type === 'resizable' ? { width: '160px', height: '70px' } : undefined,
        },
      ])
      this.lastEvent = `Nó criado via drag & drop (tipo: ${type})`
    },
    addRandomNode() {
      dndCounter += 1
      this.addNodesFn([
        {
          id: `btn-${dndCounter}`,
          position: { x: 80 + Math.random() * 500, y: 80 + Math.random() * 260 },
          data: { label: `Nó ${dndCounter}` },
        },
      ])
      this.lastEvent = 'Nó adicionado pelo painel'
    },
  },
}
</script>

<template>
  <div class="flow-wrapper" @dragover="onDragOver" @drop="onDrop">
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      fit-view-on-init
      :min-zoom="0.2"
      :max-zoom="4"
      :default-edge-options="{ type: 'custom' }"
    >
      <!-- nó customizado (handles próprios + NodeToolbar) -->
      <template #node-custom="props">
        <CustomNode v-bind="props" />
      </template>

      <!-- nó redimensionável (NodeResizer) -->
      <template #node-resizable="props">
        <ResizableNode v-bind="props" />
      </template>

      <!-- edge customizada (label + botão de remover) -->
      <template #edge-custom="props">
        <CustomEdge v-bind="props" />
      </template>

      <template #zoom-pane>
        <div
          v-if="helperLineHorizontal !== undefined"
          class="helper-line helper-line--horizontal"
          :style="{ top: `${helperLineHorizontal}px` }"
        />
        <div
          v-if="helperLineVertical !== undefined"
          class="helper-line helper-line--vertical"
          :style="{ left: `${helperLineVertical}px` }"
        />
      </template>

      <Background pattern-color="#2a3342" :gap="18" />
      <MiniMap pannable zoomable />
      <Controls />

      <Panel position="top-right" class="event-panel">
        <strong>Último evento</strong>
        <p>{{ lastEvent }}</p>
        <button type="button" @click="addRandomNode">+ Adicionar nó</button>
      </Panel>
    </VueFlow>
  </div>
</template>
