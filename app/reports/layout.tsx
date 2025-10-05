import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
