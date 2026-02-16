import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ============================================================================
// HOISTED MOCKS
// ============================================================================

const mockUserContext = vi.hoisted(() => ({
  isConnected: true,
  isSignedUp: true,
  totems: [
    {
      id: 'ttm_001',
      attributes: {
        species: 2, // Wolf
        nickname: 'Fang',
        stage: 2,
      },
    },
  ],
  connect: vi.fn(),
  comingSoon: false,
  hasClickedLink: vi.fn().mockReturnValue(false),
}));

const mockAchievementsContext = vi.hoisted(() => ({
  getAchievementById: vi.fn().mockReturnValue(null),
  refreshAchievements: vi.fn(),
}));

// ============================================================================
// MODULE MOCKS
// ============================================================================

vi.mock('../../contexts/UserContext', () => ({
  useUser: () => mockUserContext,
}));

vi.mock('../../contexts/AchievementsContext', () => ({
  useAchievements: () => mockAchievementsContext,
}));

vi.mock('../../config/constants', () => ({
  CURRENCY_NAMES: { SOFT: 'Essence', PREMIUM: 'Gems' },
}));

// ============================================================================
// IMPORTS (after mocks)
// ============================================================================

import {
  useTutorialConfig,
  TUTORIAL_STEPS_CONFIG,
  TUTORIAL_REWARDS,
} from './useTutorialConfig';

