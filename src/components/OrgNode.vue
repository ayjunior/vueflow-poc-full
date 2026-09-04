<script>
import { Handle, Position } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer'

export default {
  name: 'OrgNode',
  components: { Handle, NodeResizer },
  props: {
    data: { type: Object, default: () => ({}) },
    selected: { type: Boolean, default: false },
  },
  data() {
    return { Position }
  },
}
</script>

<template>
  <NodeResizer
    :is-visible="selected"
    :min-width="120"
    :min-height="24"
    :max-width="420"
    :max-height="260"
    line-class-name="org-resizer-line"
    handle-class-name="org-resizer-handle"
  />
  <!-- handle extra no topo: só a raiz usa (linha ascendente até o Conselho Consultivo) -->
  <Handle v-if="data.kind === 'root'" id="s-top" type="source" :position="Position.Top" />
  <!-- handle extra embaixo: só o Conselho Consultivo usa (recebe a linha vinda de cima) -->
  <Handle v-if="data.kind === 'consultivo'" id="t-bottom" type="target" :position="Position.Bottom" />

  <Handle id="t-top" type="target" :position="Position.Top" />
  <div class="org-node" :class="`org-node--${data.kind}`">
    <span>{{ data.label }}</span>
  </div>
  <Handle id="s-bottom" type="source" :position="Position.Bottom" />
</template>
