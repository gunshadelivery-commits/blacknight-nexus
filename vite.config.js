import { defineConfig } from 'vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // ตั้งค่า Base — ใช้ '/' สำหรับ custom domain (blacknight69.com)
  // หากต้องการกลับไปใช้ GitHub Pages ให้เปลี่ยนเป็น '/blacknight-nexus/'
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
