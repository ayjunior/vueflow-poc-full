<script>
import { VueFlow, useVueFlow, Panel } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import OrgNode from './OrgNode.vue'
import PrintPreview from './PrintPreview.vue'
import LayoutHistoryPanel from './LayoutHistoryPanel.vue'

// Estrutura organizacional do IMAP (Lei 7.671/1991 · Decreto 423/2026).
// Posições (x = canto superior-esquerdo, y, width) replicam o layout do
// organograma oficial em PDF: staff ao lado do tronco vertical, Conselho
// Consultivo ligado por cima (tracejado), 4 diretorias sob a Superintendência.
const NODES_DATA = [
  { id: 'root', label: 'Instituto Municipal de Administração Pública', parentId: null, kind: 'root', x: 940, y: 90, width: 300 },

  { id: 'conselho', label: 'Conselho Consultivo', parentId: 'root', kind: 'consultivo', x: 1170, y: 0, width: 160 },
  { id: 'gabinete', label: 'Gabinete', parentId: 'root', kind: 'staff', x: 725, y: 200, width: 150 },
  { id: 'assessoria', label: 'Assessoria Técnica', parentId: 'root', kind: 'staff', x: 870, y: 200, width: 160 },
  { id: 'nucleo_ti', label: 'Núcleo Setorial de Informação e Tecnologia', parentId: 'root', kind: 'staff', x: 1170, y: 200, width: 260 },
  { id: 'superintendencia', label: 'Superintendência Técnica', parentId: 'root', kind: 'super', x: 990, y: 340, width: 240 },

  { id: 'equipe_projetos', label: 'Equipe de Projetos', parentId: 'superintendencia', kind: 'staff', x: 1265, y: 430, width: 150 },
  { id: 'dir_adm_fin', label: 'Diretoria Administrativo-Financeira', parentId: 'superintendencia', kind: 'director', x: 200, y: 520, width: 230 },
  { id: 'escola_adm', label: 'Escola de Administração Pública', parentId: 'superintendencia', kind: 'director', x: 1020, y: 520, width: 280 },
  { id: 'dir_dev_inst', label: 'Diretoria de Desenvolvimento Institucional', parentId: 'superintendencia', kind: 'director', x: 1525, y: 520, width: 220 },
  { id: 'dir_planejamento', label: 'Diretoria de Planejamento, Pesquisa e Inovação', parentId: 'superintendencia', kind: 'director', x: 1795, y: 520, width: 220 },

  { id: 'coord_estagio', label: 'Coordenação de Estágio', parentId: 'dir_adm_fin', kind: 'coord', x: 115, y: 610, width: 150 },
  { id: 'coord_adm_fin', label: 'Coordenação Administrativo-Financeira', parentId: 'dir_adm_fin', kind: 'coord', x: 345, y: 610, width: 190 },
  { id: 'unid_seguros', label: 'Unidade de Administração de Seguros', parentId: 'coord_adm_fin', kind: 'unit', x: 215, y: 700, width: 170 },
  { id: 'unid_rh', label: 'Unidade de Recursos Humanos', parentId: 'coord_adm_fin', kind: 'unit', x: 475, y: 700, width: 170 },
  { id: 'ger_folha', label: 'Gerência de Folha de Pagamento', parentId: 'unid_rh', kind: 'gerencia', x: 315, y: 790, width: 170 },
  { id: 'ger_contab', label: 'Gerência de Contabilidade e Finanças', parentId: 'unid_rh', kind: 'gerencia', x: 465, y: 790, width: 190 },
  { id: 'ger_compras', label: 'Gerência de Compras e Contratos', parentId: 'unid_rh', kind: 'gerencia', x: 625, y: 790, width: 190 },
  { id: 'div_compras', label: 'Divisão de Compras e Contratos', parentId: 'ger_compras', kind: 'divisao', x: 625, y: 880, width: 190 },

  { id: 'coord_formacao', label: 'Coordenação de Formação', parentId: 'escola_adm', kind: 'coord', x: 865, y: 610, width: 150 },
  { id: 'coord_dev_prof', label: 'Coordenação de Desenvolvimento Profissional', parentId: 'escola_adm', kind: 'coord', x: 1075, y: 610, width: 170 },
  { id: 'coord_nucleo_ead', label: 'Coordenação do Núcleo EaD', parentId: 'escola_adm', kind: 'coord', x: 1300, y: 610, width: 160 },
  { id: 'secretaria_academica', label: 'Secretaria Acadêmica', parentId: 'coord_formacao', kind: 'unit', x: 855, y: 700, width: 170 },

  { id: 'coord_tec_dev_inst', label: 'Coordenação Técnica', parentId: 'dir_dev_inst', kind: 'coord', x: 1540, y: 610, width: 190 },

  { id: 'coord_tec_planejamento', label: 'Coordenação Técnica', parentId: 'dir_planejamento', kind: 'coord', x: 1810, y: 610, width: 190 },
  { id: 'nucleo_pesquisa', label: 'Núcleo de Pesquisa', parentId: 'coord_tec_planejamento', kind: 'nucleo', x: 1820, y: 700, width: 170 },
]

const HISTORY_KEY = 'imap-orgchart-flow-history'

const EDGE_STYLE = { stroke: '#33475b', strokeWidth: 1.4 }
const CONSULTIVO_STYLE = { ...EDGE_STYLE, strokeDasharray: '4 4' }

