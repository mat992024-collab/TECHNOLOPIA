import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  Calculator, 
  Wallet, 
  Wrench, 
  HeartHandshake, 
  User, 
  Briefcase, 
  CheckSquare, 
  Users, 
  Megaphone, 
  GraduationCap, 
  Cpu, 
  Settings,
  X,
  PieChart,
  ShieldCheck,
  Scale
} from 'lucide-react';
import { PartnerId } from '../types/company';

export type ActiveTab = 
  | 'dashboard'
  | 'ai_ceo'
  | 'governance'
  | 'profit_calculator'
  | 'finance'
  | 'dev_fund'
  | 'sadaqah_fund'
  | 'mohamed_account'
  | 'tarek_account'
  | 'projects'
  | 'tasks'
  | 'crm'
  | 'marketing'
  | 'skills'
  | 'token_monitor'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  currentPartner: PartnerId;
  pendingApprovalsCount: number;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  isCurrent?: boolean;
  highlight?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  currentPartner,
  pendingApprovalsCount
}) => {
  const navGroups: NavGroup[] = [
    {
      title: 'القيادة والاستراتيجية',
      items: [
        { id: 'dashboard' as ActiveTab, label: 'لوحة التحكم العامة', icon: LayoutDashboard },
        { id: 'ai_ceo' as ActiveTab, label: 'المدير التنفيذي الذكي', icon: Sparkles, badge: 'AI' },
        { id: 'governance' as ActiveTab, label: 'مجلس الإدارة والذاكرة', icon: Scale }
      ]
    },
    {
      title: 'النظام المالي والأرباح (25% × 4)',
      items: [
        { id: 'profit_calculator' as ActiveTab, label: 'حاسبة الأرباح التفاعلية', icon: Calculator, highlight: true },
        { 
          id: 'finance' as ActiveTab, 
          label: 'الإدارة المالية ودورات الأرباح', 
          icon: Wallet, 
          badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount}` : undefined,
          badgeColor: 'bg-amber-500'
        },
        { id: 'dev_fund' as ActiveTab, label: 'صندوق تطوير الشركة (25%)', icon: Wrench },
        { id: 'sadaqah_fund' as ActiveTab, label: 'سجل الصدقة لوجه الله (25%)', icon: HeartHandshake }
      ]
    },
    {
      title: 'حسابات الشريكين',
      items: [
        { 
          id: 'mohamed_account' as ActiveTab, 
          label: 'حساب م. محمد البحر', 
          icon: User,
          isCurrent: currentPartner === 'mohamed'
        },
        { 
          id: 'tarek_account' as ActiveTab, 
          label: 'حساب م. طارق حافظ', 
          icon: User,
          isCurrent: currentPartner === 'tarek'
        }
      ]
    },
    {
      title: 'إدارة المشروعات والعمليات',
      items: [
        { id: 'projects' as ActiveTab, label: 'المشروعات وسابقة الأعمال', icon: Briefcase },
        { id: 'tasks' as ActiveTab, label: 'المهام وتوزيع العمل', icon: CheckSquare },
        { id: 'crm' as ActiveTab, label: 'إدارة العملاء (CRM)', icon: Users },
        { id: 'marketing' as ActiveTab, label: 'التسويق وجلب العقود', icon: Megaphone }
      ]
    },
    {
      title: 'التطوير والحوكمة والتقنية',
      items: [
        { id: 'skills' as ActiveTab, label: 'تطوير مهارات الشريكين', icon: GraduationCap },
        { id: 'token_monitor' as ActiveTab, label: 'مراقبة الـ Tokens والتكلفة', icon: Cpu },
        { id: 'settings' as ActiveTab, label: 'إعدادات الشركة وFirebase', icon: Settings }
      ]
    }
  ];

  return (
    <>
      {/* خلفية معتمة للهواتف عند فتح القائمة */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside className={`
        fixed md:sticky top-0 right-0 z-50 md:z-30
        h-screen w-72 bg-slate-900 border-l border-slate-800
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
        {/* رأس القائمة للشاشات الصغيرة */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 md:hidden">
          <span className="font-bold text-white">أقسام المنصة</span>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* عناصر القائمة مع التمرير السلس */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all
                      ${isActive 
                        ? 'bg-gradient-to-l from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-900/40' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                      ${item.highlight && !isActive ? 'border border-emerald-500/30 text-emerald-300 bg-emerald-950/20' : ''}
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                      )}
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold text-white ${item.badgeColor || 'bg-indigo-600'}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* أسفل القائمة: ملخص حوكمة الشريكين */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>نظام الحوكمة المتساوي معتمد</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            صلاحيات متطابقة للشريكين | أرباح مقسمة 4 أرباع بالتساوي
          </p>
        </div>
      </aside>
    </>
  );
};
