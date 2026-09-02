import { createApp } from 'vue'
import App from './App.vue'

// Estilos obrigatórios do Vue Flow + tema padrão
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import '@vue-flow/node-resizer/dist/style.css'

// Estilos globais do POC
import './style.css'

createApp(App).mount('#app')
