import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false, nocache: true },
};

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-crema">{children}</div>;
}
