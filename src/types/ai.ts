import { PartnerId } from './company';

export type AiMode = 'advisor' | 'execution';

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'ai_ceo';
  senderPartner?: PartnerId;
  text: string;
  timestamp: string;
  mode: AiMode;
  isOpportunityCard?: boolean;
  opportunityData?: MarketOpportunity;
  suggestedAction?: {
    type: 'create_task' | 'create_project' | 'create_client' | 'record_transaction';
    payload: any;
    confirmed: boolean;
  };
}

export interface MarketOpportunity {
  id: string;
  title: string;
  targetAudience: string;
  demandLevel: 'high' | 'very_high' | 'medium';
  expectedDeliveryDays: number;
  priceRange: string;
  profitMarginPercent: number;
  whyFastCash: string;
  requiredSkills: string[];
}

export interface TokenUsageStats {
  totalCalls: number;
  estimatedTokensUsed: number;
  estimatedCostUsd: number;
  tokenSaverSavedPercent: number;
  lastCallTimestamp: string;
  activeModel: string;
}
