export interface Task {
  title?: string;
  description?: string;
  status?: string;
  priority?: unknown;
  owner?: unknown;
}

export interface VisibleTask extends Task {
  label: string;
}
