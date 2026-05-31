/**
 * Client-side trait bonus preview.
 *
 * Mirrors the server resolver math for **display only** — the server stays
 * authoritative on every action. This util just lets the UI show the effective
 * cost / XP / happiness up front (e.g. "20 → 18 Essence" when a totem has
 * Thrifty), so the button matches what the API will return.
 *
 * Scope rules: this is **self scope** — it folds effects from the acting totem
 * for `{ action: 'feed' | 'train' | 'treat' }`. Aura traits also fire (the
 * `aura` token matches every context). Conditional auras (Kindred Soul) are
 * **not** evaluated here — they need the live team and only matter on team
 * activities (expeditions / arena), so they have no display surface on the
 * solo action bar today.
 *
 * Keep this in lockstep with `totem-api/src/config/trait-effects.js`. If a new
 * bonus field is added there, mirror its identity here.
 */

import { TRAIT_BY_ID, TotemTraits, TraitEffect } from '../config/traits';

export interface ActionContext {
    action?: 'feed' | 'train' | 'treat';
    challenge?: 'strength' | 'agility' | 'wisdom' | 'balance';
    system?: 'expedition' | 'sanctum';
    sub?: 'mission';
    earnsEssence?: boolean;
    loot?: 'any' | 'rune';
}

export interface ActionBonuses {
    xpMultiplier: number;
    essenceCostMultiplier: number;
    essenceRewardMultiplier: number;
    happinessFlat: number;
    happinessRewardMultiplier: number;
    hungerRestoreBonusPct: number;
    durationMultiplier: number;
    successChanceBonus: number;
    runeChanceBonus: number;
    lootChanceBonus: number;
    lootBoxChanceBonus: number;
    seatEarnRateMultiplier: number;
    tenureBonusMultiplier: number;
    offenseBonus: number;
    defenseBonus: number;
    statBonus: { strength: number; agility: number; wisdom: number };
}

export const EMPTY_BONUSES: ActionBonuses = {
    xpMultiplier: 1,
    essenceCostMultiplier: 1,
    essenceRewardMultiplier: 1,
    happinessFlat: 0,
    happinessRewardMultiplier: 1,
    hungerRestoreBonusPct: 0,
    durationMultiplier: 1,
    successChanceBonus: 0,
    runeChanceBonus: 0,
    lootChanceBonus: 0,
    lootBoxChanceBonus: 0,
    seatEarnRateMultiplier: 1,
    tenureBonusMultiplier: 1,
    offenseBonus: 0,
    defenseBonus: 0,
    statBonus: { strength: 0, agility: 0, wisdom: 0 },
};

function expandScopes(ctx: ActionContext): Set<string> {
    const tokens = new Set<string>(['aura']);
    if (ctx.action) tokens.add(`action:${ctx.action}`);
    if (ctx.challenge) {
        tokens.add(`challenge:${ctx.challenge}`);
        tokens.add('challenge:any');
        tokens.add('aura:combat');
    }
    if (ctx.loot) {
        tokens.add(`loot:${ctx.loot}`);
        tokens.add('loot:any');
    }
    if (ctx.system) tokens.add(`system:${ctx.system}`);
    if (ctx.system && ctx.sub) tokens.add(`${ctx.system}:${ctx.sub}`);
    if (ctx.earnsEssence) tokens.add('earn:any');
    return tokens;
}

function applyEffect(bonuses: ActionBonuses, effect: TraitEffect): void {
    const t = effect.type;
    if (t === 'statBonus' && typeof effect.value === 'object') {
        for (const [k, v] of Object.entries(effect.value as Record<string, number>)) {
            if (k === 'strength' || k === 'agility' || k === 'wisdom') {
                bonuses.statBonus[k] = (bonuses.statBonus[k] || 0) + v;
            }
        }
        return;
    }
    if (typeof effect.value !== 'number') return;
    const key = t as keyof ActionBonuses;
    if (typeof bonuses[key] !== 'number') return;
    if (t.endsWith('Multiplier')) {
        (bonuses[key] as number) *= effect.value;
    } else {
        (bonuses[key] as number) += effect.value;
    }
}

/**
 * Resolve trait bonuses for a single totem in a given action context.
 *
 * Conditional auras (Kindred Soul) are skipped — they need the team and have
 * no display surface on the solo action bar.
 */
export function resolveTraitBonusesForTotem(
    traits: TotemTraits | null | undefined,
    context: ActionContext,
): ActionBonuses {
    const bonuses: ActionBonuses = JSON.parse(JSON.stringify(EMPTY_BONUSES));
    if (!traits) return bonuses;
    const wanted = expandScopes(context);
    const seenTraitIds = new Set<string>();
    for (const slot of ['innate', 'learned', 'awakened'] as const) {
        const id = traits[slot];
        if (!id || seenTraitIds.has(id)) continue;
        seenTraitIds.add(id);
        const def = TRAIT_BY_ID[id];
        if (!def || !Array.isArray(def.effects)) continue;
        for (const eff of def.effects) {
            // Skip conditional effects — we can't evaluate Kindred Soul without a team.
            if (eff.condition) continue;
            const scopes = Array.isArray(eff.scope) ? eff.scope : [eff.scope];
            if (!scopes.some((s) => wanted.has(s))) continue;
            applyEffect(bonuses, eff);
        }
    }
    return bonuses;
}

/** Compute the effective Essence cost for a care action after Thrifty et al. */
export function effectiveEssenceCost(
    baseCost: number,
    traits: TotemTraits | null | undefined,
    action: 'feed' | 'train' | 'treat',
): number {
    const b = resolveTraitBonusesForTotem(traits, { action });
    return Math.floor(baseCost * b.essenceCostMultiplier);
}
