import { PartnerId } from './company';

export type DecisionCategory = 'pricing' | 'investment' | 'partnership' | 'hiring' | 'policy' | 'dev_fund';

export interface StrategicDecision {
  id: string;
  title: string;
  description: string;
  category: DecisionCategory;
  proposedBy: PartnerId;
  impactSummary: string;
  status: 'pending' | 'approved' | 'rejected';
  mohamedApproved: boolean;
  mohamedApprovedAt?: string;
  tarekApproved: boolean;
  tarekApprovedAt?: string;
  createdAt: string;
}

export type MemoryCategory = 'strategy' | 'technical' | 'client' | 'pricing' | 'lesson_learned';

export interface CompanyMemoryItem {
  id: string;
  topic: string;
  category: MemoryCategory;
  content: string;
  source: string;
  addedBy: PartnerId | 'ai_ceo';
  createdAt: string;
}
