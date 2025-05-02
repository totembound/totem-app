import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  option?: string;
  endTime?: number;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  option = 'midnight',
  endTime
}) => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntil());

  function getBaseTime() {
    if (endTime) {
      return endTime * 1000; // Convert from seconds to milliseconds
    }

    if (option == 'midnight') {
        return new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1, 0, 0, 0)).getTime();
    }

    return new Date().getTime();
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntil());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  function getTimeUntil() {
    const now = new Date().getTime();
    const baseTime = getBaseTime();
    const diffMs = baseTime - now;
    
    // Handle completed countdown
    if (diffMs <= 0) {
      return { hours: 0, minutes: "00", seconds: "00" };
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = String(Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    const seconds = String(Math.floor((diffMs % (1000 * 60)) / 1000)).padStart(2, '0');
    return { hours, minutes, seconds };
  }

  return (
    <span>{timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}</span>
  );
};

export default CountdownTimer;
