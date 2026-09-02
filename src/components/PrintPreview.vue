<script>
import { toPng } from 'html-to-image'
import { useVueFlow, getRectOfNodes } from '@vue-flow/core'

// 1 px CSS a zoom 1 (96dpi) convertido para milímetros físicos.
const MM_PER_PX = 25.4 / 96

const PAPER_SIZES_MM = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A2: { width: 420, height: 594 },
}

// resolução de captura do diagrama (multiplicador sobre o tamanho em px)
const CAPTURE_PIXEL_RATIO = 2
// resolução de cada página recortada, em pixels por mm de conteúdo
const PAGE_PX_PER_MM = 6

export default {
  name: 'PrintPreview',
  props: {
    modelValue: { type: Boolean, default: false },
    backgroundColor: { type: String, default: '#dbe6f5' },
    documentTitle: { type: String, default: 'Organograma' },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      format: 'A4',
      orientation: 'landscape',
      scalePercent: 100,
      marginMm: 10,
      currentPage: 0,
      status: 'idle', // idle | capturing | ready | error
      errorMessage: '',
      capture: null, // { image, bounds, pixelRatio }
      pageSizeStyleEl: null,
    }
  },
  setup() {
    const { getNodes, vueFlowRef } = useVueFlow()
    return { getNodesRef: getNodes, vueFlowRef }
  },
  beforeUnmount() {
    this.pageSizeStyleEl?.remove()
  },
  computed: {
    paper() {
      const size = PAPER_SIZES_MM[this.format]
      return this.orientation === 'landscape'
        ? { width: size.height, height: size.width }
        : { width: size.width, height: size.height }
    },
    contentAreaMm() {
      return {
        width: Math.max(this.paper.width - this.marginMm * 2, 10),
        height: Math.max(this.paper.height - this.marginMm * 2, 10),
      }
    },
    mmPerFlowUnit() {
      return MM_PER_PX * (100 / this.scalePercent)
    },
    fitToOnePagePercent() {
      if (!this.capture) return 100
      const { bounds } = this.capture
      const wPct = (this.contentAreaMm.width / (bounds.width * MM_PER_PX)) * 100
      const hPct = (this.contentAreaMm.height / (bounds.height * MM_PER_PX)) * 100
      return Math.max(5, Math.floor(Math.min(wPct, hPct)))
    },
    grid() {
      if (!this.capture) return { cols: 0, rows: 0, pageContentFlowWidth: 0, pageContentFlowHeight: 0 }
      const pageContentFlowWidth = this.contentAreaMm.width / this.mmPerFlowUnit
      const pageContentFlowHeight = this.contentAreaMm.height / this.mmPerFlowUnit
      const cols = Math.max(1, Math.ceil(this.capture.bounds.width / pageContentFlowWidth))
      const rows = Math.max(1, Math.ceil(this.capture.bounds.height / pageContentFlowHeight))
      return { cols, rows, pageContentFlowWidth, pageContentFlowHeight }
    },
    pages() {
      if (!this.capture) return []
      const { bounds } = this.capture
      const { cols, rows, pageContentFlowWidth, pageContentFlowHeight } = this.grid
      const list = []
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          list.push({
            index: list.length,
            row: r,
            col: c,
            flowRect: {
              x: bounds.x + c * pageContentFlowWidth,
              y: bounds.y + r * pageContentFlowHeight,
              width: pageContentFlowWidth,
              height: pageContentFlowHeight,
            },
          })
        }
      }
      return list
    },
    pageImages() {
      if (!this.capture || !this.pages.length) return []
      return this.pages.map((page) => this.renderPageImage(page))
    },
    activePageImage() {
      return this.pageImages[this.currentPage] || null
    },
    paperAspectRatio() {
      return `${this.paper.width} / ${this.paper.height}`
    },
  },
  watch: {
    modelValue(open) {
      if (open) this.openPreview()
    },
    format() {
      this.currentPage = 0
    },
    orientation() {
      this.currentPage = 0
    },
    scalePercent() {
      this.currentPage = 0
    },
    paper: {
      handler() {
        this.applyPageSizeStyle()
      },
      deep: true,
    },
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false)
    },
    async openPreview() {
      this.status = 'capturing'
      this.errorMessage = ''
      this.currentPage = 0
      try {
        await this.captureDiagram()
        this.status = 'ready'
        this.applyPageSizeStyle()
      } catch (err) {
        console.error('[PrintPreview] falha ao capturar diagrama', err)
        this.status = 'error'
        this.errorMessage = 'Não foi possível gerar a pré-visualização de impressão.'
      }
    },
    async captureDiagram() {
      const bounds = getRectOfNodes(this.getNodesRef)
      const viewportEl = this.vueFlowRef?.querySelector('.vue-flow__viewport')
      if (!viewportEl || !bounds.width || !bounds.height) {
        throw new Error('Diagrama vazio ou viewport indisponível')
      }

      const dataUrl = await toPng(viewportEl, {
        backgroundColor: this.backgroundColor,
        pixelRatio: CAPTURE_PIXEL_RATIO,
        width: bounds.width,
        height: bounds.height,
        style: {
          width: `${bounds.width}px`,
          height: `${bounds.height}px`,
          transform: `translate(${-bounds.x}px, ${-bounds.y}px) scale(1)`,
        },
      })

      const image = await this.loadImage(dataUrl)
      this.capture = { image, bounds, pixelRatio: CAPTURE_PIXEL_RATIO }
    },
    loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Falha ao carregar imagem capturada'))
        img.src = src
      })
    },
    renderPageImage(page) {
      const { image, bounds, pixelRatio } = this.capture
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(this.contentAreaMm.width * PAGE_PX_PER_MM)
      canvas.height = Math.round(this.contentAreaMm.height * PAGE_PX_PER_MM)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = this.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const sx = (page.flowRect.x - bounds.x) * pixelRatio
      const sy = (page.flowRect.y - bounds.y) * pixelRatio
      const sw = page.flowRect.width * pixelRatio
      const sh = page.flowRect.height * pixelRatio

      ctx.drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/png')
    },
    goToPage(index) {
      if (index < 0 || index >= this.pages.length) return
      this.currentPage = index
    },
    setFitToOnePage() {
      this.scalePercent = this.fitToOnePagePercent
    },
    applyPageSizeStyle() {
      if (!this.pageSizeStyleEl) {
        this.pageSizeStyleEl = document.createElement('style')
        this.pageSizeStyleEl.setAttribute('data-print-preview', '')
        document.head.appendChild(this.pageSizeStyleEl)
      }
      this.pageSizeStyleEl.textContent = `@page { size: ${this.paper.width}mm ${this.paper.height}mm; margin: 0; }`
    },
    triggerPrint() {
      this.applyPageSizeStyle()
      window.print()
    },
  },
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="print-preview" role="dialog" aria-modal="true">
      <div class="print-preview__toolbar no-print">
        <div class="print-preview__title">
          <strong>Pré-visualização de impressão</strong>
          <span v-if="status === 'ready'">
            {{ format }} · {{ orientation === 'landscape' ? 'Paisagem' : 'Retrato' }} · {{ grid.cols }}×{{ grid.rows }} folha(s)
          </span>
        </div>

        <div class="print-preview__controls">
          <label>
            Folha
            <select v-model="format">
              <option value="A4">A4</option>
              <option value="A3">A3</option>
              <option value="A2">A2</option>
            </select>
          </label>

          <label>
            Orientação
            <select v-model="orientation">
              <option value="portrait">Retrato</option>
              <option value="landscape">Paisagem</option>
            </select>
          </label>

          <label>
            Escala
            <select v-model.number="scalePercent">
              <option :value="25">25%</option>
              <option :value="50">50%</option>
              <option :value="75">75%</option>
              <option :value="100">100%</option>
              <option :value="150">150%</option>
            </select>
          </label>

          <button type="button" class="print-preview__btn" @click="setFitToOnePage">
            Ajustar em 1 folha
          </button>

          <button type="button" class="print-preview__btn print-preview__btn--primary" :disabled="status !== 'ready'" @click="triggerPrint">
            Imprimir
          </button>

          <button type="button" class="print-preview__btn print-preview__btn--close" @click="close">
            Fechar ✕
          </button>
        </div>
      </div>

      <div class="print-preview__body no-print">
        <div v-if="status === 'capturing'" class="print-preview__status">
          Gerando pré-visualização…
        </div>
        <div v-else-if="status === 'error'" class="print-preview__status print-preview__status--error">
          {{ errorMessage }}
        </div>

        <template v-else-if="status === 'ready'">
          <div class="print-preview__sheet-area">
            <div class="print-preview__sheet" :style="{ aspectRatio: paperAspectRatio }">
              <img v-if="activePageImage" :src="activePageImage" :alt="`Página ${currentPage + 1}`" />
            </div>
          </div>

          <div class="print-preview__pagination">
            <button type="button" class="print-preview__nav" :disabled="currentPage === 0" @click="goToPage(currentPage - 1)">
              ◀
            </button>
            <span class="print-preview__page-label">Página {{ currentPage + 1 }} de {{ pages.length }}</span>
            <button type="button" class="print-preview__nav" :disabled="currentPage === pages.length - 1" @click="goToPage(currentPage + 1)">
              ▶
            </button>
          </div>

          <div class="print-preview__grid" :style="{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)` }">
            <button
              v-for="page in pages"
              :key="page.index"
              type="button"
              class="print-preview__tile"
              :class="{ 'print-preview__tile--active': page.index === currentPage }"
              @click="goToPage(page.index)"
            >
              {{ page.index + 1 }}
            </button>
          </div>
        </template>
      </div>

      <!-- Conteúdo exclusivo de impressão: uma folha por página, em unidades físicas (mm). -->
      <div v-if="status === 'ready'" class="print-pages">
        <div
          v-for="page in pages"
          :key="page.index"
          class="print-pages__page"
          :style="{
            width: `${paper.width}mm`,
            height: `${paper.height}mm`,
            padding: `${marginMm}mm`,
          }"
        >
          <img :src="pageImages[page.index]" :alt="`Página ${page.index + 1}`" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
