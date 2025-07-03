import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle, Gift, Lock, Maximize2, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTutorialConfig } from './useTutorialConfig';
import { useTutorialClaims } from './useTutorialClaims';
import { useUser } from '../../contexts/UserContext';

interface TutorialWizardProps {
  className?: string;
  onComplete?: () => void;
}

const TutorialWizard: React.FC<TutorialWizardProps> = ({ 
  className, 
  onComplete
}) => {
  const { 
    tutorialWizardVisible, 
    setTutorialWizardVisible, 
    isSignedUp,
    trackLink
  } = useUser();
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const { comingSoon, totems } = useUser();
  const { tutorialSteps, areAllStepsComplete, stepActions } = useTutorialConfig();
  const { handleClaimReward, getClaimStatus, canClaim } = useTutorialClaims();

  const currentTutorialStep = tutorialSteps[currentStep];
  const isStepComplete = areAllStepsComplete(currentTutorialStep.steps);
  const isStepLocked = currentStep > 0 && !areAllStepsComplete(tutorialSteps[currentStep - 1].steps);
  const { hasClaimed, isLoading } = getClaimStatus(currentTutorialStep.rewardId);
  const canClaimReward = canClaim(currentTutorialStep.rewardId, isStepComplete, currentTutorialStep.requiresTotem);

  // Helper function to handle link clicks with tracking
  const handleLinkClick = (step: any) => {
    // Only track if this step uses hasClickedLink check type
    if (step.checkType === 'hasClickedLink' && step.checkParam) {
      trackLink(step.checkParam, {
        source: 'tutorial_wizard',
        stepTitle: currentTutorialStep.title,
        url: step.actionUrl || '',
        actionType: step.actionType || '',
        timestamp: Date.now()
      });
    }
  };

  const handleClaimClick = async () => {
    try {
      await handleClaimReward(currentTutorialStep.rewardId, currentTutorialStep.requiresTotem);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const closeDialog = () => {
    setTutorialWizardVisible(false);
    onComplete?.();
  };

  const showWizard = () => {
    setTutorialWizardVisible(true);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  if (!isSignedUp ||  !tutorialWizardVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-6 right-2 w-96 max-w-[calc(100vw-1rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ease-in-out z-50 border border-gray-200 dark:border-gray-700 ${
      isMinimized ? 'h-auto' : ''} ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Step {currentStep + 1} of {tutorialSteps.length}
            </span>
            {isStepComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
            {isStepLocked && <Lock className="w-4 h-4 text-red-400" />}
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button
                onClick={toggleMinimize}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors md:hidden"
                aria-label={isMinimized ? "Expand" : "Minimize"}
            >
                {isMinimized ? <Maximize2 size={18} /> : <Minus size={18} />}
            </button>
            <button
            onClick={closeDialog}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
            >
            <X size={20} />
            </button>
        </div>
      </div>

      {/* Progress Bar */}
       {!isMinimized && (
        <div className="h-2 bg-gray-200 dark:bg-gray-700">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
          />
        </div>
      )}

      {/* Content */}
      {!isMinimized && (
      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {currentTutorialStep.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {currentTutorialStep.subtitle}
          </p>
        </div>

        {/* Steps List */}
        <div className="space-y-3 mb-4">
          {currentTutorialStep.steps.map((step, idx) => {
            const complete = step.isStepComplete ? step.isStepComplete() : step.complete;

            return (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                  complete ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className="flex-shrink-0 h-6 pt-1">
                  {complete ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                  )}
                </div>
            
                <span className={`mr-auto text-sm ${complete ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {step.label}
                </span>
                
                {!complete && step.actionType && (
                <div className="h-6 mr-1">
                    {step.actionType === 'link' && step.actionUrl && (
                    <Link
                        to={step.actionUrl}
                        className="text-sm text-purple-500 hover:text-purple-400 hover:underline font-bold"
                        onClick={() => handleLinkClick(step)}  // Track if this step uses hasClickedLink
                    >
                        {step.actionText}
                    </Link>
                    )}
                    
                    {step.actionType === 'button' && step.actionId && (
                    <button
                        disabled={comingSoon}
                        className={`px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors ${
                        comingSoon ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={() => stepActions[step.actionId!]?.()}
                    >
                        {step.actionText}
                    </button>
                    )}
                    
                    {step.actionType === 'external' && step.actionUrl && (
                    <a
                        href={step.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-500 hover:text-purple-400 hover:underline font-bold"
                        onClick={() => handleLinkClick(step)}  // Track if this step uses hasClickedLink
                    >
                        {step.actionText}
                    </a>
                    )}
                </div>
                )}

              </div>
            );
          })}
        </div>

        {/* Reward Section */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentTutorialStep.tokenReward} TOTEM
                {currentTutorialStep.experienceReward > 0 && ` + ${currentTutorialStep.experienceReward} XP`}
              </span>
            </div>
            
            {hasClaimed ? (
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ Claimed
              </span>
            ) : canClaimReward ? (
              <button
                onClick={handleClaimClick}
                disabled={isLoading || comingSoon}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Claiming..." : "Claim"}
              </button>
            ) : (
              <span className="text-xs text-gray-500">
                {isStepComplete 
                  ? (currentTutorialStep.requiresTotem && (!totems || totems.length === 0) 
                    ? "Need Totem" 
                    : "Ready to claim")
                  : "Complete steps"
                }
              </span>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Footer Navigation */}
      <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        
        <div className="flex gap-1">
          {tutorialSteps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentStep 
                  ? 'bg-purple-500' 
                  : idx < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
        
        <button
          onClick={nextStep}
          disabled={currentStep === tutorialSteps.length - 1}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default TutorialWizard;