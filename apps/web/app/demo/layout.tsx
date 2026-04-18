import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kin — live demo",
  description: "Live demo surface for Kin voice-driven care coordination.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEE7DC] via-[#F6F4EE] to-[#E8EDE5] text-ink">
      {children}
    </div>
  );
}
