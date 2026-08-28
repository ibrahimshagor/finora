import React from 'react';
import { ExternalLink, ShieldCheck, Heart, Sparkles, Building } from 'lucide-react';
import { APP_INFO } from '../../lib/constants';
import { useFinance } from '../../context/FinancialContext';

export const Footer: React.FC = () => {
  const { syncStatus } = useFinance();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 pb-6 mb-6">
          
          {/* Brand Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {APP_INFO.name}
              </span>
              <span className="text-xs text-slate-400 font-normal">|</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                {APP_INFO.tagline}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              সম্পূর্ণ ব্যক্তিগত আর্থিক ব্যবস্থাপনা প্ল্যাটফর্ম। দৈনন্দিন হিসাব, বিভিন্ন অ্যাকাউন্ট, ঋণ, সঞ্চয় ও বিনিয়োগ পরিচালনা করুন এক জায়গায়।
            </p>
          </div>

          {/* Developer & Powered By Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
              <span className="text-slate-400">Developed by: </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {APP_INFO.developedBy}
              </span>
            </div>

            <a
              href={APP_INFO.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors shadow-2xs"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Powered by: <strong>{APP_INFO.poweredBy}</strong></span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>
          </div>

        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} FINORA. All rights reserved.</span>
            <span>•</span>
            <a
              href={APP_INFO.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              www.tikmerk.com
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Firestore Security Rules Guarded</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{syncStatus === 'synced' ? 'Real-time Synced' : syncStatus === 'syncing' ? 'Syncing...' : 'Local Engine Ready'}</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
