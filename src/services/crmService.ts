// src/services/crmService.ts
import { AuthService } from './authService';
import { PartnerId } from '../types/company';

export type CrmStage = 
  | 'NEW_LEAD'
  | 'CONTACTED'
  | 'INTERESTED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export interface CrmLeadHistoryItem {
  fromStage: string;
  toStage: string;
  changedBy: string;
  changedAt: string;
  note: string;
}

export interface CrmLead {
  id: string;
  businessName: string;
  industry: string;
  softwareNeed: string;
  source: string;
  stage: CrmStage;
  priority: 'low' | 'medium' | 'high';
  dealValueEstimate: number;
  dealProbability: number;
  assignedPartner: PartnerId | 'both';
  contactInfo: {
    contactPerson: string;
    phone: string;
    email?: string;
    city?: string;
    address?: string;
  };
  notes: string[];
  nextFollowUpDate: string;
  history: CrmLeadHistoryItem[];
  linkedTasks?: string[];
  isRealProspect: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrmAnalytics {
  totalLeads: number;
  activePipelineCount: number;
  totalPipelineValue: number;
  totalWonValue: number;
  conversionRate: number;
  wonCount: number;
  lostCount: number;
  stageBreakdown: Record<string, { count: number; totalValue: number }>;
  sourceDistribution: Record<string, number>;
  partnerPerformance: Record<string, { assignedCount: number; wonCount: number; pipelineValue: number; wonValue: number }>;
  overdueFollowUpsCount: number;
  overdueFollowUps: Array<{
    id: string;
    businessName: string;
    phone: string;
    stage: string;
    assignedPartner: string;
    nextFollowUpDate: string;
  }>;
}

export interface AiStrategyResponse {
  leadId: string;
  businessName: string;
  industry: string;
  needsAnalysis: string;
  recommendedService: string;
  suggestedPricingRange: {
    minimumEgp: number;
    recommendedEgp: number;
    maximumEgp: number;
    currency: string;
    pricingModel: string;
  };
  pricingDisclaimer: string;
  outreachPitchMessage: string;
  negotiationStrategy: string;
  status: string;
  draftId?: string;
}

export interface WhatsAppSimulationResult {
  success: boolean;
  mode: string;
  isLiveDispatched: boolean;
  leadId: string;
  businessName: string;
  recipientPhone: string;
  messageText: string;
  previewUrl: string;
  readyToCopy: boolean;
  disclaimer: string;
}

export interface FacebookSimulationResult {
  success: boolean;
  mode: string;
  isLivePublished: boolean;
  campaignTitle: string;
  targetNiche: string;
  postContent: string;
  suggestedHashtags: string[];
  budgetPlanNote: string;
  disclaimer: string;
}

export class CrmService {
  private static async getHeaders(partnerId: PartnerId): Promise<HeadersInit> {
    const token = await AuthService.getAuthBearerToken(partnerId);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'x-partner-id': partnerId
    };
  }

  /**
   * استرجاع قائمة العملاء من الخادم
   */
  static async getLeads(partnerId: PartnerId, filters?: { stage?: string; assignedPartner?: string; search?: string }): Promise<CrmLead[]> {
    try {
      const headers = await this.getHeaders(partnerId);
      const params = new URLSearchParams();
      if (filters?.stage && filters.stage !== 'all') params.set('stage', filters.stage);
      if (filters?.assignedPartner && filters.assignedPartner !== 'all') params.set('assignedPartner', filters.assignedPartner);
      if (filters?.search) params.set('search', filters.search);

      const res = await fetch(`/api/crm/leads?${params.toString()}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.leads || [];
    } catch {
      return [];
    }
  }

  /**
   * إنشاء عميل محتمل جديد
   */
  static async createLead(partnerId: PartnerId, leadData: Partial<CrmLead>): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
    try {
      const headers = await this.getHeaders(partnerId);
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers,
        body: JSON.stringify(leadData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'فشل تسجيل العميل' };
      }
      return { success: true, lead: data.lead };
    } catch (e: any) {
      return { success: false, error: e.message || 'خطأ في الاتصال بالخادم' };
    }
  }

  /**
   * ترقية مرحلة العميل
   */
  static async updateStage(partnerId: PartnerId, leadId: string, stage: CrmStage, note?: string): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
    try {
      const headers = await this.getHeaders(partnerId);
      const res = await fetch(`/api/crm/leads/${leadId}/stage`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ stage, note })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'فشل تحديث المرحلة' };
      }
      return { success: true, lead: data.lead };
    } catch (e: any) {
      return { success: false, error: e.message || 'خطأ في الاتصال' };
    }
  }

  /**
   * إضافة ملاحظة للعميل
   */
  static async addNote(partnerId: PartnerId, leadId: string, note: string): Promise<{ success: boolean; lead?: CrmLead; error?: string }> {
    try {
      const headers = await this.getHeaders(partnerId);
      const res = await fetch(`/api/crm/leads/${leadId}/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ note })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'فشل إضافة الملاحظة' };
      }
      return { success: true, lead: data.lead };
    } catch (e: any) {
      return { success: false, error: e.message || 'خطأ في الاتصال' };
    }
  }

  /**
   * جلب مؤشرات وإحصائيات لوحة المبيعات
   */
  static async getAnalytics(partnerId: PartnerId): Promise<CrmAnalytics | null> {
    try {
      const headers = await this.getHeaders(partnerId);
      const res = await fetch('/api/crm/analytics', { headers });
      if (!res.ok) return null;
      const data = await res.json();
      return data.analytics || null;
    } catch {
      return null;
    }
  }

  /**
   * استدعاء وكيل المبيعات الذكي لتحليل العميل وتقديم عرض واستراتيجية
   */
  static async generateAiStrategy(partnerId: PartnerId, leadId: string): Promise<{ success: boolean; strategy?: AiStrategyResponse; error?: string }> {
    try {
      const headers = await this.getHeaders(partnerId);
      const res = await fetch(`/api/crm/leads/${leadId}/ai-strategy`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'فشل استدعاء وكيل الذكاء الاصطناعي' };
      }
      return { success: true, strategy: data.strategy };
    } catch (e: any) {
      return { success: false, error: e.message || 'خطأ أثناء التوليد' };
    }
  }

  /**
   * إعداد محاكاة رسالة واتساب
   */
  static async simulateWhatsApp(partnerId: PartnerId, leadId: string, messageText?: string): Promise<WhatsAppSimulationResult | null> {
    try {
      const headers = await this.getHeaders(partnerId);
      const res = await fetch('/api/crm/simulate-whatsapp', {
        method: 'POST',
        headers,
        body: JSON.stringify({ leadId, messageText })
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * إعداد محاكاة منشور فيسبوك
   */
  static async simulateFacebook(partnerId: PartnerId, campaignData: { title?: string; targetNiche?: string; postBody?: string; budgetEstimate?: number }): Promise<FacebookSimulationResult | null> {
    try {
      const headers = await this.getHeaders(partnerId);
      const res = await fetch('/api/crm/simulate-facebook', {
        method: 'POST',
        headers,
        body: JSON.stringify(campaignData)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}
