import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kin — live demo",
  description: "Live demo surface for Kin voice-driven care coordination.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#0b0c0f] text-white">{children}</div>;
}
