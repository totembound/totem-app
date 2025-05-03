import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { posthog, isPostHogEnabled } from "../clients/posthogClient";

export function usePageViews() {
  const location = useLocation();

  useEffect(() => {
    if (!posthog) return;
    if (!isPostHogEnabled) return;

    posthog.capture("$pageview", {
      path: location.pathname,
      url: window.location.href,
    });
  }, [location]);
}
