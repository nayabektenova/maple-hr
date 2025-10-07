import type { ReactNode } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";

export const metadata = {
  title: "Resume AI • MapleHR",
};

export default function ResumeAILayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
