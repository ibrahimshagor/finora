import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useFinance } from '../../context/FinancialContext';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const { language } = useFinance();

  if (!isOpen) return null;

  const defaultTitle = language === 'bn' ? 'অ্যাকাউন্ট মুছুন' : 'Delete Account';
  const defaultMessage = language === 'bn'
    ? 'আপনি কি নিশ্চিত যে এই অ্যাকাউন্টটি স্থায়ীভাবে মুছে ফেলতে চান? এই অ্যাকাউন্টের সাথে যুক্ত সকল ব্যালেন্স ও লেনদেন রেকর্ড মুছে যেতে পারে।'
    : 'Are you sure you want to permanently delete this account? All associated balances and records may be affected.';

  return (
    <div
      id="delete-confirm-modal"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900/50 overflow-hidden my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-300 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              {title || defaultTitle}
            </h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3 text-xs">
          {itemName && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-400 block mb-0.5">
                {language === 'bn' ? 'নির্বাচিত আইটেম:' : 'Selected Item:'}
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {itemName}
              </p>
            </div>
          )}

          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {message || defaultMessage}
          </p>

          <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/30 p-2.5 rounded-lg border border-rose-200/50 dark:border-rose-900/30">
            ⚠️ {language === 'bn' ? 'সতর্কতা: এটি একটি অপরিবর্তনীয় প্রক্রিয়া।' : 'Warning: This action cannot be undone.'}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors text-xs"
          >
            {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
          </button>
          
          <button
            type="button"
            id="confirm-delete-action-btn"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-semibold rounded-xl transition-all shadow-sm shadow-rose-600/30 text-xs disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isLoading ? (language === 'bn' ? 'মুছে ফেলা হচ্ছে...' : 'Deleting...') : (language === 'bn' ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
