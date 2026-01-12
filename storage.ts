
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
  getRegistry: (): any[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.REGISTRY) || '[]');
    } catch (e) {
      return [];
    }
  },
  
  addToRegistry: (entry: any) => {
    try {
      const reg = Storage.getRegistry();
      if (!reg.find(r => r.email === entry.email)) {
        reg.push(entry);
        localStorage.setItem(KEYS.REGISTRY, JSON.stringify(reg));
      }
    } catch (e) {
      console.error("Storage Error: addToRegistry", e);
    }
  },

  getCurrentUser: (): User | null => {
    try {
      const data = localStorage.getItem(KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveSession: (user: User | null) => {
    try {
      if (user) localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
      else localStorage.removeItem(KEYS.CURRENT_USER);
    } catch (e) {
      console.error("Storage Error: saveSession", e);
    }
  },

  getMembers: (companyId: string): Member[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.MEMBERS + companyId) || '[]');
    } catch (e) {
      return [];
    }
  },

  saveMembers: (companyId: string, members: Member[]) => {
    try {
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
    } catch (e) {
      console.error("Storage Error: saveMembers", e);
    }
  },

  getTasks: (companyId: string): Task[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.TASKS + companyId) || '[]');
    } catch (e) {
      return [];
    }
  },

  saveTasks: (companyId: string, tasks: Task[]) => {
    try {
      localStorage.setItem(KEYS.TASKS + companyId, JSON.stringify(tasks));
    } catch (e) {
      console.error("Storage Error: saveTasks", e);
    }
  },

  getCheckIns: (companyId: string): CheckIn[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.CHECKINS + companyId) || '[]');
    } catch (e) {
      return [];
    }
  },

  saveCheckIns: (companyId: string, checkins: CheckIn[]) => {
    try {
      localStorage.setItem(KEYS.CHECKINS + companyId, JSON.stringify(checkins));
    } catch (e) {
      console.error("Storage Error: saveCheckIns", e);
    }
  },

  getSettings: (companyId: string): AppSettings => {
    try {
      const saved = localStorage.getItem(KEYS.SETTINGS + companyId);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    
    return {
      teamName: 'Prado Gestão',
      notificationsEnabled: true
    };
  },

  saveSettings: (companyId: string, settings: AppSettings) => {
    try {
      localStorage.setItem(KEYS.SETTINGS + companyId, JSON.stringify(settings));
    } catch (e) {
      console.error("Storage Error: saveSettings", e);
    }
  },

  logout: () => {
    try {
      localStorage.removeItem(KEYS.CURRENT_USER);
    } catch (e) {}
  }
};
