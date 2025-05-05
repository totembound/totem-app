import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { posthog, isPostHogEnabled } from './clients/posthogClient';
import { PostHogProvider} from 'posthog-js/react'

// stamp version to create a file diff when version changes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const version = `${process.env.REACT_APP_VERSION}`;

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
