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
import print from 'vue3-print-nb'

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

app.use(print)

// // fontawesome 
// import { library } from '@fortawesome/fontawesome-svg-core'
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// // import specific icons 
// import { faBoxesStacked } from '@fortawesome/free-solid-svg-icons'


// // add icons to the library 
// library.add(faBoxesStacked)

// app.component('font-awesome-icon', FontAwesomeIcon)

// Mount vue app
app.mount('#app')


