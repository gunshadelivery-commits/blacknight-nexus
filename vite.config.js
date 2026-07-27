import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFile, mkdir } from 'node:fs/promises'

const prepareSitesOutput = () => ({
  name: 'prepare-sites-output',
  async closeBundle() {
    await mkdir(resolve(__dirname, 'dist/server'), { recursive: true })
    await mkdir(resolve(__dirname, 'dist/.openai'), { recursive: true })
    await copyFile(resolve(__dirname, 'sites-worker.js'), resolve(__dirname, 'dist/server/index.js'))
    await copyFile(resolve(__dirname, '.openai/hosting.json'), resolve(__dirname, 'dist/.openai/hosting.json'))
  },
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [prepareSitesOutput()],
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
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
      },
    },
  },
})
