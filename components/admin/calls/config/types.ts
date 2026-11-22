export type CallConfigStepKey = "fields" | "stages" | "criteria" | "publish";

export type CallStatusValue = "draft" | "open" | "closed" | "archived";

export interface CallConfigSummary {
  id: string;
  title: string;
  slug: string;
  status: CallStatusValue;
  opensAtLabel: string;
  closesAtLabel: string;
}

export interface CallFieldItem {
  id: string;
  key: string;
  label: string;
  helpText: string | null;
  type: string;
  required: boolean;
  isActive: boolean;
  sectionKey: string;
  options: string[] | null;
}

export interface CallStageItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: string;
  position: number;
  isTerminal: boolean;
}

export interface CallCriterionItem {
  id: string;
  stageId: string;
  name: string;
  description: string | null;
  maxScore: number;
  weight: string;
  isArchived: boolean;
  stageName: string;
  hasScores: boolean;
}
