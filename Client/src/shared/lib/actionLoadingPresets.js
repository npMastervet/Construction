import { RefreshCw, Send, UploadCloud } from "lucide-react";
import { ACTION_LOADING_PHASES } from "@/shared/lib/actionLoadingPhases";

export const DEFAULT_ACTION_LOADING_COPY = {
  [ACTION_LOADING_PHASES.LOADING]: {
    title: "กำลังดำเนินการ",
    description: "กรุณารอสักครู่...",
  },
  [ACTION_LOADING_PHASES.PROCESSING]: {
    title: "กำลังประมวลผล",
    description: "ระบบกำลังประมวลผลคำขอของคุณ กรุณารอสักครู่...",
  },
  [ACTION_LOADING_PHASES.SAVING]: {
    title: "กำลังบันทึกข้อมูล",
    description: "ระบบกำลังบันทึกข้อมูล กรุณารอสักครู่...",
  },
  [ACTION_LOADING_PHASES.SENDING]: {
    title: "กำลังส่งข้อมูล",
    description: "ระบบกำลังส่งข้อมูลไปยังปลายทาง กรุณารอสักครู่...",
  },
  [ACTION_LOADING_PHASES.RESENDING]: {
    title: "กำลังส่งซ้ำ",
    description: "ระบบกำลังลองส่งข้อมูลอีกครั้ง กรุณาอย่าปิดหน้าต่างนี้...",
  },
  [ACTION_LOADING_PHASES.SUBMITTING]: {
    title: "กำลังส่งคำขอ",
    description: "ระบบกำลังส่งคำขอเข้าสู่ขั้นตอนถัดไป กรุณารอสักครู่...",
  },
  [ACTION_LOADING_PHASES.UPLOADING]: {
    title: "กำลังอัปโหลดไฟล์",
    description: "ระบบกำลังอัปโหลดไฟล์แนบ กรุณารอสักครู่...",
  },
  [ACTION_LOADING_PHASES.SUCCESS]: {
    title: "ดำเนินการสำเร็จ",
    description: "ระบบดำเนินการเสร็จเรียบร้อยแล้ว",
  },
  [ACTION_LOADING_PHASES.FAIL]: {
    title: "ดำเนินการไม่สำเร็จ",
    description: "ระบบไม่สามารถดำเนินการได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
  },
};

export const SEND_ACTION_LOADING_COPY = {
  [ACTION_LOADING_PHASES.SENDING]: DEFAULT_ACTION_LOADING_COPY[ACTION_LOADING_PHASES.SENDING],
  [ACTION_LOADING_PHASES.RESENDING]: DEFAULT_ACTION_LOADING_COPY[ACTION_LOADING_PHASES.RESENDING],
  [ACTION_LOADING_PHASES.PROCESSING]: DEFAULT_ACTION_LOADING_COPY[ACTION_LOADING_PHASES.PROCESSING],
  [ACTION_LOADING_PHASES.SUCCESS]: DEFAULT_ACTION_LOADING_COPY[ACTION_LOADING_PHASES.SUCCESS],
};

export const SEND_ACTION_LOADING_STEPS = [
  { key: ACTION_LOADING_PHASES.SENDING, label: "ส่งข้อมูล", icon: Send },
  { key: ACTION_LOADING_PHASES.RESENDING, label: "ส่งซ้ำ", icon: RefreshCw },
];

export const UPLOAD_ACTION_LOADING_STEPS = [
  { key: ACTION_LOADING_PHASES.SUBMITTING, label: "ส่งคำขอ", icon: Send },
  { key: ACTION_LOADING_PHASES.UPLOADING, label: "อัปโหลดไฟล์", icon: UploadCloud },
];

