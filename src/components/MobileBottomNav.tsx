import React from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  Sparkles, 
  Briefcase, 
  Menu,
  Coins
} from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenMore: () => void;
  pendingApprovalsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMore,
  pendingApprovalsCount
}) => {
  const isHome = activeTab === 'dashboard';
  const isProfit = activeTab === 'profit_calculator' || activeTab === 'finance';
  const isAi = activeTab === 'ai_ceo';
  const isProjects = activeTab === 'projects' || activeTab === 'tasks';
  const isMore = !isHome && !isProfit && !isAi && !isProjects;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 pt-1.5 pb-safe shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* 1. الرئيسية */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isHome ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">الرئيسية</span>
        </button>

        {/* 2. الأرباح */}
        <button
          onClick={() => onSelectTab('profit_calculator')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl relative transition-all ${
            isProfit ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">الأرباح</span>
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          )}
        </button>

        {/* 3. المدير الذكي (الزر الأوسط البارز) */}
        <button
          onClick={() => onSelectTab('ai_ceo')}
          className="flex flex-col items-center justify-center -mt-4 relative group"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all transform ${
            isAi 
              ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white scale-110 shadow-indigo-500/50 ring-2 ring-indigo-400' 
              : 'bg-gradient-to-tr from-slate-800 to-indigo-900 text-indigo-300 shadow-slate-950/80 border border-indigo-500/30'
          }`}>
            <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
          </div>
          <span className={`text-[10px] mt-1 font-bold ${isAi ? 'text-indigo-400' : 'text-slate-400'}`}>
            المدير الذكي
          </span>
        </button>

        {/* 4. المشاريع */}
        <button
          onClick={() => onSelectTab('projects')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isProjects ? 'text-emerald-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Briefcase className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">المشاريع</span>
        </button>

        {/* 5. المزيد */}
        <button
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
            isMore ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] leading-tight">المزيد</span>
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>

      </div>
    </nav>
  );
};
