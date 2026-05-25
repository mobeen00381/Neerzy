// app/dashboard/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Neerzy",
  description: "Your Neerzy marketing dashboard — post updates, track performance, and manage your business profile.",
  robots: {
    index: false,
    follow: false,
  },
};
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 w-full overflow-x-hidden">
      {children}
    </div>
  );
}
