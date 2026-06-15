import React, { useEffect, useState, useRef, useMemo } from "react";

interface CountdownTimerProps {
  option?: string;
  endTime?: number;
  /** Callback fired when countdown reaches zero */
  onComplete?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  option = 'midnight',
  endTime,
  onComplete
}) => {
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Calculate target time once based on props - memoized to prevent recalculation
  const targetTime = useMemo(() => {
    if (endTime) {
      return endTime * 1000;
    }
    if (option === 'midnight') {
      // Calculate next midnight UTC
      const now = new Date();
      return new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
      )).getTime();
    }
    return new Date().getTime();
  }, [endTime, option]);

  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date().getTime();
    const diffMs = targetTime - now;
    if (diffMs <= 0) {
      return { hours: 0, minutes: "00", seconds: "00" };
    }
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = String(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const seconds = String(Math.floor((diffMs % (1000 * 60)) / 1000)).padStart(2, '0');
    return { hours, minutes, seconds };
  });

  // Keep ref updated with latest callback
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Reset completed flag when target changes
  useEffect(() => {
    hasCompletedRef.current = false;
  }, [targetTime]);

  // Main timer effect
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const diffMs = targetTime - now;

      if (diffMs <= 0) {
        return { hours: 0, minutes: "00", seconds: "00", completed: true };
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = String(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
      const seconds = String(Math.floor((diffMs % (1000 * 60)) / 1000)).padStart(2, '0');
      return { hours, minutes, seconds, completed: false };
    };

    const timer = setInterval(() => {
      const newTime = calculateTimeLeft();
      setTimeLeft({ hours: newTime.hours, minutes: newTime.minutes, seconds: newTime.seconds });

      // Fire onComplete callback when countdown reaches zero (only once)
      if (newTime.completed && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        console.log('[CountdownTimer] Timer reached zero, firing onComplete callback');
        // Small delay to ensure UI updates before callback
        setTimeout(() => {
          if (onCompleteRef.current) {
            console.log('[CountdownTimer] Executing onComplete callback now');
            onCompleteRef.current();
          }
        }, 100);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

  return (
    <span>{timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}</span>
  );
};

export default CountdownTimer;