const ORG_NODES = NODES_DATA.map((n) => ({
  id: n.id,
  type: 'org',
  position: { x: n.x, y: n.y },
  style: { width: `${n.width}px` },
  draggable: true,
  data: { label: n.label, kind: n.kind },
}))

const ORG_EDGES = NODES_DATA.filter((n) => n.parentId).map((n) => {
  const isConsultivo = n.kind === 'consultivo'
  return {
    id: `e-${n.parentId}-${n.id}`,
    source: n.parentId,
    target: n.id,
    sourceHandle: isConsultivo ? 's-top' : 's-bottom',
    targetHandle: isConsultivo ? 't-bottom' : 't-top',
    type: 'step',
    style: isConsultivo ? CONSULTIVO_STYLE : EDGE_STYLE,
  }
})

export default {
  name: 'OrgChart',
  components: { VueFlow, Controls, MiniMap, Panel, OrgNode, PrintPreview, LayoutHistoryPanel },
  data() {
    return {
      nodes: ORG_NODES,
      edges: ORG_EDGES,
      printPreviewOpen: false,
      layoutStatus: '',
      layoutHistory: [],
      historyPanelOpen: false,
    }
  },
  setup() {
    // Composables da Vue Flow: precisam rodar dentro de setup(), por isso são
    // expostos ao restante do componente (Options API) via `this`.
    const { onPaneReady, fitView, toObject, fromObject } = useVueFlow()
    return {
      onPaneReadyFn: onPaneReady,
      fitViewFn: fitView,
      toObjectFn: toObject,
      fromObjectFn: fromObject,
    }
  },
  mounted() {
    this.onPaneReadyFn(() => {
      this.fitViewFn({ padding: 0.08 })
    })
    this.loadHistory()
  },
  methods: {
    loadHistory() {
      const raw = localStorage.getItem(HISTORY_KEY)
      this.layoutHistory = raw ? JSON.parse(raw) : []
    },
    persistHistory() {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.layoutHistory))
    },
    saveLayout() {
      const defaultName = `Layout ${new Date().toLocaleString('pt-BR')}`
      const name = window.prompt('Nome para este layout:', defaultName)
      if (!name) return

      this.layoutHistory.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        savedAt: new Date().toISOString(),
        data: this.toObjectFn(),
      })
      this.persistHistory()
      this.layoutStatus = 'Layout salvo no histórico.'
    },
    openHistory() {
      this.loadHistory()
      this.historyPanelOpen = true
    },
    async restoreFromHistory(id) {
      const entry = this.layoutHistory.find((e) => e.id === id)
      if (!entry) return
      await this.fromObjectFn(entry.data)
      this.historyPanelOpen = false
      this.layoutStatus = `Layout "${entry.name}" restaurado.`
    },
    deleteFromHistory(id) {
      this.layoutHistory = this.layoutHistory.filter((e) => e.id !== id)
      this.persistHistory()
    },
  },
}
</script>

<template>
  <div class="org-chart-page">
    <header class="org-chart-header">
      <div class="org-chart-header__brand">
        <span class="badge">IMAP</span>
        <span>Prefeitura de Curitiba</span>
      </div>
      <h2>INSTITUTO MUNICIPAL DE ADMINISTRAÇÃO PÚBLICA - IMAP</h2>
      <div class="org-chart-header__actions">
        <span v-if="layoutStatus" class="org-chart-status">{{ layoutStatus }}</span>
        <button type="button" class="org-chart-print-btn" @click="saveLayout">
          💾 Salvar layout
        </button>
        <button type="button" class="org-chart-print-btn" @click="openHistory">
          🕒 Histórico ({{ layoutHistory.length }})
        </button>
        <button type="button" class="org-chart-print-btn" @click="printPreviewOpen = true">
          🖶 Visualizar impressão
        </button>
      </div>
    </header>

    <div class="flow-wrapper">
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        fit-view-on-init
        :min-zoom="0.1"
        :max-zoom="2"
        :nodes-connectable="false"
        :edges-updatable="false"
        :elevate-nodes-on-select="false"
      >
        <template #node-org="props">
          <OrgNode v-bind="props" />
        </template>

        <MiniMap pannable zoomable />
        <Controls />

        <Panel position="top-right" class="org-legend">
          <ul>
            <li><span class="dot dot--root"></span> Instituto / Superintendência</li>
            <li><span class="dot dot--director"></span> Diretoria</li>
            <li><span class="dot dot--coord"></span> Coordenação</li>
            <li><span class="dot dot--unit"></span> Unidade / Gerência / Divisão / Núcleo</li>
            <li><span class="dot dot--staff"></span> Assessoria / Staff</li>
            <li><span class="dot dot--consultivo"></span> Órgão consultivo</li>
          </ul>
        </Panel>

        <PrintPreview v-model="printPreviewOpen" background-color="#dbe6f5" />
      </VueFlow>
    </div>

    <LayoutHistoryPanel
      v-model="historyPanelOpen"
      :entries="layoutHistory"
      @restore="restoreFromHistory"
      @delete="deleteFromHistory"
    />

    <footer class="org-chart-footer">
      <span>Legislação de estrutura: Lei 7.671/1991 – Último Decreto Altera: 423/2026</span>
      <span>Desenvolvido por IMAP/APDI – impressão em A4 – página 1/1</span>
      <span>Data de revisão: 15/05/2026</span>
    </footer>
  </div>
</template>
