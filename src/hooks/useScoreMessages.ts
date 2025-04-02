import { useState, useCallback, useRef, useEffect } from 'react';
import { ScoreMessage } from '../components/effects/ScoreMessage';

export const useScoreMessages = (duration = 1000) => {
  const [scoreMessages, setScoreMessages] = useState<ScoreMessage[]>([]);
  const scoreMessagesRef = useRef<ScoreMessage[]>([]);
  
  // Add a new score message
  const addScoreMessage = useCallback((x: number, y: number, value: number) => {
    const newMessage: ScoreMessage = {
      id: Date.now(),
      value,
      x,
      y,
      createdAt: Date.now()
    };
    
    scoreMessagesRef.current = [...scoreMessagesRef.current, newMessage];
    setScoreMessages(scoreMessagesRef.current);
  }, []);

  // Update and clean up score messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      const now = Date.now();
      
      // Filter out messages that have expired
      const updatedMessages = scoreMessagesRef.current.filter(
        message => now - message.createdAt < duration
      );
      
      if (updatedMessages.length !== scoreMessagesRef.current.length) {
        scoreMessagesRef.current = updatedMessages;
        setScoreMessages(updatedMessages);
      }
    }, 100);
    
    return () => {
      clearInterval(messageInterval);
    };
  }, [duration]);

  return {
    scoreMessages,
    addScoreMessage
  };
};