import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kin — care that listens",
  description:
    "AI layer that coordinates care across a patient and their chosen support network.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto min-h-screen max-w-md">
          <header className="flex items-center justify-between px-6 pt-8 pb-4">
            <Link href="/" className="font-serif text-2xl tracking-tight">
              kin
            </Link>
            <nav className="flex gap-4 text-sm text-ink/60">
              <Link href="/checkin" className="hover:text-ink">Check-in</Link>
              <Link href="/brief" className="hover:text-ink">Brief</Link>
              <Link href="/contribute" className="hover:text-ink">Contribute</Link>
              <Link href="/pulse" className="hover:text-ink">Pulse</Link>
            </nav>
          </header>
          <main className="px-6 pb-24">{children}</main>
        </div>
      </body>
    </html>
  );
}
