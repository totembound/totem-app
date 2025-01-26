import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// stamp version to create a file diff when version changes
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const version = `${process.env.REACT_APP_VERSION}`;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Add this check on app initialization
console.log('Contract addresses:', {
  game: process.env.REACT_APP_GAME_ADDRESS,
  forwarder: process.env.REACT_APP_FORWARDER_ADDRESS,
  token: process.env.REACT_APP_TOKEN_ADDRESS,
  nft: process.env.REACT_APP_NFT_ADDRESS
});
