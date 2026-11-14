// src/components/sections/ProjectsHubSection.tsx
import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  FolderTree,
  FileCode,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Lock,
  Unlock,
  Sparkles,
  Bot,
  CheckCircle2,
  X,
  Layers,
  Code,
  Terminal,
  Cpu,
  TrendingUp,
  Clock,
  Eye,
  Check,
  Zap
} from 'lucide-react';
import { PartnerId } from '../../types/company';

const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

interface ProjectsHubProps {
  currentPartner: PartnerId;
}

export const ProjectsHubSection: React.FC<ProjectsHubProps> = ({ currentPartner }) => {
  const [accounts, setAccounts] = useState<any>({ account_1: { connected: false }, account_2: { connected: false } });
  const [repositories, setRepositories] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [portfolioReport, setPortfolioReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [repoDetails, setRepoDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState<boolean>(false);

  // حالة إضافة أو ربط حساب ثانٍ
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false);
  const [connectSlot, setConnectSlot] = useState<'account_1' | 'account_2'>('account_2');
  const [inputToken, setInputToken] = useState<string>('');
  const [connectError, setConnectError] = useState<string>('');

  // فلاتر المستودعات والتوصيات
  const [filterType, setFilterType] = useState<string>('all');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [recFilter, setRecFilter] = useState<string>('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = { 'x-partner-id': currentPartner };

      // 1. الحسابات
      const accRes = await fetch('/api/github/accounts', { headers });
      if (accRes.ok) {
        const d = await accRes.json();
        setAccounts(d.accounts || {});
      }

      // 2. المستودعات
      const repoRes = await fetch('/api/github/repositories', { headers });
      if (repoRes.ok) {
        const d = await repoRes.json();
        setRepositories(d.repositories || []);
      }

      // 3. التوصيات
      const recRes = await fetch('/api/github/recommendations', { headers });
      if (recRes.ok) {
        const d = await recRes.json();
        setRecommendations(d.recommendations || []);
      }

      // 4. تقرير المحفظة
      const repRes = await fetch('/api/github/portfolio-report', { headers });
      if (repRes.ok) {
        const d = await repRes.json();
        setPortfolioReport(d.report);
      }
    } catch (err) {
      console.warn('Could not fetch GitHub data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPartner]);

  // فحص تفاصيل مستودع
  const handleInspectRepo = async (repo: any) => {
    setSelectedRepo(repo);
    setIsLoadingDetails(true);
    setRepoDetails(null);
    try {
      const res = await fetch(`/api/github/repository/${repo.owner}/${repo.name}`, {
        headers: { 'x-partner-id': currentPartner }
      });
      if (res.ok) {
        const d = await res.json();
        setRepoDetails(d.details);
      }
    } catch (err) {
      console.warn('Error fetching repo details:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // تشغيل تحليل كود Gemini للمستودع
  const handleAnalyzeWithGemini = async (repo: any) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-id': currentPartner
        },
        body: JSON.stringify({ owner: repo.owner, repo: repo.name })
      });
      if (res.ok) {
        const d = await res.json();
        setAnalysisResult(d.analysis);
        // تحديث التوصيات فوراً
        fetchData();
      }
    } catch (err) {
      console.warn('Error analyzing repo:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ربط حساب
  const handleConnectAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    setConnectError('');
    try {
      const res = await fetch('/api/github/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-id': currentPartner
        },
        body: JSON.stringify({ slotId: connectSlot, token: inputToken.trim() })
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setInputToken('');
        setShowConnectModal(false);
        fetchData();
      } else {
        setConnectError(d.error || 'فشل التحقق من الرمز لدى GitHub.');
      }
    } catch (err: any) {
      setConnectError(err.message || 'خطأ في الاتصال بالخادم.');
    }
  };

  // إلغاء ربط حساب
  const handleDisconnect = async (slotId: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء ربط هذا الحساب وسحب التوكن من الخادم؟')) return;
    try {
      await fetch('/api/github/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-id': currentPartner
        },
        body: JSON.stringify({ slotId })
      });
      fetchData();
    } catch (err) {
      console.warn('Error disconnecting account:', err);
    }
  };

  // تحديث حالة التوصية
  const handleUpdateRecStatus = async (id: string, status: string) => {
    try {
      await fetch('/api/github/recommendation/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-partner-id': currentPartner
        },
        body: JSON.stringify({ id, status })
      });
      setRecommendations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      console.warn('Error updating recommendation:', err);
    }
  };

  // تصفية المستودعات
  const filteredRepos = repositories.filter(r => {
    if (filterType === 'saas' && !r.projectClassification?.isFullSaasCandidate) return false;
    if (filterType === 'private' && !r.isPrivate) return false;
    if (filterType === 'public' && r.isPrivate) return false;
    if (filterLanguage !== 'all' && r.language !== filterLanguage) return false;
    return true;
  });

  // تصفية التوصيات
  const filteredRecs = recommendations.filter(r => {
    if (recFilter === 'all') return true;
    return r.status === recFilter;
  });

  return (
    <div className="space-y-6">
      {/* 1. الترويسة الرئيسية والتحكم */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl -z-10" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-slate-950 to-indigo-950 border border-indigo-500/30 text-indigo-400 rounded-2xl shadow-inner">
              <GithubIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  مركز التحكم البرمجي ومستودعات GitHub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Read-Only Mode ✓
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                ربط حسابات الشركة، اكتشاف المستودعات، وفحص الكود المعماري والأمني عبر مستشار Gemini الذكي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {portfolioReport && (
              <button
                onClick={() => setShowPortfolioModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>تقرير المحفظة الشاملة</span>
              </button>
            )}

            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>تحديث المزامنة</span>
            </button>
          </div>
        </div>

        {/* بطاقات الحسابين المتصلين (Multi-Account Support) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          {/* الحساب 1 */}
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {accounts.account_1?.avatarUrl ? (
                <img src={accounts.account_1.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-xl border border-slate-700" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <GithubIcon className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">الحساب الرئيسي:</span>
                  {accounts.account_1?.connected ? (
                    <span className="text-xs font-bold text-emerald-400 font-mono">@{accounts.account_1.username}</span>
                  ) : (
                    <span className="text-xs text-slate-500">غير متصل</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {accounts.account_1?.connected ? (
                    <span>{accounts.account_1.displayName} • {accounts.account_1.repoCount} مستودع مصرح</span>
                  ) : (
                    <span>جاهز لربط حساب GitHub الأساسي</span>
                  )}
                </div>
              </div>
            </div>

            {accounts.account_1?.connected ? (
              <button
                onClick={() => handleDisconnect('account_1')}
                className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40"
              >
                إلغاء الربط
              </button>
            ) : (
              <button
                onClick={() => { setConnectSlot('account_1'); setShowConnectModal(true); }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
              >
                ربط الحساب
              </button>
            )}
          </div>

          {/* الحساب 2 */}
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {accounts.account_2?.avatarUrl ? (
                <img src={accounts.account_2.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-xl border border-slate-700" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                  <GithubIcon className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">الحساب الإضافي / الشريك الثاني:</span>
                  {accounts.account_2?.connected ? (
                    <span className="text-xs font-bold text-emerald-400 font-mono">@{accounts.account_2.username}</span>
                  ) : (
                    <span className="text-xs text-slate-500">غير متصل</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {accounts.account_2?.connected ? (
                    <span>{accounts.account_2.displayName} • {accounts.account_2.repoCount} مستودع</span>
                  ) : (
                    <span>يمكن ربط حساب GitHub للشريك الثاني لدمج المستودعات</span>
                  )}
                </div>
              </div>
            </div>

            {accounts.account_2?.connected ? (
              <button
                onClick={() => handleDisconnect('account_2')}
                className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg hover:bg-rose-950/40 border border-transparent hover:border-rose-800/40"
              >
                إلغاء الربط
              </button>
            ) : (
              <button
                onClick={() => { setConnectSlot('account_2'); setShowConnectModal(true); }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
              >
                ربط حساب ثانٍ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. مؤشرات الأداء الحقيقية للمحفظة البرمجية */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>المستودعات المكتشفة</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{repositories.length}</div>
          <p className="text-[10px] text-slate-400">مستودع تم دمجه بدون أي تكرار</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>مرشحة لـ Micro-SaaS</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {repositories.filter(r => r.projectClassification?.isFullSaasCandidate).length}
          </div>
          <p className="text-[10px] text-emerald-500/80">جاهزة لنماذج الاشتراكات الشهرية</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>توصيات المستشار الذكي</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">{recommendations.length}</div>
          <p className="text-[10px] text-slate-400">
            {recommendations.filter(r => r.priority === 'urgent').length} عاجلة تتطلب قراراً
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>الأمان والسلامة</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">100%</div>
          <p className="text-[10px] text-slate-400">صلاحيات قراءة فقط (Read-Only)</p>
        </div>
      </div>

      {/* 3. شريط الفلاتر واستعراض المستودعات */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-bold ml-2">نوع المشروع:</span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              الكل ({repositories.length})
            </button>
            <button
              onClick={() => setFilterType('saas')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${filterType === 'saas' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              جاهزة لـ SaaS ({repositories.filter(r => r.projectClassification?.isFullSaasCandidate).length})
            </button>
            <button
              onClick={() => setFilterType('public')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${filterType === 'public' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              مستودعات عامة
            </button>
            <button
              onClick={() => setFilterType('private')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${filterType === 'private' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              مستودعات خاصة
            </button>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            عرض {filteredRepos.length} من {repositories.length} مستودع
          </div>
        </div>

        {/* شبكة كروت المستودعات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepos.map(repo => {
            const isSaas = repo.projectClassification?.isFullSaasCandidate;

            return (
              <div
                key={repo.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between shadow-md"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                        <Code className="w-4 h-4 text-indigo-400" />
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-sm tracking-tight leading-snug hover:text-indigo-400 transition-colors">
                          {repo.name}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">@{repo.owner}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {repo.isPrivate ? (
                        <span className="p-1 rounded bg-slate-800 text-amber-400" title="مستودع خاص (Private)">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-slate-800 text-slate-400" title="مستودع عام (Public)">
                          <Unlock className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {repo.description || 'لا يوجد وصف رسمي متاح'}
                  </p>

                  {/* تصنيف المشروع ولغة البرمجة */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isSaas ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {repo.projectClassification?.label || 'وحدة برمجية'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                      {repo.language}
                    </span>
                    {repo.linkedAccounts?.length > 1 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        مشترك بالحسابين
                      </span>
                    )}
                  </div>
                </div>

                {/* شريط الإجراءات والمعاينة */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleInspectRepo(repo)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-[11px] font-bold transition-all"
                    >
                      <FolderTree className="w-3.5 h-3.5" />
                      <span>الملفات والفروع</span>
                    </button>

                    <button
                      onClick={() => handleAnalyzeWithGemini(repo)}
                      disabled={isAnalyzing}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 text-white rounded-xl text-[11px] font-bold transition-all shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>فحص Gemini</span>
                    </button>
                  </div>

                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="فتح المستودع على GitHub"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. لوحة توصيات المستشار البرمجي (Gemini Recommendations Action Board) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-tr from-amber-600 to-indigo-600 text-white rounded-xl shadow-md">
              <Bot className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                توصيات المستشار البرمجي (Gemini Code Advisor)
              </h2>
              <p className="text-xs text-slate-400">
                تشخيص المشكلات المعمارية والأمنية وفرص النمو التجاري مع الدليل والحل المقترح
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setRecFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${recFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              الكل ({recommendations.length})
            </button>
            <button
              onClick={() => setRecFilter('pending')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${recFilter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              بانتظار المراجعة ({recommendations.filter(r => r.status === 'pending').length})
            </button>
            <button
              onClick={() => setRecFilter('approved')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${recFilter === 'approved' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              معتمدة ({recommendations.filter(r => r.status === 'approved').length})
            </button>
          </div>
        </div>

        {/* قائمة التوصيات الموثقة بالدليل */}
        <div className="space-y-3">
          {filteredRecs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800/80">
              لا توجد توصيات مسجلة حالياً بهذه الفئة. انقر على "فحص Gemini" لأي مستودع لبدء التحليل.
            </div>
          ) : (
            filteredRecs.map(rec => {
              const isUrgent = rec.priority === 'urgent';
              const isApproved = rec.status === 'approved';

              return (
                <div
                  key={rec.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isUrgent 
                      ? 'bg-rose-950/10 border-rose-500/30' 
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isUrgent 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {isUrgent ? '🚨 أولوية عاجلة' : '⚡ أولوية هامة'}
                      </span>
                      <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                        {rec.projectName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {rec.isConfirmedFact ? '• حقيقة برمجية مؤكدة ✓' : '• استنتاج تحليلي محتمل'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      {isApproved ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>معتمدة من الشريك</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleUpdateRecStatus(rec.id, 'approved')}
                          className="flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-xl shadow-sm transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>اعتماد التوصية</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="font-bold text-white text-sm">{rec.issue}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 font-bold block mb-0.5">📌 الدليل والملف المستند عليه:</span>
                        <code className="text-indigo-300 font-mono text-[11px]">{rec.evidence}</code>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800/80">
                        <span className="text-slate-400 font-bold block mb-0.5">💡 الحل المقترح:</span>
                        <span className="text-emerald-300">{rec.suggestedSolution}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>الأثر المتوقع: <span className="text-slate-200">{rec.impact}</span></span>
                      {rec.effortEstimate && (
                        <span>الجهد التقديري: <span className="text-amber-400 font-bold">{rec.effortEstimate}</span></span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 5. نافذة فحص بنية الملفات والفروع للمستودع (Deep Inspector Modal) */}
      {selectedRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-indigo-950 text-indigo-400 rounded-xl border border-indigo-800/40">
                  <FolderTree className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{selectedRepo.fullName}</h3>
                  <p className="text-xs text-slate-400">بنية الملفات والفروع وآخر التعديلات</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRepo(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {isLoadingDetails ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                  <span>جاري فحص المستودع من GitHub...</span>
                </div>
              ) : repoDetails ? (
                <>
                  {/* الفروع وآخر Commits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-300">
                        <GitBranch className="w-3.5 h-3.5 text-indigo-400" />
                        <span>الفروع ({repoDetails.branches?.length || 1}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {repoDetails.branches?.map((b: string) => (
                          <span key={b} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[11px] border border-slate-800">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-300">
                        <GitCommit className="w-3.5 h-3.5 text-emerald-400" />
                        <span>آخر تحديث:</span>
                      </div>
                      <p className="text-slate-300 font-mono text-[11px] truncate">
                        {repoDetails.latestCommits?.[0]?.message || 'لا توجد رسالة كوميت'}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        بواسطة {repoDetails.latestCommits?.[0]?.author || 'غير معروف'}
                      </span>
                    </div>
                  </div>

                  {/* بنية الملفات في الجذر */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-300">
                      <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                      <span>الملفات والمجلدات الأساسية:</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[11px]">
                      {repoDetails.files?.map((f: any) => (
                        <div key={f.name} className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 text-slate-300 truncate">
                          {f.type === 'dir' ? '📁' : '📄'}
                          <span className="truncate">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* الاعتماديات المكتشفة إن وجدت */}
                  {repoDetails.packageJsonDependencies && (
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                      <span className="font-bold text-slate-300 block">📦 اعتماديات package.json:</span>
                      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                        {Object.keys(repoDetails.packageJsonDependencies.dependencies || {}).map(dep => (
                          <span key={dep} className="px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                            {dep}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRepo(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. نافذة ربط حساب GitHub جديد */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-slate-950 text-indigo-400 rounded-xl border border-slate-800">
                  <GithubIcon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">ربط حساب GitHub جديد</h3>
                  <p className="text-xs text-slate-400">{connectSlot === 'account_1' ? 'الحساب الرئيسي' : 'حساب الشريك الثاني'}</p>
                </div>
              </div>
              <button onClick={() => setShowConnectModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConnectAccount} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  أدخل Personal Access Token (صلاحيات قراءة فقط):
                </label>
                <input
                  type="password"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="ghp_..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {connectError && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-300 text-[11px]">
                  {connectError}
                </div>
              )}

              <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-500/20 text-[11px] text-slate-300 space-y-1">
                <p className="font-bold text-indigo-300">🛡️ ضمان الحماية:</p>
                <p>- الرمز يُحفظ في الخادم فقط ولا يُرسل لمتصفح العميل نهائياً.</p>
                <p>- النظام يطلب صلاحيات قراءة فقط (repo / read:user) ولا يقوم بأي تعديل أو push للكود.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!inputToken.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  توثيق وربط الحساب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. نافذة تقرير فحص Gemini التفصيلي للمستودع */}
      {analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-xl shadow-md">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">تقرير المستشار البرمجي (Gemini Analysis)</h3>
                  <p className="text-xs text-slate-400 font-mono">{analysisResult.fullName}</p>
                </div>
              </div>
              <button onClick={() => setAnalysisResult(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">تقييم المعمارية وجودة الكود</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/20 text-indigo-400">
                    Scalability: {analysisResult.scalabilityRating} / 10
                  </span>
                </div>
                <p className="text-slate-300">{analysisResult.architectureAssessment}</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>الفحص الأمني (Security Audit):</span>
                </div>
                <p className="text-slate-300">{analysisResult.securityAudit?.findings}</p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>خطة التحويل إلى Micro-SaaS:</span>
                </div>
                <p className="text-slate-300">{analysisResult.saasMonetizationPlan}</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setAnalysisResult(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                تم، إغلاق التقرير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. نافذة تقرير المحفظة الشاملة لجميع مشروعات الشركة */}
      {showPortfolioModal && portfolioReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white rounded-xl shadow-md">
                  <FileCode className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">التقرير الاستراتيجي الشامل للمحفظة البرمجية</h3>
                  <p className="text-xs text-slate-400">تحليل كود ومستودعات شركة TECHNOLOPIA</p>
                </div>
              </div>
              <button onClick={() => setShowPortfolioModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
              <div className="p-4 bg-indigo-950/30 rounded-2xl border border-indigo-500/20 text-slate-200">
                <p className="leading-relaxed">{portfolioReport.strategicSummaryText}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">المستودعات الإجمالية:</span>
                  <span className="text-base font-bold text-white">{portfolioReport.totalRepositories} مستودع</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">جاهزة كـ SaaS:</span>
                  <span className="text-base font-bold text-emerald-400">{portfolioReport.discoveredSaaSCandidates} مشروع</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block mb-0.5">توصيات حيوية:</span>
                  <span className="text-base font-bold text-amber-400">{portfolioReport.totalRecommendations} توصية</span>
                </div>
              </div>

              {portfolioReport.topPriorityProjects && (
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <span className="font-bold text-white block">🚀 أبرز مشروعات Micro-SaaS ذات العائد المرتفع:</span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    {portfolioReport.topPriorityProjects.map((p: any) => (
                      <div key={p.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                        <span className="font-bold text-indigo-300">{p.name}</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">{p.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowPortfolioModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
