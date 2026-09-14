import { HardHat, FolderKanban, Calculator, ReceiptText } from "lucide-react";
import { useAuthStore } from "@/core/auth/store/useAuthStore";
import { usePageTitle } from "@/shared/hooks/use-page-title";
import { PageContainer } from "@/shared/components/motion/PageContainer";
import { BackForwardNav } from "@/components/ui/back-forward-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const plannedAreas = [
  { title: "โครงการ", icon: FolderKanban, description: "ข้อมูลโครงการ ลูกค้า และทีมงานในแต่ละหน้างาน" },
  { title: "ประมาณต้นทุน", icon: Calculator, description: "รายการ BOQ และงบประมาณอ้างอิงของโครงการ" },
  { title: "ค่าใช้จ่ายจริง", icon: ReceiptText, description: "ค่าใช้จ่าย ใบเสร็จ และประวัติการจ่ายเงิน" },
] as const;

export default function MainPage() {
  const displayName = useAuthStore((state) => state.user?.displayName || state.user?.nickName || "ผู้ใช้งาน");
  usePageTitle();

  return (
    <PageContainer className="mx-auto max-w-6xl space-y-6 p-4">
      <BackForwardNav
        layoutBreakpoint="lg"
        start={
          <div className="min-w-0 space-y-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <HardHat className="h-6 w-6 shrink-0 text-primary" />
              ภาพรวมงานก่อสร้าง
            </h1>
            <p className="text-sm text-muted-foreground">สวัสดี {displayName}</p>
          </div>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>เตรียมพื้นที่สำหรับงานของคุณ</CardTitle>
          <CardDescription>ระบบอยู่ระหว่างเตรียมเปิดใช้งานส่วนบริหารงานก่อสร้าง</CardDescription>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          ขณะนี้ยังไม่เปิดให้สร้างโครงการหรือบันทึกค่าใช้จ่าย เมื่อเปิดใช้งานแล้ว
          คุณจะจัดการงบประมาณและติดตามต้นทุนของแต่ละโครงการได้จากที่นี่
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {plannedAreas.map(({ title, icon: Icon, description }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="mb-2 h-6 w-6 text-primary" aria-hidden="true" />
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent><span className="text-xs text-muted-foreground">ยังไม่เปิดใช้งาน</span></CardContent>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
