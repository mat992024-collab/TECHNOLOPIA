import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Sparkles, 
  AlertTriangle, 
  Menu, 
  TrendingUp, 
  Bell, 
  BellRing, 
  CheckCircle2, 
  RefreshCw,
  ShieldCheck,
  Lock,
  Key,
  X,
  LogOut
} from 'lucide-react';
import { PartnerProfile, PartnerId, CompanyMeta } from '../types/company';
import { NotificationService } from '../services/notificationService';
import { AuthService, AuthenticatedPartner } from '../services/authService';

interface NavbarProps {
  currentPartner: PartnerId;
  partners: PartnerProfile[];
  companyMeta: CompanyMeta;
  pendingApprovalsCount: number;
  onPartnerSwitch: (newPartner: PartnerId) => void;
  onOpenCeo: () => void;
  onToggleSidebar: () => void;
  isFirebaseActive: boolean;
  onRefresh?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPartner,
  companyMeta,
  pendingApprovalsCount,
  onPartnerSwitch,
  onOpenCeo,
  onToggleSidebar,
  onRefresh
}) => {
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [showNotifToast, setShowNotifToast] = useState<boolean>(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState<boolean>(false);

  // حالات التوثيق وتسجيل الدخول الآمن للشريكين
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [targetLoginPartner, setTargetLoginPartner] = useState<PartnerId>(currentPartner);
  const [secretInput, setSecretInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [authSession, setAuthSession] = useState<AuthenticatedPartner | null>(() => AuthService.getCurrentPartner());

  useEffect(() => {
    return AuthService.subscribe((session) => {
      setAuthSession(session);
      if (session && session.partnerId !== currentPartner) {
        onPartnerSwitch(session.partnerId);
      }
    });
  }, [currentPartner, onPartnerSwitch]);

  const handlePerformLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!secretInput.trim()) {
      setAuthError('يرجى إدخال كلمة المرور أو رمز PIN الخاص بالشريك');
      return;
    }

    const res = await AuthService.loginPartner(targetLoginPartner, secretInput.trim());
    if (res.success) {
      onPartnerSwitch(targetLoginPartner);
      setShowAuthModal(false);
      setSecretInput('');
    } else {
      setAuthError(res.error || 'فشل التحقق من هوية الشريك');
    }
  };

  useEffect(() => {
    setNotifPermission(NotificationService.getPermission());
  }, []);

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsManualRefreshing(false), 600);
  };

  useEffect(() => {
    setNotifPermission(NotificationService.getPermission());
  }, []);

  const handleToggleNotifications = async () => {
    if (notifPermission === 'granted') {
      NotificationService.sendNotification('الإشعارات نشطة ومفعلة بالفعل! 🔔', {
        body: 'أنت جاهز لاستلام تنبيهات المهام والمواعيد المحددة في وقتها.'
      });
      setShowNotifToast(true);
      setTimeout(() => setShowNotifToast(false), 3000);
      return;
    }

    const granted = await NotificationService.requestPermission();
    setNotifPermission(granted ? 'granted' : 'denied');
    if (granted) {
      setShowNotifToast(true);
      setTimeout(() => setShowNotifToast(false), 3500);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/90 px-3 sm:px-6 py-2.5 sm:py-3 shadow-md">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto">
        
        {/* الشعار واسم الشركة */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            onClick={onToggleSidebar}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 md:hidden transition-colors"
            title="القائمة الكاملة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white font-black text-base sm:text-xl shrink-0">
              T
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-lg text-white tracking-wide">Tecnolobia</span>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  AI CEO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden md:block">
                مقر الإدارة المشتركة بين م. محمد وم. طارق
              </p>
            </div>
          </div>
        </div>

        {/* مؤشر الهدف المالي (يظهر في الشاشات الكبيرة فقط) */}
        <div className="hidden xl:flex items-center gap-2.5 bg-slate-950/70 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-slate-300">هدف الكاش الشهري:</span>
          <span className="font-bold text-emerald-400">
            {companyMeta.currentMonthTarget.toLocaleString()} ج.م
          </span>
        </div>

        {/* الجانب الأيسر: الإشعارات، الشريك، والمدير الذكي */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* زر جرس إشعارات الهاتف والمهام */}
          <button
            onClick={handleToggleNotifications}
            className={`p-2 rounded-xl border transition-all relative ${
              notifPermission === 'granted'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
            title={notifPermission === 'granted' ? 'إشعارات المهام مفعلة على هاتفك ولابتوبك' : 'اضغط لتفعيل إشعارات المهام المباشرة'}
          >
            {notifPermission === 'granted' ? (
              <BellRing className="w-4 h-4 text-emerald-400 animate-pulse" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            {notifPermission !== 'granted' && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>

          {/* زر التحديث السريع للابتوب والكمبيوتر */}
          <button
            onClick={handleManualRefresh}
            className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40 hover:bg-slate-700/80 transition-all cursor-pointer"
            title="تحديث البيانات لحظياً (أو اسحب للأسفل بالماوس / التاتش)"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isManualRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* تنبيه دورات الأرباح المعلقة إن وجدت */}
          {pendingApprovalsCount > 0 && (
            <div 
              className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold"
              title="توجد دورات أرباح بانتظار الاعتماد المزدوج"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-bounce" />
              <span className="hidden sm:inline">{pendingApprovalsCount} دورة معلقة</span>
              <span className="sm:hidden font-black text-amber-400">{pendingApprovalsCount}</span>
            </div>
          )}

          {/* هوية الشريك الموثقة ونظام الحوكمة الصارم */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setTargetLoginPartner(currentPartner === 'mohamed' ? 'tarek' : 'mohamed');
                setShowAuthModal(true);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm bg-slate-950 border-slate-800 hover:border-indigo-500/50"
              title="اضغط للتحقق الأمني أو تبديل الحساب بكلمة السر / PIN"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${currentPartner === 'mohamed' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
              <span className="text-white text-[11px] sm:text-xs">
                {currentPartner === 'mohamed' ? 'م. محمد البحر' : 'م. طارق حافظ'}
              </span>
              <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 font-mono">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">موثق</span>
              </span>
              <Lock className="w-3 h-3 text-slate-500" />
            </button>
          </div>

          {/* زر استشارة المدير الذكي في الشاشات الكبيرة */}
          <button
            onClick={onOpenCeo}
            className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>المدير الذكي</span>
          </button>

        </div>

      </div>

      {/* نافذة التحقق من هوية الشريك (Authentication Modal) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">توثيق هوية الشريك والمصادقة</h3>
                  <p className="text-[11px] text-slate-400">حماية الصلاحيات والقرارات المالية الحساسة</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError('');
                  setSecretInput('');
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePerformLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">الشريك المطلوب تسجيل الدخول بحسابه:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetLoginPartner('mohamed')}
                    className={`p-2.5 rounded-xl font-bold text-center border transition-all ${
                      targetLoginPartner === 'mohamed'
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    م. محمد البحر
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetLoginPartner('tarek')}
                    className={`p-2.5 rounded-xl font-bold text-center border transition-all ${
                      targetLoginPartner === 'tarek'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    م. طارق حافظ
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">كلمة المرور / رمز PIN الخاص بالشريك:</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={secretInput}
                    onChange={(e) => setSecretInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  (الرمز الافتراضي المعتمد للشريكين: 2026 أو كلمة سر الحساب)
                </span>
              </div>

              {authError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[11px] font-bold">
                  {authError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    setAuthError('');
                    setSecretInput('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md"
                >
                  تأكيد الدخول
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* رسالة تأكيد تفعيل الإشعارات */}
      {showNotifToast && (
        <div className="absolute top-16 right-4 sm:right-6 z-50 bg-slate-900 border border-emerald-500/50 p-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs text-white animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>تم تفعيل إشعارات الهاتف بنجاح! ستصلك تنبيهات المهام والمواعيد فورياً.</span>
        </div>
      )}
    </header>
  );
};
