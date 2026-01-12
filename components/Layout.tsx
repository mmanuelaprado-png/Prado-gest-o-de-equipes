
import React from 'react';
import { TabType } from '../types';
import { HomeIcon, UsersIcon, CheckSquareIcon, BarChartIcon, SettingsIcon } from './Icons';

interface NavItemProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center flex-1 py-3 transition-all duration-300 relative ${
      active ? 'text-prado-gold scale-110' : 'text-slate-400 hover:text-slate-200'
    }`}
  >
    <div className="mb-1">{icon}</div>
    <span className={`text-[9px] font-bold uppercase tracking-widest transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>
      {label}
    </span>
    {active && (
      <div className="absolute -top-1 w-1 h-1 bg-prado-gold rounded-full" />
    )}
  </button>
);

interface AppLayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  title: string;
  rightAction?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeTab, setActiveTab, title, rightAction }) => (
  <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-slate-50">
    <header className="flex items-center justify-between px-8 pt-14 pb-6 sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/50">
      <div>
        <h1 className="text-2xl font-black text-prado-blue tracking-tight">{title}</h1>
        <div className="h-1 w-8 bg-prado-gold rounded-full mt-1"></div>
      </div>
      {rightAction}
    </header>
    
    <main className="flex-1 overflow-y-auto px-6 pt-6 pb-32 scrollbar-hide">
      <div className="animate-fade-in max-w-lg mx-auto">
        {children}
      </div>
    </main>

    <div className="fixed bottom-6 left-6 right-6 z-40 max-w-sm mx-auto">
      <nav className="glass bg-prado-blue rounded-[32px] shadow-2xl shadow-prado-blue/40 flex items-center justify-around px-2 py-1 border border-white/10">
        <NavItem
          active={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
          icon={<HomeIcon />}
          label="Painel"
        />
        <NavItem
          active={activeTab === 'team'}
          onClick={() => setActiveTab('team')}
          icon={<UsersIcon />}
          label="Equipe"
        />
        <NavItem
          active={activeTab === 'tasks'}
          onClick={() => setActiveTab('tasks')}
          icon={<CheckSquareIcon />}
          label="Tarefas"
        />
        <NavItem
          active={activeTab === 'reports'}
          onClick={() => setActiveTab('reports')}
          icon={<BarChartIcon />}
          label="Dados"
        />
        <NavItem
          active={activeTab === 'settings'}
          onClick={() => setActiveTab('settings')}
          icon={<SettingsIcon />}
          label="Conta"
        />
      </nav>
    </div>
  </div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-[28px] p-6 shadow-sm border border-slate-100 mb-4 transition-all active:scale-[0.98] ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${className}`}
  >
    {children}
  </div>
);

export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}> = ({ children, onClick, variant = 'primary', fullWidth = false, disabled = false, className = '', type = "button" }) => {
  const baseStyles = "px-6 py-4 rounded-[20px] font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95";
  const variants = {
    primary: "bg-prado-blue text-white shadow-lg shadow-prado-blue/20 hover:bg-prado-blue-light",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    gold: "bg-prado-gold text-white shadow-lg shadow-prado-gold/20 hover:brightness-110"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
};
