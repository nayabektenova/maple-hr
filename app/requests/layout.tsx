import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