/* Estilos globais (não-scoped): o overlay é teleportado para <body> e o
   bloco de impressão precisa de @page/@media print fora do escopo do Vue Flow. */

.print-preview {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  background: rgba(13, 17, 23, 0.92);
  color: var(--text, #e7ecf3);
  font-family: var(--font-mono, monospace);
}

.print-preview__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  background: var(--bg-panel, #151b26);
  border-bottom: 1px solid var(--line, #2a3342);
  flex-wrap: wrap;
}

.print-preview__title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}

.print-preview__title strong {
  font-family: var(--font-display, sans-serif);
  font-size: 14px;
}

.print-preview__title span {
  color: var(--text-dim, #8b96a8);
}

.print-preview__controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.print-preview__controls label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim, #8b96a8);
}

.print-preview__controls select {
  font-family: inherit;
  font-size: 12px;
  padding: 5px 6px;
  background: var(--bg-elevated, #1c2431);
  color: var(--text, #e7ecf3);
  border: 1px solid var(--line, #2a3342);
  border-radius: 6px;
}

.print-preview__btn {
  background: var(--bg-elevated, #1c2431);
  color: var(--text, #e7ecf3);
  border: 1px solid var(--line, #2a3342);
  border-radius: 6px;
  padding: 7px 12px;
  font-size: 12px;
  font-family: inherit;
}

.print-preview__btn:hover {
  border-color: var(--accent, #8b5cf6);
}

.print-preview__btn--primary {
  background: var(--accent, #8b5cf6);
  border-color: var(--accent, #8b5cf6);
  color: #fff;
  font-weight: 600;
}

.print-preview__btn--close {
  border-color: var(--danger, #f0525d);
  color: var(--danger, #f0525d);
}

.print-preview__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 14px;
  overflow: auto;
}

.print-preview__status {
  margin: auto;
  font-size: 13px;
  color: var(--text-dim, #8b96a8);
}

.print-preview__status--error {
  color: var(--danger, #f0525d);
}

.print-preview__sheet-area {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.print-preview__sheet {
  background: #fff;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
  max-height: 100%;
  max-width: min(90vw, 900px);
  height: auto;
  width: auto;
  overflow: hidden;
}

.print-preview__sheet img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
}

.print-preview__pagination {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 12px;
  flex-shrink: 0;
}

.print-preview__nav {
  background: var(--bg-elevated, #1c2431);
  border: 1px solid var(--line, #2a3342);
  color: var(--text, #e7ecf3);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
}

.print-preview__nav:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.print-preview__grid {
  display: grid;
  gap: 4px;
  max-width: 320px;
  flex-shrink: 0;
}

.print-preview__tile {
  aspect-ratio: 1;
  min-width: 26px;
  background: var(--bg-elevated, #1c2431);
  border: 1px solid var(--line, #2a3342);
  color: var(--text-dim, #8b96a8);
  border-radius: 4px;
  font-size: 10px;
}

.print-preview__tile--active {
  border-color: var(--accent, #8b5cf6);
  color: #fff;
  background: var(--accent, #8b5cf6);
}

/* Bloco só de impressão: fica invisível na tela e visível apenas dentro de @media print. */
.print-pages {
  display: none;
}

@media print {
  body * {
    visibility: hidden;
  }

  .no-print {
    display: none !important;
  }

  .print-pages,
  .print-pages * {
    visibility: visible;
  }

  .print-pages {
    display: block;
    position: fixed;
    inset: 0;
    background: #fff;
  }

  .print-pages__page {
    box-sizing: border-box;
    page-break-after: always;
    overflow: hidden;
  }

  .print-pages__page:last-child {
    page-break-after: auto;
  }

  .print-pages__page img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: fill;
  }
}
</style>