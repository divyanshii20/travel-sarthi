import { useState, useEffect } from 'react';

interface CountdownResult {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function useCountdown(expiresAt: string): CountdownResult {
  const calcRemaining = () => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
    const totalSeconds = Math.floor(diff / 1000);
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      isExpired: false,
    };
  };

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    if (remaining.isExpired) return;
    const interval = setInterval(() => setRemaining(calcRemaining()), 1000);
    return () => clearInterval(interval);
  }, [expiresAt, remaining.isExpired]);

  return remaining;
}
