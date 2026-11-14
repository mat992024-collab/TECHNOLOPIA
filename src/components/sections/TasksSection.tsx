import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Filter,
  Lock,
  Calendar,
  Sparkles,
  ArrowRight,
  ListOrdered,
  Layers,
  ChevronDown,
  Check,
  Flame,
  Award
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus, TaskStep } from '../../types/projects';
import { PartnerId } from '../../types/company';

interface TasksSectionProps {
  tasks: TaskItem[];
  currentPartner: PartnerId;
  onAddTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateTask?: (updatedTask: TaskItem) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  tasks,
  currentPartner,
  onAddTask,
  onUpdateTaskStatus,
  onUpdateTask
}) => {
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState<PartnerId | 'all'>(currentPartner);
  const [activeTab, setActiveTab] = useState<'stream' | 'all' | 'urgent' | 'completed'>('stream');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(null);

  // حقول إضافة مهمة جديدة
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<PartnerId | 'both'>(currentPartner);
  const [priority, setPriority] = useState<TaskPriority>('urgent');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState<string>('15:00');
  const [rawSteps, setRawSteps] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  // تصفية المهام حسب الشريك
  const partnerTasks = tasks.filter(t => {
    if (selectedPartnerFilter === 'all') return true;
    return t.assignedTo === selectedPartnerFilter || t.assignedTo === 'both';
  });

  // مهام غير مكتملة مرتبة تسلسلياً
  const pendingTasks = partnerTasks
    .filter(t => t.status !== 'completed')
    .sort((a, b) => (a.order || 99) - (b.order || 99));

  // المهمة النشطة الحالية (التي تظهر في الواجهة)
  const currentActiveTask = pendingTasks[0] || null;

  // المهمة القادمة في الجدول التسلسلي (تنتظر انتهاء الحالية)
  const nextUpcomingTask = pendingTasks[1] || null;

  // المهام المكتملة
  const completedTasks = partnerTasks
    .filter(t => t.status === 'completed')
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

  // التبديل بين الخطوات الفرعية داخل المهمة
  const handleToggleStep = (task: TaskItem, stepId: string) => {
    if (!task.steps) return;
    const updatedSteps = task.steps.map(s => 
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );

    const allCompleted = updatedSteps.every(s => s.completed);
    const updatedTask: TaskItem = {
      ...task,
      steps: updatedSteps,
      status: allCompleted ? 'in_progress' : task.status
    };

    if (onUpdateTask) {
      onUpdateTask(updatedTask);
    }
  };

  // إنجاز المهمة الحالية والانتقال للمهمة التالية فوراً
  const handleCompleteCurrentTask = (taskId: string) => {
    setCelebratingTaskId(taskId);
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    setTimeout(() => {
      onUpdateTaskStatus(taskId, 'completed');
      setCelebratingTaskId(null);
    }, 450);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // استخراج الخطوات من النص السطري
    const parsedSteps: TaskStep[] = rawSteps
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map((text, idx) => ({
        id: `step-${Date.now()}-${idx}`,
        text,
        completed: false
      }));

    const nextOrder = (pendingTasks[pendingTasks.length - 1]?.order || 0) + 1;

    onAddTask({
      title,
      description,
      assignedTo,
      priority,
      status: 'todo',
      dueDate,
      dueTime: dueTime || undefined,
      steps: parsedSteps.length > 0 ? parsedSteps : undefined,
      order: nextOrder,
      isPrivate,
      createdBy: currentPartner
    });

    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setRawSteps('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* رأس القسم */}
      <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">المسار التنفيذي للمهام المتتابعة</h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                  <ListOrdered className="w-3 h-3" />
                  <span>خطوات تفصيلية + تسلسل آلي</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                تنفيذ المهام خطوة بخطوة؛ وبمجرد وضع علامة الإنجاز تختفي المهمة لتظهر المهمة القادمة فوراً.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedPartnerFilter('mohamed')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedPartnerFilter === 'mohamed' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              م. محمد البحر
            </button>
            <button
              onClick={() => setSelectedPartnerFilter('tarek')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedPartnerFilter === 'tarek' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              م. طارق حافظ
            </button>
            <button
              onClick={() => setSelectedPartnerFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                selectedPartnerFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              الكل
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إسناد مهمة بخطوات</span>
          </button>
        </div>
      </div>

      {/* شريط الفلاتر والتبويبات */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-bold overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('stream')}
          className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'stream' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>المسار المتتابع (المهمة الحالية والقادمة)</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'all' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>كافة المهام النشطة ({pendingTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('urgent')}
          className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'urgent' 
              ? 'border-rose-500 text-rose-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-rose-400" />
          <span>العاجلة والحرجة</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-2 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'completed' 
              ? 'border-teal-500 text-teal-400' 
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-teal-400" />
          <span>سجل المهام المكتملة ({completedTasks.length})</span>
        </button>
      </div>

      {/* 1. عرض المسار المتتابع (المهمة النشطة الحالية + المهمة القادمة) */}
      {activeTab === 'stream' && (
        <div className="space-y-6">
          {currentActiveTask ? (
            <div className="space-y-6">
              
              {/* بطاقة المهمة النشطة الحالية (Hero Active Card) */}
              <div className={`p-6 sm:p-7 rounded-3xl border-2 transition-all shadow-2xl relative overflow-hidden ${
                celebratingTaskId === currentActiveTask.id 
                  ? 'scale-95 opacity-40 bg-emerald-950 border-emerald-400' 
                  : 'bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border-indigo-500/50 shadow-indigo-950/30'
              }`}>
                
                {/* شارة الترتيب والحالة */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/30 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>المهمة النشطة الحالية #{currentActiveTask.order || 1}</span>
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                      currentActiveTask.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {currentActiveTask.priority === 'urgent' ? 'عاجلة جداً ⚡' : 'أولوية عالية'}
                    </span>

                    <span className="text-xs text-slate-400">
                      المسؤول: <strong className="text-white">{currentActiveTask.assignedTo === 'mohamed' ? 'م. محمد البحر' : currentActiveTask.assignedTo === 'tarek' ? 'م. طارق حافظ' : 'الشريكان معاً'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>تاريخ التسليم: <strong className="text-white">{currentActiveTask.dueDate}</strong></span>
                    {currentActiveTask.dueTime && (
                      <span className="text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {currentActiveTask.dueTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* عنوان المهمة وتفاصيلها */}
                <div className="space-y-3 mb-6">
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                    {currentActiveTask.title}
                  </h2>
                  {currentActiveTask.description && (
                    <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                      {currentActiveTask.description}
                    </p>
                  )}
                </div>

                {/* قائمة الخطوات التنفيذية التفصيلية (Step-by-Step Checklist) */}
                {currentActiveTask.steps && currentActiveTask.steps.length > 0 && (
                  <div className="space-y-3 mb-6 bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                        <span>خطوات التنفيذ الواضحة للمهمة:</span>
                      </span>
                      <span className="text-slate-400 font-semibold">
                        {currentActiveTask.steps.filter(s => s.completed).length} من {currentActiveTask.steps.length} خطوات منجزة
                      </span>
                    </div>

                    {/* شريط تقدم الخطوات */}
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-3">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                        style={{ 
                          width: `${(currentActiveTask.steps.filter(s => s.completed).length / currentActiveTask.steps.length) * 100}%` 
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      {currentActiveTask.steps.map((step, idx) => (
                        <div 
                          key={step.id}
                          onClick={() => handleToggleStep(currentActiveTask, step.id)}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                            step.completed 
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300 line-through' 
                              : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-850'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                            step.completed ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-600 bg-slate-950'
                          }`}>
                            {step.completed && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <span className="text-xs font-medium leading-relaxed flex-1">
                            {idx + 1}. {step.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* زر وضع علامة الإنجاز واختفاء المهمة وظهور القادمة */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>عند إنجاز المهمة، ستنتقل للأرشيف وتفتح المهمة القادمة فوراً</span>
                  </div>

                  <button
                    onClick={() => handleCompleteCurrentTask(currentActiveTask.id)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-2xl text-sm font-black shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>وضع علامة: تم إنجاز المهمة بالكامل ✓</span>
                  </button>
                </div>
              </div>

              {/* بطاقة المهمة القادمة التمهيدية (Next Upcoming Task Preview) */}
              {nextUpcomingTask && (
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-dashed border-slate-800 space-y-3 opacity-80 hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-slate-800 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block">المهمة القادمة في الجدول #{nextUpcomingTask.order || 2}</span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-200">{nextUpcomingTask.title}</h3>
                      </div>
                    </div>
                    <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 font-bold">
                      ستظهر تلقائياً فور إنهاء المهمة الحالية ⏳
                    </span>
                  </div>

                  {nextUpcomingTask.steps && nextUpcomingTask.steps.length > 0 && (
                    <div className="p-3 bg-slate-950/50 rounded-xl text-xs text-slate-400 space-y-1">
                      <span className="font-semibold text-slate-300 block mb-1">الخطوات المعدة مسبقاً ({nextUpcomingTask.steps.length} خطوات):</span>
                      {nextUpcomingTask.steps.slice(0, 3).map((st, i) => (
                        <div key={st.id} className="truncate text-[11px] text-slate-400">
                          • {st.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 space-y-3">
              <Award className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">رائع! تم إنجاز كافة المهام المجدولة لهذا المسار 🏆</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                لا توجد مهام معلقة لهذا الشريك حالياً. يمكنك إسناد مهمة جديدة بخطواتها المحددة أو الاطلاع على أرشيف المهام المكتملة.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>إسناد مهمة جديدة</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. عرض كافة المهام النشطة أو العاجلة أو المكتملة */}
      {activeTab !== 'stream' && (
        <div className="space-y-3">
          {(activeTab === 'completed' ? completedTasks : partnerTasks.filter(t => {
            if (activeTab === 'urgent') return t.priority === 'urgent' && t.status !== 'completed';
            return t.status !== 'completed';
          })).length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              لا توجد مهام في هذا التصنيف حالياً.
            </div>
          ) : (
            (activeTab === 'completed' ? completedTasks : partnerTasks.filter(t => {
              if (activeTab === 'urgent') return t.priority === 'urgent' && t.status !== 'completed';
              return t.status !== 'completed';
            })).map((task) => (
              <div 
                key={task.id} 
                className={`p-5 bg-slate-900 rounded-2xl border transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
                  task.status === 'completed' 
                    ? 'border-emerald-500/20 bg-slate-950/60' 
                    : task.priority === 'urgent' 
                      ? 'border-rose-500/40 hover:border-rose-500' 
                      : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-bold text-sm sm:text-base ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                      {task.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                      task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {task.priority === 'urgent' ? 'عاجل جداً' : task.priority === 'high' ? 'أولوية عالية' : 'عادي'}
                    </span>
                  </div>

                  {task.description && (
                    <p className="text-slate-300 text-xs leading-relaxed">{task.description}</p>
                  )}

                  {/* الخطوات إن وجدت */}
                  {task.steps && task.steps.length > 0 && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
                      <span className="font-semibold text-slate-300">الخطوات:</span>
                      <span>{task.steps.filter(s => s.completed).length} من {task.steps.length} منجزة</span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap pt-1 border-t border-slate-800/60">
                    <span>
                      المسؤول: <strong className="text-indigo-400">{task.assignedTo === 'mohamed' ? 'المهندس محمد البحر' : task.assignedTo === 'tarek' ? 'المهندس طارق حافظ' : 'الشريكان معاً'}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>الموعد: <strong className="text-slate-200">{task.dueDate}</strong></span>
                      {task.dueTime && <span className="text-amber-300 font-bold">({task.dueTime})</span>}
                    </span>
                    {task.completedAt && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>أُنجزت في: {new Date(task.completedAt).toLocaleDateString('ar-EG')}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  {task.status !== 'completed' ? (
                    <button
                      onClick={() => handleCompleteCurrentTask(task.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>إنجاز وأرشفة</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateTaskStatus(task.id, 'todo')}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                    >
                      إعادة فتح المهمة
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* نافذة إضافة مهمة جديدة مع الخطوات التفصيلية */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <span>إسناد مهمة جديدة بخطوات واضحة ومحددة</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">عنوان المهمة الرئيسي:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تجهيز ديمو كاشير مطعم فريش..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المسؤول عن التنفيذ:</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="mohamed">المهندس محمد البحر (تقني)</option>
                    <option value="tarek">المهندس طارق حافظ (أعمال)</option>
                    <option value="both">الشريكان معاً</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">درجة الأولوية:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="urgent">عاجل جداً (تنفيذ فوري)</option>
                    <option value="high">أولوية عالية</option>
                    <option value="medium">متوسط</option>
                    <option value="low">منخفض</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ التسليم:</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">ساعة التسليم المحددة:</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">شرح وتفاصيل المهمة:</label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر للهدف من المهمة..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-bold">الخطوات التنفيذية التفصيلية (خطوة في كل سطر):</label>
                  <span className="text-[10px] text-emerald-400">ستظهر كـ Checklist تفاعلي</span>
                </div>
                <textarea
                  rows={4}
                  placeholder={`اكتب كل خطوة في سطر منفصل:\nخطوة 1: تنظيف الكود القديم\nخطوة 2: اختبار قاعدة البيانات\nخطوة 3: تجربة الطباعة`}
                  value={rawSteps}
                  onChange={(e) => setRawSteps(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-xs font-mono resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
                >
                  إسناد المهمة في المسار التنفيذي
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
