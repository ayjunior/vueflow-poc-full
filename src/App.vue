<script>
import FlowCanvas from './components/FlowCanvas.vue'
import OrgChart from './components/OrgChart.vue'

export default {
  name: 'App',
  components: { FlowCanvas, OrgChart },
  data() {
    return {
      activeView: 'orgchart',
      palette: [
        { type: 'input', label: '① Nó de entrada' },
        { type: 'default', label: '② Nó padrão' },
        { type: 'output', label: '③ Nó de saída' },
        { type: 'custom', label: '④ Nó customizado' },
        { type: 'resizable', label: '⑤ Nó redimensionável' },
      ],
    }
  },
  methods: {
    onDragStart(event, type) {
      event.dataTransfer.setData('application/vueflow', type)
      event.dataTransfer.effectAllowed = 'move'
    },
  },
}
</script>

<template>
  <div class="app">
    <header class="app__header">
      <h1>Vue Flow · POC</h1>
      <p>Options API · nodes, edges, zoom/pan, MiniMap, Controls, nós/edges customizados, drag&amp;drop, NodeToolbar e NodeResizer.</p>
      <nav class="app__tabs">
        <button
          type="button"
          :class="{ 'app__tab--active': activeView === 'orgchart' }"
          class="app__tab"
          @click="activeView = 'orgchart'"
        >
          Organograma IMAP
        </button>
        <button
          type="button"
          :class="{ 'app__tab--active': activeView === 'demo' }"
          class="app__tab"
          @click="activeView = 'demo'"
        >
          Playground Vue Flow
        </button>
      </nav>
    </header>

    <div class="app__body" v-if="activeView === 'demo'">
      <aside class="palette">
        <h2>Arraste para o canvas</h2>
        <div
          v-for="item in palette"
          :key="item.type"
          class="palette__item"
          draggable="true"
          @dragstart="(event) => onDragStart(event, item.type)"
        >
          {{ item.label }}
        </div>
        <p class="palette__hint">
          Dica: clique num nó customizado ou redimensionável para ver a
          NodeToolbar / o NodeResizer em ação. Arraste de um handle a outro
          para criar uma conexão (edge customizada com label e botão de
          remover).
        </p>
      </aside>

      <main class="canvas">
        <FlowCanvas />
      </main>
    </div>

    <div class="app__body" v-else>
      <main class="canvas">
        <OrgChart />
      </main>
    </div>
  </div>
</template>