describe('useTutorialConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserContext.isConnected = true;
    mockUserContext.isSignedUp = true;
    mockUserContext.totems = [
      {
        id: 'ttm_001',
        attributes: { species: 2, nickname: 'Fang', stage: 2 },
      },
    ] as any;
    mockUserContext.hasClickedLink.mockReturnValue(false);
    mockAchievementsContext.getAchievementById.mockReturnValue(null);
  });

  // =========================================================================
  // TUTORIAL_STEPS_CONFIG (static data)
  // =========================================================================

  describe('TUTORIAL_STEPS_CONFIG', () => {
    it('has 6 tutorial steps', () => {
      expect(TUTORIAL_STEPS_CONFIG).toHaveLength(6);
    });

    it('each step has required fields', () => {
      for (const step of TUTORIAL_STEPS_CONFIG) {
        expect(step.stepId).toBeGreaterThan(0);
        expect(step.title).toBeDefined();
        expect(step.rewardId).toBeDefined();
        expect(step.steps.length).toBeGreaterThan(0);
        expect(typeof step.requiresTotem).toBe('boolean');
      }
    });

    it('step 1 does not require totem', () => {
      expect(TUTORIAL_STEPS_CONFIG[0].requiresTotem).toBe(false);
    });

    it('steps 2-5 require totem', () => {
      expect(TUTORIAL_STEPS_CONFIG[1].requiresTotem).toBe(true);
      expect(TUTORIAL_STEPS_CONFIG[2].requiresTotem).toBe(true);
      expect(TUTORIAL_STEPS_CONFIG[3].requiresTotem).toBe(true);
      expect(TUTORIAL_STEPS_CONFIG[4].requiresTotem).toBe(true);
    });

    it('step 6 does not require totem', () => {
      expect(TUTORIAL_STEPS_CONFIG[5].requiresTotem).toBe(false);
    });
  });

  // =========================================================================
  // TUTORIAL_REWARDS (constants)
  // =========================================================================

  describe('TUTORIAL_REWARDS', () => {
    it('has all 6 step reward IDs', () => {
      expect(TUTORIAL_REWARDS.STEP_1).toBe('tutorial_step_1_signup');
      expect(TUTORIAL_REWARDS.STEP_2).toBe('tutorial_step_2_mint');
      expect(TUTORIAL_REWARDS.STEP_3).toBe('tutorial_step_3_care');
      expect(TUTORIAL_REWARDS.STEP_4).toBe('tutorial_step_4_challenge');
      expect(TUTORIAL_REWARDS.STEP_5).toBe('tutorial_step_5_evolve');
      expect(TUTORIAL_REWARDS.STEP_6).toBe('tutorial_step_6_explore');
    });
  });

  // =========================================================================
  // checkStep
  // =========================================================================

  describe('checkStep', () => {
    it('isConnected: returns true when connected', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({ label: 'test', checkType: 'isConnected' } as any)).toBe(true);
    });

    it('isConnected: returns false when not connected', () => {
      mockUserContext.isConnected = false;
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({ label: 'test', checkType: 'isConnected' } as any)).toBe(false);
    });

    it('isSignedUp: returns true when signed up', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({ label: 'test', checkType: 'isSignedUp' } as any)).toBe(true);
    });

    it('isSignedUp: returns false when not signed up', () => {
      mockUserContext.isSignedUp = false;
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({ label: 'test', checkType: 'isSignedUp' } as any)).toBe(false);
    });

    it('hasTotems: returns true when user has totems', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({ label: 'test', checkType: 'hasTotems' } as any)).toBe(true);
    });

    it('hasTotems: returns false when no totems', () => {
      mockUserContext.totems = [] as any;
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({ label: 'test', checkType: 'hasTotems' } as any)).toBe(false);
    });

    it('hasTotemName: returns true when first totem has nickname', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({ label: 'test', checkType: 'hasTotemName' } as any)).toBe(true);
    });

    it('hasTotemName: returns false when nickname is null', () => {
      mockUserContext.totems = [{ id: 'ttm_001', attributes: { species: 2, nickname: null } }] as any;
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({ label: 'test', checkType: 'hasTotemName' } as any)).toBe(false);
    });

    it('hasTotemName: returns false when no totems', () => {
      mockUserContext.totems = [] as any;
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({ label: 'test', checkType: 'hasTotemName' } as any)).toBe(false);
    });

    it('hasClickedLink: delegates to hasClickedLink from UserContext', () => {
      mockUserContext.hasClickedLink.mockReturnValue(true);
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({
        label: 'test',
        checkType: 'hasClickedLink',
        checkParam: 'codex_totem_link',
      } as any)).toBe(true);
      expect(mockUserContext.hasClickedLink).toHaveBeenCalledWith('codex_totem_link');
    });

    it('hasClickedLink: returns false without checkParam', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({
        label: 'test',
        checkType: 'hasClickedLink',
      } as any)).toBe(false);
    });

    it('hasAchievement: returns true for completed OneTime achievement', () => {
      mockAchievementsContext.getAchievementById.mockReturnValue({
        achievementType: 0, // OneTime
        isCompleted: true,
        currentCount: 1,
      });
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({
        label: 'test',
        checkType: 'hasAchievement',
        checkParam: 'login_progression',
      } as any)).toBe(true);
      // Should normalize: login_progression → ach_login-progression
      expect(mockAchievementsContext.getAchievementById).toHaveBeenCalledWith('ach_login-progression');
    });

    it('hasAchievement: returns false for incomplete OneTime', () => {
      mockAchievementsContext.getAchievementById.mockReturnValue({
        achievementType: 0,
        isCompleted: false,
        currentCount: 0,
      });
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({
        label: 'test',
        checkType: 'hasAchievement',
        checkParam: 'login_progression',
      } as any)).toBe(false);
    });

    it('hasAchievement: returns true for Progression with count > 0', () => {
      mockAchievementsContext.getAchievementById.mockReturnValue({
        achievementType: 1, // Progression
        isCompleted: false,
        currentCount: 3,
      });
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({
        label: 'test',
        checkType: 'hasAchievement',
        checkParam: 'feed_progression',
      } as any)).toBe(true);
    });

    it('hasAchievement: returns false when achievement not found', () => {
      mockAchievementsContext.getAchievementById.mockReturnValue(null);
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({
        label: 'test',
        checkType: 'hasAchievement',
        checkParam: 'nonexistent',
      } as any)).toBe(false);
    });

    it('hasAchievement: returns false without checkParam', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({
        label: 'test',
        checkType: 'hasAchievement',
      } as any)).toBe(false);
    });

    it('hasAchievementProgress: returns true when count >= target', () => {
      mockAchievementsContext.getAchievementById.mockReturnValue({
        currentCount: 5,
      });
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({
        label: 'test',
        checkType: 'hasAchievementProgress',
        checkParam: 'collector_progression',
        checkParamNum: 3,
      } as any)).toBe(true);
    });

    it('hasAchievementProgress: returns false when count < target', () => {
      mockAchievementsContext.getAchievementById.mockReturnValue({
        currentCount: 1,
      });
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({
        label: 'test',
        checkType: 'hasAchievementProgress',
        checkParam: 'collector_progression',
        checkParamNum: 3,
      } as any)).toBe(false);
    });

    it('hasAchievementProgress: returns false without checkParam', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({
        label: 'test',
        checkType: 'hasAchievementProgress',
        checkParamNum: 2,
      } as any)).toBe(false);
    });

    it('custom: always returns false', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({ label: 'test', checkType: 'custom' } as any)).toBe(false);
    });

    it('unknown checkType: returns false', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.checkStep({ label: 'test', checkType: 'unknownType' } as any)).toBe(false);
    });
  });

  // =========================================================================
  // areAllStepsComplete
  // =========================================================================

  describe('areAllStepsComplete', () => {
    it('returns true when all required steps are complete', () => {
      const { result } = renderHook(() => useTutorialConfig());
      const steps = [
        { label: 'A', complete: false, isStepComplete: () => true },
        { label: 'B', complete: false, isStepComplete: () => true },
      ] as any;
      expect(result.current.areAllStepsComplete(steps)).toBe(true);
    });

    it('returns false when any required step is incomplete', () => {
      const { result } = renderHook(() => useTutorialConfig());
      const steps = [
        { label: 'A', complete: false, isStepComplete: () => true },
        { label: 'B', complete: false, isStepComplete: () => false },
      ] as any;
      expect(result.current.areAllStepsComplete(steps)).toBe(false);
    });

    it('skips optional steps (always count as complete)', () => {
      const { result } = renderHook(() => useTutorialConfig());
      const steps = [
        { label: 'A', complete: false, isStepComplete: () => true },
        { label: 'B (optional)', optional: true, complete: false, isStepComplete: () => false },
      ] as any;
      expect(result.current.areAllStepsComplete(steps)).toBe(true);
    });

    it('falls back to step.complete when isStepComplete is not defined', () => {
      const { result } = renderHook(() => useTutorialConfig());
      const steps = [
        { label: 'A', complete: true },
        { label: 'B', complete: false },
      ] as any;
      expect(result.current.areAllStepsComplete(steps)).toBe(false);
    });

    it('returns false for empty array', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.areAllStepsComplete([])).toBe(false);
    });

    it('returns false for non-array input', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.areAllStepsComplete(null as any)).toBe(false);
    });
  });

  // =========================================================================
  // tutorialSteps (convertConfigToSteps)
  // =========================================================================

  describe('tutorialSteps', () => {
    it('converts all 6 config steps to runtime steps', () => {
      const { result } = renderHook(() => useTutorialConfig());
      expect(result.current.tutorialSteps).toHaveLength(6);
    });

    it('each step has isStepComplete functions on sub-steps', () => {
      const { result } = renderHook(() => useTutorialConfig());
      for (const step of result.current.tutorialSteps) {
        for (const subStep of step.steps) {
          expect(typeof subStep.isStepComplete).toBe('function');
        }
      }
    });

    it('replaces {species} placeholder with first totem species name', () => {
      const { result } = renderHook(() => useTutorialConfig());
      // Step 3 (Care) has actionUrl "/guides/codex/totems/{species}"
      const step3 = result.current.tutorialSteps[2];
      const learnStep = step3.steps[0]; // "Learn More About Your Chosen Totem"
      expect(learnStep.actionUrl).toBe('/guides/codex/totems/wolf');
    });

    it('keeps {species} unresolved when no totems', () => {
      mockUserContext.totems = [] as any;
      const { result } = renderHook(() => useTutorialConfig());
      const step3 = result.current.tutorialSteps[2];
      const learnStep = step3.steps[0];
      // When no totems, the {species} placeholder stays
      expect(learnStep.actionUrl).toContain('{species}');
    });

    it('preserves linkState on steps', () => {
      const { result } = renderHook(() => useTutorialConfig());
      // Step 4 has linkState: { openSection: 4 }
      const step4 = result.current.tutorialSteps[3];
      const learnStep = step4.steps[0];
      expect(learnStep.linkState).toEqual({ openSection: 4 });
    });

    it('preserves optional flag', () => {
      const { result } = renderHook(() => useTutorialConfig());
      // Step 2 has optional "Give it a Nickname"
      const step2 = result.current.tutorialSteps[1];
      const optionalStep = step2.steps.find(s => s.optional);
      expect(optionalStep).toBeDefined();
      expect(optionalStep?.label).toContain('Nickname');
    });
  });

  // =========================================================================
  // refreshAchievements on mount
  // =========================================================================

  it('refreshes achievements once on mount when signed up', () => {
    renderHook(() => useTutorialConfig());
    expect(mockAchievementsContext.refreshAchievements).toHaveBeenCalledTimes(1);
  });

  it('does not refresh achievements when not signed up', () => {
    mockUserContext.isSignedUp = false;
    renderHook(() => useTutorialConfig());
    expect(mockAchievementsContext.refreshAchievements).not.toHaveBeenCalled();
  });
});
