import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  // ตั้งค่า Base สำหรับรันบน Cloudflare Pages root domain
  base: '/',
  publicDir: 'image', // กำหนดให้โฟลเดอร์ image เป็นโฟลเดอร์ public
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        accessories: resolve(__dirname, 'accessories.html'),
      },
    },
  },
})
