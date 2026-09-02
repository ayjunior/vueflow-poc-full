<script>
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeToolbar } from '@vue-flow/node-toolbar'

export default {
  name: 'CustomNode',
  components: { Handle, NodeToolbar },
  props: {
    id: { type: String, required: true },
    data: { type: Object, default: () => ({}) },
    selected: { type: Boolean, default: false },
  },
  data() {
    return {
      Position,
    }
  },
  setup() {
    // useVueFlow precisa ser chamado dentro de um setup() / composable,
    // por isso expomos aqui o que o resto do componente (Options API) usa via `this`.
    const { removeNodes, addNodes, findNode } = useVueFlow()
    return { removeNodes, addNodes, findNode }
  },
  methods: {
    onDelete() {
      this.removeNodes([this.id])
    },
    onDuplicate() {
      const node = this.findNode(this.id)
      if (!node) return
      this.addNodes([
        {
          ...node,
          id: `${this.id}-copia-${Date.now()}`,
          position: { x: node.position.x + 32, y: node.position.y + 32 },
          selected: false,
        },
      ])
    },
  },
}
</script>

<template>
  <NodeToolbar :is-visible="selected" :position="Position.Top">
    <button class="toolbar-btn" @click="onDuplicate">Duplicar</button>
    <button class="toolbar-btn toolbar-btn--danger" @click="onDelete">Excluir</button>
  </NodeToolbar>

  <Handle type="target" :position="Position.Top" />
  <div class="custom-node">
    <span class="custom-node__icon">⚡</span>
    <span class="custom-node__label">{{ data.label }}</span>
  </div>
  <Handle type="source" :position="Position.Bottom" />
</template>
