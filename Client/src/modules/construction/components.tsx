import { useEffect, useId, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const button = "inline-flex min-h-10 items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";
export const inputClass = "w-full rounded-md border bg-background px-3 py-2 text-sm";
export function ErrorMessage({ error }: { error: unknown }) { return error ? <p role="alert" className="rounded-md border border-destructive/40 p-3 text-sm text-destructive">{error instanceof Error ? error.message : "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง"}</p> : null; }
export function Panel({ title, children }: { title: string; children: ReactNode }) { return <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6"><h2 className="text-lg font-semibold">{title}</h2>{children}</section>; }
export interface Field { name: string; label: string; type?: string; options?: readonly (string | { value: string; label: string })[] }
export function EditForm({ fields, schema, initial = {}, save, done, cancel }: { fields: Field[]; schema: z.ZodType<Record<string, string>>; initial?: Record<string, string>; save: (values: Record<string, string>) => Promise<unknown>; done: () => void; cancel?: () => void }) {
  const prefix = useId();
  const cache = useQueryClient();
  const form = useForm<Record<string, string>>({ resolver: zodResolver(schema), defaultValues: initial });
  const mutation = useMutation({ mutationFn: save, onSuccess: () => { form.reset(); done(); }, onError: (error) => {
    // Refresh the surrounding data, keeping this form's original draft/version.
    if ([403, 404, 409].includes(Number((error as Error & { status?: number }).status))) void cache.invalidateQueries({ queryKey: ["business"] });
  } });
  useEffect(() => { if (!form.formState.isDirty) return; const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [form.formState.isDirty]);
  return <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
    <div className="grid gap-4 sm:grid-cols-2">{fields.map((field) => <div className="space-y-1" key={field.name}><label className="text-sm font-medium" htmlFor={`${prefix}-${field.name}`}>{field.label}</label>{field.options ? <select id={`${prefix}-${field.name}`} className={inputClass} {...form.register(field.name)}>{field.options.map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{typeof option === "string" ? option : option.label}</option>; })}</select> : <input id={`${prefix}-${field.name}`} className={inputClass} type={field.type ?? "text"} {...form.register(field.name)} aria-invalid={Boolean(form.formState.errors[field.name])} />}{form.formState.errors[field.name] && <p className="text-xs text-destructive" role="alert">{form.formState.errors[field.name]?.message}</p>}</div>)}</div>
    <ErrorMessage error={mutation.error} />
    <div className="flex flex-wrap gap-2"><button className={`${button} bg-primary text-primary-foreground`} disabled={mutation.isPending} type="submit">{mutation.isPending ? "กำลังบันทึก…" : "บันทึก"}</button>{cancel && <button type="button" className={button} disabled={mutation.isPending} onClick={() => { if (!form.formState.isDirty || window.confirm("ยกเลิกข้อมูลที่ยังไม่บันทึกหรือไม่?")) cancel(); }}>ยกเลิก</button>}</div>
  </form>;
}
export function Pager({ page, pages, change }: { page: number; pages: number; change: (page: number) => void }) { return <div className="flex items-center justify-between gap-3"><button className={button} disabled={page <= 1} onClick={() => change(page - 1)}>ก่อนหน้า</button><span className="text-sm">หน้า {page} / {Math.max(1, pages)}</span><button className={button} disabled={page >= pages} onClick={() => change(page + 1)}>ถัดไป</button></div>; }
