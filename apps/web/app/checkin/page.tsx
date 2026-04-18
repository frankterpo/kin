import { VoiceCheckin } from "@/components/VoiceCheckin";

export default function CheckinPage() {
  return (
    <div className="space-y-6 pt-4">
      <header>
        <div className="text-sm uppercase tracking-widest text-ink/50">Patient</div>
        <h1 className="font-serif text-3xl leading-tight">How are you, really?</h1>
        <p className="mt-2 text-sm text-ink/60">
          15 seconds. Just say how today feels. No wrong answer.
        </p>
      </header>
      <VoiceCheckin source="patient" />
    </div>
  );
}
