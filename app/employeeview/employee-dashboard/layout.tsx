import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function submitClaimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
