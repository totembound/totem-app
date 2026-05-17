import React from 'react';
import { Sparkles, Gem } from 'lucide-react';
import { useUser } from '../../contexts/UserContext';
import { useGame } from '../../contexts/GameContext';
import { formatTokenAmount, formatCompact } from '../../utils/formats';
import { CURRENCY_NAMES } from '../../config/constants';

interface CurrencyItemProps {
  Icon: React.ElementType;
  iconColor: string;
  label: string;
  value: number;
}

const CurrencyItem: React.FC<CurrencyItemProps> = ({ Icon, iconColor, label, value }) => (
  <div className="flex items-center gap-1" title={label}>
    <Icon className={`w-4 h-4 shrink-0 drop-shadow ${iconColor}`} />
    <span className="text-sm font-bold text-amber-50 tabular-nums drop-shadow sm:hidden">
      {formatCompact(value)}
    </span>
    <span className="hidden sm:inline text-sm font-bold text-amber-50 tabular-nums drop-shadow">
      {formatTokenAmount(value)}
    </span>
  </div>
);

const Divider: React.FC = () => <div className="hidden sm:block h-4 w-px bg-amber-400/30 shrink-0" />;

const RUNE_TIERS = [
  { type: 'lesser' as const, dotClass: 'bg-blue-400', textClass: 'text-blue-300' },
  { type: 'greater' as const, dotClass: 'bg-amber-400', textClass: 'text-amber-300' },
  { type: 'ancient' as const, dotClass: 'bg-purple-400', textClass: 'text-purple-300' },
];

const VillageCurrencyHUD: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { essenceBalance, gemsBalance } = useUser();
  const { runeBalances } = useGame();

  return (
    <div className={`flex items-center gap-1.5 sm:gap-3 ${className}`}>
      <CurrencyItem
        Icon={Sparkles}
        iconColor="text-amber-300"
        label={CURRENCY_NAMES.SOFT}
        value={Number(essenceBalance) || 0}
      />
      <Divider />
      <CurrencyItem
        Icon={Gem}
        iconColor="text-violet-300"
        label={CURRENCY_NAMES.PREMIUM}
        value={Number(gemsBalance) || 0}
      />
      <Divider />
      <div className="flex items-center gap-1" title="Runes (lesser / greater / ancient)">
        {RUNE_TIERS.map(({ type, dotClass, textClass }) => (
          <div key={type} className="flex items-center gap-0.5" title={`${type} rune`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
            <span className={`text-sm font-bold tabular-nums drop-shadow sm:hidden ${textClass}`}>
              {formatCompact(runeBalances[type])}
            </span>
            <span className={`hidden sm:inline text-sm font-bold tabular-nums drop-shadow ${textClass}`}>
              {formatTokenAmount(runeBalances[type])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VillageCurrencyHUD;
