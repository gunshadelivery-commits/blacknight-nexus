import { GAS_URL } from './config.js';

/**
 * เก็บสถานะผู้ใช้ลง localStorage
 */
export function setAuthSession(user) {
    localStorage.setItem('blacknight_user', JSON.stringify(user));
}

/**
 * ดึงสถานะผู้ใช้จาก localStorage
 */
export function getAuthSession() {
    try {
        const stored = localStorage.getItem('blacknight_user');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}

/**
 * ลบสถานะผู้ใช้ (Logout)
 */
export function clearAuthSession() {
    localStorage.removeItem('blacknight_user');
}

/**
 * ตรวจสอบว่าเข้าระบบอยู่หรือไม่
 */
export function isLoggedIn() {
    return !!getAuthSession();
}

/**
 * ส่งคำขอเข้าสู่ระบบไปยัง Google Apps Script
 */
export async function loginUser(email, password) {
    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' }, // Using text/plain for GAS
            body: JSON.stringify({
                action: 'login',
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        return data; // { result: "success", name: "...", email: "...", token: "..." } or { error: "..." }
    } catch (err) {
        console.error('Login Error:', err);
        return { error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
    }
}

/**
 * ส่งคำขอสมัครสมาชิกไปยัง Google Apps Script
 */
export async function registerUser(name, email, password) {
    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'register',
                name: name,
                email: email,
                password: password
            })
        });
        
        const data = await response.json();
        return data; // { result: "success" } or { error: "..." }
    } catch (err) {
        console.error('Register Error:', err);
        return { error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้' };
    }
}
