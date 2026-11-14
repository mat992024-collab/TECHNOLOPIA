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
  Sparkles,
  Bot,
  Edit3,
  Save,
  X,
  Layers,
  Globe,
  RefreshCw,
  TrendingUp,
  Code
} from 'lucide-react';

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);
import { ProjectItem, ProjectStatus } from '../../types/projects';
import { PartnerId } from '../../types/company';
import { AiCeoService, ProjectAiReviewResult } from '../../services/aiCeoService';

interface ProjectsSectionProps {
  projects: ProjectItem[];
  currentPartner: PartnerId;
  onAddProject: (project: Omit<ProjectItem, 'id'>) => void;
  onUpdateStatus: (projectId: string, status: ProjectStatus) => void;
  onUpdateProject?: (project: ProjectItem) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  currentPartner,
  onAddProject,
  onUpdateStatus,
  onUpdateProject
}) => {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'delivered' | 'quick_cash'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // حالة استشارة ومراجعة Gemini للمشروع
  const [reviewingProject, setReviewingProject] = useState<ProjectItem | null>(null);
  const [aiReviewData, setAiReviewData] = useState<ProjectAiReviewResult | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState<boolean>(false);

  // حالة تعديل رابط GitHub
  const [editingRepoProject, setEditingRepoProject] = useState<ProjectItem | null>(null);
  const [tempGithubUrl, setTempGithubUrl] = useState<string>('');

  // حالات إضافة مشروع
  const [name, setName] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [category, setCategory] = useState<ProjectItem['category']>('restaurant_pos');
  const [budget, setBudget] = useState<number>(0);
  const [directCost, setDirectCost] = useState<number>(0);
  const [leadPartner, setLeadPartner] = useState<PartnerId | 'both'>('both');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [scopeSummary, setScopeSummary] = useState<string>('');
  const [isQuickCash, setIsQuickCash] = useState<boolean>(true);
  const [newGithubUrl, setNewGithubUrl] = useState<string>('https://github.com/mat992024-collab/TECHNOLOPIA');

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
      isQuickCash,
      githubUrl: newGithubUrl,
      techStack: ['React', 'TypeScript', 'TailwindCSS']
    });

    setShowAddModal(false);
    setName('');
    setClientName('');
    setBudget(0);
    setDirectCost(0);
    setScopeSummary('');
    setNewGithubUrl('https://github.com/mat992024-collab/TECHNOLOPIA');
  };

  const openAiReview = async (project: ProjectItem) => {
    setReviewingProject(project);
    setIsLoadingReview(true);
    setAiReviewData(null);

    try {
      const review = await AiCeoService.reviewProjectWithGemini(project);
      setAiReviewData(review);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingReview(false);
    }
  };

  const handleSaveReviewToProject = () => {
    if (!reviewingProject || !aiReviewData || !onUpdateProject) return;

    const updated: ProjectItem = {
      ...reviewingProject,
      aiReview: `${aiReviewData.architectureCritique}\n\nخطة الـ SaaS: ${aiReviewData.microSaasPlan}`
    };

    onUpdateProject(updated);
    setReviewingProject(updated);
  };

  const handleSaveGithubUrl = () => {
    if (!editingRepoProject || !onUpdateProject) return;

    const updated: ProjectItem = {
      ...editingRepoProject,
      githubUrl: tempGithubUrl.trim()
    };

    onUpdateProject(updated);
    setEditingRepoProject(null);
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
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">المشروعات وسابقة الأعمال</h1>
                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-bold flex items-center gap-1">
                  <GithubIcon className="w-3 h-3" />
                  <span>GitHub Connected</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                ربط مشاريع وأنظمة الشركة بمستودعات GitHub، مع مراجعة معمارية الكود وخطط تحويلها إلى Micro-SaaS عبر Gemini.
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

              {/* أوسمة التقنيات (Tech Stack) */}
              {proj.techStack && proj.techStack.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {proj.techStack.map((tech, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-800/80 text-slate-300 text-[10px] font-mono rounded-md border border-slate-700/60">
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              {/* روابط GitHub والديمو اللايف */}
              <div className="flex items-center gap-2 pt-1">
                {proj.githubUrl ? (
                  <a
                    href={proj.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-mono border border-slate-800 transition-all"
                    title={proj.githubUrl}
                  >
                    <GithubIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>مستودع GitHub</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      setEditingRepoProject(proj);
                      setTempGithubUrl('https://github.com/mat992024-collab/TECHNOLOPIA');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-[11px] border border-dashed border-slate-700 transition-all"
                  >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span>ربط بـ GitHub</span>
                  </button>
                )}

                {proj.githubUrl && (
                  <button
                    onClick={() => {
                      setEditingRepoProject(proj);
                      setTempGithubUrl(proj.githubUrl || '');
                    }}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800"
                    title="تعديل رابط المستودع"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* معلومات العميل والمسؤول */}
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

            {/* الأرقام المالية ونسبة الإنجاز وزر مراجعة Gemini */}
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

              {/* زر مراجعة واستشارة Gemini للمشروع */}
              <button
                onClick={() => openAiReview(proj)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-pink-600/20 hover:from-indigo-600/30 hover:to-pink-600/30 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-indigo-500/30 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
                <span>مراجعة واستشارة Gemini للمشروع</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* نافذة استشارة ومراجعة Gemini للمشروع */}
      {reviewingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl">
                    <Bot className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      مراجعة واستشارة Gemini: {reviewingProject.name}
                    </h3>
                    <p className="text-xs text-indigo-400 font-mono">
                      {reviewingProject.githubUrl || 'https://github.com/mat992024-collab/TECHNOLOPIA'}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setReviewingProject(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingReview ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <p className="text-xs sm:text-sm text-slate-300 font-bold">
                  Gemini يراجع معمارية المشروع، نماذج الـ SaaS، وخطة التوسع الإقليمي...
                </p>
              </div>
            ) : aiReviewData ? (
              <div className="space-y-4 text-xs">
                {/* تقييم المعمارية */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                    <Code className="w-4 h-4" />
                    <span>1. تقييم المعمارية البرمجية وجودة الكود:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {aiReviewData.architectureCritique}
                  </p>
                </div>

                {/* خطة الـ Micro-SaaS */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>2. خطة التحويل إلى Micro-SaaS باشتراك شهري (ARR):</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {aiReviewData.microSaasPlan}
                  </p>
                </div>

                {/* فرص التوسع الإقليمي والمنافسة */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <Globe className="w-4 h-4" />
                    <span>3. فرص التوسع والمنافسة في السوق المصري والخليجي:</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {aiReviewData.regionalExpansion}
                  </p>
                </div>

                {/* خطوات التطوير العاجلة */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>4. أهم خطوات التطوير التقنية العاجلة لتجهيزه للمنافسة:</span>
                  </div>
                  <ul className="space-y-1.5 pr-4 list-disc text-slate-300">
                    {aiReviewData.immediateActionSteps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                  <button
                    onClick={() => openAiReview(reviewingProject)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>إعادة التحليل عبر Gemini</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReviewingProject(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                    >
                      إغلاق
                    </button>
                    {onUpdateProject && (
                      <button
                        onClick={handleSaveReviewToProject}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ التقرير بالمشروع</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* نافذة تعديل رابط GitHub للمشروع */}
      {editingRepoProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GithubIcon className="w-5 h-5 text-indigo-400" />
              <span>ربط مستودع GitHub لمشروع: {editingRepoProject.name}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <label className="block text-slate-300 font-bold">رابط مستودع GitHub (Repository URL):</label>
              <input
                type="url"
                value={tempGithubUrl}
                onChange={(e) => setTempGithubUrl(e.target.value)}
                placeholder="https://github.com/mat992024-collab/..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                يمكن ربط مستودع المشروع الرئيسي أو فرع محدد للمشروع لمراجعته وفحصه عبر الذكاء الاصطناعي.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRepoProject(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveGithubUrl}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-md"
              >
                حفظ الرابط
              </button>
            </div>
          </div>
        </div>
      )}

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

              <div>
                <label className="block text-slate-300 font-bold mb-1">رابط GitHub للمشروع:</label>
                <input
                  type="text"
                  placeholder="https://github.com/mat992024-collab/..."
                  value={newGithubUrl}
                  onChange={(e) => setNewGithubUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
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
