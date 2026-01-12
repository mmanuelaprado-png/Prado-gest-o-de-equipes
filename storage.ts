
import { Member, Task, CheckIn, AppSettings, User } from './types';

const KEYS = {
  CURRENT_USER: 'prado_session',
  REGISTRY: 'prado_user_registry',
  MEMBERS: 'prado_members_',
  TASKS: 'prado_tasks_',
  CHECKINS: 'prado_checkins_',
  SETTINGS: 'prado_settings_'
};

export const Storage = {
  getRegistry: (): any[] => JSON.parse(localStorage.getItem(KEYS.REGISTRY) || '[]'),
  
  addToRegistry: (entry: any) => {
    const reg = Storage.getRegistry();
    if (!reg.find(r => r.email === entry.email)) {
      reg.push(entry);
      localStorage.setItem(KEYS.REGISTRY, JSON.stringify(reg));
    }
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  },

  saveSession: (user: User | null) => {
    if (user) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(KEYS.CURRENT_USER);
  },

  getMembers: (companyId: string): Member[] => {
    return JSON.parse(localStorage.getItem(KEYS.MEMBERS + companyId) || '[]');
  },

  saveMembers: (companyId: string, members: Member[]) => {
    localStorage.setItem(KEYS.MEMBERS + companyId, JSON.stringify(members));
    members.forEach(m => {
      if (m.email && m.password) {
        Storage.addToRegistry({
          email: m.email,
          password: m.password,
          name: m.name,
          role: 'member',
          companyId: m.companyId,
          id: m.id
        });
      }
    });
  },

  getTasks: (companyId: string): Task[] => {
    return JSON.parse(localStorage.getItem(KEYS.TASKS + companyId) || '[]');
  },

  saveTasks: (companyId: string, tasks: Task[]) => {
    localStorage.setItem(KEYS.TASKS + companyId, JSON.stringify(tasks));
  },

  getCheckIns: (companyId: string): CheckIn[] => {
    return JSON.parse(localStorage.getItem(KEYS.CHECKINS + companyId) || '[]');
  },

  saveCheckIns: (companyId: string, checkins: CheckIn[]) => {
    localStorage.setItem(KEYS.CHECKINS + companyId, JSON.stringify(checkins));
  },

  getSettings: (companyId: string): AppSettings => {
    return JSON.parse(localStorage.getItem(KEYS.SETTINGS + companyId) || JSON.stringify({
      teamName: 'Prado Gestão',
      notificationsEnabled: true
    }));
  },

  saveSettings: (companyId: string, settings: AppSettings) => {
    localStorage.setItem(KEYS.SETTINGS + companyId, JSON.stringify(settings));
  },

  logout: () => {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
};
