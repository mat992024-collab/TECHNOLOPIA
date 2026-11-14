import React, { useState } from 'react';
import { 
  User, 
  Wallet, 
  CheckSquare, 
  Lock, 
  Plus, 
  Coins, 
  Sparkles, 
  GraduationCap, 
  Clock, 
  Save,
  CheckCircle2
} from 'lucide-react';
import { PartnerProfile, PartnerId, PrivateNote } from '../../types/company';
import { ProfitDistributionCycle } from '../../types/finance';
import { TaskItem } from '../../types/projects';
import { AppStorageService } from '../../services/storageService';

interface PartnerAccountSectionProps {
  partnerId: PartnerId;
  partners: PartnerProfile[];
  profitCycles: ProfitDistributionCycle[];
  tasks: TaskItem[];
  onUpdatePartner?: (updated: PartnerProfile) => void;
}

export const PartnerAccountSection: React.FC<PartnerAccountSectionProps> = ({
  partnerId,
  partners,
  profitCycles,
  tasks,
  onUpdatePartner
}) => {
  const partner = partners.find(p => p.id === partnerId) || partners[0];
  
  // الملاحظات الخاصة المشفرة
  const [notes, setNotes] = useState<PrivateNote[]>(() => AppStorageService.getPrivateNotes(partnerId));
  const [newNoteTitle, setNewNoteTitle] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [showAddNote, setShowAddNote] = useState<boolean>(false);

  // حساب الأرباح المستحقة للشريك (25%)
  const approvedCycles = profitCycles.filter(c => c.status === 'approved');
  const totalEarned = approvedCycles.reduce((sum, c) => {
    return sum + (partnerId === 'mohamed' ? c.mohamedShare : c.tarekShare);
  }, 0);

  const totalReceived = partner.totalReceivedProfit || 0;
  const balanceRemaining = Math.max(0, totalEarned - totalReceived);

  // مهام هذا الشريك
  const myTasks = tasks.filter(t => t.assignedTo === partnerId || t.assignedTo === 'both');

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle || !newNoteContent) return;

    const newNote: PrivateNote = {
      id: `note-${Date.now()}`,
      ownerId: partnerId,
      title: newNoteTitle,
      content: newNoteContent,
      updatedAt: new Date().toISOString()
    };

    AppStorageService.savePrivateNote(newNote);
    setNotes(prev => [newNote, ...prev]);
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowAddNote(false);
  };

  return (
    <div className="space-y-6">
      
      {/* بطاقة الشريك التعريفية */}
      <div className={`p-6 rounded-2xl border shadow-xl bg-gradient-to-r ${
        partnerId === 'mohamed' 
          ? 'from-blue-950 via-slate-900 to-slate-900 border-blue-500/30' 
          : 'from-emerald-950 via-slate-900 to-slate-900 border-emerald-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${partner.avatarColor} flex items-center justify-center text-white font-black text-2xl shadow-lg`}>
              {partnerId === 'mohamed' ? 'م' : 'ط'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">{partner.name}</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                  شريك مؤسس متساوي الصلاحيات
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{partner.roleTitle}</p>
            </div>
          </div>

          <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-3 self-start sm:self-auto text-xs">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-slate-400 block text-[10px]">الوقت المخصص للشركة:</span>
              <span className="font-bold text-white">{partner.availableHoursPerWeek} ساعة أسبوعياً</span>
            </div>
          </div>
        </div>
      </div>

      {/* المؤشرات المالية الخاصة بالشريك */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-xs font-bold text-slate-400 block">إجمالي أرباحك المستحقة (25%)</span>
          <span className="text-2xl font-black text-white mt-2 block">
            {totalEarned.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-slate-400">تراكمي من جميع الدورات المعتمدة</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-md">
          <span className="text-xs font-bold text-slate-400 block">المبالغ المسجلة كـ مستلمة</span>
          <span className="text-2xl font-black text-emerald-400 mt-2 block">
            {totalReceived.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-slate-400">تم استلامها نقداً / بنكياً خارج التطبيق</span>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 to-emerald-950/30 shadow-md">
          <span className="text-xs font-bold text-slate-400 block">الرصيد المتبقي لك وفق السجلات</span>
          <span className="text-2xl font-black text-emerald-400 mt-2 block">
            {balanceRemaining.toLocaleString()} ج.م
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">مستحق الصرف للشريك</span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* الملاحظات والمذكرات الشخصية المشفرة (خاصة جداً) */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-base font-bold text-white">ملاحظاتي وأفكاري الخاصة</h2>
                <span className="text-[10px] text-slate-400 block">
                  مساحة مشفرة خاصة بك لا يراها الشريك الآخر
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowAddNote(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ملاحظة جديدة</span>
            </button>
          </div>

          {/* إضافة ملاحظة جديدة */}
          {showAddNote && (
            <form onSubmit={handleSaveNote} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="عنوان الملاحظة..."
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
              />
              <textarea
                rows={3}
                required
                placeholder="اكتب أفكارك أو خططك السرية هنا..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddNote(false)}
                  className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg"
                >
                  حفظ في الملاحظات الخاصة
                </button>
              </div>
            </form>
          )}

          {/* قائمة الملاحظات */}
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{note.title}</h3>
                  <span className="text-[10px] text-slate-400">{new Date(note.updatedAt).toLocaleDateString('ar-EG')}</span>
                </div>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* المهارات والمهام المباشرة */}
        <div className="space-y-6">
          
          {/* المهارات ونقاط القوة */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              <span>المهارات ونقاط القوة الحالية</span>
            </h2>

            <div className="flex flex-wrap gap-2">
              {partner.skills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-semibold">
                  {skill}
                </span>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 block">نقاط القوة التنافسية:</span>
              <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
                {partner.strengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* المهام المعينة لك */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <span>المهام المعينة لك ({myTasks.length})</span>
              </h2>
            </div>

            <div className="space-y-2 text-xs">
              {myTasks.map((task) => (
                <div key={task.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">{task.title}</span>
                    <span className="text-[10px] text-slate-400">التسليم: {task.dueDate}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {task.status === 'completed' ? 'مكتملة' : 'قيد العمل'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
