import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Coins, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  UserCheck, 
  Filter,
  Sparkles
} from 'lucide-react';
import { ProjectItem, ProjectStatus } from '../../types/projects';
import { PartnerId } from '../../types/company';

interface ProjectsSectionProps {
  projects: ProjectItem[];
  currentPartner: PartnerId;
  onAddProject: (project: Omit<ProjectItem, 'id'>) => void;
  onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  currentPartner,
  onAddProject,
  onUpdateStatus
}) => {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'delivered' | 'quick_cash'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [name, setName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [category, setCategory] = useState<ProjectItem['category']>('restaurant_pos');
  const [budget, setBudget] = useState<number>(0);
  const [directCost, setDirectCost] = useState<number>(0);
  const [leadPartner, setLeadPartner] = useState<PartnerId | 'both'>('both');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [scopeSummary, setScopeSummary] = useState<string>('');
  const [isQuickCash, setIsQuickCash] = useState<boolean>(true);

  const filtered = projects.filter(p => {
    if (filter === 'in_progress') return p.status === 'in_progress';
    if (filter === 'delivered') return p.status === 'delivered';
    if (filter === 'quick_cash') return p.isQuickCash;
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !clientName || budget <= 0) return;

    onAddProject({
      name,
      clientName,
      category,
      status: 'in_progress',
      budget,
      directCost,
      expectedProfit: Math.max(0, budget - directCost),
      collectedAmount: 0,
      leadPartner,
      startDate: new Date().toISOString().split('T')[0],
      deliveryDate: deliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      progressPercent: 10,
      scopeSummary,
      isQuickCash
    });

    setShowAddModal(false);
    setName('');
    setClientName('');
    setBudget(0);
    setDirectCost(0);
    setScopeSummary('');
  };

  return (
    <div className="space-y-6">
      
      {/* رأس القسم */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">المشروعات وسابقة الأعمال</h1>
              <p className="text-xs text-slate-300 mt-1">
                متابعة تنفيذ مشروعات الشركة، التكاليف المباشرة، الأرباح المتوقعة، ومبادرات الكاش السريع.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>مشروع جديد</span>
        </button>
      </div>

      {/* شريط الفلاتر */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          كافة المشاريع ({projects.length})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${filter === 'in_progress' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          قيد التنفيذ
        </button>
        <button
          onClick={() => setFilter('quick_cash')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${filter === 'quick_cash' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-emerald-400 hover:text-white'}`}
        >
          مبادرات الكاش السريع ⚡
        </button>
        <button
          onClick={() => setFilter('delivered')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${filter === 'delivered' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          تم التسليم
        </button>
      </div>

      {/* شبكة المشاريع */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((proj) => (
          <div key={proj.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-indigo-500/40 transition-all shadow-md flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-white text-sm sm:text-base leading-snug">{proj.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                  proj.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {proj.status === 'delivered' ? 'تم التسليم' : 'قيد العمل'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {proj.scopeSummary}
              </p>

              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                <div className="flex justify-between">
                  <span>العميل:</span>
                  <span className="text-white font-semibold">{proj.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span>المسؤول:</span>
                  <span className="text-indigo-400 font-bold">
                    {proj.leadPartner === 'mohamed' ? 'م. محمد البحر' : proj.leadPartner === 'tarek' ? 'م. طارق حافظ' : 'الشريكان معاً'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>موعد التسليم:</span>
                  <span className="text-slate-300">{proj.deliveryDate}</span>
                </div>
              </div>
            </div>

            {/* الأرقام المالية ونسبة الإنجاز */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">قيمة العقد:</span>
                  <span className="text-sm font-black text-white">{proj.budget.toLocaleString()} ج.م</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">المحصل فعلياً:</span>
                  <span className="text-xs font-bold text-emerald-400">{proj.collectedAmount.toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* شريط الإنجاز */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-semibold">
                  <span>نسبة الإنجاز:</span>
                  <span>{proj.progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all"
                    style={{ width: `${proj.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة إضافة مشروع جديد */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              <span>إضافة مشروع جديد للشركة</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المشروع:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: نظام كاشير لمطعم..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم العميل:</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المسؤول عن المشروع:</label>
                  <select
                    value={leadPartner}
                    onChange={(e) => setLeadPartner(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="both">كلا الشريكين (مشترك)</option>
                    <option value="mohamed">م. محمد البحر</option>
                    <option value="tarek">م. طارق حافظ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">قيمة التعاقد (ج.م):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={budget || ''}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تكلفة التنفيذ المباشرة (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={directCost || ''}
                    onChange={(e) => setDirectCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">موعد التسليم المتفق عليه:</label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملخص نطاق العمل والمخرجات:</label>
                <textarea
                  rows={2}
                  value={scopeSummary}
                  onChange={(e) => setScopeSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md"
                >
                  إضافة المشروع
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
