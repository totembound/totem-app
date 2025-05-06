import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { posthog, isPostHogEnabled } from "../clients/posthogClient";

function normalizePath(pathname: string): string {
    if (pathname === '/') return '/';
    return pathname.replace(/\/+$/, ''); // remove trailing slash
}

export function usePageViews() {
  const location = useLocation();

  useEffect(() => {
    if (!posthog) return;
    if (!isPostHogEnabled) return;

    const normalizedPath = normalizePath(location.pathname);

    posthog.capture("$pageview", {
      path: normalizedPath,
      url: window.location.href,
    });
  }, [location]);
}
