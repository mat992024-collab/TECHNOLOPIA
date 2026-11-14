// أنواع بيانات الشركة والشركاء وسجل العمليات

export type PartnerId = 'mohamed' | 'tarek';

export interface PartnerProfile {
  id: PartnerId;
  name: string;
  roleTitle: string;
  avatarColor: string;
  skills: string[];
  strengths: string[];
  learningGoals: string[];
  availableHoursPerWeek: number;
  totalReceivedProfit: number; // إجمالي ما استلمه فعلياً
}

export interface PrivateNote {
  id: string;
  ownerId: PartnerId;
  title: string;
  content: string;
  updatedAt: string;
}

export interface CompanyMeta {
  name: string;
  tagline: string;
  foundedDate: string;
  activeGoal: string;
  quickCashTarget: number; // بالجنيه المصري
  currentMonthTarget: number;
}

export interface AuditLogItem {
  id: string;
  actor: PartnerId | 'ai_ceo';
  action: string;
  details: string;
  timestamp: string;
  category: 'finance' | 'project' | 'task' | 'crm' | 'system';
}
