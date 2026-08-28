import React from 'react';
import { useFinance } from '../../context/FinancialContext';

interface PrivacyAmountProps {
  amount: number;
  prefix?: string;
  suffix?: string;
  showSign?: boolean;
  className?: string;
  decimals?: number;
  highlightNegative?: boolean;
}

export const PrivacyAmount: React.FC<PrivacyAmountProps> = ({
  amount = 0,
  prefix,
  suffix,
  showSign = false,
  className = '',
  decimals = 0,
  highlightNegative = false,
}) => {
  const { privacyMode, currencySymbol } = useFinance();

  if (privacyMode) {
    return <span className={`font-mono tracking-widest ${className}`}>••••••</span>;
  }

  const numericAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const sign = showSign && numericAmount > 0 ? '+' : '';
  const formatted = Math.abs(numericAmount).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const displayPrefix = prefix !== undefined ? prefix : currencySymbol;
  const isNeg = numericAmount < 0;

  return (
    <span
      className={`${highlightNegative && isNeg ? 'text-rose-600 dark:text-rose-400' : ''} ${className}`}
    >
      {isNeg ? '-' : sign}
      {displayPrefix}
      {formatted}
      {suffix || ''}
    </span>
  );
};
