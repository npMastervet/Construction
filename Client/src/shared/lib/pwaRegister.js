import { registerSW } from "virtual:pwa-register"

// Imported for side effects from main.jsx to register the service worker.
// registerType="autoUpdate": SW ใหม่ skipWaiting + clientsClaim แล้ว plugin reload หน้าเองตอน activated
// อัปเดตจึงเกิดอัตโนมัติโดยไม่ต้องมี banner/ปุ่มใด ๆ
registerSW({ immediate: true })
