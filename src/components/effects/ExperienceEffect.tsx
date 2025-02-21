import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface ExperienceEffectProps {
    exp: number;
    onComplete: () => void;
}

const ExperienceEffect: React.FC<ExperienceEffectProps> = ({ 
    exp,
    onComplete 
}) => {
    const [particles, setParticles] = useState<Array<{ id: number; delay: string }>>([]);

    useEffect(() => {
        // Create particles with similar timing to ActionEffect
        const newParticles = Array.from({ length: 6 }, (_, i) => ({
            id: i,
            delay: `delay-${(i * 350)}`
        }));
        setParticles(newParticles);

        const timeout = setTimeout(() => {
            onComplete();
        }, 2000);

        return () => clearTimeout(timeout);
    }, [onComplete]);

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

                    @keyframes score-pop {
                        0% {
                            transform: scale(0.8);
                            opacity: 0;
                        }
                        20% {
                            transform: scale(1.2);
                            opacity: 1;
                        }
                        100% {
                            transform: scale(1);
                            opacity: 0;
                        }
                    }

                    .score-animation {
                        animation: score-pop 2s ease-out forwards;
                    }
                `}
            </style>

            {/* Pulsing background */}
            <div className="absolute inset-0 bg-emerald-500/20 animate-pulse" />

            {/* Central score display */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="score-animation flex items-center gap-2 text-3xl font-bold text-emerald-500">
                    <span>+{exp}</span>
                    <span className="text-xl">XP</span>
                </div>
            </div>

            {/* Floating sparkles */}
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
                    <Sparkles className="w-full h-full text-emerald-500 animate-bounce" />
                </div>
            ))}

            {/* Rising orbs */}
            {particles.map(particle => (
                <div
                    key={`orb-${particle.id}`}
                    className="absolute w-4 h-4 rounded-full bg-emerald-400/30 animate-ping opacity-75"
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

export default ExperienceEffect;