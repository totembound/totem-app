import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Zap, CheckCircle2 } from 'lucide-react';
import { useTutorialClaims } from '../guides/useTutorialClaims';
import { TUTORIAL_STEPS_CONFIG } from '../guides/useTutorialConfig';
import { useUser } from '../../contexts/UserContext';
import { CURRENCY_NAMES } from '../../config/constants';
import { withVillagePrefix } from '../village/villagePath';

const TutorialClaimsCard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { claimStatus } = useTutorialClaims();
  const { setTutorialWizardVisible } = useUser();

  const total = TUTORIAL_STEPS_CONFIG.length;
  const claimedCount = TUTORIAL_STEPS_CONFIG.filter(s => claimStatus[s.rewardId]).length;
  const remaining = total - claimedCount;
  const allDone = claimedCount === total;

  const nextStep = TUTORIAL_STEPS_CONFIG.find(s => !claimStatus[s.rewardId]);
  const nextStepName = nextStep ? nextStep.title.replace(/^\d+\.\s*/, '') : null;
  const nextStepReward = nextStep ? Number(nextStep.tokenReward || 0) : 0;

  const remainingEssence = TUTORIAL_STEPS_CONFIG
    .filter(s => !claimStatus[s.rewardId])
    .reduce((sum, s) => sum + Number(s.tokenReward || 0), 0);
  const additionalAfterNext = remainingEssence - nextStepReward;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="w-6 h-6 text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Onboarding Rewards</h2>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums">{claimedCount} / {total}</span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-1.5 mb-4">
        {TUTORIAL_STEPS_CONFIG.map(s => {
          const done = !!claimStatus[s.rewardId];
          return (
            <div
              key={s.stepId}
              className={`flex-1 h-2 rounded-full transition-colors ${
                done
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-400'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
              title={s.title}
            />
          );
        })}
      </div>

      {/* Status callout */}
      <div className={`rounded-lg p-3 mb-4 ${allDone ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
        {allDone ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" />
            <span>All onboarding rewards claimed</span>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="text-sm min-w-0">
                <div className="text-gray-600 dark:text-gray-400 text-xs">Next step</div>
                <div className="text-gray-900 dark:text-white truncate" title={nextStepName || ''}>{nextStepName}</div>
              </div>
              <div className="flex items-center gap-1 ml-3 shrink-0">
                <Zap className="w-3.5 h-3.5 text-purple-500" />
                <span className="font-bold text-gray-900 dark:text-white">+{nextStepReward}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{CURRENCY_NAMES.SOFT}</span>
              </div>
            </div>
            {additionalAfterNext > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                +{additionalAfterNext} {CURRENCY_NAMES.SOFT} across {remaining - 1} more step{remaining - 1 === 1 ? '' : 's'}
              </div>
            )}
          </>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-1">
        {allDone
          ? 'You\'ve completed the spirit-keeper\'s journey. Visit the tutorial anytime to revisit lore.'
          : `${remaining} step${remaining === 1 ? '' : 's'} remaining. Walk the path of the Ancients to earn ${CURRENCY_NAMES.SOFT} and grow your bond.`}
      </p>

      {/* CTA */}
      <button
        onClick={() => {
          setTutorialWizardVisible(true);
          navigate(withVillagePrefix(location.pathname, '/guides/tutorial'));
        }}
        className={`w-full py-2 px-4 min-h-[44px] rounded-lg transition-colors font-medium ${
          allDone
            ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
        }`}
      >
        {allDone ? 'View Tutorial' : 'Continue Tutorial'}
      </button>
    </div>
  );
};

export default TutorialClaimsCard;
