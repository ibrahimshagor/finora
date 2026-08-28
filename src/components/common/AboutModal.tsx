import React from 'react';
import { X, ExternalLink, ShieldCheck, Sparkles, Building, Heart, CheckCircle2, Code2, Globe } from 'lucide-react';
import { APP_INFO } from '../../lib/constants';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="about-app-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-tr from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10">
            <Sparkles className="w-48 h-48 text-emerald-400" />
          </div>

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                F
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  {APP_INFO.name}
                </h2>
                <p className="text-xs text-emerald-400 font-semibold tracking-wide mt-0.5">
                  {APP_INFO.tagline}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 text-[11px] font-medium text-emerald-200">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              Version {APP_INFO.version}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              Zero Double-Counting Engine
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              AI Smart Advisor
            </span>
          </div>
        </div>

        {/* Body Info */}
        <div className="p-6 sm:p-8 space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2">
              FINORA পরিচিতি ও মূল দর্শন
            </h3>
            <p>
              FINORA একটি সম্পূর্ণ ব্যক্তিগত আর্থিক ব্যবস্থাপনা প্ল্যাটফর্ম। দৈনন্দিন জীবনের টাকা-পয়সার নিখুঁত হিসাব, বিভিন্ন ধরনের ব্যাংক/ক্যাশ অ্যাকাউন্ট, আয়, ব্যয়, অভ্যন্তরীণ স্থানান্তর, ঋণ, বাজেট, ক্রেডিট কার্ড এবং বিনিয়োগ এক জায়গা থেকে সুচারুভাবে পরিচালনার জন্য এটি নির্মিত।
            </p>
          </div>

          {/* Strict Financial Rules */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>নির্ভুল আর্থিক গণনার নীতিমালা (Strict Integrity)</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>শূন্য ডাবল কাউন্টিং:</strong> কোনো টাকাই ভুলভাবে দুইবার হিসেবে অন্তর্ভুক্ত হয় না।</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>স্থানান্তর (Transfers):</strong> এক অ্যাকাউন্ট থেকে অন্যটিতে স্থানান্তরিত হলে তা নিছক ফান্ড মুভমেন্ট, নতুন কোনো আয় বা ব্যয় নয়।</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span><strong>ঋণ ও দেনা:</strong> ধার নেওয়া বা দেওয়া নিট সম্পদ ও দায়কে প্রভাবিত করে, মাসিক আয় বা খরচকে নয়।</span>
              </li>
            </ul>
          </div>

          {/* Credits Box */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Developed by</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {APP_INFO.developedBy}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-medium">Powered by</span>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {APP_INFO.poweredBy}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/50 dark:border-emerald-900/50 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">অফিসিয়াল ওয়েবসাইট:</span>
              <a
                href={APP_INFO.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>www.tikmerk.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors shadow-xs"
          >
            বন্ধ করুন (Close)
          </button>
        </div>

      </div>
    </div>
  );
};
