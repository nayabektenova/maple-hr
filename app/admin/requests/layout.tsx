import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function RequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
