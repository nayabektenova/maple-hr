import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function ManageRoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
