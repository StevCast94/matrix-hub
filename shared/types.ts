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
