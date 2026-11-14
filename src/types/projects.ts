import { PartnerId } from './company';

export type ProjectStatus = 'planning' | 'in_progress' | 'review' | 'delivered' | 'on_hold';

export interface ProjectItem {
  id: string;
  name: string;
  clientName: string;
  category: 'restaurant_pos' | 'print_erp' | 'school_pos' | 'mobile_app' | 'portfolio' | 'qr_menu' | 'custom_web';
  status: ProjectStatus;
  budget: number;             // قيمة التعاقد بالجنيه
  directCost: number;         // تكلفة التنفيذ المتوقعة
  expectedProfit: number;     // الربح المتوقع
  collectedAmount: number;    // ما تم تحصيله فعلياً حتى الآن
  leadPartner: PartnerId | 'both';
  startDate: string;
  deliveryDate: string;
  progressPercent: number;    // 0 - 100
  scopeSummary: string;
  liveUrl?: string;
  isQuickCash: boolean;       // هل المشروع ضمن مبادرات الكاش السريع؟
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed';

export interface TaskItem {
  id: string;
  projectId?: string;
  projectTitle?: string;
  title: string;
  description: string;
  assignedTo: PartnerId | 'both';
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;           // YYYY-MM-DD
  dueTime?: string;          // HH:mm (مثال: 14:30)
  completedAt?: string;      // تاريخ ووقت الإنجاز الدقيق
  isPrivate: boolean;        // مهمة خاصة بصاحبها أم مشتركة
  createdBy: PartnerId | 'both';
  createdAt: string;
}
