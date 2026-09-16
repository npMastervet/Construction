import { z } from "zod";
export const required = z.string().trim().min(1, "กรุณาระบุข้อมูล").max(200);
export const rate = z.string().regex(/^(?:0(?:\.\d{1,6})?|1(?:\.0{1,6})?)$/, "ระบุอัตรา 0–1 เช่น 0.07");
export const optional = z.string().max(2000);
