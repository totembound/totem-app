import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState } from '../../types/types';
import Tooltip from '../Tooltip';
import { elementsDB, RuneType, validateChainReaction } from './RuneValidator';

interface SpiritWeavingRunesProps {
  difficulty?: number;
  wisdom?: number;
  onComplete?: (score: number) => void;
  onFail?: () => void;
}

const SpiritWeavingRunes: React.FC<SpiritWeavingRunesProps> = ({
  difficulty = 2,
  wisdom = 10,
  onComplete = (score: number) => console.log('Challenge complete:', score),
  onFail = () => console.log('Challenge failed')
}) => {
  // Game state management
  const [gameState, setGameState] = useState<GameState>('ready');
  const [availableRunes, setAvailableRunes] = useState<RuneType[]>([]);
  const [selectedRunes, setSelectedRunes] = useState<RuneType[]>([]);
  const [maxSlots, setMaxSlots] = useState<number>(2);
  const [targetPattern, setTargetPattern] = useState<string>('');
  const [currentOutcome, setCurrentOutcome] = useState<string | null>(null);
  const [currentOutcomeImage, setCurrentOutcomeImage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [incorrectAttempts, setIncorrectAttempts] = useState<number>(0);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [showMaxSlotsAlert, setShowMaxSlotsAlert] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [showFailure, setShowFailure] = useState<boolean>(false);
  const [outcomeDescription, setOutcomeDescription] = useState<string>('');

  // References for timer implementation
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const maxSlotsAlertTimeoutRef = useRef<number | null>(null);

  // Game settings based on difficulty and wisdom
  const timeLimit = (10 * difficulty) + (wisdom * 1.5);

  // Get target elements by tier for different difficulty levels
  const getTargetElementsByTier = (tier: number): string[] => {
    return Object.entries(elementsDB.elements)
      .filter(([_, data]) => data && data.tier === tier)
      .map(([element, _]) => element);
  };

  const setupTargetPattern = useCallback(() => {
    try {
      // Determine target tier based on difficulty
      // difficulty 1 -> tier 2, difficulty 2 -> tier 3, difficulty 3+ -> tier 4
      const targetTier = Math.min(4, difficulty + 1);

      // Get all possible targets of the appropriate tier
      const possibleTargets = getTargetElementsByTier(targetTier);

      if (possibleTargets.length === 0) {
        console.warn(`No elements found for tier ${targetTier}`);
        // Fallback to lower tier if no elements found
        const fallbackTier = Math.max(1, targetTier - 1);
        const fallbackTargets = getTargetElementsByTier(fallbackTier);
        if (fallbackTargets.length > 0) {
          const randomIndex = Math.floor(Math.random() * fallbackTargets.length);
          setTargetPattern(fallbackTargets[randomIndex]);
        } else {
          // Worst case, just set a basic target from the primary elements
          const primaryElements = getTargetElementsByTier(1);
          if (primaryElements.length > 0) {
            setTargetPattern(primaryElements[0]);
          } else {
            // Ultimate fallback
            setTargetPattern('fire');
          }
        }
        return;
      }

      // Randomly select a target from the appropriate tier
      const randomIndex = Math.floor(Math.random() * possibleTargets.length);
      const target = possibleTargets[randomIndex];
      setTargetPattern(target);
    } catch (error) {
      console.error('Error setting up target pattern:', error);
      // Fallback to a simple target
      setTargetPattern('fire');
    }
  }, [difficulty]);

  const processChainReaction = useCallback((runeSequence: RuneType[]): void => {
    if (runeSequence.length === 0) {
      setCurrentOutcome(null);
      setCurrentOutcomeImage(null);
      setOutcomeDescription('');
      return;
    }

    const result = validateChainReaction(runeSequence);

    // Set the outcome based on the final result
    if (result) {
      setCurrentOutcome(result);
      
      if (elementsDB.elements[result]) {
        setCurrentOutcomeImage(elementsDB.elements[result].image);
        setOutcomeDescription(elementsDB.elements[result].description || '');
      }
    } else {
      // If a combination failed, set no outcome
      setCurrentOutcome(null);
      setCurrentOutcomeImage(null);
      setOutcomeDescription('');
    }
  }, []);

  // Calculate game score based on time efficiency and incorrect attempts
  const calculateGameScore = (
    timeElapsed: number,
    timeLimit: number,
    incorrectAttemptsCount: number
  ): number => {
    const maxScore = 3000;

    // Time efficiency: ratio of time remaining to total time (0 to 1)
    const timeEfficiency = Math.max(0, (timeLimit - timeElapsed) / timeLimit);
    
    // Base score from time efficiency (0 to 3000 points)
    const timeScore = maxScore * timeEfficiency;
    
    // Penalty for incorrect attempts: 200 points per mistake
    const incorrectAttemptsPenalty = incorrectAttemptsCount * 200;
    
    // Final score cannot be negative
    return Math.round(Math.max(0, timeScore - incorrectAttemptsPenalty));
  };

  const handleGameEnd = useCallback((success: boolean, elapsedTime: number | null = null) => {
    // Clear any active timers
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      if (success) {
        const finalElapsedTime = elapsedTime !== null ? elapsedTime : timeLimit;
        const score = calculateGameScore(
          finalElapsedTime,
          timeLimit,
          incorrectAttempts
        );

        setFinalScore(score);
        setGameState('success');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        onComplete(score);
      } else {
        setFinalScore(0);
        setGameState('failed');
        setShowFailure(true);
        setTimeout(() => setShowFailure(false), 2000);
        onFail();
      }
    } catch (error) {
      console.error('Error handling game end:', error);
      // Ensure game state is updated even if there's an error
      setGameState(success ? 'success' : 'failed');
      if (success) onComplete(0);
      else onFail();
    }
  }, [timeLimit, calculateGameScore, onComplete, onFail, incorrectAttempts]);

  // SIMPLIFIED: Victory condition check now directly in an effect
  useEffect(() => {
    // Check victory condition whenever currentOutcome changes
    if (gameState === 'playing' && currentOutcome === targetPattern) {
      // Victory condition met
      if (endTimeRef.current === null) return;

      // Calculate time elapsed
      const now = Date.now();
      const elapsed = (timeLimit * 1000) - (endTimeRef.current - now);
      const elapsedSeconds = Math.min(timeLimit, elapsed / 1000);

      // End game with win
      handleGameEnd(true, elapsedSeconds);
    }
  }, [currentOutcome, targetPattern, gameState, handleGameEnd, timeLimit]);

  const generateAvailableRunes = () => {
    // Simply use all primary (tier 1) runes
    const primaryRunes = Object.entries(elementsDB.elements)
      .filter(([_, data]) => data.tier === 1)
      .map(([element, data], index) => ({
        id: index,
        element,
        image: data.image || `/images/runes/${element}.png`,
        tier: data.tier
      }));

    setAvailableRunes(primaryRunes);
  };

  const startTimer = () => {
    try {
      // Calculate when the timer should end
      const now = Date.now();
      const duration = timeLimit * 1000; // convert seconds to milliseconds
      endTimeRef.current = now + duration;

      // Set initial timeLeft
      setTimeLeft(timeLimit);

      // Start a new timer that updates every 100ms for smoother countdown
      timerRef.current = window.setInterval(() => {
        if (endTimeRef.current === null) return;

        const now = Date.now();
        const remaining = Math.max(0, endTimeRef.current - now);
        const remainingSeconds = remaining / 1000;

        // Update timeLeft
        setTimeLeft(remainingSeconds);

        // Check if timer has expired
        if (remainingSeconds <= 0) {
          // Clear timer
          if (timerRef.current) {
            window.clearInterval(timerRef.current);
            timerRef.current = null;
          }

          // Time's up - game over
          handleGameEnd(false);
        }
      }, 100); // Update more frequently for smoother countdown
    } catch (error) {
      console.error('Error starting timer:', error);
      // Ensure game continues even if timer fails
      setTimeLeft(timeLimit);
    }
  };

  // Initialize the game
  const startGame = () => {
    try {
      console.log('Starting game...');

      // Reset all game states
      setSelectedRunes([]);
      setCurrentOutcome(null);
      setCurrentOutcomeImage(null);
      setOutcomeDescription('');
      setIncorrectAttempts(0);
      setGameState('playing');
      setFinalScore(0);
      setShowSuccess(false);
      setShowFailure(false);

      // Set max slots based on difficulty
      setMaxSlots(difficulty + 1);

      // Setup the target pattern first
      setupTargetPattern();

      // Generate game elements
      generateAvailableRunes();

      // Start the timer
      startTimer();

      console.log('Game started successfully');
    } catch (error) {
      console.error('Error starting game:', error);
      // If something goes wrong, ensure we're not in a broken state
      setGameState('ready');
    }
  };

  // Show max slots alert temporarily
  const showMaxSlotsAlertTemporarily = () => {
    // Clear any existing timeout
    if (maxSlotsAlertTimeoutRef.current !== null) {
      window.clearTimeout(maxSlotsAlertTimeoutRef.current);
    }

    // Show the alert
    setShowMaxSlotsAlert(true);

    // Set a timeout to hide it after 1.5 seconds
    maxSlotsAlertTimeoutRef.current = window.setTimeout(() => {
      setShowMaxSlotsAlert(false);
      maxSlotsAlertTimeoutRef.current = null;
    }, 1500);
  };

  // Handle selecting a rune
  const handleRuneSelect = (rune: RuneType) => {
    if (gameState !== 'playing') return;

    // Check if we've reached the maximum number of slots
    if (selectedRunes.length >= maxSlots) {
      // Show the max slots alert
      showMaxSlotsAlertTemporarily();
      return;
    }

    try {
      // Add the rune to the selected sequence
      const newSelectedRunes = [...selectedRunes, rune];
      setSelectedRunes(newSelectedRunes);

      // Process the chain reaction
      processChainReaction(newSelectedRunes);

      // Victory check moved to useEffect
    } catch (error) {
      console.error('Error handling rune selection:', error);
    }
  };

  // Handle unselecting a rune
  const handleRuneUnselect = (index: number) => {
    if (gameState !== 'playing') return;

    try {
      // Remove the rune at the specified index
      const newSelectedRunes = [...selectedRunes];
      newSelectedRunes.splice(index, 1);
      setSelectedRunes(newSelectedRunes);

      // Clear outcome if no runes are selected
      if (newSelectedRunes.length === 0) {
        setCurrentOutcome(null);
        setCurrentOutcomeImage(null);
        setOutcomeDescription('');
      } else {
        // Process the chain reaction with the new sequence
        processChainReaction(newSelectedRunes);
      }
    } catch (error) {
      console.error('Error handling rune unselection:', error);
    }
  };

  // Clear the selected runes sequence
  const clearSelection = () => {
    setSelectedRunes([]);
    setCurrentOutcome(null);
    setCurrentOutcomeImage(null);
    setOutcomeDescription('');
  };


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (maxSlotsAlertTimeoutRef.current !== null) {
        window.clearTimeout(maxSlotsAlertTimeoutRef.current);
      }
    };
  }, []);

  // Show alert when time is running low
  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 5 && gameState === 'playing') {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [timeLeft, gameState]);

  // Score ticker component
  const scoreTicker = (
    <div className="text-gray-300 font-bold">
      Time: {timeLeft ? timeLeft.toFixed(1) : '-'}s |
      Score: {Math.floor(finalScore)}
    </div>
  );

  // Empty slot component for selected runes
  const EmptySlot = () => (
    <div className="h-10 w-10 md:h-14 md:w-14 border-2 border-dashed border-gray-600 rounded-md bg-gray-800/30"></div>
  );

  // Render empty slots for the selected runes section
  const renderEmptySlots = () => {
    const slots = [];
    const filledCount = selectedRunes.length;

    for (let i = 0; i < maxSlots; i++) {
      if (i >= filledCount) {
        slots.push(<EmptySlot key={`empty-slot-${i}`} />);
      }
    }

    return slots;
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      <div className="relative bg-slate-800 rounded-lg mb-4 p-1 md:p-2 h-96 flex flex-col overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <img
            src="/challenges/spirit-weaving-background.png"
            alt="Ancient runes background"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image doesn't load
              e.currentTarget.style.backgroundColor = '#2d3748';
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* Game Content - Enhanced Grid Layout */}
        <div className="relative z-10 grid grid-rows-[auto_1fr_auto] h-full gap-1 md:gap-2">
          
          {/* TOP: Selected Runes Sequence with Empty Slots */}
          <div className="flex justify-center items-center gap-2 py-1">
            {selectedRunes.map((rune, index) => (
              <div
                key={`selected-${index}`}
                className="relative cursor-pointer hover:scale-110 transition-transform"
                onClick={() => handleRuneUnselect(index)}
              >
                <img
                  src={rune.image}
                  alt={rune.element}
                  className="h-10 w-10 md:h-14 md:w-14 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.backgroundColor = '#4a5568';
                    e.currentTarget.src = '/images/placeholder.png';
                  }}
                />
                {index < selectedRunes.length - 1 && (
                  <div className="absolute right-[-8px] top-1/2 transform -translate-y-1/2 text-white text-sm">→</div>
                )}
              </div>
            ))}
            {renderEmptySlots()}
          </div>

          {/* MIDDLE: Target and Current Outcome - Responsive Grid */}
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 items-center justify-items-center px-2">
            
            {/* Target Pattern */}
            <div className="flex items-center justify-center w-full">
              {/* Left TARGET label */}
              <div className="flex items-center justify-center mr-2">
                <div 
                  className="text-amber-400 text-xs md:text-sm font-semibold whitespace-nowrap"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'upright',
                    textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                  }}
                >
                  TARGET
                </div>
              </div>
              
              <div className="h-32 w-32 md:h-40 md:w-40 flex flex-col items-center justify-center bg-black/80 rounded-xl p-2 border-2 border-amber-400/30">
                {targetPattern && (
                  <>
                    <span className="text-white text-sm md:text-base font-bold mb-1">{targetPattern}</span>
                    {elementsDB.elements[targetPattern] && (
                      <div className="flex justify-center items-center flex-grow">
                        <img
                          src={elementsDB.elements[targetPattern].image}
                          alt={targetPattern}
                          className="h-20 w-20 md:h-24 md:w-24 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.backgroundColor = '#4a5568';
                            e.currentTarget.src = '/images/placeholder.png';
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Right TARGET label */}
              <div className="flex items-center justify-center ml-2">
                <div 
                  className="text-amber-400 text-xs md:text-sm font-semibold whitespace-nowrap"
                  style={{
                    writingMode: 'vertical-lr',
                    textOrientation: 'upright',
                    textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                  }}
                >
                  TARGET
                </div>
              </div>
            </div>

            {/* Current Outcome */}
            <div className="flex items-center justify-center w-full">
              {/* Left OUTCOME label */}
              <div className="flex items-center justify-center mr-2">
                <div 
                  className="text-green-400 text-xs md:text-sm font-semibold whitespace-nowrap"
                  style={{
                    writingMode: 'vertical-rl',
                    textOrientation: 'upright',
                    textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                  }}
                >
                  OUTCOME
                </div>
              </div>
              
              <div className="h-32 w-32 md:h-40 md:w-40 flex flex-col items-center justify-center bg-black/80 rounded-xl p-2 border-2 border-green-400/30">
                {currentOutcome ? (
                  <>
                    <span className="text-white text-sm md:text-base font-bold mb-1">{currentOutcome}</span>
                    {currentOutcomeImage && (
                      <div className="flex justify-center items-center flex-grow">
                        <img
                          src={currentOutcomeImage}
                          alt={currentOutcome}
                          className="h-20 w-20 md:h-24 md:w-24 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.backgroundColor = '#4a5568';
                            e.currentTarget.src = '/images/placeholder.png';
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-gray-400 italic text-xs">Select runes...</span>
                  </div>
                )}
              </div>
              
              {/* Right OUTCOME label */}
              <div className="flex items-center justify-center ml-2">
                <div 
                  className="text-green-400 text-xs md:text-sm font-semibold whitespace-nowrap"
                  style={{
                    writingMode: 'vertical-lr',
                    textOrientation: 'upright',
                    textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                  }}
                >
                  OUTCOME
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM: Available Runes */}
          <div className="flex flex-wrap justify-center gap-2 py-2 min-h-16">
            {availableRunes.map((rune) => (
              <Tooltip key={`available-${rune.id}`} content={rune.element}>
                <div
                  className="cursor-pointer hover:scale-110 transition-transform relative"
                  onClick={() => handleRuneSelect(rune)}
                >
                  <img
                    src={rune.image}
                    alt={rune.element}
                    className="h-12 w-12 object-contain"
                    onError={(e) => {
                      // Fallback if image doesn't load
                      e.currentTarget.style.backgroundColor = '#4a5568';
                      e.currentTarget.src = '/images/placeholder.png';
                    }}
                  />
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div>
        {gameState === 'ready' && (
          <button
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
        transition-colors duration-200"
            onClick={startGame}
            type="button"
          >
            Start Challenge
          </button>
        )}

        {gameState === 'playing' && (
          <button
            className="w-full py-2 px-4 bg-gray-400 dark:bg-gray-600 text-white rounded-lg cursor-not-allowed"
            disabled={true}
            type="button"
          >
            <div className="text-gray-300 font-bold">
              Time: {timeLeft ? timeLeft.toFixed(1) : '-'}s |
              Score: {Math.floor(calculateGameScore(
                timeLimit - (timeLeft || 0),
                timeLimit,
                incorrectAttempts
              ))}
            </div>
          </button>
        )}

        {gameState === 'success' && (
          <div className="flex justify-between items-center">
            <div className="text-gray-300 font-bold">
              Time: {timeLeft ? timeLeft.toFixed(1) : '-'}s |
              Score: {Math.floor(finalScore)}
            </div>
            <button
              className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 
          transition-colors duration-200"
              onClick={startGame}
              type="button"
            >
              Try Again
            </button>
          </div>
        )}

        {gameState === 'failed' && (
          <div className="flex justify-between items-center">
            <div className="text-gray-300 font-bold">
              Time: {timeLeft ? timeLeft.toFixed(1) : '-'}s |
              Score: {Math.floor(finalScore)}
            </div>
            <button
              className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 
          transition-colors duration-200"
              onClick={startGame}
              type="button"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


export default SpiritWeavingRunes;