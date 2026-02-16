import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { posthog, isPostHogEnabled } from './clients/posthogClient';
import { PostHogProvider} from 'posthog-js/react'
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

if (isPostHogEnabled) {
  root.render(
    <React.StrictMode>
      <PostHogProvider client={posthog}>
        <App />
      </PostHogProvider>
    </React.StrictMode>
  );
}
else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// Register the service worker for PWA functionality
// Update detection and user prompt handled by ServiceWorkerDialog component
serviceWorkerRegistration.register();

