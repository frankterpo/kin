import { VoiceCheckin } from "@/components/VoiceCheckin";

export default function ContributePage() {
  return (
    <div className="space-y-6 pt-4">
      <header>
        <div className="text-sm uppercase tracking-widest text-ink/50">Supporter</div>
        <h1 className="font-serif text-3xl leading-tight">Leave a voice note</h1>
        <p className="mt-2 text-sm text-ink/60">
          Something you noticed, something you&rsquo;re worried about,
          something warm. 15 seconds.
        </p>
      </header>
      <VoiceCheckin source="supporter" />
    </div>
  );
}
