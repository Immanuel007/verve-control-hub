import { useEffect, useState, useCallback } from 'react';

const TTL_SECONDS = 20 * 60; // 20 minutes

function generateCvv(seed: string): string {
  // Deterministic-ish: hash seed + time bucket so it changes each cycle
  let h = 0;
  const s = seed + ':' + Math.floor(Date.now() / (TTL_SECONDS * 1000));
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  // Mix with random for unpredictability
  const r = Math.floor(Math.random() * 1000);
  return String(((h % 1000) ^ r) % 1000).padStart(3, '0');
}

/**
 * Dynamic CVV (dCVV) — rotates every 20 minutes per card.
 * Returns the current dCVV and seconds remaining until next rotation.
 */
export function useDynamicCvv(cardId: string) {
  const [cvv, setCvv] = useState(() => generateCvv(cardId));
  const [secondsLeft, setSecondsLeft] = useState(TTL_SECONDS);

  const rotate = useCallback(() => {
    setCvv(generateCvv(cardId + ':' + Math.random()));
    setSecondsLeft(TTL_SECONDS);
  }, [cardId]);

  // Reset when card changes
  useEffect(() => {
    setCvv(generateCvv(cardId));
    setSecondsLeft(TTL_SECONDS);
  }, [cardId]);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setCvv(generateCvv(cardId + ':' + Math.random()));
          return TTL_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [cardId]);

  return { cvv, secondsLeft, ttl: TTL_SECONDS, rotate };
}
