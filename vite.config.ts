import { fileURLToPath, URL } from 'node:url' // Import URL helpers

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite' // Keep existing import

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),

  ],
  resolve: { // Add this resolve block
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
