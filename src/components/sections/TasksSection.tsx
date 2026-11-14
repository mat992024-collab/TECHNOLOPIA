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
  Calendar
} from 'lucide-react';
import { TaskItem, TaskPriority, TaskStatus } from '../../types/projects';
import { PartnerId } from '../../types/company';

interface TasksSectionProps {
  tasks: TaskItem[];
  currentPartner: PartnerId;
  onAddTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  tasks,
  currentPartner,
  onAddTask,
  onUpdateTaskStatus
}) => {
  const [filter, setFilter] = useState<'all' | 'mine' | 'urgent' | 'completed'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<PartnerId | 'both'>(currentPartner);
  const [priority, setPriority] = useState<TaskPriority>('urgent');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState<string>('15:00');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);

  const filteredTasks = tasks.filter(t => {
    if (filter === 'mine') return t.assignedTo === currentPartner || t.assignedTo === 'both';
    if (filter === 'urgent') return t.priority === 'urgent' && t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    onAddTask({
      title,
      description,
      assignedTo,
      priority,
      status: 'todo',
      dueDate,
      dueTime: dueTime || undefined,
      isPrivate,
      createdBy: currentPartner
    });

    setShowAddModal(false);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* رأس القسم */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">إدارة المهام وتوزيع العمل اليومي</h1>
              <p className="text-xs text-slate-300 mt-1">
                توزيع المهام بإنصاف مع تحديد المواعيد والساعات الدقيقة وإرسال إشعارات الهاتف المباشرة.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إسناد مهمة جديدة</span>
        </button>
      </div>

      {/* شريط الفلاتر */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${filter === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          كافة المهام ({tasks.length})
        </button>
        <button
          onClick={() => setFilter('mine')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${filter === 'mine' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          مهامي المباشرة
        </button>
        <button
          onClick={() => setFilter('urgent')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${filter === 'urgent' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-rose-400 hover:text-white'}`}
        >
          العاجلة والحرجة ⚡
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${filter === 'completed' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
        >
          المكتملة ✓
        </button>
      </div>

      {/* قائمة المهام */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            لا توجد مهام في هذا التصنيف حالياً.
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className={`p-4 sm:p-5 bg-slate-900 rounded-2xl border transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                task.status === 'completed' 
                  ? 'border-emerald-500/20 bg-slate-950/60 opacity-80' 
                  : task.priority === 'urgent' 
                    ? 'border-rose-500/40 hover:border-rose-500' 
                    : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-bold text-sm ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-white'}`}>
                    {task.title}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                    task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' :
                    task.priority === 'high' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {task.priority === 'urgent' ? 'عاجل جداً' : task.priority === 'high' ? 'أولوية عالية' : 'عادي'}
                  </span>
                  {task.isPrivate && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                      <Lock className="w-2.5 h-2.5" /> خاص
                    </span>
                  )}
                </div>

                {task.description && (
                  <p className="text-slate-300 text-xs leading-relaxed">{task.description}</p>
                )}

                <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap">
                  <span>
                    المسؤول: <strong className="text-indigo-400">{task.assignedTo === 'mohamed' ? 'المهندس محمد البحر' : task.assignedTo === 'tarek' ? 'المهندس طارق حافظ' : 'الشريكان معاً'}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>تاريخ التسليم: <strong className="text-slate-200">{task.dueDate}</strong></span>
                    {task.dueTime && (
                      <span className="text-amber-300 font-bold mr-1">(الساعة {task.dueTime})</span>
                    )}
                  </span>
                  {task.completedAt && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>أُنجزت بنجاح</span>
                    </span>
                  )}
                </div>
              </div>

              {/* أزرار تغيير الحالة */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800 w-full sm:w-auto justify-end">
                <button
                  onClick={() => onUpdateTaskStatus(task.id, 'todo')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-colors ${task.status === 'todo' ? 'bg-slate-700 text-white' : 'bg-slate-950 text-slate-400'}`}
                >
                  قيد الانتظار
                </button>
                <button
                  onClick={() => onUpdateTaskStatus(task.id, 'in_progress')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold transition-colors ${task.status === 'in_progress' ? 'bg-amber-600 text-slate-950' : 'bg-slate-950 text-slate-400'}`}
                >
                  شغال فيها
                </button>
                <button
                  onClick={() => onUpdateTaskStatus(task.id, 'completed')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${task.status === 'completed' ? 'bg-emerald-600 text-white shadow' : 'bg-slate-950 text-slate-400 hover:text-emerald-400'}`}
                >
                  تمت ✓
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* نافذة إضافة مهمة جديدة بتوقيت وساعة محددة */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <span>إسناد مهمة جديدة بوقت وإشعار محدد</span>
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">عنوان المهمة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تجهيز عقد نظام كاشير مطعم..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">تفاصيل التنفيذ وما هو المطلوب بدقة:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب المعايير المطلوب تحقيقها..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المسؤول عن التنفيذ:</label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="mohamed">المهندس محمد البحر</option>
                    <option value="tarek">المهندس طارق حافظ</option>
                    <option value="both">الشريكان معاً (مشترك)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">درجة الأولوية:</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="urgent">عاجل جداً (كاش سريع)</option>
                    <option value="high">أولوية عالية</option>
                    <option value="medium">متوسط</option>
                    <option value="low">منخفض</option>
                  </select>
                </div>
              </div>

              {/* تاريخ وساعة التسليم الدقيقة لإرسال الإشعار */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">تاريخ التسليم:</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الساعة المحددة (تنبيه الإشعار):</label>
                  <input
                    type="time"
                    required
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none"
                  />
                </div>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-md"
                >
                  حفظ المهمة وتفعيل التنبيه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
