import React from 'react';
import { Wallet } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';

export const WalletButton: React.FC = () => {
  const { connect, comingSoon } = useUser();

  return (
    <button
      onClick={connect}
      disabled={comingSoon}
      className={`flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg
        hover:bg-purple-700 transition-colors font-medium ${comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Wallet size={18} />
      Connect Wallet
    </button>
  );
};