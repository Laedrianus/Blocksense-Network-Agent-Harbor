export enum Step {
  SystemCheck = 1,
  SelectAgent,
  Setup,
  ApiKey,
  CreateTask,
  Timeline,
  ParallelTasks,
  TaskMonitor,
  Summary
}

export enum CheckState {
  Pending,
  Success,
  Error,
  Installing,
}

export interface SystemStatus {
  git: CheckState;
  docker: CheckState;
  vscode: CheckState;
  nix: CheckState;
  ah?: CheckState;
  dockerError: string | null;
  os: string | undefined;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

export interface TaskDetails {
  branchName: string;
  description: string;
  pushToRemote: boolean;
  yoloMode?: boolean;
  platform?: string;
}

export interface TaskFile {
  filename: string;
  content: string;
}

export interface Task {
  id: string;
  branch: string;
  agent: string;
  description: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'pending';
  createdAt: number;
  completedAt?: number;
  parentTaskId?: string;
  logs?: LogEntry[];
}

export interface Snapshot {
  id: string;
  taskId: string;
  timestamp: number;
  message: string;
  filesChanged?: number;
}

export interface Timeline {
  taskId: string;
  snapshots: Snapshot[];
  currentSnapshotId?: string;
}
