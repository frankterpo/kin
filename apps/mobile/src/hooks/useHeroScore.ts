import { useEffect, useState } from 'react';
import { fetchHeroScore, HeroScore } from '../data/queries';

export function useHeroScore(circleId?: string) {
  const [score, setScore] = useState<HeroScore>({ value: 82, source: 'mock' });

  useEffect(() => {
    let cancelled = false;
    fetchHeroScore(circleId).then((s) => {
      if (!cancelled) setScore(s);
    });
    return () => {
      cancelled = true;
    };
  }, [circleId]);

  return score;
}
