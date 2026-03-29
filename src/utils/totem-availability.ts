/**
 * Totem Availability Checks
 *
 * Frontend equivalent of backend common/totem-utils.js.
 * Centralizes busy-check logic for game actions, expeditions, and sanctum.
 */

import type { TotemAttributes } from '../types/types';

/**
 * Check if a totem is available for game actions (Feed, Train, Treat).
 * Seated totems CAN perform actions (resting at sanctum).
 * Totems on a Council Mission CANNOT (away).
 */
export function isAvailableForAction(attributes: TotemAttributes): boolean {
  if (attributes.sanctum?.onMission) return false;
  return true;
}

/**
 * Check if a totem is available for expeditions or forge.
 * Seated totems CANNOT go on expeditions or be forged (locked).
 */
export function isAvailableForExpedition(attributes: TotemAttributes): boolean {
  if (attributes.sanctum?.seated) return false;
  return true;
}

/**
 * Get a human-readable busy reason for display.
 */
export function getBusyReason(attributes: TotemAttributes): string | null {
  if (attributes.sanctum?.onMission) return 'On Council Mission';
  if (attributes.sanctum?.seated) return 'Seated on Council';
  return null;
}
