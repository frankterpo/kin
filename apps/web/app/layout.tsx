import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kin — care that listens",
  description:
    "AI layer that coordinates care across a patient and their chosen support network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
