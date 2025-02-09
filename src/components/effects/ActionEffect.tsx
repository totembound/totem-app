import React, { useEffect, useState } from 'react';
import { Heart, Coffee, Dumbbell } from 'lucide-react';

type ActionEffectType = 'treat' | 'feed' | 'train' | null;

interface ActionEffectProps {
  action: ActionEffectType;
  onComplete: () => void;
}

const ActionEffect: React.FC<ActionEffectProps> = ({ action, onComplete }) => {
  const [particles, setParticles] = useState<Array<{ id: number; delay: string }>>([]);

  useEffect(() => {
    if (!action) return;

    // Create particles with Tailwind-compatible delay values
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      delay: `delay-${(i * 350)}` // Will handle with inline styles instead since dynamic
    }));
    setParticles(newParticles);

    const timeout = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [action, onComplete]);

  if (!action) return null;

  const getActionIcon = () => {
    switch (action) {
      case 'treat':
        return (
          <Heart 
            className="w-full h-full text-pink-500 animate-bounce" 
          />
        );
      case 'feed':
        return (
          <Coffee 
            className="w-full h-full text-green-500 animate-bounce" 
          />
        );
      case 'train':
        return (
          <Dumbbell 
            className="w-full h-full text-blue-500 animate-bounce" 
          />
        );
      default:
        return null;
    }
  };

  const getActionColors = () => {
    switch (action) {
      case 'treat':
        return {
          overlay: 'bg-pink-500/20',
          bubble: 'bg-pink-400/30'
        };
      case 'feed':
        return {
          overlay: 'bg-green-500/20',
          bubble: 'bg-green-400/30'
        };
      case 'train':
        return {
          overlay: 'bg-blue-500/20',
          bubble: 'bg-blue-400/30'
        };
      default:
        return {
          overlay: '',
          bubble: ''
        };
    }
  };

  const colors = getActionColors();

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-10">
      <style>
        {`
          @keyframes float-up {
            0% {
              transform: translate(var(--tw-translate-x), 0) scale(0.5);
              opacity: 1;
            }
            50% {
              transform: translate(var(--tw-translate-x), -20px) scale(1.2);
              opacity: 0.8;
            }
            100% {
              transform: translate(var(--tw-translate-x), -40px) scale(0.8);
              opacity: 0;
            }
          }

          .float-animation {
            animation: float-up 1.5s ease-out forwards;
          }
        `}
      </style>

      {/* Pulsing background contained within image */}
      <div className={`
        absolute inset-0
        ${colors.overlay}
        animate-pulse
      `} />

      {/* Floating icons */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-6 h-6 float-animation"
          style={{
            left: `${30 + Math.random() * 40}%`,
            top: `${30 + Math.random() * 40}%`,
            animationDelay: `${particle.id * 150}ms`,
            '--tw-translate-x': `${Math.random() * 30 - 15}px`
          } as React.CSSProperties}
        >
          {getActionIcon()}
        </div>
      ))}

      {/* Rising bubbles */}
      {particles.map(particle => (
        <div
          key={`bubble-${particle.id}`}
          className={`
            absolute w-4 h-4 rounded-full
            ${colors.bubble}
            animate-ping opacity-75
          `}
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${40 + Math.random() * 40}%`,
            animationDelay: `${particle.id * 150}ms`,
            animationDuration: '2s',
            animationIterationCount: 1
          }}
        />
      ))}
    </div>
  );
};

export default ActionEffect;