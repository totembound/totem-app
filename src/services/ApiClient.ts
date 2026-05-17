/**
 * TotemBound REST API Client
 *
 * Handles all API calls with JWT authentication.
 * Replaces Web3 contract calls for the Web2 migration.
 */

import type { AvatarRef, BannerRef, PublicPlayerProfile } from '../types/types';
import type { DailyQuestSet, QuestClaimResponse, QuestProgressUpdate } from '../types/quests';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/v1';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    [key: string]: unknown;
  };
}

interface TokenStorage {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number;
}

class ApiClient {
  private tokens: TokenStorage | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.loadTokens();
  }

  private loadTokens() {
    const stored = localStorage.getItem('totembound_tokens');
    if (stored) {
      try {
        this.tokens = JSON.parse(stored);
      } catch {
        this.tokens = null;
      }
    }
  }

  private saveTokens(tokens: TokenStorage) {
    this.tokens = tokens;
    localStorage.setItem('totembound_tokens', JSON.stringify(tokens));
  }

  public clearTokens() {
    this.tokens = null;
    localStorage.removeItem('totembound_tokens');
  }

  public isAuthenticated(): boolean {
    return !!this.tokens?.idToken;
  }

  public getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.tokens?.refreshToken) return false;

    // Prevent multiple refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.tokens!.refreshToken }),
        });

        const data = await response.json();

        if (data.success && data.tokens) {
          this.saveTokens({
            accessToken: data.tokens.accessToken,
            refreshToken: data.tokens.refreshToken,
            idToken: data.tokens.idToken,
            expiresAt: Date.now() + (data.tokens.expiresIn * 1000),
          });
          return true;
        }

        this.clearTokens();
        return false;
      } catch {
        this.clearTokens();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async parseJsonResponse<T>(response: Response, path: string): Promise<ApiResponse<T>> {
    // Handle non-OK responses
    if (!response.ok) {
      // Try to parse error from JSON
      try {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || {
            code: `HTTP_${response.status}`,
            message: errorData.message || response.statusText,
          },
        };
      } catch {
        // If JSON parsing fails, return generic error
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: response.statusText || `Request failed with status ${response.status}`,
          },
        };
      }
    }

    // Parse successful response
    try {
      return await response.json();
    } catch (parseError) {
      console.error('Failed to parse JSON response from', path, parseError);
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse server response',
        },
      };
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    requiresAuth = true
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    };

    if (requiresAuth) {
      // Always read fresh from localStorage to handle token updates from AuthService
      this.loadTokens();

      if (!this.tokens?.idToken) {
        return {
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'Not logged in' },
        };
      }
      headers['Authorization'] = this.tokens.idToken;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle 401 - try to refresh token
      if (response.status === 401 && requiresAuth && this.tokens?.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          headers['Authorization'] = this.tokens!.idToken;
          const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
          });
          return await this.parseJsonResponse(retryResponse, path);
        }
      }

      return await this.parseJsonResponse(response, path);
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  // ============================================
  // Auth endpoints
  // ============================================

  async signup(email: string, password: string, displayName: string) {
    const response = await this.request<{
      user: { id: string; email: string; displayName: string };
      tokens: { accessToken: string; refreshToken: string; idToken: string; expiresIn: number };
      lootItem: { id: string; boxId: string; boxName: string; boxDescription: string; boxRarity: string; boxIcon: string };
    }>('POST', '/auth/signup', { email, password, displayName }, false);

    if (response.success && response.data?.tokens) {
      this.saveTokens({
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken,
        idToken: response.data.tokens.idToken,
        expiresAt: Date.now() + (response.data.tokens.expiresIn * 1000),
      });
    }

    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      user: { id: string; email: string; displayName: string };
      tokens: { accessToken: string; refreshToken: string; idToken: string; expiresIn: number };
    }>('POST', '/auth/login', { email, password }, false);

    if (response.success && response.data?.tokens) {
      this.saveTokens({
        accessToken: response.data.tokens.accessToken,
        refreshToken: response.data.tokens.refreshToken,
        idToken: response.data.tokens.idToken,
        expiresAt: Date.now() + (response.data.tokens.expiresIn * 1000),
      });
    }

    return response;
  }

  async logout() {
    if (this.tokens?.refreshToken) {
      await this.request('POST', '/auth/logout', { refreshToken: this.tokens.refreshToken });
    }
    this.clearTokens();
  }

  async getMe() {
    return this.request<{
      id: string;
      email: string;
      displayName: string;
      tier: string;
      currencies: { essence: number; gems: number };
      stats: { totalTotems: number; loginStreak: number };
    }>('GET', '/auth/me');
  }

  // ============================================
  // Totem endpoints
  // ============================================

  async getTotems() {
    return this.request<Array<{
      id: string;
      tokenId: string;
      displayName: string;
      name: string;
      description: string;
      image: string;
      affinity: string;
      domain: string;
      attributes: {
        species: number;
        color: number;
        rarity: number;
        happiness: number;
        experience: number;
        stage: number;
        strength: number;
        agility: number;
        wisdom: number;
      };
      trackings: Record<number, { lastUsed: number; dailyUses: number; dayStartTime: number }>;
    }>>('GET', '/totems');
  }

  async getTotem(totemId: string) {
    return this.request<unknown>('GET', `/totems/${totemId}`);
  }

  // ============================================
  // Game Action endpoints
  // ============================================

  async feedTotem(totemId: string) {
    return this.request<{
      action: string;
      totemId: string;
      xpGained: number;
      newExperience: number;
      statChanges: Record<string, number>;
      cooldown: { type: string; duration: number; readyAt: string };
      achievements?: Array<{ achievementId: string; milestone?: number; rewards?: { essence?: number; xp?: number } }>;
      quests?: QuestProgressUpdate[];
      message: string;
      feedsToday: number;
      maxDaily: number;
      newEssenceBalance: number;
    }>('POST', `/totems/${totemId}/feed`);
  }

  async trainTotem(totemId: string) {
    return this.request<{
      action: string;
      totemId: string;
      xpGained: number;
      newExperience: number;
      statChanges: Record<string, number>;
      cooldown: { type: string; duration: number; readyAt: string };
      achievements?: Array<{ achievementId: string; milestone?: number; rewards?: { essence?: number; xp?: number } }>;
      quests?: QuestProgressUpdate[];
      message: string;
      newEssenceBalance: number;
    }>('POST', `/totems/${totemId}/train`);
  }

  async treatTotem(totemId: string) {
    return this.request<{
      action: string;
      totemId: string;
      xpGained: number;
      newExperience: number;
      statChanges: Record<string, number>;
      cooldown: { type: string; duration: number; readyAt: string };
      achievements?: Array<{ achievementId: string; milestone?: number; rewards?: { essence?: number; xp?: number } }>;
      quests?: QuestProgressUpdate[];
      message: string;
      newEssenceBalance: number;
    }>('POST', `/totems/${totemId}/treat`);
  }

  async evolveTotem(totemId: string) {
    return this.request<{
      action: string;
      totemId: string;
      evolution: {
        previousStage: number;
        previousStageName: string;
        newStage: number;
        newStageName: string;
        newDisplayName: string;
      };
      statBoosts: Record<string, number>;
      achievements?: Array<{ achievementId: string; milestone?: number; rewards?: { essence?: number; xp?: number } }>;
      quests?: QuestProgressUpdate[];
      message: string;
    }>('POST', `/totems/${totemId}/evolve`);
  }

  async setNickname(totemId: string, nickname: string | null) {
    return this.request<{
      totemId: string;
      nickname: string | null;
    }>('POST', `/totems/${totemId}/nickname`, { nickname });
  }

  async getCooldowns(totemId: string) {
    return this.request<{
      totemId: string;
      cooldowns: {
        feed: { onCooldown: boolean; readyAt: string | null; remainingMs: number };
        train: { onCooldown: boolean; readyAt: string | null; remainingMs: number };
        treat: { onCooldown: boolean; readyAt: string | null; remainingMs: number };
      };
    }>('GET', `/totems/${totemId}/cooldowns`);
  }

  async getEvolutionStatus(totemId: string) {
    return this.request<{
      totemId: string;
      currentStage: number;
      currentStageName: string;
      canEvolve: boolean;
      requirements: {
        experience: { required: number; current: number; met: boolean };
        happiness: { required: number; current: number; met: boolean };
      };
      nextStage: number | null;
      nextStageName: string | null;
    }>('GET', `/totems/${totemId}/evolution`);
  }

  async getTotemStatus(totemId: string) {
    return this.request<{
      totemId: string;
      name: string;
      stage: number;
      stageName: string;
      experience: number;
      stats: Record<string, number>;
      actions: {
        feed: { available: boolean; readyAt: string | null };
        train: { available: boolean; readyAt: string | null };
        treat: { available: boolean; readyAt: string | null };
      };
      evolution: {
        nextStage: number;
        nextStageName: string;
        requirements: { experience: number; happiness: number };
        progress: {
          experience: { current: number; required: number; percent: number };
          happiness: { current: number; required: number; met: boolean };
        };
      } | { maxStageReached: boolean };
    }>('GET', `/totems/${totemId}/status`);
  }

  // ============================================
  // User profile endpoints
  // ============================================

  async getProfile() {
    return this.request<{
      id: string;
      email: string;
      displayName: string;
      tier: string;
      currencies: { essence: number; gems: number; runes?: { lesser: number; greater: number; ancient: number } };
      stats: { totalTotems: number; loginStreak: number };
      settings: { notifications: boolean; darkMode: string };
      displayNameCooldown?: { readyAt: string | null; skipCost: number };
      profile?: { bio: string | null; avatar: AvatarRef; banner: BannerRef };
    }>('GET', '/user/profile');
  }

  async updateProfile(data: {
    displayName?: string;
    settings?: Record<string, unknown>;
    bio?: string | null;
    avatar?: AvatarRef;
    banner?: BannerRef;
  }) {
    return this.request('PUT', '/user/profile', data);
  }

  async getPublicPlayerProfile(userId: string) {
    return this.request<PublicPlayerProfile>('GET', `/players/${userId}/public`);
  }

  async updateDisplayName(displayName: string, skipCooldown = false) {
    return this.request<{
      displayName: string;
      displayNameCooldown: { readyAt: string; skipCost: number };
      skippedCooldown: boolean;
      newEssenceBalance?: number;
    }>('PUT', '/user/displayName', { displayName, skipCooldown });
  }

  // ============================================
  // Reward endpoints
  // ============================================

  async getRewardStatus() {
    return this.request<{
      tier?: string;
      tierMultiplier?: number;
      tierBonusPercent?: number;
      daily: {
        canClaim: boolean;
        streakDays: number;
        bestStreak: number;
        nextClaimTime: string | null;
        isProtected: boolean;
        protectionCharges: number;
      };
      weekly: {
        canClaim: boolean;
        weeklyStreak: number;
        bestStreak: number;
        nextClaimTime: string | null;
        isProtected: boolean;
        protectionCharges: number;
        isUnlocked: boolean;
      };
    }>('GET', '/rewards/status');
  }

  async claimDailyReward() {
    return this.request<{
      success: boolean;
      reward: {
        amount: number;
        streakDays: number;
        streakBonus: number;
      };
      message: string;
    }>('POST', '/rewards/daily/claim');
  }

  async claimWeeklyReward() {
    return this.request<{
      success: boolean;
      reward: {
        type: string;
        baseAmount: number;
        streakAtClaim: number;
        bonusPercent: number;
        bonusAmount: number;
        totalAmount: number;
        amount?: number;
        weeklyStreak?: number;
      };
      newStreak: number;
      newBalance: number;
      nextClaimTime: string;
      message: string;
    }>('POST', '/rewards/weekly/claim');
  }

  async purchaseProtection(type: 'daily' | 'weekly', tier: number) {
    return this.request<{
      rewardType: string;
      tier: number;
      cost: number;
      chargesAdded: number;
      protectionCharges: number;
      maxCharges: number;
      newBalance: number;
    }>('POST', `/rewards/${type}/protection`, { tier });
  }

  async getDailyQuests() {
    return this.request<DailyQuestSet>('GET', '/rewards/quests');
  }

  async claimDailyQuests() {
    return this.request<QuestClaimResponse>('POST', '/rewards/quests/claim');
  }

  // TODO Phase 3: previewUpcomingThemes() — preview /v1/rewards/quests/preview?days=N

  // ============================================
  // Challenge endpoints
  // ============================================

  async getChallenges() {
    return this.request<{
      challenges: Array<{
        id: string;
        name: string;
        description: string;
        type: string;
        affinity: string;
        requirements: {
          stage: number;
          strength: number;
          agility: number;
          wisdom: number;
        };
        maxDailyAttempts: number;
        maxScore: number;
        xpReward: number;
        difficulty: string;
        progress: {
          completionCount: number;
          totalAttempts: number;
          totalXpEarned: number;
          highScore: number;
          lastScore: number;
          lastAttemptAt: string | null;
          firstCompletedAt: string | null;
        };
        daily: {
          attemptsToday: number;
          attemptsRemaining: number;
          canAttempt: boolean;
        };
      }>;
      byType: Record<string, unknown>;
      summary: {
        totalChallenges: number;
        uniqueChallengesCompleted: number;
        totalCompletions: number;
        totalXpEarned: number;
      };
    }>('GET', '/challenges');
  }

  async completeChallenge(challengeId: string, totemId: string, score: number) {
    return this.request<{
      challengeId: string;
      challengeName: string;
      totemId: string;
      score: number;
      xpEarned: number;
      essenceEarned: number;
      newEssenceBalance: number | null;
      totem: {
        id: string;
        previousXp: number;
        newXp: number;
        stage: number;
        eligibleToEvolve: boolean;
      };
      progress: {
        completionCount: number;
        totalAttempts: number;
        totalXpEarned: number;
        highScore: number;
        attemptsToday: number;
        attemptsRemaining: number;
      };
      achievements?: Array<{ achievementId: string; milestone?: number; rewards?: { essence?: number; xp?: number } }>;
      quests?: QuestProgressUpdate[];
      message: string;
    }>('POST', `/challenges/${challengeId}/complete`, { totemId, score });
  }

  // ============================================
  // Expedition endpoints
  // ============================================

  async getExpeditions() {
    return this.request<{
      available: Array<{
        id: string;
        name: string;
        domain: string;
        duration: number;
        essenceCost: number;
        happinessCost: number;
        baseExperience: number;
        affinityWeights: [number, number, number];
        runeDropChances: [number, number, number];
        enabled: boolean;
      }>;
      active: Array<{
        expeditionId: string;
        totemIds: string[];
        endTime: string;
        canClaim: boolean;
      }>;
    }>('GET', '/expeditions');
  }

  async getActiveExpeditions() {
    return this.request<{
      expeditions: Array<{
        id: string;
        expeditionId: string;
        totemId: string;
        totemIds: string[];
        startedAt: string;
        endsAt: string;
        status: string;
        canClaim: boolean;
        progress: number;
        remainingMs: number;
      }>;
      summary: { total: number; inProgress: number; claimable: number };
    }>('GET', '/expeditions/active');
  }

  async startExpedition(expeditionId: string, totemIds: string[]) {
    return this.request<{
      success: boolean;
      expedition: {
        id: string;
        expeditionId: string;
        name: string;
        endTime: string;
        endsAt: string;
        essenceCost: number;
        happinessCost: number;
        totemId: string;
      };
      quests?: QuestProgressUpdate[];
      message: string;
    }>('POST', `/expeditions/${expeditionId}/start`, { totemId: totemIds[0], totemIds });
  }

  async claimExpeditionRewards(totemId: string) {
    return this.request<{
      rewards: {
        experience: number;
        experienceGained?: number;
        essence: number;
        newEssenceBalance: number | null;
        runes: {
          lesser: number;
          greater: number;
          ancient: number;
        };
        runesGained?: {
          lesser: number;
          greater: number;
          ancient: number;
        };
        newRuneBalances?: {
          lesser: number;
          greater: number;
          ancient: number;
        };
        score?: number;
        totemExpUpdates?: Record<string, number>;
      };
      score?: {
        value: number;
        tier: string;
        tierLabel: string;
        breakdown: Record<string, number>;
        totemAffinity: string;
        multipliers: { xpMultiplier: number; essenceMultiplier: number; runeMultiplier: number };
      };
      expedition: {
        id: string;
        expeditionId: string;
        name: string;
        startedAt: string;
        completedAt: string;
        durationMinutes: number;
        totemIds?: string[];
      };
      totem: {
        id: string;
        newExperience: number;
      };
      achievements?: Array<{
        achievementId: string;
        milestone?: number;
        rewards?: { essence?: number; xp?: number };
      }>;
      quests?: QuestProgressUpdate[];
      message: string;
    }>('POST', `/expeditions/${totemId}/claim`);
  }

  // ============================================
  // Gem Purchase endpoints
  // ============================================

  async getGemPackages() {
    return this.request<{
      packages: Array<{
        id: string;
        name: string;
        price: number;
        priceFormatted: string;
        gems: number;
        essence: number;
        bonus: number;
        bonusFormatted: string | null;
      }>;
      conversionRate: number;
      conversionNote: string;
    }>('GET', '/shop/gems/packages');
  }

  async purchaseGems(packageId: string) {
    return this.request<{
      sessionId?: string;
      sessionUrl?: string;
      package?: string;
      gemsAdded?: number;
      essenceAdded?: number;
      newGemsBalance?: number;
      newEssenceBalance?: number;
      isDev?: boolean;
      message?: string;
    }>('POST', '/shop/gems/checkout', { packageId });
  }

  // ============================================
  // Gem to Essence Exchange endpoints
  // ============================================

  async getExchangeBundles() {
    return this.request<{
      bundles: Array<{
        id: string;
        name: string;
        gemCost: number;
        essenceAmount: number;
        bonus: number;
        bonusNote: string | null;
      }>;
      conversionRate: number;
      conversionNote: string;
    }>('GET', '/shop/exchange/bundles', undefined, false);
  }

  async exchangeGemsForEssence(bundleId: string) {
    return this.request<{
      bundleId: string;
      bundleName: string;
      gemsSpent: number;
      essenceReceived: number;
      bonus: number;
      newGemsBalance: number;
      newEssenceBalance: number;
    }>('POST', '/shop/exchange', { bundleId });
  }

  // ============================================
  // Achievement endpoints
  // ============================================

  async getAchievements() {
    // Web2: API returns milestone progress arrays per achievement
    // Format: { achievements: { "ach_id": [{ unlocked: bool, progress: number }, ...] } }
    return this.request<{
      achievements: Record<string, Array<{
        unlocked: boolean;
        progress: number;
      }>>;
    }>('GET', '/achievements');
  }

  async checkAchievement(achievementId: string) {
    return this.request<{
      unlocked: boolean;
      achievement?: {
        id: string;
        name: string;
        badgeUri: string;
      };
      milestone?: {
        index: number;
        threshold: number;
        reward: number;
      };
    }>('POST', `/achievements/${achievementId}/check`);
  }

  // ============================================
  // Totem Purchase endpoints
  // ============================================

  /**
   * Get info about purchasing new totems (cost, available species)
   */
  async getTotemPurchaseInfo() {
    return this.request<{
      cost: number;
      currency: string;
      availableSpecies: Array<{
        id: number;
        name: string;
        baseStats: Record<string, number>;
      }>;
      note: string;
    }>('GET', '/totems/purchase/info');
  }

  /**
   * Purchase a new totem (direct purchase, not from marketplace)
   */
  async purchaseNewTotem(options?: { speciesId?: number; name?: string }) {
    return this.request<{
      totem: {
        id: string;
        speciesId: number;
        speciesName: string;
        colorId: number;
        rarityId: number;
        name: string;
        stage: number;
        experience: number;
        stats: {
          strength: number;
          agility: number;
          wisdom: number;
          happiness: number;
        };
        image: string;
        createdAt: string;
      };
      newBalance: number;
      cost: number;
      achievements: Array<{
        achievementId: string;
        milestone?: number;
        rewards?: unknown;
      }>;
    }>('POST', '/totems/purchase', options || {});
  }

  // ============================================
  // Shop / Marketplace endpoints
  // ============================================

  /**
   * Get marketplace listings (unbound totems for sale)
   */
  async getShopListings(options?: {
    page?: number;
    limit?: number;
    speciesId?: number;
    rarityId?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'price' | 'listedAt' | 'stage';
    sortOrder?: 'asc' | 'desc';
  }) {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.speciesId !== undefined) params.append('speciesId', options.speciesId.toString());
    if (options?.rarityId !== undefined) params.append('rarityId', options.rarityId.toString());
    if (options?.minPrice) params.append('minPrice', options.minPrice.toString());
    if (options?.maxPrice) params.append('maxPrice', options.maxPrice.toString());
    if (options?.sortBy) params.append('sortBy', options.sortBy);
    if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

    const queryString = params.toString();
    return this.request<{
      listings: Array<{
        id: string;
        totemId: string;
        originalOwnerId: string;
        sellPrice: number;
        listedAt: string;
        status: string;
        totemData: {
          speciesId: number;
          colorId: number;
          rarityId: number;
          name: string;
          stage: number;
          experience: number;
          prestigeLevel: number;
          stats: {
            strength: number;
            agility: number;
            wisdom: number;
            happiness: number;
          };
        };
      }>;
      total: number;
      hasMore: boolean;
    }>('GET', `/shop/listings${queryString ? '?' + queryString : ''}`);
  }

  /**
   * Get user's own marketplace listings
   */
  async getMyListings(status?: 'active' | 'sold' | 'cancelled' | 'all') {
    const params = status ? `?status=${status}` : '';
    return this.request<{
      listings: Array<{
        id: string;
        totemId: string;
        sellPrice: number;
        status: string;
        listedAt: string;
        totemData: {
          speciesId: number;
          colorId: number;
          rarityId: number;
          name: string;
          stage: number;
        };
      }>;
    }>('GET', `/shop/my-listings${params}`);
  }

  /**
   * List a totem for sale in the marketplace
   */
  async listTotemForSale(totemId: string, askingPrice: number) {
    return this.request<{
      listing: {
        id: string;
        totemId: string;
        sellPrice: number;
        listedAt: string;
        status: string;
      };
      feeDeducted: number;
      newBalance: number;
    }>('POST', '/shop/list', { totemId, askingPrice });
  }

  /**
   * Purchase an unbound totem from the marketplace
   */
  async purchaseUnboundTotem(totemId: string) {
    return this.request<{
      totem: {
        id: string;
        speciesId: number;
        colorId: number;
        rarityId: number;
        name: string;
        stage: number;
        experience: number;
        stats: Record<string, number>;
      };
      totalPaid: number;
      purchaseFee: number;
      newBalance: number;
    }>('POST', '/shop/purchase', { totemId });
  }

  /**
   * Cancel an active listing
   */
  async cancelListing(totemId: string) {
    return this.request<{
      totem: {
        id: string;
        name: string;
      };
      message: string;
    }>('POST', '/shop/cancel', { totemId });
  }

  /**
   * Get shop configuration (fees, limits)
   */
  async getShopConfig() {
    return this.request<{
      listingFee: number;
      purchaseFee: number;
      minAskingPrice: number;
      maxAskingPrice: number;
    }>('GET', '/shop/config');
  }

  // ============================================
  // Subscription endpoints
  // ============================================

  async createSubscriptionCheckout(tier: 'premium' | 'vip') {
    return this.request<{
      sessionId?: string;
      sessionUrl?: string;
      tier?: string;
      message?: string;
      devMode?: boolean;
      upgraded?: boolean;
    }>('POST', '/subscription/checkout', { tier });
  }

  async getSubscriptionStatus() {
    return this.request<{
      tier: string;
      stripeCustomerId: string | null;
      subscription: {
        status: string;
        tier: string | null;
        currentPeriodEnd: string | null;
        cancelAtPeriodEnd: boolean;
        subscriptionId: string | null;
      };
    }>('GET', '/subscription/status');
  }

  async cancelSubscription() {
    return this.request<{
      message: string;
      currentPeriodEnd?: string;
      cancelAtPeriodEnd?: boolean;
      tier?: string;
    }>('POST', '/subscription/cancel');
  }

  async reactivateSubscription() {
    return this.request<{
      message: string;
      currentPeriodEnd?: string;
      cancelAtPeriodEnd?: boolean;
    }>('POST', '/subscription/reactivate');
  }

  async getBillingPortalUrl(returnPath?: string) {
    const qs = returnPath ? `?returnPath=${encodeURIComponent(returnPath)}` : '';
    return this.request<{
      portalUrl: string;
    }>('GET', `/subscription/portal${qs}`);
  }

  async getSubscriptionBonusStatus() {
    return this.request<{
      eligible: boolean;
      tier: string;
      canClaim: boolean;
      alreadyClaimed?: boolean;
      claimedAt?: string | null;
      currentMonth?: string;
      reason?: string;
      bonus?: { essence: number; gems: number };
    }>('GET', '/subscription/bonus-status');
  }

  async claimSubscriptionBonus() {
    return this.request<{
      tier: string;
      monthKey: string;
      essence: number;
      gems: number;
      newEssenceBalance: number;
      newGemsBalance: number;
      message: string;
    }>('POST', '/subscription/claim-bonus');
  }

  // ============================================
  // Special Offer Bundle endpoints
  // ============================================

  /**
   * Get available special offer bundles
   */
  async getSpecialOfferBundles() {
    return this.request<{
      bundles: Array<{
        id: string;
        name: string;
        description: string;
        gemCost: number;
        essenceAmount: number;
        totemRarity: string;
        totemRarityId: number;
        isMonthly: boolean;
        month?: number;
      }>;
    }>('GET', '/shop/bundles');
  }

  /**
   * Purchase a special offer bundle (totem + essence for gems)
   */
  async purchaseBundle(bundleId: number) {
    return this.request<{
      bundle: { name: string; essence: number };
      totem: { id: string; name: string; rarityId: number; image?: string };
      gemsSpent: number;
      essenceReceived: number;
      newGemsBalance: number;
      newEssenceBalance: number;
    }>('POST', '/shop/bundles/purchase', { bundleId });
  }
  // ============================================
  // Forge (Fusion) endpoints
  // ============================================

  async fuseTotem(totemIds: string[]) {
    return this.request<{
      action: 'forge';
      fusionType: 'pure' | 'wild';
      consumedTotemIds: string[];
      newTotem: {
        id: string;
        speciesId: number;
        speciesName: string;
        colorId: number;
        rarityId: number;
        nickname: string | null;
        stage: number;
        experience: number;
        stats: {
          strength: number;
          agility: number;
          wisdom: number;
          happiness: number;
          hunger: number;
        };
        image: string;
        createdAt: string;
      };
      newEssenceBalance: number;
      achievements: Array<{
        achievementId: string;
        milestone?: number;
        rewards?: { essence?: number; xp?: number };
      }>;
    }>('POST', '/totems/forge', { totemIds });
  }

  // ============================================
  // Loot Box endpoints
  // ============================================

  async getLootItems() {
    return this.request<{
      items: Array<{
        id: string;
        boxId: string;
        source: string;
        status: string;
        grantedAt: string;
        box: {
          id: string;
          name: string;
          description: string;
          icon: string;
          rarity: string;
          type: string;
          config: {
            rarityId?: number;
            minAmount?: number;
            maxAmount?: number;
            userChooses: string[];
            randomized: string[];
          };
        };
      }>;
      count: number;
    }>('GET', '/loot/items');
  }

  async claimLootItem(lootItemId: string, options?: { speciesId?: number }) {
    return this.request<{
      lootItemId: string;
      boxId: string;
      boxName: string;
      type: string;
      result: {
        type: string;
        totem?: {
          id: string;
          speciesId: number;
          speciesName: string;
          colorId: number;
          rarityId: number;
          rarityName: string;
          stage: number;
          experience: number;
          stats: {
            strength: number;
            agility: number;
            wisdom: number;
            happiness: number;
            hunger: number;
          };
        };
        amount?: number;
        newBalance?: number;
      };
    }>('POST', '/loot/claim', { lootItemId, options });
  }

  // ============================================
  // IoT Push Notification endpoints
  // ============================================

  async getIoTConfig() {
    return this.request<{
      endpoint: string | null;
      region: string;
      identityPoolId: string | null;
      userPoolId: string | null;
      userPoolClientId: string | null;
      registered: boolean;
      topic: string | null;
    }>('GET', '/iot/config');
  }

  async registerIoT(identityId: string) {
    return this.request<{
      registered: boolean;
      topic: string;
    }>('POST', '/iot/register', { identityId });
  }

  public getIdToken(): string | null {
    this.loadTokens();
    return this.tokens?.idToken || null;
  }

  // ============================================
  // Sanctum endpoints
  // ============================================

  async getSanctum() {
    return this.request<{
      maxSeats: number;
      seats: Array<{
        seatIndex: number;
        totemId: string;
        totemName: string;
        species: string;
        seatedAt: string;
        lastClaimedAt: string;
        tenureDays: number;
        tenureMultiplier: number;
        accumulatedEssence: number;
        atCap: boolean;
        onMission: boolean;
        activeMission: {
          missionType: string;
          name: string;
          startedAt: string;
          endsAt: string;
          canClaim: boolean;
        } | null;
      }>;
      totalAccumulated: number;
      lockedSeats: number[];
    }>('GET', '/sanctum');
  }

  async seatTotem(totemId: string, seatIndex?: number) {
    return this.request<{
      seatIndex: number;
      totemId: string;
      seatedAt: string;
      sanctumState: unknown;
      achievements: Array<{ achievementId: string; milestone?: number; rewards?: { essence?: number; xp?: number } }>;
    }>('POST', '/sanctum/seat', { totemId, seatIndex });
  }

  async unseatTotem(totemId: string) {
    return this.request<{
      totemId: string;
      sanctumState: unknown;
    }>('POST', '/sanctum/unseat', { totemId });
  }

  async claimSanctum() {
    return this.request<{
      totalClaimed: number;
      breakdown: Array<{ seatIndex: number; totemId: string; claimed: number; tenureMultiplier: number }>;
      newEssenceBalance: number;
      achievements: Array<{ achievementId: string; milestone?: number; rewards?: { essence?: number; xp?: number } }>;
    }>('POST', '/sanctum/claim', {});
  }

  async getCouncilMissions() {
    return this.request<{
      governance: Array<unknown>;
      diplomacy: Array<unknown>;
      legacy: Array<unknown>;
    }>('GET', '/sanctum/missions');
  }

  async startCouncilMission(totemId: string, missionType: string) {
    return this.request<{
      missionType: string;
      totemId: string;
      startedAt: string;
      endsAt: string;
      cost: { essence: number; happiness: number };
      newEssenceBalance: number;
    }>('POST', '/sanctum/missions/start', { totemId, missionType });
  }

  async claimCouncilMission(totemId: string) {
    return this.request<{
      missionType: string;
      missionName: string;
      totemId: string;
      rewards: { xp: number; runesEarned: { lesser: number; greater: number; ancient: number } };
      newRuneBalances: { lesser: number; greater: number; ancient: number } | null;
      achievements: Array<{ achievementId: string; milestone?: number; rewards?: { essence?: number; xp?: number } }>;
    }>('POST', '/sanctum/missions/claim', { totemId });
  }

  async cancelCouncilMission(totemId: string) {
    return this.request<{
      totemId: string;
      cancelled: boolean;
    }>('POST', '/sanctum/missions/cancel', { totemId });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
