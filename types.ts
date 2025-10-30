export enum Step {
  SystemCheck = 1,
  SelectAgent,
  Setup,
  ApiKey,
  CreateTask,
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
  dockerError?: string | null;
  os?: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

export interface TaskDetails {
    branchName: string;
    description: string;
    pushToRemote: boolean;
}

export interface TaskFile {
  filename: string;
  content: string;
}
