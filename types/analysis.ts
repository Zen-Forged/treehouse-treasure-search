// types/analysis.ts

export type AnalysisStepId =
  | "uploading"
  | "identifying"
  | "refining"
  | "searching_comps"
  | "analyzing_market"
  | "finalizing";

export type AnalysisStepStatus = "waiting" | "active" | "complete";

export interface AnalysisMessage {
  id: string;
  stepId: AnalysisStepId;
  title: string;
  detail?: string;
  status: AnalysisStepStatus;
}

export interface AnalysisState {
  messages: AnalysisMessage[];
  currentStep: AnalysisStepId;
  isComplete: boolean;
  identifiedItem?: string;
  identifiedTitle?: string;  // populated as soon as identify API resolves
  confidence?: "strong" | "likely" | "low";
  searchQuery?: string;
  compCount?: number;
  priceRange?: { low: number; high: number };
  medianPrice?: number;
}
