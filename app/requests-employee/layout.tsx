// app/(employee)/requests-employee/layout.tsx
import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function RequestsEmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
