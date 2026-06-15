import { useLocation } from 'react-router-dom';

const VILLAGE_PREFIX = '/keepers-village';

/**
 * Rewrites an absolute app path so it stays inside the village modal trunk
 * when the current route is under /keepers-village/. Otherwise returns the
 * original path unchanged.
 *
 * Use this for shared components rendered in both trunks (Sidebar, Codex
 * NavItems, etc.) so their internal links don't navigate the user out of
 * a modal-over-village session.
 *
 * Example:
 *   from /guides/codex             → /guides/codex/totems/owl
 *   from /keepers-village/guides/* → /keepers-village/guides/codex/totems/owl
 */
export function withVillagePrefix(currentPathname: string, absPath: string): string {
  if (!absPath.startsWith('/')) return absPath;
  if (!currentPathname.startsWith(VILLAGE_PREFIX)) return absPath;
  if (absPath.startsWith(VILLAGE_PREFIX)) return absPath;
  return `${VILLAGE_PREFIX}${absPath}`;
}

export function useVillageAwarePath(absPath: string): string {
  const { pathname } = useLocation();
  return withVillagePrefix(pathname, absPath);
}

/**
 * True when the current route is the village hub or any of its modal-over-
 * village children (eg. /keepers-village/profile, /keepers-village/players/:id).
 * Use this when component behavior should branch on "am I inside the village
 * trunk?" — e.g. layout/background tweaks, link rewriting decisions.
 */
export function useInVillage(): boolean {
  const { pathname } = useLocation();
  return pathname === VILLAGE_PREFIX || pathname.startsWith(`${VILLAGE_PREFIX}/`);
}
