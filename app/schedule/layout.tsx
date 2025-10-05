import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
