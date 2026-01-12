
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
  const [user, setUser] = useState<User | null>(Storage.getCurrentUser());
  const [view, setView] = useState<ViewState>(user ? 'app' : 'landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ teamName: 'Carregando...', notificationsEnabled: true });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'member' | 'task' | 'none'>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (user) {
      const cid = user.companyId;
      setMembers(Storage.getMembers(cid));
      setTasks(Storage.getTasks(cid));
      setCheckins(Storage.getCheckIns(cid));
      setSettings(Storage.getSettings(cid));
      setView('app');
    } else {
      setView('landing');
    }
  }, [user]);

  useEffect(() => { if (user) Storage.saveMembers(user.companyId, members); }, [members, user]);
  useEffect(() => { if (user) Storage.saveTasks(user.companyId, tasks); }, [tasks, user]);
  useEffect(() => { if (user) Storage.saveCheckIns(user.companyId, checkins); }, [checkins, user]);
  useEffect(() => { if (user) Storage.saveSettings(user.companyId, settings); }, [settings, user]);

  const todayStr = new Date().toISOString().split('T')[0];
  const isAdmin = user?.role === 'admin';

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
    }, 1000);
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
    if (!isAdmin) return;
    if (user?.plan === 'free' && members.length >= 2) {
      alert("Limite de 2 membros no plano Free atingido.");
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
    setMembers([...members, newMember]);
    setIsModalOpen(false);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
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
      companyId: user!.companyId
    };
    setTasks([...tasks, newTask]);
    setIsModalOpen(false);
  };

  // --- COMPONENTES DE TELA ---

  const LandingPage = () => (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center p-6 text-white animate-fade-in overflow-y-auto pb-20">
      <header className="w-full max-w-sm flex justify-between items-center py-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-prado-gold rounded-xl flex items-center justify-center text-prado-blue shadow-lg">
            <CheckSquareIcon className="w-6 h-6" />
          </div>
          <span className="font-black text-xl tracking-tight text-white">Prado</span>
        </div>
        <button 
          onClick={() => { setAuthMode('login'); setView('auth'); }}
          className="text-xs font-black text-prado-gold uppercase tracking-widest hover:brightness-110 transition-all"
        >
          Acessar Painel
        </button>
      </header>

      <main className="w-full max-w-sm text-center flex flex-col items-center mt-12">
        <h1 className="text-5xl font-black tracking-tighter leading-[0.95] mb-6">
          Gestão de equipes com <span className="text-prado-gold">excelência.</span>
        </h1>
        <p className="text-slate-400 font-medium leading-relaxed mb-10 px-4">
          A plataforma premium para líderes que buscam organização absoluta e resultados consistentes.
        </p>

        <div className="w-full space-y-4 mb-16">
          <Button variant="gold" fullWidth onClick={() => { setAuthMode('register'); setView('auth'); }} className="py-5 text-base">
            Iniciar Consultoria Grátis
          </Button>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Até 2 consultores no plano free</p>
        </div>

        <div className="grid grid-cols-1 gap-6 w-full">
          <div className="bg-slate-800 p-8 rounded-[32px] text-left border border-slate-700 shadow-xl">
            <div className="w-10 h-10 bg-prado-blue rounded-2xl flex items-center justify-center mb-4 border border-prado-gold/30">
              <UsersIcon className="text-prado-gold w-5 h-5" />
            </div>
            <h3 className="font-black text-lg mb-1 text-white">Liderança de Valor</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Fomente uma cultura de alto desempenho através de acompanhamento humano e preciso.</p>
          </div>
          <div className="bg-slate-800 p-8 rounded-[32px] text-left border border-slate-700 shadow-xl">
            <div className="w-10 h-10 bg-prado-blue rounded-2xl flex items-center justify-center mb-4 border border-prado-gold/30">
              <ClockIcon className="text-prado-gold w-5 h-5" />
            </div>
            <h3 className="font-black text-lg mb-1 text-white">Sincronização Elite</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">Dados em tempo real com infraestrutura cloud de última geração para sua tomada de decisão.</p>
          </div>
        </div>

        <footer className="mt-20 opacity-40">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-prado-gold">Prado Gestão de Equipes © 2024</p>
        </footer>
      </main>
    </div>
  );

  const AuthScreen = () => (
    <div className="min-h-screen bg-prado-blue flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-prado-gold opacity-10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-prado-gold opacity-5 rounded-full blur-[100px]" />

      <button 
        onClick={() => setView('landing')}
        className="absolute top-10 left-8 text-slate-400 hover:text-prado-gold transition-colors flex items-center gap-2 text-xs font-bold"
      >
        <ChevronRightIcon className="w-4 h-4 rotate-180" /> Retornar
      </button>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-prado-gold rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-prado-gold/20">
            <CheckSquareIcon className="w-8 h-8 text-prado-blue" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Prado <span className="text-prado-gold">Gestão</span></h1>
          <p className="text-slate-400 text-sm mt-1">{authMode === 'login' ? 'Acesse seu painel executivo' : 'Inicie sua jornada de liderança'}</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'register' && (
            <input name="name" required placeholder="Nome Completo" className="w-full bg-slate-800/50 p-5 rounded-2xl focus:ring-2 focus:ring-prado-gold outline-none font-bold placeholder:text-slate-500" />
          )}
          <input name="email" type="email" required placeholder="E-mail Corporativo" className="w-full bg-slate-800/50 p-5 rounded-2xl focus:ring-2 focus:ring-prado-gold outline-none font-bold placeholder:text-slate-500" />
          <input name="password" type="password" required placeholder="Senha de Acesso" className="w-full bg-slate-800/50 p-5 rounded-2xl focus:ring-2 focus:ring-prado-gold outline-none font-bold placeholder:text-slate-500" />
          
          {authError && <p className="text-rose-400 text-xs font-bold text-center bg-rose-400/10 py-2 rounded-lg">{authError}</p>}
          
          <Button variant="gold" type="submit" fullWidth disabled={isLoading} className="py-5 shadow-prado-gold/10">
            {isLoading ? 'Autenticando...' : (authMode === 'login' ? 'Entrar no Sistema' : 'Ativar Conta Gratuita')}
          </Button>
        </form>

        <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full mt-6 text-slate-400 text-sm font-bold hover:text-white transition-colors">
          {authMode === 'login' ? 'Solicitar nova conta de gestor' : 'Já possui credenciais? Faça o login'}
        </button>
      </div>
    </div>
  );

  if (view === 'landing') return <LandingPage />;
  if (view === 'auth') return <AuthScreen />;

  return (
    <div className="max-w-md mx-auto h-full bg-slate-50">
      <AppLayout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        title={settings.teamName}
        rightAction={
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2 py-1 bg-prado-blue text-white rounded-lg uppercase tracking-tighter">{user!.role}</span>
          </div>
        }
      >
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="bg-prado-blue rounded-[32px] p-8 text-white shadow-2xl shadow-prado-blue/20 overflow-hidden relative border border-white/5">
              <p className="text-prado-gold text-xs font-black uppercase mb-1 tracking-widest">Entrega da Equipe</p>
              <h2 className="text-4xl font-black mb-4">{stats.percent}%</h2>
              <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-prado-gold shadow-[0_0_15px_rgba(212,175,55,0.5)] transition-all duration-1000 ease-out" style={{ width: `${stats.percent}%` }} />
              </div>
              <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-prado-gold opacity-10 rounded-full blur-3xl" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-col justify-between h-36 border-slate-100">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Aguardando</span>
                <span className="text-4xl font-black text-prado-blue">{stats.totalToday - stats.doneToday}</span>
              </Card>
              <Card className="flex flex-col justify-between h-36 border-rose-100 bg-rose-50/50">
                <span className="text-rose-400 text-[10px] font-black uppercase tracking-widest">Critico/Atraso</span>
                <span className="text-4xl font-black text-rose-500">{stats.late}</span>
              </Card>
            </div>

            {isAdmin && user!.plan === 'free' && (
              <div className="bg-prado-blue p-6 rounded-[28px] flex items-center justify-between border border-prado-gold/20 shadow-xl">
                <div>
                  <p className="text-xs font-black text-prado-gold uppercase tracking-tighter">Limites Prado Free</p>
                  <p className="text-[10px] text-slate-400 font-bold">{members.length}/2 Membros Adicionados</p>
                </div>
                <button className="bg-prado-gold text-prado-blue text-[10px] font-black px-4 py-2 rounded-xl uppercase hover:brightness-110 transition-all">Upgrade Pro</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Membros do Time</h3>
              {isAdmin && <button onClick={() => { setModalType('member'); setIsModalOpen(true); }} className="text-prado-gold font-black text-[10px] uppercase border border-prado-gold/30 px-3 py-1 rounded-lg">Novo +</button>}
            </div>
            <div className="grid gap-3">
              {members.map(m => (
                <Card key={m.id} className="flex items-center gap-4 py-5 hover:border-prado-gold/20">
                  <div className="w-14 h-14 bg-prado-blue rounded-[20px] flex items-center justify-center text-prado-gold font-black text-xl shadow-inner border border-white/5">{m.name.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-lg tracking-tight">{m.name}</p>
                    <p className="text-[10px] text-prado-gold font-black uppercase tracking-widest">{m.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Funções & Tarefas</h3>
              <button onClick={() => { setModalType('task'); setIsModalOpen(true); }} className="bg-prado-blue text-prado-gold p-3 rounded-2xl shadow-xl shadow-prado-blue/20">
                <PlusIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              {tasks.filter(t => user!.role === 'admin' || t.assigneeId === user!.id).map(t => (
                <Card key={t.id} className={`flex items-center justify-between group transition-all ${t.status === TaskStatus.DONE ? 'opacity-60 grayscale' : ''}`}>
                  <div className="flex-1 pr-4">
                    <h4 className={`font-bold text-lg leading-tight mb-1 ${t.status === TaskStatus.DONE ? 'line-through text-slate-400' : 'text-slate-800'}`}>{t.title}</h4>
                    <div className="flex gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{t.deadline}</span>
                      <span className="text-[10px] text-prado-gold font-black uppercase tracking-tighter">● {t.priority}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newStatus = t.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
                      setTasks(tasks.map(task => task.id === t.id ? { ...task, status: newStatus } : task));
                    }}
                    className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all ${t.status === TaskStatus.DONE ? 'bg-prado-gold text-prado-blue' : 'bg-slate-50 text-slate-300 group-hover:text-prado-gold'}`}
                  >
                    <CheckSquareIcon className="w-5 h-5" />
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {!isAdmin ? (
               <div className="py-24 text-center">
                 <AlertCircleIcon className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                 <p className="text-slate-400 font-bold text-sm tracking-tight uppercase">Painel Restrito à Gerência</p>
               </div>
            ) : (
              <div className="space-y-6">
                <Card className="bg-prado-blue text-white p-8 border-prado-gold/10 overflow-hidden relative">
                  <div className="relative z-10">
                    <p className="text-prado-gold text-[10px] font-black uppercase tracking-widest mb-2">Relatório de Performance</p>
                    <h3 className="text-4xl font-black">{tasks.filter(t => t.status === TaskStatus.DONE).length} Finalizadas</h3>
                    <p className="text-slate-400 text-xs mt-2 font-medium tracking-tight">Total de entregas contabilizadas na nuvem Prado.</p>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-prado-gold/5 rounded-full blur-3xl" />
                </Card>
                <div className="space-y-4 px-2">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Entrega por Consultor</h3>
                  {members.map(m => {
                    const done = tasks.filter(t => t.assigneeId === m.id && t.status === TaskStatus.DONE).length;
                    return (
                      <div key={m.id} className="flex items-center justify-between py-4 border-b border-slate-100">
                        <span className="font-bold text-slate-700">{m.name}</span>
                        <span className="text-xs font-black text-prado-gold bg-prado-blue px-3 py-1 rounded-full uppercase tracking-tighter">{done} OK</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card className="p-8 border-prado-blue/5">
              <p className="text-[10px] font-black text-prado-gold uppercase mb-4 tracking-widest">Gerenciamento de Identidade</p>
              <h4 className="text-2xl font-black text-prado-blue tracking-tight">{user!.name}</h4>
              <p className="text-sm font-bold text-slate-400 mb-8">{user!.email}</p>
              
              <Button onClick={handleLogout} variant="danger" fullWidth className="rounded-2xl">
                Encerrar Acesso Seguro
              </Button>
            </Card>

            {isAdmin && (
              <div className="bg-white rounded-[32px] p-8 border border-slate-100 space-y-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da Unidade Gestora</p>
                <div className="flex items-center gap-2 border-b-2 border-slate-50 pb-2 focus-within:border-prado-gold transition-colors">
                  <input 
                    defaultValue={settings.teamName} 
                    onBlur={(e) => setSettings({ ...settings, teamName: e.target.value })}
                    className="text-xl font-black text-prado-blue bg-transparent w-full outline-none" 
                  />
                  <EditIcon className="w-5 h-5 text-slate-200" />
                </div>
              </div>
            )}
            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] pt-12">Prado Gestão Enterprise v2.5</p>
          </div>
        )}
      </AppLayout>

      {/* MODALS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-prado-blue/80 backdrop-blur-lg p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl relative">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-8" />
            <h3 className="text-2xl font-black text-prado-blue mb-8 tracking-tight">{modalType === 'member' ? 'Convidar Consultor' : 'Registrar Tarefa'}</h3>
            <form onSubmit={modalType === 'member' ? handleAddMember : handleSaveTask} className="space-y-5">
              {modalType === 'member' ? (
                <>
                  <input name="name" required placeholder="Nome do Consultor" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold placeholder:text-slate-300 border-2 border-transparent focus:border-prado-gold/30" />
                  <input name="role" required placeholder="Função Executiva" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold placeholder:text-slate-300 border-2 border-transparent focus:border-prado-gold/30" />
                  <div className="p-6 bg-prado-blue rounded-3xl space-y-4 shadow-xl">
                    <p className="text-[10px] font-black text-prado-gold uppercase tracking-widest">Segurança & Acesso</p>
                    <input name="email" type="email" required placeholder="E-mail de acesso" className="w-full bg-slate-800 p-4 rounded-xl outline-none text-xs font-bold text-white placeholder:text-slate-500" />
                    <input name="password" type="password" required placeholder="Senha temporária" className="w-full bg-slate-800 p-4 rounded-xl outline-none text-xs font-bold text-white placeholder:text-slate-500" />
                  </div>
                  <Button variant="gold" type="submit" fullWidth>Ativar Nova Licença</Button>
                </>
              ) : (
                <>
                  <input name="title" required placeholder="Título do Deliverable" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold placeholder:text-slate-300 border-2 border-transparent focus:border-prado-gold/30" />
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Alocação de Recurso</p>
                    <select name="assignee" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold text-prado-blue appearance-none border-2 border-transparent focus:border-prado-gold/30">
                      <option value={user!.id}>Mim mesmo</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <input name="deadline" type="date" className="w-full bg-slate-50 p-5 rounded-2xl outline-none font-bold text-prado-blue" />
                  <Button variant="primary" type="submit" fullWidth>Confirmar Sincronização</Button>
                </>
              )}
            </form>
            <button onClick={() => setIsModalOpen(false)} className="w-full mt-6 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-rose-500 transition-colors">Cancelar Operação</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
