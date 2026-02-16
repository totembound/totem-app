import { useTutorialConfig } from './useTutorialConfig';
import { useTutorialClaims } from './useTutorialClaims';
import TutorialPanel from './TutorialPanel';
import TutorialCompleteModal from './TutorialCompleteModal';

export default function TutorialPanels() {
  const { tutorialSteps, areAllStepsComplete, stepActions } = useTutorialConfig();
  const { handleClaimReward, getClaimStatus, tutorialComplete, dismissTutorialComplete } = useTutorialClaims();

  const handleClaimRewardWrapper = async (rewardId: string, _totemId: string) => {
    const stepConfig = tutorialSteps.find(step => step.rewardId === rewardId);
    if (!stepConfig) return;

    await handleClaimReward(rewardId, stepConfig.requiresTotem);
  };

  return (
    <>
      <div className="container mx-auto mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {tutorialSteps.map((section, index) => {
          const { hasClaimed } = getClaimStatus(section.rewardId);
          const completed = hasClaimed || areAllStepsComplete(section.steps);
          const previousHasClaimed = index === 0 || getClaimStatus(tutorialSteps[index-1]?.rewardId).hasClaimed;
          const isPreviousCompleted = index === 0 || previousHasClaimed || areAllStepsComplete(tutorialSteps[index-1]?.steps);

          return (
          <TutorialPanel
            key={index}
            title={section.title}
            subtitle={section.subtitle}
            imageUrl={section.imageUrl}
            steps={section.steps}
            stepActions={stepActions}
            isLocked={!isPreviousCompleted}
            isComplete={completed}
            rewardId={section.rewardId}
            tokenReward={section.tokenReward}
            experienceReward={section.experienceReward}
            requiresTotem={section.requiresTotem}
            onClaimReward={handleClaimRewardWrapper}
            hasClaimed={hasClaimed}
          />
        )})}
      </div>
      {tutorialComplete && <TutorialCompleteModal onClose={dismissTutorialComplete} />}
    </>
  );
}
