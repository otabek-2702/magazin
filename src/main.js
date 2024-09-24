/* eslint-disable import/order */
import '@/@iconify/icons-bundle'
import App from '@/App.vue'
import layoutsPlugin from '@/plugins/layouts'
import vuetify from '@/plugins/vuetify'
import { loadFonts } from '@/plugins/webfontloader'
import router from '@/router'
import '@core/scss/template/index.scss'
import '@styles/styles.scss'
import "vue3-toastify/dist/index.css";
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { abilitiesPlugin, Can } from "@casl/vue"
import ability from "@/plugins/casl/ability"

loadFonts()


// Create vue app
const app = createApp(App)

// global imports
app.component('Can', Can);

// Use plugins
app.use(vuetify)
app.use(createPinia())
app.use(router)
app.use(layoutsPlugin)
app.use(abilitiesPlugin, ability, {
  useGlobalProperties: true,
})

// Mount vue app
app.mount('#app')
