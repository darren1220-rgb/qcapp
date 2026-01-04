
export interface Task {
  id: string;
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  description: string;
}

export interface AnalysisResult {
  reportDate: string;
  totalDurationMinutes: number;
  tasks: Task[];
  summary: string;
  efficiencyScore: number;
  suggestions: string[];
}

export enum TaskCategory {
  INSPECTION = "抽檢/檢驗",
  DOCUMENTATION = "文件作業/SOP",
  ADMIN = "行政/會議",
  LAB_WORK = "實驗室/微生物",
  COMMUNICATION = "溝通/聯絡",
  OTHERS = "其他"
}
