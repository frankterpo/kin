import Link from "next/link";

const tiles: { href: "/checkin" | "/brief" | "/contribute" | "/pulse"; title: string; body: string }[] = [
  {
    href: "/checkin",
    title: "Daily check-in",
    body: "15 seconds of voice. We listen to what you say and how you say it.",
  },
  {
    href: "/brief",
    title: "Supporter brief",
    body: "What your person needs today. Specific. Humane.",
  },
  {
    href: "/contribute",
    title: "Contribute",
    body: "Add a short voice note to the shared timeline.",
  },
  {
    href: "/pulse",
    title: "Network pulse",
    body: "Biomarker trajectory across the circle over time.",
  },
];

export default function Home() {
  return (
    <div className="space-y-6">
      <section className="pt-4">
        <h1 className="font-serif text-4xl leading-tight">
          Care that listens — and notices.
        </h1>
        <p className="mt-3 text-ink/70">
          Kin is an AI layer that coordinates a patient and their chosen support
          network. Powered by Speechmatics (medical STT) and Thymia Sentinel
          (voice biomarkers).
        </p>
      </section>

      <section className="grid gap-3">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-2xl border border-ink/10 bg-white/60 p-5 shadow-sm transition hover:border-kin-500/40 hover:shadow"
          >
            <div className="font-serif text-xl">{t.title}</div>
            <div className="mt-1 text-sm text-ink/70">{t.body}</div>
          </Link>
        ))}
      </section>
    </div>
  );
}
