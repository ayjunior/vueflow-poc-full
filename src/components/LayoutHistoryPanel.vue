<script>
export default {
  name: 'LayoutHistoryPanel',
  props: {
    modelValue: { type: Boolean, default: false },
    entries: { type: Array, default: () => [] },
  },
  emits: ['update:modelValue', 'restore', 'delete'],
  methods: {
    close() {
      this.$emit('update:modelValue', false)
    },
    formatDate(iso) {
      return new Date(iso).toLocaleString('pt-BR')
    },
  },
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="layout-history" role="dialog" aria-modal="true">
      <div class="layout-history__panel">
        <div class="layout-history__header">
          <strong>Histórico de layouts salvos</strong>
          <button type="button" class="layout-history__close" @click="close">Fechar ✕</button>
        </div>

        <div v-if="!entries.length" class="layout-history__empty">
          Nenhum layout salvo ainda.
        </div>

        <ul v-else class="layout-history__list">
          <li v-for="entry in entries" :key="entry.id" class="layout-history__item">
            <div class="layout-history__info">
              <span class="layout-history__name">{{ entry.name }}</span>
              <span class="layout-history__date">{{ formatDate(entry.savedAt) }}</span>
            </div>
            <div class="layout-history__actions">
              <button type="button" class="layout-history__btn" @click="$emit('restore', entry.id)">
                Restaurar
              </button>
              <button type="button" class="layout-history__btn layout-history__btn--danger" @click="$emit('delete', entry.id)">
                Excluir
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<style>
.layout-history {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(13, 17, 23, 0.72);
  font-family: var(--font-mono, monospace);
}

.layout-history__panel {
  width: min(420px, 92vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-panel, #151b26);
  border: 1px solid var(--line, #2a3342);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}

.layout-history__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--line, #2a3342);
  color: var(--text, #e7ecf3);
}

.layout-history__header strong {
  font-family: var(--font-display, sans-serif);
  font-size: 13px;
}

.layout-history__close {
  background: var(--bg-elevated, #1c2431);
  border: 1px solid var(--line, #2a3342);
  color: var(--danger, #f0525d);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 11px;
  font-family: inherit;
}

.layout-history__empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--text-dim, #8b96a8);
  font-size: 12px;
}

.layout-history__list {
  list-style: none;
  margin: 0;
  padding: 8px;
  overflow-y: auto;
}

.layout-history__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
}

.layout-history__item:hover {
  background: var(--bg-elevated, #1c2431);
}

.layout-history__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.layout-history__name {
  font-size: 12px;
  color: var(--text, #e7ecf3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-history__date {
  font-size: 10.5px;
  color: var(--text-dim, #8b96a8);
}

.layout-history__actions {
  flex-shrink: 0;
  display: flex;
  gap: 6px;
}

.layout-history__btn {
  background: var(--accent, #8b5cf6);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
}

.layout-history__btn:hover {
  filter: brightness(1.1);
}

.layout-history__btn--danger {
  background: var(--bg-elevated, #1c2431);
  border: 1px solid var(--danger, #f0525d);
  color: var(--danger, #f0525d);
}
</style>
