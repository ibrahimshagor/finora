import React, { useState } from 'react';
import { Calculator as CalcIcon, X, Check, Delete } from 'lucide-react';

interface InAppCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyValue?: (val: number) => void;
}

export const InAppCalculator: React.FC<InAppCalculatorProps> = ({
  isOpen,
  onClose,
  onApplyValue,
}) => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (waitingForNewValue) {
      setDisplay(digit);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOp = (nextOp: string) => {
    const currentVal = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(currentVal);
    } else if (operation) {
      const result = calculate(prevValue, currentVal, operation);
      setPrevValue(result);
      setDisplay(String(result));
    }

    setWaitingForNewValue(true);
    setOperation(nextOp);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b !== 0 ? a / b : 0;
      case '%':
        return (a * b) / 100;
      default:
        return b;
    }
  };

  const handleEquals = () => {
    if (prevValue === null || !operation) return;
    const currentVal = parseFloat(display);
    const result = calculate(prevValue, currentVal, operation);
    setDisplay(String(result));
    setPrevValue(null);
    setOperation(null);
    setWaitingForNewValue(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const handleBackspace = () => {
    if (display.length === 1 || (display.length === 2 && display.startsWith('-'))) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleInsert = () => {
    const val = parseFloat(display);
    if (!isNaN(val) && onApplyValue) {
      onApplyValue(val);
      onClose();
    }
  };

  return (
    <div
      id="in-app-calculator-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
    >
      <div className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CalcIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              In-App Calculator
            </h3>
          </div>
          <button
            id="calc-close-btn"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 text-right border-b border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-400 h-4 font-mono">
            {prevValue !== null && operation ? `${prevValue} ${operation}` : ''}
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 dark:text-white truncate">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="p-3 grid grid-cols-4 gap-2">
          <button
            onClick={handleClear}
            className="p-3 font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100 transition-colors"
          >
            C
          </button>
          <button
            onClick={handleBackspace}
            className="p-3 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOp('%')}
            className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            %
          </button>
          <button
            onClick={() => handleOp('÷')}
            className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            ÷
          </button>

          <button
            onClick={() => handleDigit('7')}
            className="p-3 font-medium text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            7
          </button>
          <button
            onClick={() => handleDigit('8')}
            className="p-3 font-medium text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            8
          </button>
          <button
            onClick={() => handleDigit('9')}
            className="p-3 font-medium text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            9
          </button>
          <button
            onClick={() => handleOp('×')}
            className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            ×
          </button>

          <button
            onClick={() => handleDigit('4')}
            className="p-3 font-medium text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            4
          </button>
          <button
            onClick={() => handleDigit('5')}
            className="p-3 font-medium text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            5
          </button>
          <button
            onClick={() => handleDigit('6')}
            className="p-3 font-medium text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            6
          </button>
          <button
            onClick={() => handleOp('-')}
            className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            -
          </button>

          <button
            onClick={() => handleDigit('1')}
            className="p-3 font-medium text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            1
          </button>
          <button
            onClick={() => handleDigit('2')}
            className="p-3 font-medium text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            2
          </button>
          <button
            onClick={() => handleDigit('3')}
            className="p-3 font-medium text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            3
          </button>
          <button
            onClick={() => handleOp('+')}
            className="p-3 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            +
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="p-3 font-medium text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors col-span-2"
          >
            0
          </button>
          <button
            onClick={handleDecimal}
            className="p-3 font-medium text-slate-800 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="p-3 font-bold text-white bg-emerald-600 dark:bg-emerald-500 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            =
          </button>
        </div>

        {/* Action Button */}
        {onApplyValue && (
          <div className="p-3 pt-0">
            <button
              id="calc-apply-value-btn"
              onClick={handleInsert}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              ইনপুট বক্সে বসান (Insert {display})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
