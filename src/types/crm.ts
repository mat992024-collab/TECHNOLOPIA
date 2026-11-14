import { PartnerId } from './company';

// مراحل البيع الـ 11 المعتمدة
export type PipelineStage = 
  | 'lead'              // 1. عميل محتمل
  | 'contacted'         // 2. تم التواصل
  | 'interested'        // 3. مهتم
  | 'needs_defined'     // 4. تم تحديد احتياجه
  | 'quote_sent'        // 5. تم إرسال عرض سعر
  | 'negotiation'       // 6. تفاوض
  | 'agreed'            // 7. تم الاتفاق
  | 'in_progress'       // 8. قيد التنفيذ
  | 'delivered'         // 9. تم التسليم
  | 'retained'          // 10. عميل مستمر
  | 'lost';             // 11. صفقة مفقودة

export interface ClientItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  businessType: string;
  source: 'facebook' | 'whatsapp' | 'referral' | 'direct_sales' | 'freelance' | 'website';
  stage: PipelineStage;
  requestedService: string;
  expectedBudget: number;
  assignedTo: PartnerId | 'both';
  lastContactDate: string;
  nextFollowUpDate: string;
  dealValue: number;
  notes: string;
  createdAt: string;
}
