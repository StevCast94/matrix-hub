// Tipos compartidos entre frontend y backend.

export type Role = 'SUPERADMIN' | 'COLLABORATOR';
export type AssistantKind = 'COSMO' | 'WANDA';
export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ApprovalLevel = 'GREEN' | 'YELLOW' | 'RED';
export type MemoryScope = 'GLOBAL' | 'USER' | 'PROJECT';

export interface CurrentUser {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  aiAssistant: AssistantKind;
  theme: string;
}

export interface ApiError {
  error: string;
}

export interface Metric {
  id: string;
  projectId: string;
  key: string;
  value: number;
  label: string | null;
  format: string | null;
  source: string;
  verifiedAt: string;
  isStale: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  url: string | null;
  domain: string | null;
  hosting: string | null;
  repoUrl: string | null;
  status: ProjectStatus;
  metricsEndpoint: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithMetrics {
  id: string;
  name: string;
  slug: string;
  url: string | null;
  status: ProjectStatus;
  hasMetricsEndpoint: boolean;
  metrics: Metric[];
}

export interface TimelineEvent {
  id: string;
  type: string;
  actorType: string;
  actorId: string | null;
  projectId: string | null;
  title: string;
  body: string | null;
  createdAt: string;
}

export interface TaskRef {
  id: string;
  name: string;
  slug?: string;
  avatarUrl?: string | null;
}

export interface Task {
  id: string;
  projectId: string | null;
  assigneeId: string | null;
  createdById: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  approvalLevel: ApprovalLevel;
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: { id: string; name: string; slug: string } | null;
  assignee?: { id: string; name: string; avatarUrl: string | null } | null;
  createdBy?: { id: string; name: string } | null;
}

export interface AgentStatus {
  id: string;
  kind: AssistantKind;
  displayName: string;
  emoji: string;
  isActive: boolean;
  lastHeartbeat: string | null;
  online: boolean;
}
