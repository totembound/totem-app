import React from 'react';

export type ScoreMessage = {
  id: number;
  value: number;
  x: number;
  y: number;
  createdAt: number;
};

interface ScoreMessagesProps {
  messages: ScoreMessage[];
  duration?: number; // Duration in milliseconds
  floatDistance?: number; // How far messages float up in pixels
  textClass?: string;
}

const ScoreMessages: React.FC<ScoreMessagesProps> = ({ 
  messages, 
  duration = 1000, 
  floatDistance = 40,
  textClass = "font-bold text-xl text-yellow-300 shadow-sm"
}) => {
  return (
    <>
      {messages.map(message => {
        // Calculate opacity based on elapsed time (fade out effect)
        const elapsedTime = Date.now() - message.createdAt;
        const opacity = 1 - (elapsedTime / duration);
        
        // Calculate y position for floating up effect
        const floatProgress = elapsedTime / duration;
        const yOffset = floatDistance * floatProgress;
        
        return (
          <div
            key={message.id}
            className={`absolute ${textClass}`}
            style={{
              left: `${message.x}px`,
              top: `${message.y - yOffset}px`,
              opacity,
              transform: 'translate(-50%, -50%)',
              zIndex: 50,
              textShadow: '0 0 3px rgba(0,0,0,0.8)'
            }}
          >
            +{Math.floor(message.value)}
          </div>
        );
      })}
    </>
  );
};

export default ScoreMessages;