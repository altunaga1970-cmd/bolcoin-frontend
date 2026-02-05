import { useState, useEffect } from 'react';

/**
 * Hook para manejar cuenta regresiva
 */
function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(null);
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);

      if (!newTimeLeft || newTimeLeft.total <= 0) {
        setIsExpired(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return { timeLeft, isExpired };
}

/**
 * Calcula el tiempo restante hasta la fecha objetivo
 */
function calculateTimeLeft(targetDate) {
  if (!targetDate) return null;

  const target = new Date(targetDate);
  const now = new Date();
  const difference = target - now;

  if (difference <= 0) {
    return {
      total: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
  }

  return {
    total: difference,
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
}

/**
 * Formatea el tiempo restante para mostrar
 */
export function formatCountdown(timeLeft) {
  if (!timeLeft || timeLeft.total <= 0) {
    return 'Finalizado';
  }

  const { days, hours, minutes, seconds } = timeLeft;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export default useCountdown;
