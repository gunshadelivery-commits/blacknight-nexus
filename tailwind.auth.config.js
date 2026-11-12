/** @type {import('tailwindcss').Config} */
// Tailwind ของหน้า login/register (src/auth.css) — สแกนเฉพาะสองหน้านี้ CSS จึงเล็ก ไม่พ่วง class ของหน้าร้าน
module.exports = {
  content: [
    "./login.html",
    "./register.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
