<script>
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useVueFlow } from '@vue-flow/core'

export default {
  name: 'CustomEdge',
  components: { BaseEdge, EdgeLabelRenderer },
  props: {
    id: { type: String, required: true },
    sourceX: { type: Number, required: true },
    sourceY: { type: Number, required: true },
    targetX: { type: Number, required: true },
    targetY: { type: Number, required: true },
    sourcePosition: { type: String, required: true },
    targetPosition: { type: String, required: true },
    markerEnd: { type: String, default: undefined },
    style: { type: Object, default: () => ({}) },
    data: { type: Object, default: () => ({}) },
  },
  computed: {
    path() {
      const [edgePath, labelX, labelY] = getBezierPath({
        sourceX: this.sourceX,
        sourceY: this.sourceY,
        sourcePosition: this.sourcePosition,
        targetX: this.targetX,
        targetY: this.targetY,
        targetPosition: this.targetPosition,
      })
      return { edgePath, labelX, labelY }
    },
  },
  setup() {
    const { removeEdges } = useVueFlow()
    return { removeEdges }
  },
  methods: {
    onRemove() {
      this.removeEdges([this.id])
    },
  },
}
</script>

<template>
  <BaseEdge :id="id" :style="style" :path="path.edgePath" :marker-end="markerEnd" />
  <EdgeLabelRenderer>
    <div
      class="custom-edge__label"
      :style="{
        transform: `translate(-50%, -50%) translate(${path.labelX}px, ${path.labelY}px)`,
      }"
    >
      <span>{{ data?.label || 'edge' }}</span>
      <button type="button" @click="onRemove">×</button>
    </div>
  </EdgeLabelRenderer>
</template>
