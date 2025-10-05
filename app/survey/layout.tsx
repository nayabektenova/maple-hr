import DashboardLayout from "@/components/layouts/DashboardLayout";

export default function SurveyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
