import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function EmployeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}