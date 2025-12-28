export type Platform = "Instagram" | "LinkedIn" | "TikTok" | "X";

export interface BrandProfile {
  name: string;
  mission: string;
  tone: string;
  pillars: string[];
  hashtags: string[];
  callToAction: string;
  primaryAudience: string;
}

export interface Campaign {
  id: string;
  title: string;
  objective: string;
  audience: string;
  offer: string;
  platforms: Platform[];
  timeline: {
    start: string;
    end: string;
  };
}

export interface ContentIdea {
  id: string;
  campaignId: string;
  headline: string;
  hook: string;
  angle: string;
  formats: Platform[];
  supportingPoints: string[];
  recommendedVisual: string;
  suggestedCta: string;
  createdAt: string;
}

export type PipelineStage = "ideas" | "drafts" | "scheduled" | "published";

export interface ContentDraft {
  id: string;
  ideaId: string;
  campaignId: string;
  platform: Platform;
  caption: string;
  hashtags: string[];
  assetBrief: string;
  schedule: string;
  stage: PipelineStage;
  metrics?: {
    impressions: number;
    engagements: number;
  };
  createdAt?: string;
}

export interface AgentEvent {
  id: string;
  timestamp: string;
  label: string;
  details: string;
  tone: "info" | "success" | "warning";
}

export interface AgentState {
  brand: BrandProfile;
  campaigns: Campaign[];
  ideas: ContentIdea[];
  drafts: ContentDraft[];
  events: AgentEvent[];
}
