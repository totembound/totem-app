import React, { useEffect, useState } from "react";

const CountdownTimer: React.FC<{
    option: string;
}> = ({ option }) => {

  const [timeLeft, setTimeLeft] = useState(getTimeUntil());

  function getBaseTime() {
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
