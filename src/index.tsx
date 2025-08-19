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
serviceWorkerRegistration.register({
  onUpdate: () => {
    // Show notification when a new version is available
    console.log('TotemBound is ready to be updated.');
  },
  onSuccess: () => {
    console.log('TotemBound is now available for offline use!');
  }
});

// Add this check on app initialization
console.log('Contract addresses:', {
  game: import.meta.env.VITE_GAME_ADDRESS,
  forwarder: import.meta.env.VITE_FORWARDER_ADDRESS,
  token: import.meta.env.VITE_TOKEN_ADDRESS,
  nft: import.meta.env.VITE_NFT_ADDRESS,
  shop: import.meta.env.VITE_SHOP_ADDRESS,
  rewards: import.meta.env.VITE_REWARDS_ADDRESS,
  achievements: import.meta.env.VITE_ACHIEVEMENTS_ADDRESS,
  challenges: import.meta.env.VITE_CHALLENGES_ADDRESS,
  expeditions: import.meta.env.VITE_EXPEDITIONS_ADDRESS
});
