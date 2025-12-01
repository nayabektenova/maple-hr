import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function viewemployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
