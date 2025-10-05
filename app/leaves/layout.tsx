import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function LeavesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
