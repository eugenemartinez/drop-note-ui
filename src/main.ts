import { createApp } from 'vue'
import { MotionPlugin } from '@vueuse/motion' // <-- Import Motion plugin
import './style.css' // Keep Tailwind/global styles
import App from './App.vue'
import router from './router' // Import the router

const app = createApp(App)

app.use(router) // Use the router plugin
app.use(MotionPlugin) // <-- Use Motion plugin

app.mount('#app')
