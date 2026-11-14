import React, { useState } from 'react';
import { 
  Settings, 
  Database, 
  Key, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Building2,
  RefreshCw
} from 'lucide-react';
import { CompanyMeta } from '../../types/company';
import { getSavedFirebaseConfig, saveFirebaseConfig, isFirebaseConnected } from '../../services/firebase';
import { getSavedGeminiKey, saveGeminiKey } from '../../services/aiCeoService';
import { AppStorageService } from '../../services/storageService';

interface SettingsSectionProps {
  companyMeta: CompanyMeta;
  onUpdateMeta: (meta: CompanyMeta) => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  companyMeta,
  onUpdateMeta
}) => {
  // إعدادات فايربيس
  const savedFb = getSavedFirebaseConfig();
  const [apiKey, setApiKey] = useState<string>(savedFb?.apiKey || '');
  const [authDomain, setAuthDomain] = useState<string>(savedFb?.authDomain || '');
  const [projectId, setProjectId] = useState<string>(savedFb?.projectId || '');
  const [storageBucket, setStorageBucket] = useState<string>(savedFb?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState<string>(savedFb?.messagingSenderId || '');
  const [appId, setAppId] = useState<string>(savedFb?.appId || '');

  // مفتاح Gemini API
  const [geminiKey, setGeminiKey] = useState<string>(() => getSavedGeminiKey());
  const [showKey, setShowKey] = useState<boolean>(false);
  const [geminiSaved, setGeminiSaved] = useState<boolean>(false);

  // إعدادات الشركة
  const [companyName, setCompanyName] = useState<string>(companyMeta.name);
  const [tagline, setTagline] = useState<string>(companyMeta.tagline);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(companyMeta.currentMonthTarget);
  const [metaSaved, setMetaSaved] = useState<boolean>(false);

  const handleSaveFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !projectId) {
      alert('يرجى إدخال apiKey و projectId على الأقل.');
      return;
    }

    saveFirebaseConfig({
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId
    });
  };

  const handleSaveGemini = (e: React.FormEvent) => {
    e.preventDefault();
    saveGeminiKey(geminiKey);
    setGeminiSaved(true);
    setTimeout(() => setGeminiSaved(false), 3000);
  };

  const handleSaveCompanyMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CompanyMeta = {
      ...companyMeta,
      name: companyName,
      tagline,
      currentMonthTarget: monthlyTarget
    };
    onUpdateMeta(updated);
    AppStorageService.saveCompanyMeta(updated);
    setMetaSaved(true);
    setTimeout(() => setMetaSaved(false), 3000);
  };

  const isConnected = isFirebaseConnected();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* رأس القسم */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-slate-800 text-slate-300 rounded-xl border border-slate-700">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">إعدادات المنصة والربط السحابي</h1>
              <p className="text-xs text-slate-300 mt-1">
                تهيئة بيانات Firebase ومفتاح Gemini API لتفعيل المزامنة اللحظية والذكاء الاصطناعي الحي.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-950 border border-slate-800">
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
          <span>{isConnected ? 'قاعدة بيانات فايربيس متصلة' : 'وضع العمل المحلي النشط'}</span>
        </div>
      </div>

      {/* قسم إعدادات الشركة وأهداف الكاش */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-400" />
          <span>بيانات وهوية الشركة</span>
        </h2>

        <form onSubmit={handleSaveCompanyMeta} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">اسم الشركة:</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">هدف الكاش الشهري (ج.م):</label>
              <input
                type="number"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">الشعار اللفظي (Slogan):</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {metaSaved && <span className="text-emerald-400 font-bold">تم حفظ بيانات الشركة بنجاح!</span>}
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md ml-auto"
            >
              حفظ هوية الشركة
            </button>
          </div>
        </form>
      </div>

      {/* قسم ربط Gemini API */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <span>مفتاح Gemini API (Google AI Studio)</span>
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
            مخزن محلياً ومشفر
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          يمكنكم الحصول على مفتاح API مجاني تماماً من موقع <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-bold">Google AI Studio</a>. عند إدخاله هنا، سيتحدث معكم المدير التنفيذي الذكي بنماذج Gemini 2.0 Flash السريعة مباشرة. إذا لم تدخل المفتاح، سيعمل المدير الذكي بالمحرك التنفيذي المحلي المدمج.
        </p>

        <form onSubmit={handleSaveGemini} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">مفتاح API Key:</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showKey ? 'إخفاء' : 'إظهار'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {geminiSaved && <span className="text-emerald-400 font-bold">تم حفظ المفتاح بنجاح!</span>}
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl font-black shadow-md ml-auto"
            >
              حفظ وتفعيل المفتاح
            </button>
          </div>
        </form>
      </div>

      {/* قسم ربط Firebase Firestore السحابي */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>إعدادات سحابة Firebase (Firestore & Auth)</span>
          </h2>
          <span className="text-[10px] text-slate-400">باقة Spark المجانية (50k قراءة يومياً)</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
          <span className="font-bold text-white block">كيف تحصل على هذه البيانات في دقيقة؟</span>
          <p className="text-slate-400">
            ادخل على <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-bold">Firebase Console</a>، أنشئ مشروعاً مجانياً باسم tecnolobia، أضف تطبيق ويب (Web App)، وانسخ البيانات أدناه.
          </p>
        </div>

        <form onSubmit={handleSaveFirebase} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-bold mb-1">API Key:</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Project ID:</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="tecnolobia-app"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Auth Domain:</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="tecnolobia-app.firebaseapp.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Storage Bucket:</label>
              <input
                type="text"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="tecnolobia-app.appspot.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">Messaging Sender ID:</label>
              <input
                type="text"
                value={messagingSenderId}
                onChange={(e) => setMessagingSenderId(e.target.value)}
                placeholder="123456789..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">App ID:</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>حفظ وإعادة الاتصال بالسحابة</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
