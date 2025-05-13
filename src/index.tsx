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
  onUpdate: (registration) => {
    // Show notification when a new version is available
    console.log('TotemBound is ready to be updated.');
  },
  onSuccess: () => {
    console.log('TotemBound is now available for offline use!');
  }
});

// Add this check on app initialization
console.log('Contract addresses:', {
  game: process.env.REACT_APP_GAME_ADDRESS,
  forwarder: process.env.REACT_APP_FORWARDER_ADDRESS,
  token: process.env.REACT_APP_TOKEN_ADDRESS,
  nft: process.env.REACT_APP_NFT_ADDRESS,
  shop: process.env.REACT_APP_SHOP_ADDRESS,
  rewards: process.env.REACT_APP_REWARDS_ADDRESS,
  achievements: process.env.REACT_APP_ACHIEVEMENTS_ADDRESS,
  challenges: process.env.REACT_APP_CHALLENGES_ADDRESS,
  expeditions: process.env.REACT_APP_EXPEDITIONS_ADDRESS
});
