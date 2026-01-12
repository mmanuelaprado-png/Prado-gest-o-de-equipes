
import React, { useState, useEffect, useMemo } from 'react';
import { TabType, Member, Task, CheckIn, AppSettings, Feeling, TaskStatus, Priority, TimeEstimate, User } from './types';
import { Storage } from './storage';
import { AppLayout, Card, Button } from './components/Layout';
import { 
  PlusIcon, AlertCircleIcon, EditIcon, TrashIcon, 
  ChevronRightIcon, UsersIcon, CheckSquareIcon, 
  ClockIcon, HistoryIcon, FileTextIcon, HomeIcon, BarChartIcon
} from './components/Icons';

type ViewState = 'landing' | 'auth' | 'app';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => Storage.getCurrentUser());
  const [view, setView] = useState<ViewState>(() => (Storage.getCurrentUser() ? 'app' : 'landing'));
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ teamName: 'Prado Gestão', notificationsEnabled: true });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'member' | 'task' | 'none'>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Sincronização de dados da empresa
  useEffect(() => {
    if (user) {
      const cid = user.companyId;
      setMembers(Storage.getMembers(cid));
      setTasks(Storage.getTasks(cid));
      setCheckins(Storage.getCheckIns(cid));
      setSettings(Storage.getSettings(cid));
      setView('app');
    } else {
      setView(v => v === 'app' ? 'landing' : v);
    }
  }, [user]);

  // Persistência automática
  useEffect(() => { if (user) Storage.saveMembers(user.companyId, members); }, [members, user]);
  useEffect(() => { if (user) Storage.saveTasks(user.companyId, tasks); }, [tasks, user]);
  useEffect(() => { if (user) Storage.saveCheckIns(user.companyId, checkins); }, [checkins, user]);
  useEffect(() => { if (user) Storage.saveSettings(user.companyId, settings); }, [settings, user]);

  const todayStr = new Date().toISOString().split('T')[0];
  
  const stats = useMemo(() => {
    const relevantTasks = user?.role === 'member' ? tasks.filter(t => t.assigneeId === user.id) : tasks;
    const todayTasks = relevantTasks.filter(t => t.deadline === todayStr || !t.deadline);
    const done = todayTasks.filter(t => t.status === TaskStatus.DONE).length;
    
    return {
      totalToday: todayTasks.length,
      doneToday: done,
      percent: todayTasks.length > 0 ? Math.round((done / todayTasks.length) * 100) : 0,
      late: relevantTasks.filter(t => t.status !== TaskStatus.DONE && t.deadline && t.deadline < todayStr).length
    };
  }, [tasks, todayStr, user]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    setTimeout(() => {
      const registry = Storage.getRegistry();
      
      if (authMode === 'register') {
        const companyId = 'c_' + Math.random().toString(36).substr(2, 5);
        const newUser: User = { id: 'u_' + Date.now(), email, name, plan: 'free', companyId, role: 'admin' };
        Storage.addToRegistry({ email, password, ...newUser });
        setUser(newUser);
        Storage.saveSession(newUser);
      } else {
        const match = registry.find(r => r.email === email && r.password === password);
        if (match) {
          const sessionUser: User = { 
            id: match.id, email: match.email, name: match.name, 
            plan: match.plan || 'free', companyId: match.companyId, role: match.role 
          };
          setUser(sessionUser);
          Storage.saveSession(sessionUser);
        } else {
          setAuthError('Credenciais inválidas.');
        }
      }
      setIsLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    Storage.logout();
    setUser(null);
    setMembers([]);
    setTasks([]);
    setCheckins([]);
    setView('landing');
    setActiveTab('home');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'admin') return;
    if (user?.plan === 'free' && members.length >= 2) {
      alert("Plano Free limitado a 2 membros.");
      return;
    }
    const formData = new FormData(e.target as HTMLFormElement);
    const newMember: Member = {
      id: 'm_' + Math.random().toString(36).substr(2, 5),
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      active: true,
      companyId: user!.companyId
    };
    setMembers(prev => [...prev, newMember]);
    setIsModalOpen(false);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const newTask: Task = {
      id: 't_' + Math.random().toString(36).substr(2, 5),
      title: formData.get('title') as string,
      description: '',
      assigneeId: formData.get('assignee') as string,
      deadline: formData.get('deadline') as string || todayStr,
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
      notes: '',
      timeEstimate: TimeEstimate.MEDIUM,
      createdAt: Date.now(),
      companyId: user.companyId
    };
    setTasks(prev => [...prev, newTask]);
    setIsModalOpen(false);
  };

  // --- VIEWS ---

  if (view === 'landing' || (!user && view === 'app')) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center p-6 text-white animate-fade-in overflow-y-auto pb-20">
        <header className="w-full max-w-sm flex justify-between items-center py-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-prado-gold rounded-xl flex items-center justify-center text-prado-blue shadow-lg">
              <CheckSquareIcon className="w-6 h-6" />
            </div>
            <span className="font-black text-xl tracking-tight text-white">Prado</span>
          </div>
          <button onClick={() => { setAuthMode('login'); setView('auth'); }} className="text-xs font-black text-prado-gold uppercase tracking-widest">Acessar</button>
        </header>
        <main className="w-full max-w-sm text-center flex flex-col items-center mt-12">
          <h1 className="text-5xl font-black tracking-tighter leading-[0.95] mb-6">Gestão com <span className="text-prado-gold">excelência.</span></h1>
          <p className="text-slate-400 font-medium mb-10 px-4">Plataforma premium para líderes que buscam organização absoluta e resultados.</p>
          <div className="w-full space-y-4 mb-16">
            <Button variant="gold" fullWidth onClick={() => { setAuthMode('register'); setView('auth'); }} className="py-5 text-base">Iniciar Grátis</Button>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Até 2 consultores no free</p>
          </div>
          <div className="grid grid-cols-1 gap-6 w-full">
            <div className="bg-slate-800 p-8 rounded-[32px] text-left border border-slate-700 shadow-xl">
              <div className="w-10 h-10 bg-prado-blue rounded-2xl flex items-center justify-center mb-4 border border-prado-gold/30">
                <UsersIcon className="text-prado-gold w-5 h-5" />
              </div>
              <h3 className="font-black text-lg mb-1 text-white">Liderança</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Fomente uma cultura de alto desempenho através de acompanhamento preciso.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-prado-blue flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
        <button onClick={() => setView('landing')} className="absolute top-10 left-8 text-slate-400 flex items-center gap-2 text-xs font-bold">
          <ChevronRightIcon className="w-4 h-4 rotate-180" /> Retornar
        </button>
        <div className="w-full max-w-sm z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-prado-gold rounded-3xl flex items-center justify-center mx-auto mb-4">
              <CheckSquareIcon className="w-8 h-8 text-prado-blue" />
            </div>
            <h1 className="text-2xl font-black text-white">Prado <span className="text-prado-gold">Gestão</span></h1>
            <p className="text-slate-400 text-sm mt-1">{authMode === 'login' ? 'Acesse seu painel' : 'Inicie sua liderança'}</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === 'register' && <input name="name" required placeholder="Nome Completo" className="w-full bg-slate-800/50 p-5 rounded-2xl focus:ring-2 focus:ring-prado-gold outline-none font-bold" />}
            <input name="email" type="email" required placeholder="E-mail Corporativo" className="w-full bg-slate-800/50 p-5 rounded-2xl focus:ring-2 focus:ring-prado-gold outline-none font-bold" />
            <input name="password" type="password" required placeholder="Senha de Acesso" className="w-full bg-slate-800/50 p-5 rounded-2xl focus:ring-2 focus:ring-prado-gold outline-none font-bold" />
            {authError && <p className="text-rose-400 text-xs font-bold text-center bg-rose-400/10 py-2 rounded-lg">{authError}</p>}
            <Button variant="gold" type="submit" fullWidth disabled={isLoading} className="py-5">
              {isLoading ? 'Autenticando...' : (authMode === 'login' ? 'Entrar' : 'Ativar Conta')}
            </Button>
          </form>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full mt-6 text-slate-400 text-sm font-bold">
            {authMode === 'login' ? 'Solicitar nova conta' : 'Já possui credenciais? Login'}
          </button>
        </div>
      </div>
    );
  }

  // Se chegou aqui e não tem user, evita crash
  if (!user) return null;

  return (
    <div className="max-w-md mx-auto h-full bg-slate-50">
      <AppLayout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        title={settings.teamName}
        rightAction={<span className="text-[10px] font-black px-2 py-1 bg-prado-blue text-white rounded-lg uppercase">{user.role}</span>}
      >
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="bg-prado-blue rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden border border-white/5">
              <p className="text-prado-gold text-xs font-black uppercase mb-1">Entrega da Equipe</p>
              <h2 className="text-4xl font-black mb-4">{stats.percent}%</h2>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-prado-gold transition-all duration-1000" style={{ width: `${stats.percent}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-col justify-between h-36">
                <span className="text-slate-400 text-[10px] font-black uppercase">Aguardando</span>
                <span className="text-4xl font-black text-prado-blue">{stats.totalToday - stats.doneToday}</span>
              </Card>
              <Card className="flex flex-col justify-between h-36 border-rose-100 bg-rose-50/50">
                <span className="text-rose-400 text-[10px] font-black uppercase">Atraso</span>
                <span className="text-4xl font-black text-rose-500">{stats.late}</span>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase">Time</h3>
              {user.role === 'admin' && <button onClick={() => { setModalType('member'); setIsModalOpen(true); }} className="text-prado-gold font-black text-[10px] uppercase">Novo +</button>}
            </div>
            {members.map(m => (
              <Card key={m.id} className="flex items-center gap-4 py-5">
                <div className="w-14 h-14 bg-prado-blue rounded-[20px] flex items-center justify-center text-prado-gold font-black text-xl">{m.name.charAt(0)}</div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-lg">{m.name}</p>
                  <p className="text-[10px] text-prado-gold font-black uppercase">{m.role}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase">Tarefas</h3>
              <button onClick={() => { setModalType('task'); setIsModalOpen(true); }} className="bg-prado-blue text-prado-gold p-3 rounded-2xl">
                <PlusIcon className="w-6 h-6" />
              </button>
            </div>
            {tasks.filter(t => user.role === 'admin' || t.assigneeId === user.id).map(t => (
              <Card key={t.id} className={`flex items-center justify-between ${t.status === TaskStatus.DONE ? 'opacity-60' : ''}`}>
                <div className="flex-1 pr-4">
                  <h4 className={`font-bold text-lg leading-tight ${t.status === TaskStatus.DONE ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{t.deadline}</span>
                </div>
                <button 
                  onClick={() => setTasks(tasks.map(task => task.id === t.id ? { ...task, status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE } : task))}
                  className={`w-10 h-10 rounded-[14px] flex items-center justify-center ${t.status === TaskStatus.DONE ? 'bg-prado-gold text-prado-blue' : 'bg-slate-50 text-slate-300'}`}
                >
                  <CheckSquareIcon className="w-5 h-5" />
                </button>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {user.role !== 'admin' ? (
               <div className="py-24 text-center">
                 <AlertCircleIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                 <p className="text-slate-400 font-bold text-sm uppercase">Restrito à Gerência</p>
               </div>
            ) : (
              <div className="space-y-6">
                <Card className="bg-prado-blue text-white p-8">
                  <p className="text-prado-gold text-[10px] font-black uppercase mb-2">Performance</p>
                  <h3 className="text-4xl font-black">{tasks.filter(t => t.status === TaskStatus.DONE).length} Finalizadas</h3>
                </Card>
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between py-4 border-b border-slate-100 px-2">
                    <span className="font-bold text-slate-700">{m.name}</span>
                    <span className="text-xs font-black text-prado-gold bg-prado-blue px-3 py-1 rounded-full uppercase">
                      {tasks.filter(t => t.assigneeId === m.id && t.status === TaskStatus.DONE).length} OK
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card className="p-8">
              <p className="text-[10px] font-black text-prado-gold uppercase mb-4">Identidade</p>
              <h4 className="text-2xl font-black text-prado-blue">{user.name}</h4>
              <p className="text-sm font-bold text-slate-400 mb-8">{user.email}</p>
              <Button onClick={handleLogout} variant="danger" fullWidth className="rounded-2xl">Encerrar Acesso</Button>
            </Card>
            {user.role === 'admin' && (
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Unidade Gestora</p>
                <input 
                  defaultValue={settings.teamName} 
                  onBlur={(e) => setSettings({ ...settings, teamName: e.target.value })}
                  className="text-xl font-black text-prado-blue bg-transparent w-full outline-none border-b-2 border-slate-100 focus:border-prado-gold pb-2" 
                />
              </div>
            )}
            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] pt-12">Prado Gestão v2.5</p>
          </div>
        )}
      </AppLayout>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-prado-blue/80 backdrop-blur-lg p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl">
            <h3 className="text-2xl font-black text-prado-blue mb-8">{modalType === 'member' ? 'Convidar Consultor' : 'Registrar Tarefa'}</h3>
            <form onSubmit={modalType === 'member' ? handleAddMember : handleSaveTask} className="space-y-5">
              {modalType === 'member' ? (
                <>
                  <input name="name" required placeholder="Nome do Consultor" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold" />
                  <input name="role" required placeholder="Função" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold" />
                  <div className="p-6 bg-prado-blue rounded-3xl space-y-4">
                    <input name="email" type="email" required placeholder="E-mail de acesso" className="w-full bg-slate-800 p-4 rounded-xl outline-none text-xs font-bold text-white" />
                    <input name="password" type="password" required placeholder="Senha temporária" className="w-full bg-slate-800 p-4 rounded-xl outline-none text-xs font-bold text-white" />
                  </div>
                  <Button variant="gold" type="submit" fullWidth>Ativar Nova Licença</Button>
                </>
              ) : (
                <>
                  <input name="title" required placeholder="Título" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold" />
                  <select name="assignee" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold text-prado-blue">
                    <option value={user.id}>Eu mesmo</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <input name="deadline" type="date" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold" />
                  <Button variant="primary" type="submit" fullWidth>Confirmar Sincronização</Button>
                </>
              )}
            </form>
            <button onClick={() => setIsModalOpen(false)} className="w-full mt-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
