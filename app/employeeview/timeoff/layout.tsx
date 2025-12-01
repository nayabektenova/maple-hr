import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function TimeOffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
