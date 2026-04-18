import { useEffect, useState } from 'react';
import { fetchSupporterBrief, SupporterBriefRow } from '../data/queries';

export function useSupporterBrief(supporterId?: string) {
  const [brief, setBrief] = useState<SupporterBriefRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSupporterBrief(supporterId).then((b) => {
      if (cancelled) return;
      setBrief(b);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [supporterId]);

  return { brief, loading };
}
