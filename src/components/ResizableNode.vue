<script>
import { Handle, Position } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'

export default {
  name: 'ResizableNode',
  components: { Handle, NodeResizer },
  props: {
    data: { type: Object, default: () => ({}) },
    selected: { type: Boolean, default: false },
  },
  data() {
    return {
      Position,
    }
  },
}
</script>

<template>
  <NodeResizer
    :is-visible="selected"
    :min-width="140"
    :min-height="70"
    line-class-name="resizer-line"
    handle-class-name="resizer-handle"
  />
  <Handle type="target" :position="Position.Left" />
  <div class="resizable-node">
    <strong>{{ data.label }}</strong>
    <p>Selecione e arraste as bordas para redimensionar</p>
  </div>
  <Handle type="source" :position="Position.Right" />
</template>
