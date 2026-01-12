
export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta'
}

export enum TaskStatus {
  TODO = 'A fazer',
  IN_PROGRESS = 'Em andamento',
  DONE = 'Concluída'
}

export enum TimeEstimate {
  LITTLE = 'Pouco tempo',
  MEDIUM = 'Tempo médio',
  MUCH = 'Muito tempo'
}

export enum Feeling {
  GOOD = 'Bem',
  TIRED = 'Cansado',
  OVERWHELMED = 'Sobrecarregado'
}

export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro';
  companyId: string;
  role: UserRole;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  email: string;
  password?: string; // Simulado para o SaaS
  active: boolean;
  companyId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  deadline: string;
  priority: Priority;
  status: TaskStatus;
  notes: string;
  timeEstimate: TimeEstimate;
  createdAt: number;
  companyId: string;
}

export interface CheckIn {
  date: string;
  feeling: Feeling;
  userId: string;
}

export interface AppSettings {
  teamName: string;
  notificationsEnabled: boolean;
}

export type TabType = 'home' | 'team' | 'tasks' | 'reports' | 'settings';
