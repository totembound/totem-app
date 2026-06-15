import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_PUBLIC_POSTHOG_KEY!;
const POSTHOG_HOST = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;
const POSTHOG_AUTOCAPTURE = import.meta.env.VITE_PUBLIC_POSTHOG_AUTOCAPTURE === 'true';
const isPostHogEnabled = !!POSTHOG_KEY && !!POSTHOG_HOST;

if (isPostHogEnabled) {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: POSTHOG_AUTOCAPTURE,
    capture_pageview: false, // manually captured in usePageViews
  });
}

export { posthog, isPostHogEnabled };
